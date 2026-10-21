-- Migration: Lower daily minigame win limits to 100,000 gold
-- Affected games: Slots, Plinko, Penalties, Cards, Scratch

-- 1. Slots: update daily net win limit to 100k
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
  if v_daily + greatest(v_payout - p_bet, 0) > 100000 then raise exception 'Límite diario de Slots alcanzado.' using errcode = '22023'; end if;
  v_next := v_gold::bigint - p_bet + v_payout;
  if v_payout > 2147483647 or v_next < 0 or v_next > 2147483647 then raise exception 'El pago excede el máximo integer.' using errcode = '22003'; end if;
  update public.players set gold = v_next::integer where id = v_player;
  insert into public.game_rounds(player_id, game, bet, payout, outcome, idempotency_key, request_hash) values (v_player, 'slots', p_bet, v_payout::integer, jsonb_build_object('roll', round(v_roll, 8), 'multiplier', v_multiplier), trim(p_idempotency_key), v_hash) returning id into round_id;
  return query select round_id, 'slots'::text, p_bet, v_payout::integer, jsonb_build_object('roll', round(v_roll, 8), 'multiplier', v_multiplier), v_next::integer;
end;
$$;

-- 2. Plinko: update daily net win limit to 100k
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
  if v_daily + greatest(v_total_payout - v_total_bet, 0) > 100000 then raise exception 'Límite diario de Plinko alcanzado.' using errcode = '22023'; end if;
  v_next := v_gold::bigint - v_total_bet + v_total_payout;
  if v_total_payout > 2147483647 or v_next < 0 or v_next > 2147483647 then raise exception 'El pago excede el máximo integer.' using errcode = '22003'; end if;
  update public.players set gold = v_next::integer where id = v_player;
  insert into public.game_rounds(player_id, game, bet, payout, outcome, idempotency_key, request_hash) values (v_player, 'plinko', v_total_bet::integer, v_total_payout::integer, v_outcomes, trim(p_idempotency_key), v_hash) returning id into round_id;
  return query select round_id, 'plinko'::text, v_total_bet::integer, v_total_payout::integer, v_outcomes, v_next::integer;
end;
$$;

-- 3. Penalties: update daily net win limit to 100k
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
  select coalesce(sum(greatest(g.payout::bigint-g.bet::bigint,0)),0) into v_daily_net
    from public.game_rounds g
   where g.player_id=v_player and g.game='penalties'
     and g.created_at >= date_trunc('day',clock_timestamp());
  if v_daily_net + greatest(p_bet::bigint*8-p_bet,0) > 100000 then
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

-- 4. Cards: get_cards_session_state
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
    greatest(100000 - v_daily_wins, 0),
    v_player.gold;
end;
$$;

-- 5. Cards: start_cards_game
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

  if v_daily_wins >= 100000 then
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
  set gold = gold - p_bet
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
    p_bet,
    0,
    0,
    0,
    'started'
  );

  return query
  select
    v_session.bet_amount,
    v_session.pool_amount,
    v_session.streak_count,
    v_session.current_card,
    0,
    v_session.phase_state,
    v_daily_wins,
    greatest(100000 - v_daily_wins, 0),
    v_player.gold;
end;
$$;

-- 6. Cards: guess_cards_round
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
    raise exception 'La prediccion debe ser mayor o menor.' using errcode = '22023';
  end if;

  v_player := public.get_current_player_for_game();
  v_session := public.ensure_cards_session_row(v_player.id);
  v_daily_wins := public.ensure_cards_daily_totals(v_player.id, v_date_key);

  if v_session.phase_state <> 'playing' then
    raise exception 'No hay una ronda de Cartas en juego.' using errcode = '22023';
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
    greatest(100000 - v_daily_wins, 0),
    v_player.gold;
end;
$$;

-- 7. Cards: continue_cards_game
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
    greatest(100000 - v_daily_wins, 0),
    v_player.gold;
end;
$$;

-- 8. Cards: cash_out_cards_game
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

  v_allowed_total := v_session.bet_amount + greatest(100000 - v_daily_wins, 0);
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
    greatest(100000 - (v_daily_wins + v_net_win), 0),
    v_player.gold,
    v_cashout;
end;
$$;

-- 9. Scratch: get_daily_scratch_config
create or replace function public.get_daily_scratch_config(
  p_date_key text default to_char(timezone('America/Asuncion', now()), 'YYYY-MM-DD')
)
returns table (
  date_key text,
  cost integer,
  win_chance double precision,
  max_daily_limit integer
)
language plpgsql
stable
as $$
declare
  v_seed double precision;
  v_normalized_seed double precision;
begin
  v_seed := public.get_scratch_seed(trim(p_date_key));

  if v_seed < 0.5 then
    v_normalized_seed := v_seed * 2;
    cost := 200 + floor(v_normalized_seed * 149)::integer;
    win_chance := 0.10 + (v_normalized_seed * 0.14);
  else
    v_normalized_seed := (v_seed - 0.5) * 2;
    cost := 350 + floor(v_normalized_seed * 150)::integer;
    win_chance := 0.25 + (v_normalized_seed * 0.15);
  end if;

  max_daily_limit := floor(v_seed * (100000 - 10000 + 1))::integer + 10000;
  date_key := trim(p_date_key);

  return next;
end;
$$;
