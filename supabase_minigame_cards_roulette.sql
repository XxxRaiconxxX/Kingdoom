create table if not exists public.player_cards_daily_totals (
  player_id uuid not null references public.players(id) on delete cascade,
  date_key text not null,
  net_wins integer not null default 0 check (net_wins >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, date_key)
);

create table if not exists public.player_cards_sessions (
  player_id uuid primary key references public.players(id) on delete cascade,
  bet_amount integer not null default 0 check (bet_amount >= 0),
  pool_amount integer not null default 0 check (pool_amount >= 0),
  streak_count integer not null default 0 check (streak_count >= 0),
  current_card integer not null default 0,
  next_card integer,
  phase_state text not null default 'betting',
  updated_at timestamptz not null default now()
);

create table if not exists public.cards_runs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  date_key text not null,
  bet_amount integer not null check (bet_amount >= 0),
  cashout_amount integer not null check (cashout_amount >= 0),
  net_win integer not null check (net_win >= 0),
  streak_count integer not null check (streak_count >= 0),
  final_phase text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.roulette_spins (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  bet_amount integer not null check (bet_amount > 0),
  multiplier numeric not null,
  winnings integer not null check (winnings >= 0),
  remaining_gold integer not null check (remaining_gold >= 0),
  created_at timestamptz not null default now()
);

alter table public.player_cards_daily_totals enable row level security;
alter table public.player_cards_sessions enable row level security;
alter table public.cards_runs enable row level security;
alter table public.roulette_spins enable row level security;

drop policy if exists "Players can read own cards totals" on public.player_cards_daily_totals;
create policy "Players can read own cards totals"
on public.player_cards_daily_totals
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = player_cards_daily_totals.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Players can read own cards sessions" on public.player_cards_sessions;
create policy "Players can read own cards sessions"
on public.player_cards_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = player_cards_sessions.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Players can read own cards runs" on public.cards_runs;
create policy "Players can read own cards runs"
on public.cards_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = cards_runs.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Players can read own roulette spins" on public.roulette_spins;
create policy "Players can read own roulette spins"
on public.roulette_spins
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = roulette_spins.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

create or replace function public.get_cards_daily_date_key()
returns text
language sql
stable
as $$
  select to_char(timezone('America/Asuncion', now()), 'YYYY-MM-DD');
$$;

create or replace function public.draw_cards_value()
returns integer
language sql
volatile
as $$
  select floor(random() * 15 + 1)::integer;
$$;

create or replace function public.get_current_player_for_game()
returns public.players
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid;
  v_player public.players%rowtype;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Debes iniciar sesion antes de jugar.' using errcode = '42501';
  end if;

  select *
  into v_player
  from public.players
  where auth_user_id = v_auth_user_id
  limit 1
  for update;

  if v_player.id is null then
    raise exception 'Tu cuenta segura aun no esta vinculada a un jugador del reino.' using errcode = '42501';
  end if;

  return v_player;
end;
$$;

create or replace function public.ensure_cards_daily_totals(p_player_id uuid, p_date_key text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_net_wins integer := 0;
begin
  insert into public.player_cards_daily_totals (player_id, date_key, net_wins)
  values (p_player_id, p_date_key, 0)
  on conflict (player_id, date_key) do nothing;

  select net_wins
  into v_net_wins
  from public.player_cards_daily_totals
  where player_id = p_player_id
    and date_key = p_date_key
  for update;

  return coalesce(v_net_wins, 0);
end;
$$;

create or replace function public.ensure_cards_session_row(p_player_id uuid)
returns public.player_cards_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.player_cards_sessions%rowtype;
begin
  insert into public.player_cards_sessions (player_id)
  values (p_player_id)
  on conflict (player_id) do nothing;

  select *
  into v_session
  from public.player_cards_sessions
  where player_id = p_player_id
  for update;

  return v_session;
end;
$$;

create or replace function public.get_cards_session_state()
returns table (
  bet_amount integer,
  pool_amount integer,
  streak_count integer,
  current_card integer,
  next_card integer,
  phase_state text,
  daily_wins integer,
  remaining_net_limit integer,
  remaining_gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_session public.player_cards_sessions%rowtype;
  v_date_key text := public.get_cards_daily_date_key();
  v_daily_wins integer := 0;
begin
  v_player := public.get_current_player_for_game();
  v_session := public.ensure_cards_session_row(v_player.id);
  v_daily_wins := public.ensure_cards_daily_totals(v_player.id, v_date_key);

  return query
  select
    v_session.bet_amount,
    v_session.pool_amount,
    v_session.streak_count,
    v_session.current_card,
    coalesce(v_session.next_card, 0),
    v_session.phase_state,
    v_daily_wins,
    greatest(350000 - v_daily_wins, 0),
    v_player.gold;
end;
$$;

create or replace function public.start_cards_game(p_bet integer)
returns table (
  bet_amount integer,
  pool_amount integer,
  streak_count integer,
  current_card integer,
  next_card integer,
  phase_state text,
  daily_wins integer,
  remaining_net_limit integer,
  remaining_gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_session public.player_cards_sessions%rowtype;
  v_date_key text := public.get_cards_daily_date_key();
  v_daily_wins integer := 0;
  v_card integer;
begin
  if p_bet is null or p_bet < 1 then
    raise exception 'La apuesta debe ser mayor que cero.' using errcode = '22023';
  end if;

  v_player := public.get_current_player_for_game();
  v_session := public.ensure_cards_session_row(v_player.id);
  v_daily_wins := public.ensure_cards_daily_totals(v_player.id, v_date_key);

  if v_daily_wins >= 350000 then
    raise exception 'Ya alcanzaste el limite diario de Cartas. Vuelve manana.' using errcode = '22023';
  end if;

  if v_session.phase_state in ('playing', 'choice') then
    raise exception 'Ya tienes una partida activa de Cartas.' using errcode = '22023';
  end if;

  if p_bet > v_player.gold then
    raise exception 'No tienes suficiente oro para esa apuesta.' using errcode = '22023';
  end if;

  v_card := public.draw_cards_value();

  update public.players
  set gold = greatest(gold - p_bet, 0)
  where id = v_player.id
  returning * into v_player;

  update public.player_cards_sessions
  set
    bet_amount = p_bet,
    pool_amount = p_bet,
    streak_count = 0,
    current_card = v_card,
    next_card = null,
    phase_state = 'playing',
    updated_at = now()
  where player_id = v_player.id
  returning * into v_session;

  return query
  select
    v_session.bet_amount,
    v_session.pool_amount,
    v_session.streak_count,
    v_session.current_card,
    0,
    v_session.phase_state,
    v_daily_wins,
    greatest(350000 - v_daily_wins, 0),
    v_player.gold;
end;
$$;

create or replace function public.guess_cards_round(p_guess text)
returns table (
  bet_amount integer,
  pool_amount integer,
  streak_count integer,
  current_card integer,
  next_card integer,
  phase_state text,
  daily_wins integer,
  remaining_net_limit integer,
  remaining_gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_session public.player_cards_sessions%rowtype;
  v_date_key text := public.get_cards_daily_date_key();
  v_daily_wins integer := 0;
  v_next_card integer;
begin
  if p_guess not in ('higher', 'lower') then
    raise exception 'La prediccion debe ser higher o lower.' using errcode = '22023';
  end if;

  v_player := public.get_current_player_for_game();
  v_session := public.ensure_cards_session_row(v_player.id);
  v_daily_wins := public.ensure_cards_daily_totals(v_player.id, v_date_key);

  if v_session.phase_state <> 'playing' then
    raise exception 'No hay una ronda activa de Cartas para resolver.' using errcode = '22023';
  end if;

  v_next_card := public.draw_cards_value();

  if v_next_card = v_session.current_card then
    update public.player_cards_sessions
    set
      next_card = v_next_card,
      phase_state = 'choice',
      updated_at = now()
    where player_id = v_player.id
    returning * into v_session;
  elsif (p_guess = 'higher' and v_next_card > v_session.current_card)
     or (p_guess = 'lower' and v_next_card < v_session.current_card) then
    update public.player_cards_sessions
    set
      pool_amount = v_session.pool_amount * 2,
      streak_count = v_session.streak_count + 1,
      next_card = v_next_card,
      phase_state = 'choice',
      updated_at = now()
    where player_id = v_player.id
    returning * into v_session;
  else
    update public.player_cards_sessions
    set
      next_card = v_next_card,
      phase_state = 'gameOver',
      updated_at = now()
    where player_id = v_player.id
    returning * into v_session;
  end if;

  return query
  select
    v_session.bet_amount,
    v_session.pool_amount,
    v_session.streak_count,
    v_session.current_card,
    coalesce(v_session.next_card, 0),
    v_session.phase_state,
    v_daily_wins,
    greatest(350000 - v_daily_wins, 0),
    v_player.gold;
end;
$$;

create or replace function public.continue_cards_game()
returns table (
  bet_amount integer,
  pool_amount integer,
  streak_count integer,
  current_card integer,
  next_card integer,
  phase_state text,
  daily_wins integer,
  remaining_net_limit integer,
  remaining_gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_session public.player_cards_sessions%rowtype;
  v_date_key text := public.get_cards_daily_date_key();
  v_daily_wins integer := 0;
begin
  v_player := public.get_current_player_for_game();
  v_session := public.ensure_cards_session_row(v_player.id);
  v_daily_wins := public.ensure_cards_daily_totals(v_player.id, v_date_key);

  if v_session.phase_state <> 'choice' then
    raise exception 'No hay una decision pendiente para continuar.' using errcode = '22023';
  end if;

  update public.player_cards_sessions
  set
    current_card = coalesce(v_session.next_card, v_session.current_card),
    next_card = null,
    phase_state = 'playing',
    updated_at = now()
  where player_id = v_player.id
  returning * into v_session;

  return query
  select
    v_session.bet_amount,
    v_session.pool_amount,
    v_session.streak_count,
    v_session.current_card,
    0,
    v_session.phase_state,
    v_daily_wins,
    greatest(350000 - v_daily_wins, 0),
    v_player.gold;
end;
$$;

create or replace function public.cash_out_cards_game()
returns table (
  bet_amount integer,
  pool_amount integer,
  streak_count integer,
  current_card integer,
  next_card integer,
  phase_state text,
  daily_wins integer,
  remaining_net_limit integer,
  remaining_gold integer,
  cashout_amount integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_session public.player_cards_sessions%rowtype;
  v_date_key text := public.get_cards_daily_date_key();
  v_daily_wins integer := 0;
  v_allowed_total integer := 0;
  v_cashout integer := 0;
  v_net_win integer := 0;
begin
  v_player := public.get_current_player_for_game();
  v_session := public.ensure_cards_session_row(v_player.id);
  v_daily_wins := public.ensure_cards_daily_totals(v_player.id, v_date_key);

  if v_session.phase_state <> 'choice' or v_session.streak_count < 2 then
    raise exception 'Plantarse solo se desbloquea desde la ronda 2 en una decision valida.' using errcode = '22023';
  end if;

  v_allowed_total := v_session.bet_amount + greatest(350000 - v_daily_wins, 0);
  v_cashout := least(v_session.pool_amount, v_allowed_total);
  v_net_win := greatest(v_cashout - v_session.bet_amount, 0);

  update public.players
  set gold = gold + v_cashout
  where id = v_player.id
  returning * into v_player;

  update public.player_cards_daily_totals
  set
    net_wins = v_daily_wins + v_net_win,
    updated_at = now()
  where player_id = v_player.id
    and date_key = v_date_key;

  insert into public.cards_runs (
    player_id,
    date_key,
    bet_amount,
    cashout_amount,
    net_win,
    streak_count,
    final_phase
  ) values (
    v_player.id,
    v_date_key,
    v_session.bet_amount,
    v_cashout,
    v_net_win,
    v_session.streak_count,
    'cashed_out'
  );

  update public.player_cards_sessions
  set
    bet_amount = 0,
    pool_amount = 0,
    streak_count = 0,
    current_card = 0,
    next_card = null,
    phase_state = 'betting',
    updated_at = now()
  where player_id = v_player.id
  returning * into v_session;

  return query
  select
    v_session.bet_amount,
    v_session.pool_amount,
    v_session.streak_count,
    v_session.current_card,
    0,
    v_session.phase_state,
    v_daily_wins + v_net_win,
    greatest(350000 - (v_daily_wins + v_net_win), 0),
    v_player.gold,
    v_cashout;
end;
$$;

create or replace function public.spin_roulette_game(p_bet integer)
returns table (
  multiplier numeric,
  winnings integer,
  remaining_gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_roll numeric;
  v_multiplier numeric := 0;
  v_winnings integer := 0;
begin
  if p_bet is null or p_bet < 1 then
    raise exception 'La apuesta de la ruleta debe ser mayor que cero.' using errcode = '22023';
  end if;

  v_player := public.get_current_player_for_game();

  if p_bet > v_player.gold then
    raise exception 'No tienes suficiente oro para esa apuesta.' using errcode = '22023';
  end if;

  v_roll := random() * 100;

  if v_roll < 28 then
    v_multiplier := 0;
  elsif v_roll < 50 then
    v_multiplier := 0.5;
  elsif v_roll < 70 then
    v_multiplier := 1.5;
  elsif v_roll < 86 then
    v_multiplier := 2;
  elsif v_roll < 96 then
    v_multiplier := 5;
  else
    v_multiplier := 10;
  end if;

  v_winnings := floor(p_bet * v_multiplier)::integer;

  update public.players
  set gold = greatest(gold - p_bet + v_winnings, 0)
  where id = v_player.id
  returning * into v_player;

  insert into public.roulette_spins (
    player_id,
    bet_amount,
    multiplier,
    winnings,
    remaining_gold
  ) values (
    v_player.id,
    p_bet,
    v_multiplier,
    v_winnings,
    v_player.gold
  );

  return query
  select v_multiplier, v_winnings, v_player.gold;
end;
$$;

revoke all on function public.get_current_player_for_game() from public;
revoke all on function public.ensure_cards_daily_totals(uuid, text) from public;
revoke all on function public.ensure_cards_session_row(uuid) from public;
revoke all on function public.get_cards_session_state() from public;
revoke all on function public.start_cards_game(integer) from public;
revoke all on function public.guess_cards_round(text) from public;
revoke all on function public.continue_cards_game() from public;
revoke all on function public.cash_out_cards_game() from public;
revoke all on function public.spin_roulette_game(integer) from public;

grant execute on function public.get_cards_session_state() to authenticated;
grant execute on function public.start_cards_game(integer) to authenticated;
grant execute on function public.guess_cards_round(text) to authenticated;
grant execute on function public.continue_cards_game() to authenticated;
grant execute on function public.cash_out_cards_game() to authenticated;
grant execute on function public.spin_roulette_game(integer) to authenticated;
