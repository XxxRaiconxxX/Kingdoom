create table if not exists public.horse_race_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Carrera publica',
  status text not null default 'betting' check (status in ('betting', 'closed', 'running', 'finished')),
  horses jsonb not null default '[]'::jsonb,
  result jsonb,
  winner_id text,
  target_bets integer not null default 2 check (target_bets between 2 and 6),
  created_by uuid references public.players(id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.horse_race_sessions
  add column if not exists target_bets integer not null default 2;

alter table public.horse_race_sessions
  drop constraint if exists horse_race_sessions_target_bets_check;

alter table public.horse_race_sessions
  add constraint horse_race_sessions_target_bets_check check (target_bets between 2 and 6);

create table if not exists public.horse_race_bets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.horse_race_sessions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  horse_id text not null,
  horse_name text not null,
  bet_amount integer not null check (bet_amount > 0),
  odds numeric not null check (odds >= 1),
  payout integer not null default 0 check (payout >= 0),
  status text not null default 'placed' check (status in ('placed', 'won', 'lost', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, player_id)
);

create table if not exists public.horse_race_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.horse_race_sessions(id) on delete cascade,
  winner_id text not null,
  placements jsonb not null default '[]'::jsonb,
  result jsonb not null,
  payouts_processed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_horse_race_sessions_status_created
  on public.horse_race_sessions (status, created_at desc);

create index if not exists idx_horse_race_bets_session
  on public.horse_race_bets (session_id, created_at asc);

create index if not exists idx_horse_race_bets_player
  on public.horse_race_bets (player_id, created_at desc);

do $$
begin
  alter publication supabase_realtime add table public.horse_race_sessions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.horse_race_bets;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.horse_race_results;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

alter table public.horse_race_sessions enable row level security;
alter table public.horse_race_bets enable row level security;
alter table public.horse_race_results enable row level security;

drop policy if exists "Public can read horse race sessions" on public.horse_race_sessions;
create policy "Public can read horse race sessions"
on public.horse_race_sessions
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read horse race bets" on public.horse_race_bets;
create policy "Public can read horse race bets"
on public.horse_race_bets
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read horse race results" on public.horse_race_results;
create policy "Public can read horse race results"
on public.horse_race_results
for select
to anon, authenticated
using (true);

create or replace function public.is_horse_race_admin(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.players
    where id = p_player_id
      and coalesce(is_admin, false) = true
  );
$$;

drop function if exists public.create_public_horse_race_session(uuid, text, jsonb);
drop function if exists public.create_public_horse_race_session(uuid, text, jsonb, integer);

create or replace function public.create_public_horse_race_session(
  p_creator_player_id uuid,
  p_title text,
  p_horses jsonb,
  p_target_bets integer default 2
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.horse_race_sessions%rowtype;
begin
  if not exists (select 1 from public.players where id = p_creator_player_id) then
    raise exception 'Jugador no encontrado para crear sala.' using errcode = '22023';
  end if;

  if jsonb_typeof(p_horses) <> 'array' or jsonb_array_length(p_horses) < 2 then
    raise exception 'La carrera necesita caballos validos.' using errcode = '22023';
  end if;

  insert into public.horse_race_sessions (title, status, horses, target_bets, created_by)
  values (
    coalesce(nullif(trim(p_title), ''), 'Carrera publica'),
    'betting',
    p_horses,
    greatest(2, least(6, coalesce(p_target_bets, 2))),
    p_creator_player_id
  )
  returning * into v_session;

  return to_jsonb(v_session);
end;
$$;

create or replace function public.close_public_horse_race_bets(
  p_admin_player_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.horse_race_sessions%rowtype;
begin
  if not public.is_horse_race_admin(p_admin_player_id) then
    raise exception 'Solo un admin puede cerrar apuestas.' using errcode = '42501';
  end if;

  update public.horse_race_sessions
  set status = 'closed', updated_at = now()
  where id = p_session_id
    and status = 'betting'
  returning * into v_session;

  if v_session.id is null then
    raise exception 'No se encontro una carrera abierta para cerrar.' using errcode = '22023';
  end if;

  return to_jsonb(v_session);
end;
$$;

create or replace function public.place_public_horse_race_bet(
  p_session_id uuid,
  p_player_id uuid,
  p_horse_id text,
  p_horse_name text,
  p_bet_amount integer,
  p_odds numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.horse_race_sessions%rowtype;
  v_player public.players%rowtype;
  v_bet public.horse_race_bets%rowtype;
  v_bet_count integer;
begin
  if p_bet_amount is null or p_bet_amount < 1 then
    raise exception 'La apuesta debe ser mayor a 0.' using errcode = '22023';
  end if;

  select *
  into v_session
  from public.horse_race_sessions
  where id = p_session_id
  for update;

  if v_session.id is null or v_session.status <> 'betting' then
    raise exception 'La sala no acepta apuestas ahora mismo.' using errcode = '22023';
  end if;

  select count(*)
  into v_bet_count
  from public.horse_race_bets
  where session_id = p_session_id;

  if v_bet_count >= v_session.target_bets then
    raise exception 'La sala ya completo su cupo de apuestas.' using errcode = '22023';
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
  for update;

  if v_player.id is null then
    raise exception 'Jugador no encontrado.' using errcode = '22023';
  end if;

  if v_player.gold < p_bet_amount then
    raise exception 'No tienes oro suficiente para esa apuesta.' using errcode = '22023';
  end if;

  update public.players
  set gold = gold - p_bet_amount
  where id = p_player_id;

  insert into public.horse_race_bets (
    session_id,
    player_id,
    horse_id,
    horse_name,
    bet_amount,
    odds
  )
  values (
    p_session_id,
    p_player_id,
    trim(p_horse_id),
    coalesce(nullif(trim(p_horse_name), ''), 'Caballo'),
    p_bet_amount,
    p_odds
  )
  returning * into v_bet;

  return to_jsonb(v_bet);
exception
  when unique_violation then
    raise exception 'Ya tienes una apuesta en esta carrera.' using errcode = '23505';
end;
$$;

create or replace function public.start_public_horse_race(
  p_admin_player_id uuid,
  p_session_id uuid,
  p_result jsonb,
  p_winner_id text,
  p_placements jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.horse_race_sessions%rowtype;
begin
  if not public.is_horse_race_admin(p_admin_player_id) then
    raise exception 'Solo un admin puede iniciar carreras publicas.' using errcode = '42501';
  end if;

  if p_winner_id is null or trim(p_winner_id) = '' then
    raise exception 'La carrera necesita un ganador.' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.horse_race_bets
    where session_id = p_session_id
  ) < 2 then
    raise exception 'La carrera online necesita al menos 2 apuestas.' using errcode = '22023';
  end if;

  update public.horse_race_sessions
  set
    status = 'running',
    result = p_result,
    winner_id = p_winner_id,
    started_at = now(),
    updated_at = now()
  where id = p_session_id
    and status in ('betting', 'closed')
  returning * into v_session;

  if v_session.id is null then
    raise exception 'No se encontro una carrera lista para iniciar.' using errcode = '22023';
  end if;

  insert into public.horse_race_results (session_id, winner_id, placements, result)
  values (p_session_id, p_winner_id, coalesce(p_placements, '[]'::jsonb), p_result)
  on conflict (session_id) do update
  set
    winner_id = excluded.winner_id,
    placements = excluded.placements,
    result = excluded.result,
    updated_at = now();

  return to_jsonb(v_session);
end;
$$;

create or replace function public.maybe_start_public_horse_race(
  p_player_id uuid,
  p_session_id uuid,
  p_result jsonb,
  p_winner_id text,
  p_placements jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.horse_race_sessions%rowtype;
  v_bet_count integer;
begin
  if not exists (select 1 from public.players where id = p_player_id) then
    raise exception 'Jugador no encontrado.' using errcode = '22023';
  end if;

  if p_winner_id is null or trim(p_winner_id) = '' then
    raise exception 'La carrera necesita un ganador.' using errcode = '22023';
  end if;

  select *
  into v_session
  from public.horse_race_sessions
  where id = p_session_id
  for update;

  if v_session.id is null or v_session.status <> 'betting' then
    raise exception 'La sala no esta abierta para auto-inicio.' using errcode = '22023';
  end if;

  select count(*)
  into v_bet_count
  from public.horse_race_bets
  where session_id = p_session_id;

  if v_bet_count < greatest(2, v_session.target_bets) then
    raise exception 'La sala aun no completo el minimo de apuestas.' using errcode = '22023';
  end if;

  update public.horse_race_sessions
  set
    status = 'running',
    result = p_result,
    winner_id = p_winner_id,
    started_at = now(),
    updated_at = now()
  where id = p_session_id
    and status = 'betting'
  returning * into v_session;

  insert into public.horse_race_results (session_id, winner_id, placements, result)
  values (p_session_id, p_winner_id, coalesce(p_placements, '[]'::jsonb), p_result)
  on conflict (session_id) do update
  set
    winner_id = excluded.winner_id,
    placements = excluded.placements,
    result = excluded.result,
    updated_at = now();

  return to_jsonb(v_session);
end;
$$;

create or replace function public.settle_public_horse_race(
  p_player_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.horse_race_sessions%rowtype;
  v_result public.horse_race_results%rowtype;
  v_bet public.horse_race_bets%rowtype;
  v_payout integer;
begin
  if not exists (select 1 from public.players where id = p_player_id) then
    raise exception 'Jugador no encontrado.' using errcode = '22023';
  end if;

  select *
  into v_session
  from public.horse_race_sessions
  where id = p_session_id
  for update;

  if v_session.id is null or v_session.winner_id is null then
    raise exception 'La carrera aun no tiene resultado.' using errcode = '22023';
  end if;

  select *
  into v_result
  from public.horse_race_results
  where session_id = p_session_id
  for update;

  if v_result.id is null then
    raise exception 'No existe registro de resultado para esta carrera.' using errcode = '22023';
  end if;

  if not v_result.payouts_processed then
    for v_bet in
      select *
      from public.horse_race_bets
      where session_id = p_session_id
      for update
    loop
      if v_bet.horse_id = v_session.winner_id then
        v_payout := floor(v_bet.bet_amount * v_bet.odds)::integer;

        update public.players
        set gold = gold + v_payout
        where id = v_bet.player_id;

        update public.horse_race_bets
        set payout = v_payout, status = 'paid', updated_at = now()
        where id = v_bet.id;
      else
        update public.horse_race_bets
        set payout = 0, status = 'lost', updated_at = now()
        where id = v_bet.id;
      end if;
    end loop;

    update public.horse_race_results
    set payouts_processed = true, updated_at = now()
    where id = v_result.id;
  end if;

  update public.horse_race_sessions
  set status = 'finished', finished_at = coalesce(finished_at, now()), updated_at = now()
  where id = p_session_id
  returning * into v_session;

  return to_jsonb(v_session);
end;
$$;

grant execute on function public.create_public_horse_race_session(uuid, text, jsonb, integer) to anon, authenticated;
grant execute on function public.close_public_horse_race_bets(uuid, uuid) to anon, authenticated;
grant execute on function public.place_public_horse_race_bet(uuid, uuid, text, text, integer, numeric) to anon, authenticated;
grant execute on function public.start_public_horse_race(uuid, uuid, jsonb, text, jsonb) to anon, authenticated;
grant execute on function public.maybe_start_public_horse_race(uuid, uuid, jsonb, text, jsonb) to anon, authenticated;
grant execute on function public.settle_public_horse_race(uuid, uuid) to anon, authenticated;
