create table if not exists public.chest_runs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  bet_amount integer not null check (bet_amount > 0),
  selected_chest integer not null check (selected_chest between 0 and 2),
  chest_results text[] not null,
  payout integer not null check (payout >= 0),
  streak_after integer not null check (streak_after >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.player_chest_streaks (
  player_id uuid primary key references public.players(id) on delete cascade,
  consecutive_spins integer not null default 0 check (consecutive_spins >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_crash_sessions (
  player_id uuid primary key references public.players(id) on delete cascade,
  phase_state text not null default 'betting',
  bet_amount integer not null default 0 check (bet_amount >= 0),
  auto_cash_out numeric not null default 0,
  started_at timestamptz,
  crash_point numeric,
  last_win integer not null default 0 check (last_win >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.crash_runs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  bet_amount integer not null check (bet_amount > 0),
  crash_point numeric not null,
  cash_out_multiplier numeric,
  payout integer not null check (payout >= 0),
  outcome text not null,
  created_at timestamptz not null default now()
);

alter table public.chest_runs enable row level security;
alter table public.player_chest_streaks enable row level security;
alter table public.player_crash_sessions enable row level security;
alter table public.crash_runs enable row level security;

drop policy if exists "Players can read own chest runs" on public.chest_runs;
create policy "Players can read own chest runs"
on public.chest_runs
for select
to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = chest_runs.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Players can read own chest streaks" on public.player_chest_streaks;
create policy "Players can read own chest streaks"
on public.player_chest_streaks
for select
to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = player_chest_streaks.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Players can read own crash sessions" on public.player_crash_sessions;
create policy "Players can read own crash sessions"
on public.player_crash_sessions
for select
to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = player_crash_sessions.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Players can read own crash runs" on public.crash_runs;
create policy "Players can read own crash runs"
on public.crash_runs
for select
to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = crash_runs.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

create or replace function public.ensure_chest_streak_row(p_player_id uuid)
returns public.player_chest_streaks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.player_chest_streaks%rowtype;
begin
  insert into public.player_chest_streaks (player_id)
  values (p_player_id)
  on conflict (player_id) do nothing;

  select *
  into v_row
  from public.player_chest_streaks
  where player_id = p_player_id
  for update;

  return v_row;
end;
$$;

create or replace function public.ensure_crash_session_row(p_player_id uuid)
returns public.player_crash_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.player_crash_sessions%rowtype;
begin
  insert into public.player_crash_sessions (player_id)
  values (p_player_id)
  on conflict (player_id) do nothing;

  select *
  into v_row
  from public.player_crash_sessions
  where player_id = p_player_id
  for update;

  return v_row;
end;
$$;

create or replace function public.generate_crash_point()
returns numeric
language plpgsql
volatile
as $$
declare
  v_rand double precision;
  v_point double precision;
begin
  if random() < 0.03 then
    return 1.00;
  end if;

  v_rand := random();
  v_point := 0.99 / greatest(0.000001, (1 - v_rand));
  return least(greatest(v_point, 1.01), 1000)::numeric;
end;
$$;

create or replace function public.get_crash_multiplier_for_elapsed(p_elapsed_seconds double precision)
returns numeric
language sql
immutable
as $$
  select power(1.065::numeric, greatest(p_elapsed_seconds, 0)::numeric);
$$;

create or replace function public.finalize_crash_session(
  p_player_id uuid,
  p_outcome text,
  p_cash_out_multiplier numeric default null
)
returns public.player_crash_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.player_crash_sessions%rowtype;
  v_player public.players%rowtype;
  v_elapsed_seconds double precision := 0;
  v_current_multiplier numeric := 1;
  v_payout integer := 0;
begin
  select * into v_session from public.player_crash_sessions where player_id = p_player_id for update;
  select * into v_player from public.players where id = p_player_id for update;

  if v_session.started_at is not null then
    v_elapsed_seconds := greatest(extract(epoch from (timezone('America/Asuncion', now()) - v_session.started_at)), 0);
    v_current_multiplier := public.get_crash_multiplier_for_elapsed(v_elapsed_seconds);
  end if;

  if p_outcome = 'cashed_out' and v_current_multiplier < coalesce(v_session.crash_point, 1) then
    v_payout := floor(v_session.bet_amount * coalesce(p_cash_out_multiplier, v_current_multiplier))::integer;
    update public.players
    set gold = gold + v_payout
    where id = p_player_id
    returning * into v_player;
  else
    p_outcome := 'crashed';
  end if;

  insert into public.crash_runs (
    player_id,
    bet_amount,
    crash_point,
    cash_out_multiplier,
    payout,
    outcome
  ) values (
    p_player_id,
    v_session.bet_amount,
    coalesce(v_session.crash_point, 1),
    case when p_outcome = 'cashed_out' then coalesce(p_cash_out_multiplier, v_current_multiplier) else null end,
    v_payout,
    p_outcome
  );

  update public.player_crash_sessions
  set
    phase_state = p_outcome,
    bet_amount = case when p_outcome = 'crashed' then bet_amount else bet_amount end,
    last_win = v_payout,
    updated_at = now()
  where player_id = p_player_id
  returning * into v_session;

  return v_session;
end;
$$;

create or replace function public.play_chest_round(
  p_bet integer,
  p_selected_chest integer
)
returns table (
  selected_chest integer,
  chest_results text[],
  payout integer,
  remaining_gold integer,
  next_streak integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_streak public.player_chest_streaks%rowtype;
  v_difficulty integer;
  v_x2_chance numeric;
  v_x1_chance numeric := 33.3;
  v_rand numeric;
  v_actual text := 'x0';
  v_results text[] := array['x0','x1','x2'];
  v_payout integer := 0;
  v_next_streak integer := 0;
  v_other text[];
begin
  if p_bet is null or p_bet < 1 then
    raise exception 'La apuesta debe ser mayor que cero.' using errcode = '22023';
  end if;

  if p_selected_chest is null or p_selected_chest < 0 or p_selected_chest > 2 then
    raise exception 'Debes elegir uno de los tres cofres.' using errcode = '22023';
  end if;

  v_player := public.get_current_player_for_game();
  v_streak := public.ensure_chest_streak_row(v_player.id);

  if p_bet > v_player.gold then
    raise exception 'No tienes suficiente oro para esa apuesta.' using errcode = '22023';
  end if;

  v_difficulty := floor(v_streak.consecutive_spins / 2);
  v_x2_chance := greatest(3.3, 33.3 - v_difficulty * 10);
  v_rand := random() * 100;

  if v_rand <= v_x2_chance then
    v_actual := 'x2';
  elsif v_rand <= v_x2_chance + v_x1_chance then
    v_actual := 'x1';
  end if;

  update public.players
  set gold = gold - p_bet
  where id = v_player.id
  returning * into v_player;

  if v_actual = 'x2' then
    v_payout := p_bet * 2;
    v_next_streak := v_streak.consecutive_spins + 1;
  elsif v_actual = 'x1' then
    v_payout := p_bet;
    v_next_streak := v_streak.consecutive_spins + 1;
  else
    v_next_streak := 0;
  end if;

  if v_payout > 0 then
    update public.players
    set gold = gold + v_payout
    where id = v_player.id
    returning * into v_player;
  end if;

  update public.player_chest_streaks
  set consecutive_spins = v_next_streak, updated_at = now()
  where player_id = v_player.id;

  v_other := case
    when v_actual = 'x2' then array['x1','x0']
    when v_actual = 'x1' then array['x2','x0']
    else array['x2','x1']
  end;

  if random() > 0.5 then
    v_other := array[v_other[2], v_other[1]];
  end if;

  v_results := array[null, null, null];
  v_results[p_selected_chest + 1] := v_actual;

  if p_selected_chest = 0 then
    v_results[2] := v_other[1];
    v_results[3] := v_other[2];
  elsif p_selected_chest = 1 then
    v_results[1] := v_other[1];
    v_results[3] := v_other[2];
  else
    v_results[1] := v_other[1];
    v_results[2] := v_other[2];
  end if;

  insert into public.chest_runs (
    player_id,
    bet_amount,
    selected_chest,
    chest_results,
    payout,
    streak_after
  ) values (
    v_player.id,
    p_bet,
    p_selected_chest,
    v_results,
    v_payout,
    v_next_streak
  );

  return query
  select
    p_selected_chest,
    v_results,
    v_payout,
    v_player.gold,
    v_next_streak;
end;
$$;

create or replace function public.start_crash_game(
  p_bet integer,
  p_auto_cash_out numeric default 0
)
returns table (
  phase_state text,
  bet_amount integer,
  current_multiplier numeric,
  last_win integer,
  auto_cash_out numeric,
  remaining_gold integer,
  history_values numeric[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_session public.player_crash_sessions%rowtype;
  v_history numeric[];
begin
  if p_bet is null or p_bet < 1 then
    raise exception 'La apuesta de Crash debe ser mayor que cero.' using errcode = '22023';
  end if;

  if p_auto_cash_out is null then
    p_auto_cash_out := 0;
  end if;

  v_player := public.get_current_player_for_game();
  v_session := public.ensure_crash_session_row(v_player.id);

  if v_session.phase_state in ('starting', 'rising') then
    raise exception 'Ya tienes una ronda de Crash activa.' using errcode = '22023';
  end if;

  if p_bet > v_player.gold then
    raise exception 'No tienes suficiente oro para esa apuesta.' using errcode = '22023';
  end if;

  update public.players
  set gold = gold - p_bet
  where id = v_player.id
  returning * into v_player;

  update public.player_crash_sessions
  set
    phase_state = 'starting',
    bet_amount = p_bet,
    auto_cash_out = greatest(p_auto_cash_out, 0),
    started_at = timezone('America/Asuncion', now()),
    crash_point = public.generate_crash_point(),
    last_win = 0,
    updated_at = now()
  where player_id = v_player.id
  returning * into v_session;

  select coalesce(array_agg(crash_point order by created_at desc), '{}'::numeric[])
  into v_history
  from (
    select crash_point, created_at
    from public.crash_runs
    where player_id = v_player.id
    order by created_at desc
    limit 10
  ) recent_runs;

  return query
  select
    v_session.phase_state,
    v_session.bet_amount,
    1::numeric,
    v_session.last_win,
    v_session.auto_cash_out,
    v_player.gold,
    coalesce(v_history, '{}'::numeric[]);
end;
$$;

create or replace function public.get_crash_session_state()
returns table (
  phase_state text,
  bet_amount integer,
  current_multiplier numeric,
  last_win integer,
  auto_cash_out numeric,
  remaining_gold integer,
  history_values numeric[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_session public.player_crash_sessions%rowtype;
  v_elapsed_seconds double precision := 0;
  v_current_multiplier numeric := 1;
  v_history numeric[];
begin
  v_player := public.get_current_player_for_game();
  v_session := public.ensure_crash_session_row(v_player.id);

  if v_session.phase_state = 'starting' and v_session.started_at <= timezone('America/Asuncion', now()) - interval '1200 milliseconds' then
    update public.player_crash_sessions
    set phase_state = 'rising', updated_at = now()
    where player_id = v_player.id
    returning * into v_session;
  end if;

  if v_session.phase_state in ('starting', 'rising') and v_session.started_at is not null then
    v_elapsed_seconds := greatest(extract(epoch from (timezone('America/Asuncion', now()) - v_session.started_at)) - 1.2, 0);
    v_current_multiplier := public.get_crash_multiplier_for_elapsed(v_elapsed_seconds);
  end if;

  if v_session.phase_state = 'rising' and v_current_multiplier >= coalesce(v_session.crash_point, 1) then
    v_session := public.finalize_crash_session(v_player.id, 'crashed', null);
    v_current_multiplier := coalesce(v_session.crash_point, v_current_multiplier);
  elsif v_session.phase_state = 'crashed' then
    v_current_multiplier := coalesce(v_session.crash_point, 1);
  elsif v_session.phase_state = 'cashed_out' then
    v_current_multiplier := greatest(v_session.auto_cash_out, 1);
  end if;

  if v_session.phase_state = 'rising'
    and v_session.auto_cash_out >= 1.01
    and v_current_multiplier >= v_session.auto_cash_out then
    v_session := public.finalize_crash_session(v_player.id, 'cashed_out', v_session.auto_cash_out);
    select * into v_player from public.players where id = v_player.id;
    v_current_multiplier := v_session.auto_cash_out;
  end if;

  select coalesce(array_agg(value order by created_at desc), '{}'::numeric[])
  into v_history
  from (
    select crash_point as value, created_at
    from public.crash_runs
    where player_id = v_player.id
    order by created_at desc
    limit 10
  ) recent_runs;

  return query
  select
    v_session.phase_state,
    v_session.bet_amount,
    v_current_multiplier,
    v_session.last_win,
    v_session.auto_cash_out,
    v_player.gold,
    coalesce(v_history, '{}'::numeric[]);
end;
$$;

create or replace function public.cash_out_crash_game()
returns table (
  phase_state text,
  bet_amount integer,
  current_multiplier numeric,
  last_win integer,
  auto_cash_out numeric,
  remaining_gold integer,
  history_values numeric[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_session public.player_crash_sessions%rowtype;
  v_elapsed_seconds double precision := 0;
  v_current_multiplier numeric := 1;
  v_history numeric[];
begin
  v_player := public.get_current_player_for_game();
  v_session := public.ensure_crash_session_row(v_player.id);

  if v_session.phase_state = 'starting' then
    update public.player_crash_sessions
    set phase_state = 'rising', updated_at = now()
    where player_id = v_player.id
    returning * into v_session;
  end if;

  if v_session.phase_state <> 'rising' or v_session.started_at is null then
    raise exception 'No hay una ronda activa de Crash para cobrar.' using errcode = '22023';
  end if;

  v_elapsed_seconds := greatest(extract(epoch from (timezone('America/Asuncion', now()) - v_session.started_at)) - 1.2, 0);
  v_current_multiplier := public.get_crash_multiplier_for_elapsed(v_elapsed_seconds);

  if v_current_multiplier >= coalesce(v_session.crash_point, 1) then
    v_session := public.finalize_crash_session(v_player.id, 'crashed', null);
    select * into v_player from public.players where id = v_player.id;
    v_current_multiplier := coalesce(v_session.crash_point, v_current_multiplier);
  else
    v_session := public.finalize_crash_session(v_player.id, 'cashed_out', v_current_multiplier);
    select * into v_player from public.players where id = v_player.id;
  end if;

  select coalesce(array_agg(value order by created_at desc), '{}'::numeric[])
  into v_history
  from (
    select crash_point as value, created_at
    from public.crash_runs
    where player_id = v_player.id
    order by created_at desc
    limit 10
  ) recent_runs;

  return query
  select
    v_session.phase_state,
    v_session.bet_amount,
    case when v_session.phase_state = 'cashed_out' then v_current_multiplier else coalesce(v_session.crash_point, v_current_multiplier) end,
    v_session.last_win,
    v_session.auto_cash_out,
    v_player.gold,
    coalesce(v_history, '{}'::numeric[]);
end;
$$;

revoke all on function public.ensure_chest_streak_row(uuid) from public;
revoke all on function public.ensure_crash_session_row(uuid) from public;
revoke all on function public.generate_crash_point() from public;
revoke all on function public.get_crash_multiplier_for_elapsed(double precision) from public;
revoke all on function public.finalize_crash_session(uuid, text, numeric) from public;
revoke all on function public.play_chest_round(integer, integer) from public;
revoke all on function public.start_crash_game(integer, numeric) from public;
revoke all on function public.get_crash_session_state() from public;
revoke all on function public.cash_out_crash_game() from public;

grant execute on function public.play_chest_round(integer, integer) to authenticated;
grant execute on function public.start_crash_game(integer, numeric) to authenticated;
grant execute on function public.get_crash_session_state() to authenticated;
grant execute on function public.cash_out_crash_game() to authenticated;
