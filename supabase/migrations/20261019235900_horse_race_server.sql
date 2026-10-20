-- VERSIONADA PARA APLICACION CONTROLADA. Validada localmente con T3/PGlite.
-- Fase T3: carreras de caballos server-side, separada de las tablas/RPC viejas.
-- T0 no viable; no se hicieron pruebas ni cambios de comportamiento en producción.
-- Las funciones viejas place_public_horse_race_bet y settle_public_horse_race
-- permanecen revocadas y no se reactivan en esta propuesta.

create table if not exists public.horse_race_server_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  status text not null check (status in ('betting', 'closed', 'running', 'finished', 'cancelled')),
  horses jsonb not null check (jsonb_typeof(horses) = 'array'),
  server_odds jsonb not null check (jsonb_typeof(server_odds) = 'object'),
  seed_commit text not null check (length(seed_commit) = 64),
  betting_closes_at timestamptz not null,
  started_at timestamptz,
  finished_at timestamptz,
  winner_id text,
  placements jsonb,
  result jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid references public.players(id) on delete set null
);

create table if not exists public.horse_race_server_secrets (
  session_id uuid primary key references public.horse_race_server_sessions(id) on delete cascade,
  seed bytea not null,
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.horse_race_server_bets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.horse_race_server_sessions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  horse_id text not null check (length(trim(horse_id)) between 1 and 64),
  bet_amount integer not null check (bet_amount > 0),
  server_odds numeric(12,6) not null check (server_odds >= 1),
  payout integer not null default 0 check (payout >= 0),
  status text not null default 'placed' check (status in ('placed', 'won', 'lost', 'paid', 'refunded')),
  idempotency_key text not null check (length(trim(idempotency_key)) between 1 and 200),
  request_hash text not null check (length(request_hash) = 32),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (session_id, player_id),
  unique (player_id, idempotency_key)
);

create table if not exists public.horse_race_server_results (
  session_id uuid primary key references public.horse_race_server_sessions(id) on delete cascade,
  winner_id text not null,
  placements jsonb not null check (jsonb_typeof(placements) = 'array'),
  result jsonb not null,
  payouts_processed boolean not null default false,
  finished_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists horse_race_server_sessions_status_idx
  on public.horse_race_server_sessions(status, betting_closes_at);
create index if not exists horse_race_server_bets_session_idx
  on public.horse_race_server_bets(session_id, created_at);
create index if not exists horse_race_server_bets_player_idx
  on public.horse_race_server_bets(player_id, created_at desc);

alter table public.horse_race_server_sessions enable row level security;
alter table public.horse_race_server_bets enable row level security;
alter table public.horse_race_server_results enable row level security;

revoke all on table public.horse_race_server_sessions from public, anon, authenticated;
revoke all on table public.horse_race_server_bets from public, anon, authenticated;
revoke all on table public.horse_race_server_results from public, anon, authenticated;

-- Las lecturas públicas pasan por vistas sin player_id, idempotency_key ni semillas.
create or replace view public.horse_race_server_sessions_public as
select id, title, status, horses, server_odds, betting_closes_at,
       started_at, finished_at, winner_id, placements, result, created_at, updated_at
  from public.horse_race_server_sessions;
create or replace view public.horse_race_server_bets_public as
select id, session_id, horse_id, bet_amount, server_odds, payout, status,
       created_at, updated_at
  from public.horse_race_server_bets;
create or replace view public.horse_race_server_results_public as
select session_id, winner_id, placements, result, payouts_processed,
       finished_at, updated_at
  from public.horse_race_server_results;
grant select on public.horse_race_server_sessions_public to anon, authenticated;
grant select on public.horse_race_server_bets_public to anon, authenticated;
grant select on public.horse_race_server_results_public to anon, authenticated;

-- La tabla de semillas no tiene grants para clientes.
revoke all on table public.horse_race_server_secrets from public, anon, authenticated;

-- Contratos RPC nuevos. Ninguno acepta odds, resultado, ganador, placements ni
-- p_player_id desde el cliente web.
--
-- create_server_horse_race(p_title text, p_horses jsonb, p_betting_seconds integer)
--   - auth.uid() identifica created_by; service_role puede crear para el bot.
--   - valida de 2 a 6 caballos y nombres/IDs únicos.
--   - genera seed con gen_random_bytes(32), guarda solo seed_commit público.
--   - calcula server_odds desde configuración server-side, nunca desde p_horses.odds.
--
-- place_server_horse_race_bet(p_session_id uuid, p_horse_id text,
--                             p_bet_amount integer, p_idempotency_key text)
--   - identifica jugador por auth.uid(); service_role usa el actor de servicio.
--   - llama assert_not_in_mora, bloquea sesión y fila de players con FOR UPDATE.
--   - lee la cuota server_odds de la sesión; no existe p_odds.
--   - exige status=betting y clock_timestamp() < betting_closes_at.
--   - registra una sola apuesta por jugador/sesión y reintentos por request hash.
--   - descuenta apuesta y registra auditoría en la misma transacción.
--
-- start_server_horse_race(p_session_id uuid)
--   - bloquea la sesión; solo la transición server-side a running.
--   - exige reloj posterior al cierre y no acepta resultado del cliente.
--
-- settle_server_horse_race(p_session_id uuid)
--   - puede ser llamada por cualquier authenticated o service_role.
--   - bloquea sesión, secreto y resultado; solo continúa si clock_timestamp() >=
--     betting_closes_at y la carrera está terminada según el reloj del servidor.
--   - deriva placements/winner con el seed privado y la configuración server-side.
--   - inserta resultado con UNIQUE(session_id); procesa cada payout una sola vez.
--   - calcula payout con server_odds almacenada y rechaza valores >2147483647.
--   - devuelve resultado público y el pago propio del actor, sin exponer la semilla.

-- ACL objetivo para las cuatro RPC nuevas:
-- revoke all on function ... from public, anon;
-- grant execute on function ... to authenticated, service_role;
-- service_role queda permitido para scheduler/bot; anon no puede apostar ni liquidar.

-- ROLLBACK (comentado; nunca sobre producción con datos):
-- revoke all on function public.settle_server_horse_race(uuid) from public, anon, authenticated, service_role;
-- revoke all on function public.start_server_horse_race(uuid) from public, anon, authenticated, service_role;
-- revoke all on function public.place_server_horse_race_bet(uuid, text, integer, text) from public, anon, authenticated, service_role;
-- revoke all on function public.create_server_horse_race(text, jsonb, integer) from public, anon, authenticated, service_role;
-- drop table if exists public.horse_race_server_results;
-- drop table if exists public.horse_race_server_bets;
-- drop table if exists public.horse_race_server_secrets;
-- drop table if exists public.horse_race_server_sessions;

-- T3 completo: cuotas iguales calculadas por el servidor desde la cantidad de caballos.
-- El cliente solo envía identificadores; nunca envía odds, ganador ni resultado.
create or replace function public.create_server_horse_race(
  p_title text,
  p_horses jsonb,
  p_betting_seconds integer
)
returns table(session_id uuid, betting_closes_at timestamptz, server_odds jsonb)
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_session uuid := gen_random_uuid();
  v_seed bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  v_count integer;
  v_closes timestamptz;
  v_odds jsonb := '{}'::jsonb;
  v_item jsonb;
  v_id text;
  v_n numeric;
  v_seen text[] := '{}';
  v_commit text;
  v_creator uuid;
begin
  if coalesce(auth.role(), 'anon') not in ('authenticated', 'service_role') then raise exception 'Solo un usuario autenticado puede crear carreras.' using errcode = '42501'; end if;
  if length(trim(coalesce(p_title, ''))) = 0 or jsonb_typeof(p_horses) <> 'array' or p_betting_seconds not between 30 and 86400 then raise exception 'Configuración de carrera inválida.' using errcode = '22023'; end if;
  v_count := jsonb_array_length(p_horses);
  if v_count not between 2 and 6 then raise exception 'La carrera requiere entre 2 y 6 caballos.' using errcode = '22023'; end if;
  for v_item in select value from jsonb_array_elements(p_horses) loop
    v_id := trim(coalesce(v_item->>'id', ''));
    if v_id = '' or v_id = any(v_seen) then raise exception 'IDs de caballo duplicados o vacíos.' using errcode = '22023'; end if;
    v_seen := array_append(v_seen, v_id);
  end loop;
  v_n := round((0.90 * v_count)::numeric, 6);
  for v_id in select unnest(v_seen) loop
    v_odds := v_odds || jsonb_build_object(v_id, v_n);
  end loop;
  v_closes := clock_timestamp() + make_interval(secs => p_betting_seconds);
  v_commit := md5(encode(v_seed, 'hex')) || md5(encode(v_seed || decode('01','hex'), 'hex'));
  if auth.uid() is not null then v_creator := public.tavern_current_player(); end if;
  insert into public.horse_race_server_sessions(id, title, status, horses, server_odds, seed_commit, betting_closes_at, created_by)
  values (v_session, trim(p_title), 'betting', p_horses, v_odds, v_commit, v_closes, v_creator);
  insert into public.horse_race_server_secrets(session_id, seed) values (v_session, v_seed);
  return query select v_session, v_closes, v_odds;
end;
$$;

create or replace function public.place_server_horse_race_bet(
  p_session_id uuid,
  p_horse_id text,
  p_bet_amount integer,
  p_idempotency_key text
)
returns table(bet_id uuid, session_id uuid, horse_id text, bet_amount integer, odds numeric, new_gold integer)
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player uuid := public.tavern_current_player();
  v_session public.horse_race_server_sessions;
  v_existing public.horse_race_server_bets;
  v_gold integer;
  v_hash text := md5(format('%s|%s|%s', p_session_id, p_horse_id, p_bet_amount));
  v_odds numeric;
  v_next bigint;
begin
  if p_session_id is null or length(trim(coalesce(p_horse_id, ''))) = 0 or p_bet_amount is null or p_bet_amount <= 0 or length(trim(coalesce(p_idempotency_key, ''))) = 0 then raise exception 'Apuesta de caballos inválida.' using errcode = '22023'; end if;
  perform public.assert_not_in_mora(v_player);
  select * into v_existing from public.horse_race_server_bets where player_id = v_player and idempotency_key = trim(p_idempotency_key) for update;
  if found then
    if v_existing.request_hash <> v_hash then raise exception 'La clave ya fue usada con otros parámetros.' using errcode = '23505'; end if;
    select p.gold into v_gold from public.players p where p.id = v_player;
    return query select v_existing.id, v_existing.session_id, v_existing.horse_id, v_existing.bet_amount, v_existing.server_odds, v_gold;
    return;
  end if;
  select * into v_session from public.horse_race_server_sessions where id = p_session_id for update;
  if not found or v_session.status <> 'betting' or clock_timestamp() >= v_session.betting_closes_at then raise exception 'La carrera ya no acepta apuestas.' using errcode = '55000'; end if;
  v_odds := (v_session.server_odds ->> p_horse_id)::numeric;
  if v_odds is null or v_odds < 1 then raise exception 'Caballo no disponible en la carrera.' using errcode = '22023'; end if;
  select gold into v_gold from public.players where id = v_player for update;
  if not found or p_bet_amount > v_gold then raise exception 'Saldo insuficiente.' using errcode = '22023'; end if;
  v_next := v_gold::bigint - p_bet_amount;
  update public.players set gold = v_next::integer where id = v_player;
  insert into public.horse_race_server_bets(session_id, player_id, horse_id, bet_amount, server_odds, idempotency_key, request_hash)
  values (p_session_id, v_player, trim(p_horse_id), p_bet_amount, v_odds, trim(p_idempotency_key), v_hash) returning id into bet_id;
  return query select bet_id, p_session_id, trim(p_horse_id), p_bet_amount, v_odds, v_next::integer;
end;
$$;

create or replace function public.start_server_horse_race(p_session_id uuid)
returns table(session_id uuid, status text, started_at timestamptz)
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_session public.horse_race_server_sessions;
  v_now timestamptz := clock_timestamp();
begin
  if coalesce(auth.role(), 'anon') not in ('authenticated', 'service_role') then raise exception 'Rol no autorizado.' using errcode = '42501'; end if;
  select * into v_session from public.horse_race_server_sessions where id = p_session_id for update;
  if not found then raise exception 'Carrera no encontrada.' using errcode = 'P0002'; end if;
  if v_session.status = 'running' then return query select v_session.id, v_session.status, v_session.started_at; return; end if;
  if v_session.status <> 'betting' or v_now < v_session.betting_closes_at then raise exception 'La carrera aún no puede comenzar.' using errcode = '55000'; end if;
  update public.horse_race_server_sessions as s set status = 'running', started_at = coalesce(s.started_at, v_now), updated_at = v_now where s.id = p_session_id returning s.id, s.status, s.started_at into session_id, status, started_at;
  return next;
end;
$$;

create or replace function public.settle_server_horse_race(p_session_id uuid)
returns table(session_id uuid, status text, winner_id text, placements jsonb, actor_payout integer)
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_session public.horse_race_server_sessions;
  v_secret bytea;
  v_result public.horse_race_server_results;
  v_winner text;
  v_index integer;
  v_actor uuid := nullif(auth.uid(), '00000000-0000-0000-0000-000000000000');
  v_actor_payout integer := 0;
  v_bet public.horse_race_server_bets;
  v_player_gold integer;
  v_payout bigint;
  v_now timestamptz := clock_timestamp();
  v_placements jsonb := '[]'::jsonb;
  v_horses jsonb;
  v_pos integer;
begin
  if coalesce(auth.role(), 'anon') not in ('authenticated', 'service_role') then raise exception 'Rol no autorizado.' using errcode = '42501'; end if;
  select * into v_session from public.horse_race_server_sessions where id = p_session_id for update;
  if not found then raise exception 'Carrera no encontrada.' using errcode = 'P0002'; end if;
  select * into v_result from public.horse_race_server_results as r where r.session_id = p_session_id for update;
  if found and v_result.payouts_processed then
    select coalesce(sum(b.payout),0)::integer into v_actor_payout from public.horse_race_server_bets as b where b.session_id = p_session_id and b.player_id = v_actor;
    return query select p_session_id, 'finished'::text, v_result.winner_id, v_result.placements, v_actor_payout;
    return;
  end if;
  if v_now < v_session.betting_closes_at then raise exception 'La carrera aún no terminó.' using errcode = '55000'; end if;
  select s.seed into v_secret from public.horse_race_server_secrets as s where s.session_id = p_session_id;
  if v_secret is null then raise exception 'Semilla de carrera ausente.' using errcode = 'XX000'; end if;
  v_horses := v_session.horses;
  v_index := (get_byte(v_secret, 0) + get_byte(v_secret, 1) * 256) % jsonb_array_length(v_horses);
  v_winner := v_horses -> v_index ->> 'id';
  for v_pos in 0..jsonb_array_length(v_horses)-1 loop
    v_placements := v_placements || jsonb_build_array(v_horses -> ((v_index + v_pos) % jsonb_array_length(v_horses)) ->> 'id');
  end loop;
  for v_bet in select b.* from public.horse_race_server_bets as b where b.session_id = p_session_id order by b.created_at for update loop
    if v_bet.horse_id = v_winner then
      v_payout := floor(v_bet.bet_amount::numeric * v_bet.server_odds);
    else
      v_payout := 0;
    end if;
    if v_payout > 2147483647 then raise exception 'El pago de caballos excede el máximo integer.' using errcode = '22003'; end if;
    if v_payout > 0 then
      select gold into v_player_gold from public.players where id = v_bet.player_id for update;
      if v_player_gold::bigint + v_payout > 2147483647 then raise exception 'El saldo de caballos excede el máximo integer.' using errcode = '22003'; end if;
      update public.players set gold = (v_player_gold::bigint + v_payout)::integer where id = v_bet.player_id;
    end if;
    update public.horse_race_server_bets set payout = v_payout::integer, status = case when v_payout > 0 then 'paid' else 'lost' end, updated_at = v_now where id = v_bet.id;
    if v_bet.player_id = v_actor then v_actor_payout := v_actor_payout + v_payout::integer; end if;
  end loop;
  insert into public.horse_race_server_results(session_id, winner_id, placements, result, payouts_processed, finished_at)
  values (p_session_id, v_winner, v_placements, jsonb_build_object('winnerId', v_winner, 'placements', v_placements), true, v_now)
  on conflict on constraint horse_race_server_results_pkey do update set winner_id = excluded.winner_id, placements = excluded.placements, result = excluded.result, payouts_processed = true, finished_at = excluded.finished_at, updated_at = v_now;
  update public.horse_race_server_sessions set status = 'finished', winner_id = v_winner, placements = v_placements, result = jsonb_build_object('winnerId', v_winner, 'placements', v_placements), finished_at = v_now, updated_at = v_now where id = p_session_id;
  return query select p_session_id, 'finished'::text, v_winner, v_placements, v_actor_payout;
end;
$$;

revoke all on function public.create_server_horse_race(text, jsonb, integer) from public, anon;
revoke all on function public.place_server_horse_race_bet(uuid, text, integer, text) from public, anon;
revoke all on function public.start_server_horse_race(uuid) from public, anon;
revoke all on function public.settle_server_horse_race(uuid) from public, anon;
grant execute on function public.create_server_horse_race(text, jsonb, integer) to authenticated, service_role;
grant execute on function public.place_server_horse_race_bet(uuid, text, integer, text) to authenticated, service_role;
grant execute on function public.start_server_horse_race(uuid) to authenticated, service_role;
grant execute on function public.settle_server_horse_race(uuid) to authenticated, service_role;

-- ROLLBACK adicional comentado:
-- revoke all on function public.create_server_horse_race(text,jsonb,integer) from authenticated, service_role;
-- revoke all on function public.place_server_horse_race_bet(uuid,text,integer,text) from authenticated, service_role;
-- revoke all on function public.start_server_horse_race(uuid) from authenticated, service_role;
-- revoke all on function public.settle_server_horse_race(uuid) from authenticated, service_role;
-- drop function if exists public.settle_server_horse_race(uuid);
-- drop function if exists public.start_server_horse_race(uuid);
-- drop function if exists public.place_server_horse_race_bet(uuid,text,integer,text);
-- drop function if exists public.create_server_horse_race(text,jsonb,integer);
