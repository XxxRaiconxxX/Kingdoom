-- VERSIONADA PARA APLICACION CONTROLADA. Validada localmente con T2/PGlite.
-- Fase T2: Taberna server-side, aditiva.
-- Bloqueada para activación porque T0 no pudo levantar PostgreSQL aislado en Windows.
-- Producción solo lectura; este archivo no entra en supabase migration history.
-- Objetivo: conservar el cliente viejo hasta desplegar el cliente nuevo.

-- Dependencia verificada en producción read-only: pgcrypto ya está disponible.
-- Toda RPC final debe usar:
--   SECURITY DEFINER
--   SET search_path = pg_catalog, public, pg_temp
--   auth.uid() como identidad web; service_role solo para bot/operación autorizada.
-- Ninguna RPC nueva recibe p_player_id desde el cliente web.

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  game text not null check (length(trim(game)) between 1 and 64),
  bet integer not null check (bet > 0),
  payout integer not null check (payout >= 0),
  outcome jsonb not null default '{}'::jsonb,
  idempotency_key text not null check (length(trim(idempotency_key)) between 1 and 200),
  request_hash text not null check (length(request_hash) = 32),
  created_at timestamptz not null default clock_timestamp(),
  unique (player_id, idempotency_key)
);

alter table public.game_rounds enable row level security;
revoke all on table public.game_rounds from public, anon, authenticated;
grant select on table public.game_rounds to authenticated;
create policy game_rounds_select_own on public.game_rounds
  for select to authenticated
  using (
    exists (
      select 1 from public.players p
       where p.id = game_rounds.player_id
         and (
           p.auth_user_id = auth.uid()
           or exists (
             select 1 from public.player_auth_links pal
              where pal.player_id = p.id and pal.auth_user_id = auth.uid()
           )
         )
    )
  );

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  game text not null check (length(trim(game)) between 1 and 64),
  status text not null check (status in ('active', 'won', 'lost', 'cashed_out', 'cancelled')),
  bet integer not null check (bet > 0),
  state jsonb not null default '{}'::jsonb,
  idempotency_key text not null check (length(trim(idempotency_key)) between 1 and 200),
  request_hash text not null check (length(request_hash) = 32),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (player_id, idempotency_key)
);

alter table public.game_sessions enable row level security;
revoke all on table public.game_sessions from public, anon, authenticated;
grant select on table public.game_sessions to authenticated;
create policy game_sessions_select_own on public.game_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.players p
       where p.id = game_sessions.player_id
         and (
           p.auth_user_id = auth.uid()
           or exists (
             select 1 from public.player_auth_links pal
              where pal.player_id = p.id and pal.auth_user_id = auth.uid()
           )
         )
    )
  );

-- La semilla no se guarda en una tabla que el cliente pueda leer.
create table if not exists public.game_session_secrets (
  session_id uuid primary key references public.game_sessions(id) on delete cascade,
  seed bytea not null,
  created_at timestamptz not null default clock_timestamp()
);
revoke all on table public.game_session_secrets from public, anon, authenticated;

create or replace function public.tavern_current_player()
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_player uuid;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para jugar.' using errcode = '42501';
  end if;
  if coalesce(auth.role(), 'anon') not in ('authenticated', 'service_role') then
    raise exception 'El rol actual no puede jugar.' using errcode = '42501';
  end if;

  select p.id into v_player
    from public.players p
   where p.auth_user_id = v_uid
   limit 1;

  if v_player is null then
    select pal.player_id into v_player
      from public.player_auth_links pal
     where pal.auth_user_id = v_uid
     order by pal.created_at
     limit 1;
  end if;

  if v_player is null then
    raise exception 'No hay un jugador vinculado a la sesión.' using errcode = '42501';
  end if;
  return v_player;
end;
$$;

-- M2 compartido por todas las apuestas nuevas. No modifica funciones antiguas.
create or replace function public.assert_not_in_mora(p_player_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if exists (
    select 1
      from public.bank_loans l
     where l.player_id = p_player_id
       and l.status = 'in_mora'
  ) or exists (
    select 1
      from public.bank_loan_installments i
      join public.bank_loans l on l.id = i.loan_id
     where l.player_id = p_player_id
       and i.status = 'in_mora'
  ) then
    raise exception 'No puedes apostar mientras tengas una cuota en mora.' using errcode = '42501';
  end if;
end;
$$;

-- No exponer helpers internos al cliente.
revoke all on function public.tavern_current_player() from public, anon, authenticated;
revoke all on function public.assert_not_in_mora(uuid) from public, anon, authenticated;

create or replace function public.tavern_random_unit()
returns numeric
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  b bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  n bigint;
begin
  n := get_byte(b, 0)::bigint * 16777216
     + get_byte(b, 1)::bigint * 65536
     + get_byte(b, 2)::bigint * 256
     + get_byte(b, 3)::bigint;
  return n::numeric / 4294967296::numeric;
end;
$$;
revoke all on function public.tavern_random_unit() from public, anon, authenticated;

-- Contratos RPC que deben implementarse y probarse en T0 antes de activar:
--
-- A) play_slots_round(p_bet integer, p_idempotency_key text)
--    Usa los cortes 0.005/0.025/0.035/0.050/0.070/0.370 del cliente,
--    los multiplicadores x15/x6/x10/x6/x4/x1.5/x0 y el tope diario neto 350000.
--
-- A) play_roulette_round(p_bets jsonb, p_idempotency_key text)
--    Usa rueda europea de 37 bolsillos, pleno x35 y exteriores x1 de ganancia.
--    El resultado y todos los pagos salen del servidor. No acepta resultado.
--
-- A) play_plinko_round(p_bet integer, p_quantity integer, p_idempotency_key text)
--    Usa 8 decisiones server-side y [10,4,1.3,0.5,0.2,0.5,1.3,4,10].
--
-- B/C) start_penalty_session(p_bet integer, p_idempotency_key text),
--      step_penalty_session(p_session_id uuid, p_action text, p_idempotency_key text)
--    Conserva x1.7/x2.8/x4.8/x8.0, registra acción y techo de recompensa.
--
-- B) start_expedition_run(p_encounter_id text, p_idempotency_key text),
--    step_expedition_run(p_session_id uuid, p_action text, p_idempotency_key text)
--    Mueve NARRATIVE_ENCOUNTERS a configuración server-side; no toma rewardMin,
--    rewardMax ni entryFee del cliente.
--
-- B/C) start_expedition_arcade_run(...), step_expedition_arcade_run(...)
--    Conserva mutadores, ventana de intentos y recompensas, pero los lee del servidor.
--
-- C) submit_tower_defense_result(p_mode text, p_wave integer, p_score integer,
--    p_idempotency_key text)
--    Acepta únicamente el reporte acotado; techo por partida, hora y día, sin oro
--    arbitrario ni recompensa enviada por el cliente.
--
-- Funciones existentes a reutilizar, no duplicar: start_cards_game, guess_cards_round,
-- continue_cards_game, cash_out_cards_game, get_cards_session_state, start_crash_game,
-- get_crash_session_state, cash_out_crash_game, finalize_crash_session,
-- play_chest_round y play_scratch_batch. Su ACL/idempotencia debe probarse antes.
--
-- Reglas comunes de las implementaciones anteriores:
-- 1. player := tavern_current_player(); assert_not_in_mora(player).
-- 2. Validar entero positivo, límite de saldo, límites diarios y request hash.
-- 3. INSERT ... ON CONFLICT (player_id,idempotency_key) y comparar request_hash.
-- 4. SELECT players ... FOR UPDATE; calcular en bigint/numeric; rechazar >2147483647.
-- 5. UPDATE players una sola vez y luego INSERT game_rounds en la misma transacción.
-- 6. Devolver el resultado visual, nunca una semilla ni un resultado aceptado del cliente.

-- Admin-only: sustituye addPlayerGold para Archivista sin alterar increment_gold.
create table if not exists public.admin_gold_adjustments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (length(trim(reason)) between 1 and 500),
  actor_uid uuid,
  actor_role text not null,
  gold_before integer not null check (gold_before >= 0),
  gold_after integer not null check (gold_after >= 0),
  created_at timestamptz not null default clock_timestamp()
);

alter table public.admin_gold_adjustments enable row level security;
revoke all on table public.admin_gold_adjustments from public, anon, authenticated;

create or replace function public.admin_adjust_gold(
  p_player_id uuid,
  p_delta integer,
  p_reason text
)
returns table(success boolean, player_id uuid, new_gold integer, message text)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player public.players;
  v_next bigint;
  v_role text := coalesce(auth.role(), '');
  v_reason text := trim(coalesce(p_reason, ''));
  v_delta bigint := p_delta::bigint;
begin
  if v_role <> 'service_role' and not public.is_current_user_admin() then
    raise exception 'Solo un administrador puede ajustar oro.' using errcode = '42501';
  end if;
  if p_player_id is null or p_delta is null or v_delta = 0 or abs(v_delta) > 5000000 then
    raise exception 'Ajuste de oro fuera de rango.' using errcode = '22023';
  end if;
  if length(v_reason) < 1 or length(v_reason) > 500 then
    raise exception 'El motivo del ajuste es obligatorio.' using errcode = '22023';
  end if;

  select p.* into v_player from public.players p where p.id = p_player_id for update;
  if not found then
    raise exception 'Jugador no encontrado.' using errcode = 'P0002';
  end if;
  v_next := v_player.gold::bigint + v_delta;
  if v_next < 0 or v_next > 2147483647 then
    raise exception 'El saldo resultante queda fuera de rango integer.' using errcode = '22003';
  end if;

  update public.players set gold = v_next::integer where id = v_player.id;
  insert into public.admin_gold_adjustments(
    player_id, delta, reason, actor_uid, actor_role, gold_before, gold_after
  ) values (
    v_player.id, p_delta, v_reason, auth.uid(), v_role, v_player.gold, v_next::integer
  );
  insert into public.gold_increment_audit(
    auth_uid, role, player_id, amount, gold_before, gold_after
  ) values (
    auth.uid(), v_role, v_player.id, p_delta, v_player.gold, v_next::integer
  );
  return query select true, v_player.id, v_next::integer, 'Ajuste administrativo aplicado.'::text;
end;
$$;

revoke all on function public.admin_adjust_gold(uuid, integer, text) from public, anon;
grant execute on function public.admin_adjust_gold(uuid, integer, text) to authenticated, service_role;

-- ROLLBACK (comentado; ejecutar solo en runtime aislado y con verificación):
-- revoke execute on function public.admin_adjust_gold(uuid, integer, text) from authenticated, service_role;
-- drop function if exists public.admin_adjust_gold(uuid, integer, text);
-- drop table if exists public.admin_gold_adjustments;
-- drop function if exists public.tavern_random_unit();
-- drop function if exists public.assert_not_in_mora(uuid);
-- drop function if exists public.tavern_current_player();
-- drop table if exists public.game_session_secrets;
-- drop table if exists public.game_sessions;
-- drop table if exists public.game_rounds;

-- Configuración server-side de los flujos nuevos. No se concede EXECUTE directo.
create table if not exists public.tavern_action_dedup (
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null check (length(request_hash) = 32),
  result jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (session_id, idempotency_key)
);
revoke all on table public.tavern_action_dedup from public, anon, authenticated;

create table if not exists public.tavern_encounter_configs (
  game text not null check (game in ('expedition', 'expedition_arcade')),
  encounter_id text not null,
  entry_fee integer not null check (entry_fee > 0),
  reward_min integer not null check (reward_min >= 0),
  reward_max integer not null check (reward_max >= reward_min),
  max_steps integer not null check (max_steps between 1 and 100),
  max_attempts_per_window integer not null default 1 check (max_attempts_per_window between 1 and 100),
  window_hours integer not null default 24 check (window_hours between 1 and 168),
  enabled boolean not null default false,
  primary key (game, encounter_id)
);
revoke all on table public.tavern_encounter_configs from public, anon, authenticated;
alter table public.tavern_encounter_configs add column if not exists max_attempts_per_window integer not null default 1;
alter table public.tavern_encounter_configs add column if not exists window_hours integer not null default 24;

insert into public.tavern_encounter_configs(game, encounter_id, entry_fee, reward_min, reward_max, max_steps, max_attempts_per_window, window_hours, enabled)
values
  ('expedition', 'forest', 80, 170, 260, 4, 1, 24, true),
  ('expedition', 'ruins', 120, 240, 360, 4, 1, 24, true),
  ('expedition', 'abyss', 170, 320, 470, 4, 1, 24, true),
  ('expedition_arcade', 'frontier-rush', 70, 320, 500, 6, 5, 6, true),
  ('expedition_arcade', 'moonfang-hunt', 95, 420, 640, 6, 4, 6, true),
  ('expedition_arcade', 'iron-duel', 120, 650, 1000, 6, 4, 6, true),
  ('expedition_arcade', 'ash-siege', 165, 820, 1220, 6, 3, 6, true),
  ('expedition_arcade', 'void-revenant', 200, 980, 1500, 6, 3, 6, true),
  ('expedition_arcade', 'abyss-tyrant', 280, 1380, 2050, 6, 2, 6, true)
on conflict (game, encounter_id) do nothing;

create or replace function public.tavern_roulette_payout(
  p_kind text,
  p_winning integer,
  p_stake integer
)
returns bigint
language plpgsql
immutable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_kind text := lower(trim(p_kind));
  v_number integer;
begin
  if p_stake <= 0 or p_winning not between 0 and 36 then
    raise exception 'Apuesta de ruleta inválida.' using errcode = '22023';
  end if;
  if v_kind = 'red' and p_winning in (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36) then return p_stake::bigint * 2; end if;
  if v_kind = 'black' and p_winning in (2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35) then return p_stake::bigint * 2; end if;
  if v_kind = 'odd' and p_winning > 0 and p_winning % 2 = 1 then return p_stake::bigint * 2; end if;
  if v_kind = 'even' and p_winning > 0 and p_winning % 2 = 0 then return p_stake::bigint * 2; end if;
  if v_kind = 'low' and p_winning between 1 and 18 then return p_stake::bigint * 2; end if;
  if v_kind = 'high' and p_winning between 19 and 36 then return p_stake::bigint * 2; end if;
  if v_kind = 'zero' and p_winning = 0 then return p_stake::bigint * 36; end if;
  if v_kind like 'straight:%' then
    begin
      v_number := substring(v_kind from 10)::integer;
    exception when others then
      raise exception 'Apuesta de pleno inválida.' using errcode = '22023';
    end;
    if v_number not between 0 and 36 then raise exception 'Número de pleno inválido.' using errcode = '22023'; end if;
    if v_number = p_winning then return p_stake::bigint * 36; end if;
    return 0;
  end if;
  if v_kind in ('red','black','odd','even','low','high','zero') then return 0; end if;
  raise exception 'Tipo de apuesta de ruleta no permitido.' using errcode = '22023';
end;
$$;
revoke all on function public.tavern_roulette_payout(text, integer, integer) from public, anon, authenticated;

-- A: Slots. El resultado se genera en servidor; el cliente recibe solo el resultado visual.
create or replace function public.play_slots_round(p_bet integer, p_idempotency_key text)
returns table(round_id uuid, game text, bet integer, payout integer, outcome jsonb, new_gold integer)
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player uuid := public.tavern_current_player();
  v_old public.game_rounds;
  v_gold integer;
  v_next bigint;
  v_payout bigint;
  v_roll numeric := public.tavern_random_unit();
  v_multiplier numeric;
  v_hash text := md5(format('slots|%s', p_bet));
  v_daily bigint;
begin
  if p_bet is null or p_bet <= 0 or p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'La apuesta y la clave de idempotencia son obligatorias.' using errcode = '22023';
  end if;
  select * into v_old from public.game_rounds where player_id = v_player and idempotency_key = trim(p_idempotency_key) for update;
  if found then
    if v_old.request_hash <> v_hash then raise exception 'La clave ya fue usada con otros parámetros.' using errcode = '23505'; end if;
    return query select v_old.id, v_old.game, v_old.bet, v_old.payout, v_old.outcome, (select p.gold from public.players p where p.id = v_player);
    return;
  end if;
  perform public.assert_not_in_mora(v_player);
  select gold into v_gold from public.players where id = v_player for update;
  if not found or p_bet > v_gold then raise exception 'Saldo insuficiente.' using errcode = '22023'; end if;
  if v_roll < 0.005 then v_multiplier := 15;
  elsif v_roll < 0.015 then v_multiplier := 10;
  elsif v_roll < 0.035 then v_multiplier := 6;
  elsif v_roll < 0.05 then v_multiplier := 6;
  elsif v_roll < 0.07 then v_multiplier := 4;
  elsif v_roll < 0.37 then v_multiplier := 1.5;
  else v_multiplier := 0; end if;
  v_payout := floor(p_bet::numeric * v_multiplier);
  select coalesce(sum(greatest(g.payout::bigint - g.bet::bigint, 0)), 0) into v_daily from public.game_rounds g where g.player_id = v_player and g.game = 'slots' and g.created_at >= date_trunc('day', clock_timestamp());
  if v_daily + greatest(v_payout - p_bet, 0) > 350000 then raise exception 'Límite diario de Slots alcanzado.' using errcode = '22023'; end if;
  v_next := v_gold::bigint - p_bet + v_payout;
  if v_payout > 2147483647 or v_next < 0 or v_next > 2147483647 then raise exception 'El pago excede el máximo integer.' using errcode = '22003'; end if;
  update public.players set gold = v_next::integer where id = v_player;
  insert into public.game_rounds(player_id, game, bet, payout, outcome, idempotency_key, request_hash) values (v_player, 'slots', p_bet, v_payout::integer, jsonb_build_object('roll', round(v_roll, 8), 'multiplier', v_multiplier), trim(p_idempotency_key), v_hash) returning id into round_id;
  return query select round_id, 'slots'::text, p_bet, v_payout::integer, jsonb_build_object('roll', round(v_roll, 8), 'multiplier', v_multiplier), v_next::integer;
end;
$$;

-- A: Ruleta europea. p_bets es un objeto {red:10, straight:17:5}; nunca acepta resultado.
create or replace function public.play_roulette_round(p_bets jsonb, p_idempotency_key text)
returns table(round_id uuid, game text, bet integer, payout integer, outcome jsonb, new_gold integer)
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player uuid := public.tavern_current_player();
  v_old public.game_rounds;
  v_gold integer;
  v_next bigint;
  v_total_bet bigint := 0;
  v_total_payout bigint := 0;
  v_winning integer := floor(public.tavern_random_unit() * 37)::integer;
  v_hash text := md5(format('roulette|%s', p_bets::text));
  v_key text;
  v_value text;
  v_stake integer;
  v_win bigint;
  v_outcome jsonb;
begin
  if p_bets is null or jsonb_typeof(p_bets) <> 'object' or p_bets = '{}'::jsonb or p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then raise exception 'Apuestas de ruleta inválidas.' using errcode = '22023'; end if;
  select * into v_old from public.game_rounds where player_id = v_player and idempotency_key = trim(p_idempotency_key) for update;
  if found then
    if v_old.request_hash <> v_hash then raise exception 'La clave ya fue usada con otros parámetros.' using errcode = '23505'; end if;
    return query select v_old.id, v_old.game, v_old.bet, v_old.payout, v_old.outcome, (select p.gold from public.players p where p.id = v_player); return;
  end if;
  perform public.assert_not_in_mora(v_player);
  select gold into v_gold from public.players where id = v_player for update;
  for v_key, v_value in select key, value from jsonb_each_text(p_bets) loop
    if v_value !~ '^[0-9]+$' then raise exception 'La apuesta debe ser entera.' using errcode = '22023'; end if;
    v_stake := v_value::integer;
    if v_stake <= 0 then raise exception 'La apuesta debe ser mayor que cero.' using errcode = '22023'; end if;
    v_total_bet := v_total_bet + v_stake;
    v_win := public.tavern_roulette_payout(v_key, v_winning, v_stake);
    v_total_payout := v_total_payout + v_win;
  end loop;
  if v_total_bet > v_gold or v_total_bet > 2147483647 then raise exception 'Saldo o apuesta fuera de rango.' using errcode = '22023'; end if;
  v_next := v_gold::bigint - v_total_bet + v_total_payout;
  if v_total_payout > 2147483647 or v_next < 0 or v_next > 2147483647 then raise exception 'El pago excede el máximo integer.' using errcode = '22003'; end if;
  v_outcome := jsonb_build_object('winningPocket', v_winning, 'bets', p_bets);
  update public.players set gold = v_next::integer where id = v_player;
  insert into public.game_rounds(player_id, game, bet, payout, outcome, idempotency_key, request_hash) values (v_player, 'roulette', v_total_bet::integer, v_total_payout::integer, v_outcome, trim(p_idempotency_key), v_hash) returning id into round_id;
  return query select round_id, 'roulette'::text, v_total_bet::integer, v_total_payout::integer, v_outcome, v_next::integer;
end;
$$;

-- A: Plinko. Cada esfera usa ocho decisiones server-side y conserva la tabla observada.
create or replace function public.play_plinko_round(p_bet integer, p_quantity integer, p_idempotency_key text)
returns table(round_id uuid, game text, bet integer, payout integer, outcome jsonb, new_gold integer)
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player uuid := public.tavern_current_player();
  v_old public.game_rounds;
  v_gold integer;
  v_next bigint;
  v_total_bet bigint;
  v_total_payout bigint := 0;
  v_ball integer;
  v_step integer;
  v_slot integer;
  v_mult numeric;
  v_hash text := md5(format('plinko|%s|%s', p_bet, p_quantity));
  v_outcomes jsonb := '[]'::jsonb;
  v_daily bigint;
begin
  if p_bet is null or p_bet <= 0 or p_quantity is null or p_quantity < 1 or p_quantity > 100 or p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then raise exception 'Apuesta o cantidad de Plinko inválida.' using errcode = '22023'; end if;
  select * into v_old from public.game_rounds where player_id = v_player and idempotency_key = trim(p_idempotency_key) for update;
  if found then
    if v_old.request_hash <> v_hash then raise exception 'La clave ya fue usada con otros parámetros.' using errcode = '23505'; end if;
    return query select v_old.id, v_old.game, v_old.bet, v_old.payout, v_old.outcome, (select p.gold from public.players p where p.id = v_player); return;
  end if;
  perform public.assert_not_in_mora(v_player);
  select gold into v_gold from public.players where id = v_player for update;
  v_total_bet := p_bet::bigint * p_quantity;
  if v_total_bet > v_gold then raise exception 'Saldo insuficiente.' using errcode = '22023'; end if;
  for v_ball in 1..p_quantity loop
    v_slot := 0;
    for v_step in 1..8 loop if public.tavern_random_unit() >= 0.5 then v_slot := v_slot + 1; end if; end loop;
    v_mult := (array[10,4,1.3,0.5,0.2,0.5,1.3,4,10]::numeric[])[v_slot + 1];
    v_total_payout := v_total_payout + floor(p_bet::numeric * v_mult);
    v_outcomes := v_outcomes || jsonb_build_array(jsonb_build_object('slot', v_slot, 'multiplier', v_mult));
  end loop;
  select coalesce(sum(greatest(g.payout::bigint - g.bet::bigint, 0)), 0) into v_daily from public.game_rounds g where g.player_id = v_player and g.game = 'plinko' and g.created_at >= date_trunc('day', clock_timestamp());
  if v_daily + greatest(v_total_payout - v_total_bet, 0) > 350000 then raise exception 'Límite diario de Plinko alcanzado.' using errcode = '22023'; end if;
  v_next := v_gold::bigint - v_total_bet + v_total_payout;
  if v_total_payout > 2147483647 or v_next < 0 or v_next > 2147483647 then raise exception 'El pago excede el máximo integer.' using errcode = '22003'; end if;
  update public.players set gold = v_next::integer where id = v_player;
  insert into public.game_rounds(player_id, game, bet, payout, outcome, idempotency_key, request_hash) values (v_player, 'plinko', v_total_bet::integer, v_total_payout::integer, v_outcomes, trim(p_idempotency_key), v_hash) returning id into round_id;
  return query select round_id, 'plinko'::text, v_total_bet::integer, v_total_payout::integer, v_outcomes, v_next::integer;
end;
$$;

-- B/C: Penalties con cuatro rondas server-side, deduplicación por acción y techo de recompensa.
create or replace function public.start_penalty_session(p_bet integer, p_idempotency_key text)
returns uuid language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player uuid := public.tavern_current_player(); v_old public.game_sessions; v_id uuid := gen_random_uuid(); v_gold integer; v_next bigint; v_daily_net bigint; v_hash text := md5(format('penalty-start|%s',p_bet)); v_seed bytea := decode(replace(gen_random_uuid()::text,'-',''),'hex');
begin
  if p_bet is null or p_bet <= 0 or length(trim(coalesce(p_idempotency_key,'')))=0 then raise exception 'Apuesta de Penalties inválida.' using errcode='22023'; end if;
  perform public.assert_not_in_mora(v_player);
  select * into v_old from public.game_sessions where player_id=v_player and idempotency_key=trim(p_idempotency_key) for update;
  if found then if v_old.request_hash<>v_hash then raise exception 'La clave ya fue usada con otros parámetros.' using errcode='23505'; end if; return v_old.id; end if;
  -- 350.000 netos/día coincide con scratchUtils.ts:71; se valida aquí, no en localStorage.
  select coalesce(sum(greatest(g.payout::bigint-g.bet::bigint,0)),0) into v_daily_net
    from public.game_rounds g
   where g.player_id=v_player and g.game='penalties'
     and g.created_at >= date_trunc('day',clock_timestamp());
  if v_daily_net + greatest(p_bet::bigint*8-p_bet,0) > 350000 then
    raise exception 'Límite diario de Penalties alcanzado.' using errcode='22023';
  end if;
  select gold into v_gold from public.players where id=v_player for update;
  if p_bet>v_gold then raise exception 'Saldo insuficiente.' using errcode='22023'; end if;
  v_next := v_gold::bigint-p_bet;
  update public.players set gold=v_next::integer where id=v_player;
  insert into public.game_sessions(id,player_id,game,status,bet,state,idempotency_key,request_hash) values(v_id,v_player,'penalties','active',p_bet,jsonb_build_object('round',0,'history','[]'::jsonb),trim(p_idempotency_key),v_hash);
  insert into public.game_session_secrets(session_id,seed) values(v_id,v_seed);
  return v_id;
end;
$$;

create or replace function public.step_penalty_session(p_session_id uuid, p_action text, p_idempotency_key text)
returns jsonb language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player uuid := public.tavern_current_player(); v_session public.game_sessions; v_dedup public.tavern_action_dedup; v_round integer; v_success boolean; v_payout bigint:=0; v_multiplier numeric; v_gold integer; v_next bigint; v_hash text:=md5(format('penalty-step|%s|%s',p_action,p_session_id)); v_result jsonb; v_history jsonb;
begin
  if p_session_id is null or lower(trim(coalesce(p_action,''))) not in ('left','center','right') or length(trim(coalesce(p_idempotency_key,'')))=0 then raise exception 'Paso de Penalties inválido.' using errcode='22023'; end if;
  select * into v_session from public.game_sessions where id=p_session_id for update;
  if not found or v_session.player_id<>v_player or v_session.game<>'penalties' then raise exception 'Sesión de Penalties no válida.' using errcode='55000'; end if;
  select * into v_dedup from public.tavern_action_dedup where session_id=p_session_id and idempotency_key=trim(p_idempotency_key) for update;
  if found then if v_dedup.request_hash<>v_hash then raise exception 'La clave de paso ya fue usada con otros parámetros.' using errcode='23505'; end if; return v_dedup.result; end if;
  if v_session.status<>'active' then raise exception 'Sesión de Penalties no activa.' using errcode='55000'; end if;
  v_round := coalesce((v_session.state->>'round')::integer,0)+1;
  if v_round>4 then raise exception 'Penalties ya completó sus rondas.' using errcode='55000'; end if;
  v_success := public.tavern_random_unit() >= (1.0/3.0);
  v_multiplier := (array[1.7,2.8,4.8,8.0]::numeric[])[v_round];
  v_history := coalesce(v_session.state->'history','[]'::jsonb) || jsonb_build_array(jsonb_build_object('round',v_round,'action',lower(trim(p_action)),'success',v_success));
  if not v_success then
    update public.game_sessions set status='lost',state=jsonb_build_object('round',v_round,'history',v_history,'success',false),updated_at=clock_timestamp() where id=p_session_id;
    v_result:=jsonb_build_object('sessionId',p_session_id,'status','lost','round',v_round,'payout',0,'history',v_history);
    insert into public.game_rounds(player_id,game,bet,payout,outcome,idempotency_key,request_hash) values(v_player,'penalties',v_session.bet,0,v_result,trim(p_idempotency_key),v_hash);
  elsif v_round<4 then
    update public.game_sessions set state=jsonb_build_object('round',v_round,'history',v_history),updated_at=clock_timestamp() where id=p_session_id;
    v_result:=jsonb_build_object('sessionId',p_session_id,'status','active','round',v_round,'payout',0,'history',v_history);
  else
    v_payout:=floor(v_session.bet::numeric*v_multiplier);
    select gold into v_gold from public.players where id=v_player for update;
    v_next:=v_gold::bigint+v_payout;
    if v_payout>2147483647 or v_next>2147483647 then raise exception 'El premio de Penalties excede integer.' using errcode='22003'; end if;
    update public.players set gold=v_next::integer where id=v_player;
    update public.game_sessions set status='won',state=jsonb_build_object('round',v_round,'history',v_history,'payout',v_payout),updated_at=clock_timestamp() where id=p_session_id;
    v_result:=jsonb_build_object('sessionId',p_session_id,'status','won','round',v_round,'payout',v_payout,'newGold',v_next,'history',v_history);
    insert into public.game_rounds(player_id,game,bet,payout,outcome,idempotency_key,request_hash) values(v_player,'penalties',v_session.bet,v_payout::integer,v_result,trim(p_idempotency_key),v_hash);
  end if;
  insert into public.tavern_action_dedup(session_id,idempotency_key,request_hash,result) values(p_session_id,trim(p_idempotency_key),v_hash,v_result);
  return v_result;
end;
$$;

-- B: Expedición narrativa y Arcade comparten un motor que solo lee config server-side.
create or replace function public.tavern_start_configured_run(p_game text,p_encounter_id text,p_idempotency_key text)
returns uuid language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_player uuid:=public.tavern_current_player(); v_cfg public.tavern_encounter_configs; v_old public.game_sessions; v_id uuid:=gen_random_uuid(); v_gold integer; v_next bigint; v_attempts integer; v_hash text:=md5(format('run-start|%s|%s',p_game,p_encounter_id));
begin
  if p_game not in ('expedition','expedition_arcade') or length(trim(coalesce(p_encounter_id,'')))=0 or length(trim(coalesce(p_idempotency_key,'')))=0 then raise exception 'Expedición inválida.' using errcode='22023'; end if;
  perform public.assert_not_in_mora(v_player);
  select * into v_cfg from public.tavern_encounter_configs where game=p_game and encounter_id=trim(p_encounter_id) and enabled for update;
  if not found then raise exception 'Encuentro no habilitado por el servidor.' using errcode='55000'; end if;
  select * into v_old from public.game_sessions where player_id=v_player and idempotency_key=trim(p_idempotency_key) for update;
  if found then if v_old.request_hash<>v_hash then raise exception 'La clave ya fue usada con otros parámetros.' using errcode='23505'; end if; return v_old.id; end if;
  if p_game='expedition_arcade' then
    select count(*)::integer into v_attempts
      from public.game_sessions
     where player_id=v_player and game=p_game
       and state->>'encounterId'=v_cfg.encounter_id
       and created_at >= clock_timestamp() - make_interval(hours => v_cfg.window_hours);
    if v_attempts >= v_cfg.max_attempts_per_window then
      raise exception 'Límite de intentos de Arcade en la ventana alcanzado.' using errcode='22023';
    end if;
  end if;
  select gold into v_gold from public.players where id=v_player for update;
  if v_cfg.entry_fee>v_gold then raise exception 'Saldo insuficiente.' using errcode='22023'; end if;
  v_next:=v_gold::bigint-v_cfg.entry_fee; update public.players set gold=v_next::integer where id=v_player;
  insert into public.game_sessions(id,player_id,game,status,bet,state,idempotency_key,request_hash) values(v_id,v_player,p_game,'active',v_cfg.entry_fee,jsonb_build_object('encounterId',v_cfg.encounter_id,'step',0,'maxSteps',v_cfg.max_steps,'maxAttemptsPerWindow',v_cfg.max_attempts_per_window,'windowHours',v_cfg.window_hours,'rewardMin',v_cfg.reward_min,'rewardMax',v_cfg.reward_max),trim(p_idempotency_key),v_hash);
  insert into public.game_session_secrets(session_id,seed) values(v_id,decode(replace(gen_random_uuid()::text,'-',''),'hex'));
  return v_id;
end;
$$;

create or replace function public.tavern_step_configured_run(p_session_id uuid,p_action text,p_idempotency_key text,p_expected_game text)
returns jsonb language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_player uuid:=public.tavern_current_player(); v_s public.game_sessions; v_d public.tavern_action_dedup; v_step integer; v_max integer; v_reward_min integer; v_reward_max integer; v_payout bigint:=0; v_status text; v_hash text:=md5(format('run-step|%s|%s|%s',p_expected_game,p_action,p_session_id)); v_result jsonb; v_gold integer; v_next bigint; v_roll numeric;
begin
  if p_expected_game not in ('expedition','expedition_arcade') or lower(trim(coalesce(p_action,''))) not in ('advance','retreat') or length(trim(coalesce(p_idempotency_key,'')))=0 then raise exception 'Paso de expedición inválido.' using errcode='22023'; end if;
  select * into v_s from public.game_sessions where id=p_session_id and player_id=v_player for update;
  if not found or v_s.game<>p_expected_game then raise exception 'Sesión de expedición no válida.' using errcode='55000'; end if;
  select * into v_d from public.tavern_action_dedup where session_id=p_session_id and idempotency_key=trim(p_idempotency_key) for update;
  if found then if v_d.request_hash<>v_hash then raise exception 'La clave de paso ya fue usada con otros parámetros.' using errcode='23505'; end if; return v_d.result; end if;
  if v_s.status<>'active' then raise exception 'Sesión de expedición no activa.' using errcode='55000'; end if;
  v_step:=coalesce((v_s.state->>'step')::integer,0)+1; v_max:=(v_s.state->>'maxSteps')::integer; v_reward_min:=(v_s.state->>'rewardMin')::integer; v_reward_max:=(v_s.state->>'rewardMax')::integer;
  if lower(trim(p_action))='retreat' then v_status:='cashed_out'; v_payout:=floor(v_s.bet*0.5); elsif public.tavern_random_unit()<0.25 then v_status:='lost'; elsif v_step>=v_max then v_status:='won'; v_roll:=public.tavern_random_unit(); v_payout:=v_reward_min+floor(v_roll*(v_reward_max-v_reward_min+1)); else v_status:='active'; end if;
  if v_status='active' then update public.game_sessions set state=state||jsonb_build_object('step',v_step,'lastAction',lower(trim(p_action))),updated_at=clock_timestamp() where id=p_session_id; else
    if v_payout>0 then select gold into v_gold from public.players where id=v_player for update; v_next:=v_gold::bigint+v_payout; if v_next>2147483647 then raise exception 'Premio de expedición fuera de integer.' using errcode='22003'; end if; update public.players set gold=v_next::integer where id=v_player; else v_next:=null; end if;
    update public.game_sessions set status=v_status,state=state||jsonb_build_object('step',v_step,'lastAction',lower(trim(p_action)),'payout',v_payout),updated_at=clock_timestamp() where id=p_session_id;
  end if;
  v_result:=jsonb_build_object('sessionId',p_session_id,'status',v_status,'step',v_step,'payout',v_payout,'newGold',v_next);
  if v_status<>'active' then insert into public.game_rounds(player_id,game,bet,payout,outcome,idempotency_key,request_hash) values(v_player,v_s.game,v_s.bet,v_payout::integer,v_result,trim(p_idempotency_key),v_hash); end if;
  insert into public.tavern_action_dedup(session_id,idempotency_key,request_hash,result) values(p_session_id,trim(p_idempotency_key),v_hash,v_result);
  return v_result;
end;
$$;

create or replace function public.start_expedition_run(p_encounter_id text,p_idempotency_key text) returns uuid language sql volatile security definer set search_path=pg_catalog,public,pg_temp as $$ select public.tavern_start_configured_run('expedition',p_encounter_id,p_idempotency_key) $$;
create or replace function public.step_expedition_run(p_session_id uuid,p_action text,p_idempotency_key text) returns jsonb language sql volatile security definer set search_path=pg_catalog,public,pg_temp as $$ select public.tavern_step_configured_run(p_session_id,p_action,p_idempotency_key,'expedition') $$;
create or replace function public.start_expedition_arcade_run(p_encounter_id text,p_idempotency_key text) returns uuid language sql volatile security definer set search_path=pg_catalog,public,pg_temp as $$ select public.tavern_start_configured_run('expedition_arcade',p_encounter_id,p_idempotency_key) $$;
create or replace function public.step_expedition_arcade_run(p_session_id uuid,p_action text,p_idempotency_key text) returns jsonb language sql volatile security definer set search_path=pg_catalog,public,pg_temp as $$ select public.tavern_step_configured_run(p_session_id,p_action,p_idempotency_key,'expedition_arcade') $$;

create table if not exists public.tavern_tower_claims(player_id uuid not null references public.players(id) on delete cascade,mode text not null check(mode in ('frontier','siege','abyss')),day_key date not null,payout integer not null check(payout>0),idempotency_key text not null,request_hash text not null,created_at timestamptz not null default clock_timestamp(),primary key(player_id,mode,day_key),unique(player_id,idempotency_key));
revoke all on table public.tavern_tower_claims from public,anon,authenticated;

create or replace function public.submit_tower_defense_result(p_mode text,p_wave integer,p_score integer,p_idempotency_key text) returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public,pg_temp as $$
declare v_player uuid:=public.tavern_current_player(); v_mode text:=lower(trim(p_mode)); v_reward integer; v_day date:=(clock_timestamp() at time zone 'America/Asuncion')::date; v_old public.tavern_tower_claims; v_gold integer; v_next bigint; v_hash text:=md5(format('tower|%s|%s|%s',v_mode,p_wave,p_score)); v_result jsonb;
begin
  if v_mode not in ('frontier','siege','abyss') or p_wave<>5 or p_score is null or p_score<0 or p_score>100000 or length(trim(coalesce(p_idempotency_key,'')))=0 then raise exception 'Resultado de Tower Defense inválido.' using errcode='22023'; end if;
  perform public.assert_not_in_mora(v_player);
  case v_mode when 'frontier' then v_reward:=850; when 'siege' then v_reward:=1500; else v_reward:=2600; end case;
  select * into v_old from public.tavern_tower_claims where player_id=v_player and idempotency_key=trim(p_idempotency_key) for update;
  if found then if v_old.request_hash<>v_hash then raise exception 'La clave ya fue usada con otros parámetros.' using errcode='23505'; end if; return jsonb_build_object('mode',v_mode,'payout',v_old.payout,'status','already_claimed'); end if;
  select * into v_old from public.tavern_tower_claims where player_id=v_player and mode=v_mode and day_key=v_day for update;
  if found then return jsonb_build_object('mode',v_mode,'payout',v_old.payout,'status','already_claimed'); end if;
  select gold into v_gold from public.players where id=v_player for update; v_next:=v_gold::bigint+v_reward; if v_next>2147483647 then raise exception 'Recompensa de Tower Defense fuera de integer.' using errcode='22003'; end if;
  update public.players set gold=v_next::integer where id=v_player;
  insert into public.tavern_tower_claims(player_id,mode,day_key,payout,idempotency_key,request_hash) values(v_player,v_mode,v_day,v_reward,trim(p_idempotency_key),v_hash);
  v_result:=jsonb_build_object('mode',v_mode,'wave',p_wave,'score',p_score,'payout',v_reward,'newGold',v_next,'status','paid'); return v_result;
end; $$;

revoke all on function public.tavern_start_configured_run(text,text,text) from public,anon,authenticated;
revoke all on function public.tavern_step_configured_run(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.submit_tower_defense_result(text,integer,integer,text) from public,anon;

revoke all on function public.play_slots_round(integer, text) from public, anon;
revoke all on function public.play_roulette_round(jsonb, text) from public, anon;
revoke all on function public.play_plinko_round(integer, integer, text) from public, anon;
revoke all on function public.start_penalty_session(integer, text) from public, anon;
revoke all on function public.step_penalty_session(uuid, text, text) from public, anon;
revoke all on function public.start_expedition_run(text, text) from public, anon;
revoke all on function public.step_expedition_run(uuid, text, text) from public, anon;
revoke all on function public.start_expedition_arcade_run(text, text) from public, anon;
revoke all on function public.step_expedition_arcade_run(uuid, text, text) from public, anon;
revoke all on function public.submit_tower_defense_result(text, integer, integer, text) from public, anon;
grant execute on function public.play_slots_round(integer, text) to authenticated, service_role;
grant execute on function public.play_roulette_round(jsonb, text) to authenticated, service_role;
grant execute on function public.play_plinko_round(integer, integer, text) to authenticated, service_role;
grant execute on function public.start_penalty_session(integer, text) to authenticated, service_role;
grant execute on function public.step_penalty_session(uuid, text, text) to authenticated, service_role;
grant execute on function public.start_expedition_run(text, text) to authenticated, service_role;
grant execute on function public.step_expedition_run(uuid, text, text) to authenticated, service_role;
grant execute on function public.start_expedition_arcade_run(text, text) to authenticated, service_role;
grant execute on function public.step_expedition_arcade_run(uuid, text, text) to authenticated, service_role;
grant execute on function public.submit_tower_defense_result(text, integer, integer, text) to authenticated, service_role;

-- ROLLBACK adicional comentado:
-- revoke all on function public.play_slots_round(integer,text) from authenticated, service_role;
-- revoke all on function public.play_roulette_round(jsonb,text) from authenticated, service_role;
-- revoke all on function public.play_plinko_round(integer,integer,text) from authenticated, service_role;
-- drop function if exists public.tavern_roulette_payout(text,integer,integer);
-- drop function if exists public.play_slots_round(integer,text);
-- drop function if exists public.play_roulette_round(jsonb,text);
-- drop function if exists public.play_plinko_round(integer,integer,text);
-- drop function if exists public.step_expedition_arcade_run(uuid,text,text);
-- drop function if exists public.start_expedition_arcade_run(text,text);
-- drop function if exists public.step_expedition_run(uuid,text,text);
-- drop function if exists public.start_expedition_run(text,text);
-- drop function if exists public.tavern_step_configured_run(uuid,text,text,text);
-- drop function if exists public.tavern_start_configured_run(text,text,text);
-- drop function if exists public.step_penalty_session(uuid,text,text);
-- drop function if exists public.start_penalty_session(integer,text);
-- drop function if exists public.submit_tower_defense_result(text,integer,integer,text);
-- drop table if exists public.tavern_tower_claims;
-- drop table if exists public.tavern_action_dedup;
-- drop table if exists public.tavern_encounter_configs;
