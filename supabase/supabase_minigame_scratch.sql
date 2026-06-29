create table if not exists public.player_scratch_daily_totals (
  player_id uuid not null references public.players(id) on delete cascade,
  date_key text not null,
  gross_wins integer not null default 0 check (gross_wins >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, date_key)
);

create table if not exists public.scratch_runs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  date_key text not null,
  quantity integer not null check (quantity > 0),
  used_tickets integer not null check (used_tickets >= 0),
  winning_tickets integer not null check (winning_tickets >= 0),
  jackpot_wins integer not null check (jackpot_wins >= 0),
  losing_tickets integer not null check (losing_tickets >= 0),
  ticket_cost integer not null check (ticket_cost >= 0),
  total_cost integer not null check (total_cost >= 0),
  total_prize integer not null check (total_prize >= 0),
  refunded_tickets integer not null check (refunded_tickets >= 0),
  refunded_gold integer not null check (refunded_gold >= 0),
  remaining_gold integer not null check (remaining_gold >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_scratch_runs_player_id
  on public.scratch_runs(player_id, created_at desc);

alter table public.player_scratch_daily_totals enable row level security;
alter table public.scratch_runs enable row level security;

drop policy if exists "Players can read own scratch totals" on public.player_scratch_daily_totals;
create policy "Players can read own scratch totals"
on public.player_scratch_daily_totals
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = player_scratch_daily_totals.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Players can read own scratch runs" on public.scratch_runs;
create policy "Players can read own scratch runs"
on public.scratch_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = scratch_runs.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

create or replace function public.get_scratch_seed(p_date_key text)
returns double precision
language plpgsql
immutable
as $$
declare
  v_hash bigint := 0;
  v_index integer;
begin
  for v_index in 1..char_length(p_date_key) loop
    v_hash := mod((v_hash * 31) + ascii(substr(p_date_key, v_index, 1)), 2147483647);
  end loop;

  if v_hash <= 0 then
    v_hash := v_hash + 2147483646;
  end if;

  return v_hash::double precision / 2147483647::double precision;
end;
$$;

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

  max_daily_limit := floor(v_seed * (150000 - 10000 + 1))::integer + 10000;
  date_key := trim(p_date_key);

  return next;
end;
$$;

create or replace function public.play_scratch_batch(
  p_quantity integer
)
returns table (
  total_cost integer,
  cost_per_ticket integer,
  quantity integer,
  used_tickets integer,
  winning_tickets integer,
  jackpot_wins integer,
  losing_tickets integer,
  total_prize integer,
  refunded_tickets integer,
  refunded_gold integer,
  remaining_gold integer,
  daily_gross_wins integer,
  max_daily_limit integer,
  date_key text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid;
  v_player public.players%rowtype;
  v_daily_state public.player_scratch_daily_totals%rowtype;
  v_date_key text := to_char(timezone('America/Asuncion', now()), 'YYYY-MM-DD');
  v_cost integer;
  v_win_chance double precision;
  v_limit integer;
  v_existing_gross integer := 0;
  v_remaining_limit integer;
  v_total_cost integer := 0;
  v_total_prize integer := 0;
  v_refunded_tickets integer := 0;
  v_refunded_gold integer := 0;
  v_remaining_gold integer := 0;
  v_used_tickets integer := 0;
  v_winning_tickets integer := 0;
  v_jackpot_wins integer := 0;
  v_losing_tickets integer := 0;
  v_ticket_won boolean;
  v_roll_prize integer;
  v_index integer;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Debes iniciar sesion antes de jugar Rasca y gana.' using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 250 then
    raise exception 'La cantidad de tickets debe estar entre 1 y 250.' using errcode = '22023';
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

  select cfg.cost, cfg.win_chance, cfg.max_daily_limit, cfg.date_key
  into v_cost, v_win_chance, v_limit, v_date_key
  from public.get_daily_scratch_config(v_date_key) cfg;

  insert into public.player_scratch_daily_totals (player_id, date_key, gross_wins)
  values (v_player.id, v_date_key, 0)
  on conflict (player_id, date_key) do nothing;

  select *
  into v_daily_state
  from public.player_scratch_daily_totals
  where player_id = v_player.id
    and date_key = v_date_key
  for update;

  v_existing_gross := coalesce(v_daily_state.gross_wins, 0);

  if v_existing_gross >= v_limit then
    raise exception 'Ya alcanzaste el limite diario del Rasca y gana. Vuelve manana.' using errcode = '22023';
  end if;

  v_total_cost := v_cost * p_quantity;

  if v_player.gold < v_total_cost then
    raise exception 'No tienes suficiente oro para comprar esa tanda de tickets.' using errcode = '22023';
  end if;

  v_remaining_limit := greatest(v_limit - v_existing_gross, 0);

  for v_index in 1..p_quantity loop
    exit when v_total_prize >= v_remaining_limit;

    v_used_tickets := v_used_tickets + 1;
    v_ticket_won := false;

    if random() < v_win_chance then
      v_roll_prize := floor(random() * (2500 - 200 + 1) + 200)::integer;
      v_total_prize := v_total_prize + v_roll_prize;
      v_ticket_won := true;
    end if;

    if random() < 0.05 then
      v_total_prize := v_total_prize + 10000;
      v_jackpot_wins := v_jackpot_wins + 1;
      v_ticket_won := true;
    end if;

    if v_ticket_won then
      v_winning_tickets := v_winning_tickets + 1;
    end if;

    if v_total_prize >= v_remaining_limit then
      v_total_prize := v_remaining_limit;
      exit;
    end if;
  end loop;

  v_losing_tickets := greatest(v_used_tickets - v_winning_tickets, 0);
  v_refunded_tickets := greatest(p_quantity - v_used_tickets, 0);
  v_refunded_gold := v_refunded_tickets * v_cost;
  v_remaining_gold := greatest(v_player.gold - v_total_cost + v_refunded_gold + v_total_prize, 0);

  update public.players
  set gold = v_remaining_gold
  where id = v_player.id;

  update public.player_scratch_daily_totals
  set
    gross_wins = v_existing_gross + v_total_prize,
    updated_at = now()
  where player_id = v_player.id
    and date_key = v_date_key;

  insert into public.scratch_runs (
    player_id,
    date_key,
    quantity,
    used_tickets,
    winning_tickets,
    jackpot_wins,
    losing_tickets,
    ticket_cost,
    total_cost,
    total_prize,
    refunded_tickets,
    refunded_gold,
    remaining_gold
  ) values (
    v_player.id,
    v_date_key,
    p_quantity,
    v_used_tickets,
    v_winning_tickets,
    v_jackpot_wins,
    v_losing_tickets,
    v_cost,
    v_total_cost,
    v_total_prize,
    v_refunded_tickets,
    v_refunded_gold,
    v_remaining_gold
  );

  return query
  select
    v_total_cost,
    v_cost,
    p_quantity,
    v_used_tickets,
    v_winning_tickets,
    v_jackpot_wins,
    v_losing_tickets,
    v_total_prize,
    v_refunded_tickets,
    v_refunded_gold,
    v_remaining_gold,
    v_existing_gross + v_total_prize,
    v_limit,
    v_date_key;
end;
$$;

revoke all on function public.play_scratch_batch(integer) from public;
grant execute on function public.play_scratch_batch(integer) to authenticated;
