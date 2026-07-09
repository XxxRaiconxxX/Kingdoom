-- Kingdoom - El Asedio de los Reinos
-- Base persistente para temporada, facciones, territorios, tesoro e ingresos.
-- Ejecutar en Supabase SQL Editor antes de activar el catalogo web.

create extension if not exists pgcrypto;

create table if not exists public.realm_siege_seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'active'
    check (status in ('draft', 'active', 'completed', 'archived')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  min_duration_days integer not null default 7 check (min_duration_days >= 1),
  income_cycle_hours integer not null default 24 check (income_cycle_hours >= 1),
  ai_strategy_cycle_hours integer not null default 12 check (ai_strategy_cycle_hours >= 1),
  daily_deposit_limit integer not null default 25000 check (daily_deposit_limit > 0),
  kingdom_member_cap integer not null default 3 check (kingdom_member_cap > 0),
  base_territory_income integer not null default 4000 check (base_territory_income >= 0),
  conquest_reward integer not null default 20000 check (conquest_reward >= 0),
  income_invest_base_cost integer not null default 100000 check (income_invest_base_cost >= 0),
  income_invest_cost_step integer not null default 50000 check (income_invest_cost_step >= 0),
  income_invest_gain integer not null default 1000 check (income_invest_gain >= 0),
  max_income_invest_level integer not null default 5 check (max_income_invest_level >= 0),
  prize_pool_base_gold integer not null default 125000 check (prize_pool_base_gold >= 0),
  prize_pool_growth_per_cycle integer not null default 125000 check (prize_pool_growth_per_cycle >= 0),
  prize_pool_cap_gold integer not null default 1000000 check (prize_pool_cap_gold > 0),
  prize_pool_awarded_gold integer not null default 0 check (prize_pool_awarded_gold >= 0),
  prize_pool_awarded_at timestamptz,
  winner_faction_id text check (
    winner_faction_id is null
    or winner_faction_id in ('kaelum', 'oakhaven', 'arcania', 'paramos')
  ),
  winner_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.realm_siege_seasons
  add column if not exists prize_pool_base_gold integer not null default 125000 check (prize_pool_base_gold >= 0),
  add column if not exists prize_pool_growth_per_cycle integer not null default 125000 check (prize_pool_growth_per_cycle >= 0),
  add column if not exists prize_pool_cap_gold integer not null default 1000000 check (prize_pool_cap_gold > 0),
  add column if not exists prize_pool_awarded_gold integer not null default 0 check (prize_pool_awarded_gold >= 0),
  add column if not exists prize_pool_awarded_at timestamptz,
  add column if not exists winner_faction_id text,
  add column if not exists winner_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'realm_siege_winner_faction_id_check'
  ) then
    alter table public.realm_siege_seasons
      add constraint realm_siege_winner_faction_id_check
      check (
        winner_faction_id is null
        or winner_faction_id in ('kaelum', 'oakhaven', 'arcania', 'paramos')
      );
  end if;
end $$;

create table if not exists public.realm_siege_factions (
  season_id uuid not null references public.realm_siege_seasons(id) on delete cascade,
  faction_id text not null,
  display_name text not null,
  accent text not null default '#f4c95d',
  members_count integer not null default 0 check (members_count >= 0),
  treasury_gold integer not null default 0 check (treasury_gold >= 0),
  is_ai_managed boolean generated always as (members_count <= 0) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (season_id, faction_id),
  check (faction_id in ('kaelum', 'oakhaven', 'arcania', 'paramos'))
);

create table if not exists public.realm_siege_territories (
  season_id uuid not null references public.realm_siege_seasons(id) on delete cascade,
  territory_id text not null,
  short_name text not null,
  display_name text not null,
  owner_faction_id text,
  wall_level integer not null default 0 check (wall_level >= 0),
  npc_defense integer not null default 60000 check (npc_defense >= 0),
  garrison_power integer not null default 0 check (garrison_power >= 0),
  terrain text not null default 'neutral',
  favored_class text,
  disfavored_class text,
  income_bonus integer not null default 0 check (income_bonus >= 0),
  invest_level integer not null default 0 check (invest_level >= 0),
  adjacent_territory_ids text[] not null default array[]::text[],
  position_x numeric(5,2) not null default 50,
  position_y numeric(5,2) not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (season_id, territory_id),
  foreign key (season_id, owner_faction_id)
    references public.realm_siege_factions(season_id, faction_id)
    on update cascade
    on delete restrict
);

create table if not exists public.realm_siege_player_state (
  season_id uuid not null references public.realm_siege_seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  faction_id text not null,
  faction_locked boolean not null default true,
  last_income_claim_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (season_id, player_id),
  foreign key (season_id, faction_id)
    references public.realm_siege_factions(season_id, faction_id)
    on update cascade
    on delete restrict
);

create table if not exists public.realm_siege_deposits (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.realm_siege_seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  faction_id text not null,
  amount integer not null check (amount > 0),
  date_key date not null default ((now() at time zone 'America/Asuncion')::date),
  created_at timestamptz not null default now(),
  foreign key (season_id, faction_id)
    references public.realm_siege_factions(season_id, faction_id)
    on update cascade
    on delete restrict
);

create table if not exists public.realm_siege_actions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.realm_siege_seasons(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  actor_faction_id text,
  action_type text not null,
  territory_id text,
  amount integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (season_id, actor_faction_id)
    references public.realm_siege_factions(season_id, faction_id)
    on update cascade
    on delete restrict
);

create index if not exists idx_realm_siege_factions_season
  on public.realm_siege_factions(season_id);

create index if not exists idx_realm_siege_territories_owner
  on public.realm_siege_territories(season_id, owner_faction_id);

create index if not exists idx_realm_siege_player_state_player
  on public.realm_siege_player_state(player_id);

create index if not exists idx_realm_siege_deposits_player_date
  on public.realm_siege_deposits(season_id, player_id, date_key);

create index if not exists idx_realm_siege_actions_recent
  on public.realm_siege_actions(season_id, created_at desc);

alter table public.realm_siege_seasons enable row level security;
alter table public.realm_siege_factions enable row level security;
alter table public.realm_siege_territories enable row level security;
alter table public.realm_siege_player_state enable row level security;
alter table public.realm_siege_deposits enable row level security;
alter table public.realm_siege_actions enable row level security;

drop policy if exists "Realm siege seasons are readable" on public.realm_siege_seasons;
create policy "Realm siege seasons are readable"
on public.realm_siege_seasons
for select
to anon, authenticated
using (true);

drop policy if exists "Realm siege factions are readable" on public.realm_siege_factions;
create policy "Realm siege factions are readable"
on public.realm_siege_factions
for select
to anon, authenticated
using (true);

drop policy if exists "Realm siege territories are readable" on public.realm_siege_territories;
create policy "Realm siege territories are readable"
on public.realm_siege_territories
for select
to anon, authenticated
using (true);

drop policy if exists "Realm siege actions are readable" on public.realm_siege_actions;
create policy "Realm siege actions are readable"
on public.realm_siege_actions
for select
to anon, authenticated
using (true);

drop policy if exists "Players can read own realm siege state" on public.realm_siege_player_state;
create policy "Players can read own realm siege state"
on public.realm_siege_player_state
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = realm_siege_player_state.player_id
      and players.auth_user_id::text = (select auth.uid())::text
  )
  or exists (
    select 1
    from public.player_auth_links links
    where links.player_id = realm_siege_player_state.player_id
      and links.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Players can read own realm siege deposits" on public.realm_siege_deposits;
create policy "Players can read own realm siege deposits"
on public.realm_siege_deposits
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = realm_siege_deposits.player_id
      and players.auth_user_id::text = (select auth.uid())::text
  )
  or exists (
    select 1
    from public.player_auth_links links
    where links.player_id = realm_siege_deposits.player_id
      and links.auth_user_id = (select auth.uid())
  )
);

grant select on public.realm_siege_seasons to anon, authenticated;
grant select on public.realm_siege_factions to anon, authenticated;
grant select on public.realm_siege_territories to anon, authenticated;
grant select on public.realm_siege_actions to anon, authenticated;
grant select on public.realm_siege_player_state to authenticated;
grant select on public.realm_siege_deposits to authenticated;

insert into public.realm_siege_seasons (
  slug,
  title,
  status,
  starts_at,
  ends_at,
  prize_pool_base_gold,
  prize_pool_growth_per_cycle,
  prize_pool_cap_gold
) values (
  'asedio-reinos-t1',
  'El Asedio de los Reinos',
  'active',
  now(),
  now() + interval '7 days',
  125000,
  125000,
  1000000
)
on conflict (slug) do update
set
  title = excluded.title,
  min_duration_days = 7,
  income_cycle_hours = 24,
  ai_strategy_cycle_hours = 12,
  daily_deposit_limit = 25000,
  kingdom_member_cap = 3,
  base_territory_income = 4000,
  conquest_reward = 20000,
  income_invest_base_cost = 100000,
  income_invest_cost_step = 50000,
  income_invest_gain = 1000,
  max_income_invest_level = 5,
  prize_pool_base_gold = 125000,
  prize_pool_growth_per_cycle = 125000,
  prize_pool_cap_gold = 1000000,
  updated_at = now();

with season as (
  select id
  from public.realm_siege_seasons
  where slug = 'asedio-reinos-t1'
)
insert into public.realm_siege_factions (
  season_id,
  faction_id,
  display_name,
  accent
)
select
  season.id,
  faction_id,
  display_name,
  accent
from season
cross join (
  values
    ('kaelum', 'Kaelum-Gard', '#7db7ff'),
    ('oakhaven', 'Oakhaven', '#8ccf7a'),
    ('arcania', 'Arcania', '#b794f4'),
    ('paramos', 'Los Paramos', '#f47b54')
) as data(faction_id, display_name, accent)
on conflict (season_id, faction_id) do update
set
  display_name = excluded.display_name,
  accent = excluded.accent,
  updated_at = now();

with season as (
  select id
  from public.realm_siege_seasons
  where slug = 'asedio-reinos-t1'
)
insert into public.realm_siege_territories (
  season_id,
  territory_id,
  short_name,
  display_name,
  owner_faction_id,
  wall_level,
  npc_defense,
  garrison_power,
  terrain,
  favored_class,
  disfavored_class,
  adjacent_territory_ids,
  position_x,
  position_y
)
select
  season.id,
  territory_id,
  short_name,
  display_name,
  owner_faction_id,
  wall_level,
  npc_defense,
  garrison_power,
  terrain,
  favored_class,
  disfavored_class,
  adjacent_territory_ids,
  position_x,
  position_y
from season
cross join (
  values
    ('kaelum', 'Kaelum', 'Ciudadela de Kaelum-Gard', 'kaelum', 3, 100000, 28000, 'fortaleza mayor', 'Guardian', 'Asedio', array['paso','ceniza']::text[], 15.00, 18.00),
    ('paso', 'Paso', 'Paso de Montana', null::text, 1, 68000, 9000, 'paso de montana', 'Explorador', 'Blindada', array['kaelum','oakhaven','umbral']::text[], 50.00, 13.00),
    ('oakhaven', 'Oakhaven', 'Ciudadela de Oakhaven', 'oakhaven', 3, 100000, 28000, 'fortaleza mayor', 'Arquero', 'Asedio', array['paso','costa']::text[], 82.00, 18.00),
    ('ceniza', 'Ceniza', 'Valle de Ceniza', null::text, 0, 56000, 6000, 'verano candente', 'Fuego', 'Hielo', array['kaelum','paramos','umbral']::text[], 17.00, 45.00),
    ('umbral', 'Umbral', 'Bosque Umbral', null::text, 0, 64000, 9000, 'bosque umbral', 'Sigilo', 'Blindada', array['paso','ceniza','costa','arcita','dunmoor']::text[], 50.00, 50.00),
    ('costa', 'Costa', 'Costa Brumosa', null::text, 1, 66000, 8500, 'costa brumosa', 'Asedio', 'Caballeria', array['oakhaven','umbral','arcita','arcania']::text[], 84.00, 45.00),
    ('paramos', 'Paramos', 'Bastion de Los Paramos', 'paramos', 3, 100000, 28000, 'fortaleza mayor', 'Oscuridad', 'Luz', array['ceniza','dunmoor']::text[], 15.00, 72.00),
    ('arcita', 'Arcita', 'Minas de Arcita', null::text, 1, 72000, 11000, 'semi-fortificada', 'Minero', 'Sigilo', array['umbral','costa','arcania','dunmoor']::text[], 66.00, 58.00),
    ('arcania', 'Arcania', 'Ciudadela de Arcania', 'arcania', 3, 100000, 28000, 'fortaleza mayor', 'Magia', 'Asedio', array['costa','arcita']::text[], 82.00, 71.00),
    ('dunmoor', 'Dunmoor', 'Ruinas Antiguas', null::text, 0, 58000, 7000, 'ruinas antiguas', 'Reliquia', 'Fuego', array['paramos','umbral','arcita']::text[], 50.00, 83.00)
) as data(
  territory_id,
  short_name,
  display_name,
  owner_faction_id,
  wall_level,
  npc_defense,
  garrison_power,
  terrain,
  favored_class,
  disfavored_class,
  adjacent_territory_ids,
  position_x,
  position_y
)
on conflict (season_id, territory_id) do update
set
  short_name = excluded.short_name,
  display_name = excluded.display_name,
  terrain = excluded.terrain,
  favored_class = excluded.favored_class,
  disfavored_class = excluded.disfavored_class,
  adjacent_territory_ids = excluded.adjacent_territory_ids,
  position_x = excluded.position_x,
  position_y = excluded.position_y,
  updated_at = now();

create or replace function public.realm_siege_assert_player(
  p_player_id uuid
)
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
    raise exception 'Debes iniciar sesion segura para usar el Asedio.'
      using errcode = '42501';
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
    and (
      auth_user_id::text = v_auth_user_id::text
      or exists (
        select 1
        from public.player_auth_links links
        where links.player_id = players.id
          and links.auth_user_id = v_auth_user_id
      )
    )
  limit 1;

  if v_player.id is null then
    raise exception 'Tu cuenta segura no coincide con este jugador.'
      using errcode = '42501';
  end if;

  return v_player;
end;
$$;

revoke all on function public.realm_siege_assert_player(uuid) from public;

create or replace function public.realm_siege_current_prize_pool(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_income_cycle_hours integer,
  p_base_gold integer,
  p_growth_per_cycle integer,
  p_cap_gold integer,
  p_awarded_gold integer,
  p_awarded_at timestamptz
)
returns integer
language sql
stable
as $$
  select case
    when p_awarded_at is not null then greatest(coalesce(p_awarded_gold, 0), 0)
    else least(
      greatest(coalesce(p_cap_gold, 1000000), 1),
      greatest(coalesce(p_base_gold, 0), 0)
        + (
          floor(
            greatest(
              extract(
                epoch from (
                  least(now(), coalesce(p_ends_at, now()))
                  - coalesce(p_starts_at, now())
                )
              ),
              0
            )
            / (greatest(coalesce(p_income_cycle_hours, 24), 1) * 3600)
          )::integer
          * greatest(coalesce(p_growth_per_cycle, 0), 0)
        )
    )
  end::integer;
$$;

revoke all on function public.realm_siege_current_prize_pool(timestamptz, timestamptz, integer, integer, integer, integer, integer, timestamptz) from public;
grant execute on function public.realm_siege_current_prize_pool(timestamptz, timestamptz, integer, integer, integer, integer, integer, timestamptz) to anon, authenticated, service_role;

create or replace function public.get_realm_siege_state(
  p_season_slug text default 'asedio-reinos-t1',
  p_player_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.realm_siege_seasons%rowtype;
  v_player public.players%rowtype;
  v_player_state public.realm_siege_player_state%rowtype;
  v_factions jsonb;
  v_territories jsonb;
  v_actions jsonb;
  v_deposited_today integer := 0;
  v_current_prize_pool integer := 0;
  v_today date := ((now() at time zone 'America/Asuncion')::date);
begin
  select *
  into v_season
  from public.realm_siege_seasons
  where slug = coalesce(nullif(trim(p_season_slug), ''), 'asedio-reinos-t1')
  limit 1;

  if v_season.id is null then
    raise exception 'Temporada de Asedio no encontrada.'
      using errcode = 'P0002';
  end if;

  if p_player_id is not null then
    v_player := public.realm_siege_assert_player(p_player_id);

    select *
    into v_player_state
    from public.realm_siege_player_state
    where season_id = v_season.id
      and player_id = v_player.id
    limit 1;

    select coalesce(sum(amount), 0)::integer
    into v_deposited_today
    from public.realm_siege_deposits
    where season_id = v_season.id
      and player_id = v_player.id
      and date_key = v_today;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', faction_id,
        'displayName', display_name,
        'accent', accent,
        'membersCount', members_count,
        'treasuryGold', treasury_gold,
        'isAiManaged', is_ai_managed
      )
      order by display_name
    ),
    '[]'::jsonb
  )
  into v_factions
  from public.realm_siege_factions
  where season_id = v_season.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', territory_id,
        'shortName', short_name,
        'displayName', display_name,
        'ownerFactionId', owner_faction_id,
        'wallLevel', wall_level,
        'npcDefense', npc_defense,
        'garrisonPower', garrison_power,
        'terrain', terrain,
        'favoredClass', favored_class,
        'disfavoredClass', disfavored_class,
        'incomeBonus', income_bonus,
        'investLevel', invest_level,
        'adjacentTerritoryIds', adjacent_territory_ids,
        'positionX', position_x,
        'positionY', position_y
      )
      order by territory_id
    ),
    '[]'::jsonb
  )
  into v_territories
  from public.realm_siege_territories
  where season_id = v_season.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'playerId', player_id,
        'actorFactionId', actor_faction_id,
        'actionType', action_type,
        'territoryId', territory_id,
        'amount', amount,
        'payload', payload,
        'createdAt', created_at
      )
      order by created_at desc
    ),
    '[]'::jsonb
  )
  into v_actions
  from (
    select *
    from public.realm_siege_actions
    where season_id = v_season.id
    order by created_at desc
    limit 12
  ) recent_actions;

  v_current_prize_pool := public.realm_siege_current_prize_pool(
    v_season.starts_at,
    v_season.ends_at,
    v_season.income_cycle_hours,
    v_season.prize_pool_base_gold,
    v_season.prize_pool_growth_per_cycle,
    v_season.prize_pool_cap_gold,
    v_season.prize_pool_awarded_gold,
    v_season.prize_pool_awarded_at
  );

  return jsonb_build_object(
    'season', jsonb_build_object(
      'id', v_season.id,
      'slug', v_season.slug,
      'title', v_season.title,
      'status', v_season.status,
      'startsAt', v_season.starts_at,
      'endsAt', v_season.ends_at,
      'minDurationDays', v_season.min_duration_days,
      'incomeCycleHours', v_season.income_cycle_hours,
      'aiStrategyCycleHours', v_season.ai_strategy_cycle_hours,
      'dailyDepositLimit', v_season.daily_deposit_limit,
      'kingdomMemberCap', v_season.kingdom_member_cap,
      'baseTerritoryIncome', v_season.base_territory_income,
      'conquestReward', v_season.conquest_reward,
      'incomeInvestBaseCost', v_season.income_invest_base_cost,
      'incomeInvestCostStep', v_season.income_invest_cost_step,
      'incomeInvestGain', v_season.income_invest_gain,
      'maxIncomeInvestLevel', v_season.max_income_invest_level,
      'prizePoolBaseGold', v_season.prize_pool_base_gold,
      'prizePoolGrowthPerCycle', v_season.prize_pool_growth_per_cycle,
      'prizePoolCapGold', v_season.prize_pool_cap_gold,
      'currentPrizePoolGold', v_current_prize_pool,
      'prizePoolAwardedGold', v_season.prize_pool_awarded_gold,
      'prizePoolAwardedAt', v_season.prize_pool_awarded_at,
      'winnerFactionId', v_season.winner_faction_id,
      'winnerReason', v_season.winner_reason
    ),
    'factions', v_factions,
    'territories', v_territories,
    'playerState',
      case
        when v_player_state.player_id is null then null
        else jsonb_build_object(
          'factionId', v_player_state.faction_id,
          'factionLocked', v_player_state.faction_locked,
          'lastIncomeClaimAt', v_player_state.last_income_claim_at,
          'nextIncomeAt',
            case
              when v_player_state.last_income_claim_at is null then null
              else v_player_state.last_income_claim_at + make_interval(hours => v_season.income_cycle_hours)
            end,
          'depositedToday', v_deposited_today,
          'availableDeposit', greatest(v_season.daily_deposit_limit - v_deposited_today, 0),
          'dailyDepositLimit', v_season.daily_deposit_limit
        )
      end,
    'recentActions', v_actions
  );
end;
$$;

revoke all on function public.get_realm_siege_state(text, uuid) from public;
grant execute on function public.get_realm_siege_state(text, uuid) to anon, authenticated, service_role;

create or replace function public.join_realm_siege_faction(
  p_player_id uuid,
  p_faction_id text,
  p_season_slug text default 'asedio-reinos-t1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.realm_siege_seasons%rowtype;
  v_player public.players%rowtype;
  v_existing_state public.realm_siege_player_state%rowtype;
  v_member_count integer := 0;
  v_faction_id text := lower(trim(p_faction_id));
begin
  v_player := public.realm_siege_assert_player(p_player_id);

  select *
  into v_season
  from public.realm_siege_seasons
  where slug = coalesce(nullif(trim(p_season_slug), ''), 'asedio-reinos-t1')
  for update;

  if v_season.id is null or v_season.status <> 'active' then
    raise exception 'El Asedio no esta activo.'
      using errcode = '22023';
  end if;

  if v_faction_id not in ('kaelum', 'oakhaven', 'arcania', 'paramos') then
    raise exception 'Faccion no valida para el Asedio.'
      using errcode = '22023';
  end if;

  perform 1
  from public.realm_siege_factions
  where season_id = v_season.id
    and faction_id = v_faction_id;

  if not found then
    raise exception 'La faccion elegida no existe en esta temporada.'
      using errcode = 'P0002';
  end if;

  select *
  into v_existing_state
  from public.realm_siege_player_state
  where season_id = v_season.id
    and player_id = v_player.id
  for update;

  if v_existing_state.player_id is not null then
    if v_existing_state.faction_id <> v_faction_id and v_existing_state.faction_locked then
      raise exception 'Ya elegiste una faccion para esta temporada.'
        using errcode = '22023';
    end if;

    return jsonb_build_object(
      'success', true,
      'message', 'Ya estabas inscrito en esta faccion.',
      'state', public.get_realm_siege_state(v_season.slug, v_player.id)
    );
  end if;

  select count(*)::integer
  into v_member_count
  from public.realm_siege_player_state
  where season_id = v_season.id
    and faction_id = v_faction_id;

  if v_member_count >= v_season.kingdom_member_cap then
    raise exception 'Ese reino ya tiene sus 3 integrantes.'
      using errcode = '22023';
  end if;

  insert into public.realm_siege_player_state (
    season_id,
    player_id,
    faction_id,
    faction_locked
  ) values (
    v_season.id,
    v_player.id,
    v_faction_id,
    true
  );

  update public.realm_siege_factions
  set
    members_count = v_member_count + 1,
    updated_at = now()
  where season_id = v_season.id
    and faction_id = v_faction_id;

  insert into public.realm_siege_actions (
    season_id,
    player_id,
    actor_faction_id,
    action_type,
    payload
  ) values (
    v_season.id,
    v_player.id,
    v_faction_id,
    'join_faction',
    jsonb_build_object('username', v_player.username)
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Faccion fijada hasta que termine la temporada.',
    'state', public.get_realm_siege_state(v_season.slug, v_player.id)
  );
end;
$$;

revoke all on function public.join_realm_siege_faction(uuid, text, text) from public;
grant execute on function public.join_realm_siege_faction(uuid, text, text) to authenticated, service_role;

create or replace function public.deposit_realm_siege_gold(
  p_player_id uuid,
  p_amount integer,
  p_season_slug text default 'asedio-reinos-t1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.realm_siege_seasons%rowtype;
  v_player public.players%rowtype;
  v_player_state public.realm_siege_player_state%rowtype;
  v_amount integer := coalesce(p_amount, 0);
  v_deposited_today integer := 0;
  v_today date := ((now() at time zone 'America/Asuncion')::date);
  v_remaining_gold integer;
  v_treasury_gold integer;
begin
  v_player := public.realm_siege_assert_player(p_player_id);

  if v_amount <= 0 then
    raise exception 'El deposito debe ser mayor a 0.'
      using errcode = '22023';
  end if;

  select *
  into v_season
  from public.realm_siege_seasons
  where slug = coalesce(nullif(trim(p_season_slug), ''), 'asedio-reinos-t1')
  for update;

  if v_season.id is null or v_season.status <> 'active' then
    raise exception 'El Asedio no esta activo.'
      using errcode = '22023';
  end if;

  select *
  into v_player_state
  from public.realm_siege_player_state
  where season_id = v_season.id
    and player_id = v_player.id
  for update;

  if v_player_state.player_id is null then
    raise exception 'Debes elegir una faccion antes de depositar oro.'
      using errcode = '22023';
  end if;

  select coalesce(sum(amount), 0)::integer
  into v_deposited_today
  from public.realm_siege_deposits
  where season_id = v_season.id
    and player_id = v_player.id
    and date_key = v_today;

  if v_deposited_today + v_amount > v_season.daily_deposit_limit then
    raise exception 'Supera el limite diario de deposito del Asedio.'
      using errcode = '22023';
  end if;

  update public.players
  set gold = gold - v_amount
  where id = v_player.id
    and gold >= v_amount
  returning gold into v_remaining_gold;

  if v_remaining_gold is null then
    raise exception 'Oro insuficiente para depositar.'
      using errcode = '22023';
  end if;

  insert into public.realm_siege_deposits (
    season_id,
    player_id,
    faction_id,
    amount,
    date_key
  ) values (
    v_season.id,
    v_player.id,
    v_player_state.faction_id,
    v_amount,
    v_today
  );

  update public.realm_siege_factions
  set
    treasury_gold = treasury_gold + v_amount,
    updated_at = now()
  where season_id = v_season.id
    and faction_id = v_player_state.faction_id
  returning treasury_gold into v_treasury_gold;

  insert into public.realm_siege_actions (
    season_id,
    player_id,
    actor_faction_id,
    action_type,
    amount
  ) values (
    v_season.id,
    v_player.id,
    v_player_state.faction_id,
    'deposit_gold',
    v_amount
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Oro depositado al tesoro del reino.',
    'remainingGold', v_remaining_gold,
    'depositedToday', v_deposited_today + v_amount,
    'availableDeposit', greatest(v_season.daily_deposit_limit - v_deposited_today - v_amount, 0),
    'treasuryGold', v_treasury_gold,
    'state', public.get_realm_siege_state(v_season.slug, v_player.id)
  );
end;
$$;

revoke all on function public.deposit_realm_siege_gold(uuid, integer, text) from public;
grant execute on function public.deposit_realm_siege_gold(uuid, integer, text) to authenticated, service_role;

create or replace function public.claim_realm_siege_income(
  p_player_id uuid,
  p_season_slug text default 'asedio-reinos-t1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.realm_siege_seasons%rowtype;
  v_player public.players%rowtype;
  v_player_state public.realm_siege_player_state%rowtype;
  v_income integer := 0;
  v_next_gold integer;
  v_next_income_at timestamptz;
begin
  v_player := public.realm_siege_assert_player(p_player_id);

  select *
  into v_season
  from public.realm_siege_seasons
  where slug = coalesce(nullif(trim(p_season_slug), ''), 'asedio-reinos-t1')
  for update;

  if v_season.id is null or v_season.status <> 'active' then
    raise exception 'El Asedio no esta activo.'
      using errcode = '22023';
  end if;

  select *
  into v_player_state
  from public.realm_siege_player_state
  where season_id = v_season.id
    and player_id = v_player.id
  for update;

  if v_player_state.player_id is null then
    raise exception 'Debes elegir una faccion antes de cobrar produccion.'
      using errcode = '22023';
  end if;

  if v_player_state.last_income_claim_at is not null then
    v_next_income_at := v_player_state.last_income_claim_at + make_interval(hours => v_season.income_cycle_hours);

    if now() < v_next_income_at then
      raise exception 'La produccion aun no esta lista.'
        using errcode = '22023';
    end if;
  end if;

  select coalesce(sum(v_season.base_territory_income + income_bonus), 0)::integer
  into v_income
  from public.realm_siege_territories
  where season_id = v_season.id
    and owner_faction_id = v_player_state.faction_id;

  if v_income <= 0 then
    raise exception 'Tu faccion aun no controla territorios productivos.'
      using errcode = '22023';
  end if;

  update public.players
  set gold = gold + v_income
  where id = v_player.id
  returning gold into v_next_gold;

  update public.realm_siege_player_state
  set
    last_income_claim_at = now(),
    updated_at = now()
  where season_id = v_season.id
    and player_id = v_player.id;

  insert into public.realm_siege_actions (
    season_id,
    player_id,
    actor_faction_id,
    action_type,
    amount
  ) values (
    v_season.id,
    v_player.id,
    v_player_state.faction_id,
    'claim_income',
    v_income
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Produccion cobrada correctamente.',
    'income', v_income,
    'newGold', v_next_gold,
    'state', public.get_realm_siege_state(v_season.slug, v_player.id)
  );
end;
$$;

revoke all on function public.claim_realm_siege_income(uuid, text) from public;
grant execute on function public.claim_realm_siege_income(uuid, text) to authenticated, service_role;

create or replace function public.invest_realm_siege_income(
  p_player_id uuid,
  p_territory_id text,
  p_season_slug text default 'asedio-reinos-t1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.realm_siege_seasons%rowtype;
  v_player public.players%rowtype;
  v_player_state public.realm_siege_player_state%rowtype;
  v_territory public.realm_siege_territories%rowtype;
  v_cost integer;
  v_next_gold integer;
begin
  v_player := public.realm_siege_assert_player(p_player_id);

  select *
  into v_season
  from public.realm_siege_seasons
  where slug = coalesce(nullif(trim(p_season_slug), ''), 'asedio-reinos-t1')
  for update;

  if v_season.id is null or v_season.status <> 'active' then
    raise exception 'El Asedio no esta activo.'
      using errcode = '22023';
  end if;

  select *
  into v_player_state
  from public.realm_siege_player_state
  where season_id = v_season.id
    and player_id = v_player.id
  for update;

  if v_player_state.player_id is null then
    raise exception 'Debes elegir una faccion antes de invertir.'
      using errcode = '22023';
  end if;

  select *
  into v_territory
  from public.realm_siege_territories
  where season_id = v_season.id
    and territory_id = lower(trim(p_territory_id))
  for update;

  if v_territory.territory_id is null then
    raise exception 'Territorio no encontrado.'
      using errcode = 'P0002';
  end if;

  if v_territory.owner_faction_id is distinct from v_player_state.faction_id then
    raise exception 'Solo puedes invertir en territorios de tu reino.'
      using errcode = '22023';
  end if;

  if v_territory.invest_level >= v_season.max_income_invest_level then
    raise exception 'Este territorio ya alcanzo su limite de produccion.'
      using errcode = '22023';
  end if;

  v_cost := v_season.income_invest_base_cost + (v_territory.invest_level * v_season.income_invest_cost_step);

  update public.players
  set gold = gold - v_cost
  where id = v_player.id
    and gold >= v_cost
  returning gold into v_next_gold;

  if v_next_gold is null then
    raise exception 'Oro insuficiente para aumentar la produccion.'
      using errcode = '22023';
  end if;

  update public.realm_siege_territories
  set
    invest_level = invest_level + 1,
    income_bonus = income_bonus + v_season.income_invest_gain,
    updated_at = now()
  where season_id = v_season.id
    and territory_id = v_territory.territory_id;

  insert into public.realm_siege_actions (
    season_id,
    player_id,
    actor_faction_id,
    action_type,
    territory_id,
    amount
  ) values (
    v_season.id,
    v_player.id,
    v_player_state.faction_id,
    'invest_income',
    v_territory.territory_id,
    v_cost
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Produccion del territorio aumentada.',
    'cost', v_cost,
    'newGold', v_next_gold,
    'state', public.get_realm_siege_state(v_season.slug, v_player.id)
  );
end;
$$;

revoke all on function public.invest_realm_siege_income(uuid, text, text) from public;
grant execute on function public.invest_realm_siege_income(uuid, text, text) to authenticated, service_role;

create or replace function public.settle_realm_siege_prize(
  p_player_id uuid,
  p_season_slug text default 'asedio-reinos-t1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.realm_siege_seasons%rowtype;
  v_player public.players%rowtype;
  v_player_state public.realm_siege_player_state%rowtype;
  v_total_territories integer := 0;
  v_winner_faction_id text;
  v_winner_territories integer := 0;
  v_winner_reason text;
  v_closes_at timestamptz;
  v_current_prize_pool integer := 0;
  v_eligible_count integer := 0;
  v_payout_per_player integer := 0;
  v_remainder_gold integer := 0;
begin
  v_player := public.realm_siege_assert_player(p_player_id);

  select *
  into v_season
  from public.realm_siege_seasons
  where slug = coalesce(nullif(trim(p_season_slug), ''), 'asedio-reinos-t1')
  for update;

  if v_season.id is null then
    raise exception 'Temporada de Asedio no encontrada.'
      using errcode = 'P0002';
  end if;

  if v_season.status in ('draft', 'archived') then
    raise exception 'El Asedio no esta disponible para repartir premios.'
      using errcode = '22023';
  end if;

  select *
  into v_player_state
  from public.realm_siege_player_state
  where season_id = v_season.id
    and player_id = v_player.id
  for update;

  if v_player_state.player_id is null then
    raise exception 'Debes participar en el Asedio para cerrar el pozo.'
      using errcode = '22023';
  end if;

  if v_season.prize_pool_awarded_at is not null then
    return jsonb_build_object(
      'success', true,
      'message', 'El pozo del Asedio ya fue repartido.',
      'winnerFactionId', v_season.winner_faction_id,
      'prizePoolGold', v_season.prize_pool_awarded_gold,
      'state', public.get_realm_siege_state(v_season.slug, v_player.id)
    );
  end if;

  v_closes_at := coalesce(
    v_season.ends_at,
    v_season.starts_at + make_interval(days => v_season.min_duration_days)
  );

  select count(*)::integer
  into v_total_territories
  from public.realm_siege_territories
  where season_id = v_season.id;

  select owner_faction_id, count(*)::integer
  into v_winner_faction_id, v_winner_territories
  from public.realm_siege_territories
  where season_id = v_season.id
    and owner_faction_id is not null
  group by owner_faction_id
  having count(*) = v_total_territories
  limit 1;

  if v_winner_faction_id is not null then
    v_winner_reason := 'full_conquest';
  else
    if now() < v_closes_at then
      raise exception 'El pozo se reparte al conquistar todo el mapa o al cierre de la semana.'
        using errcode = '22023';
    end if;

    select
      factions.faction_id,
      count(territories.territory_id)::integer
    into v_winner_faction_id, v_winner_territories
    from public.realm_siege_factions factions
    left join public.realm_siege_territories territories
      on territories.season_id = factions.season_id
      and territories.owner_faction_id = factions.faction_id
    where factions.season_id = v_season.id
    group by factions.faction_id, factions.treasury_gold
    order by
      count(territories.territory_id) desc,
      factions.treasury_gold desc,
      coalesce(sum(territories.garrison_power), 0) desc,
      factions.faction_id asc
    limit 1;

    v_winner_reason := 'territory_lead';
  end if;

  if v_winner_faction_id is null or v_winner_territories <= 0 then
    raise exception 'Todavia no hay un reino ganador para repartir el pozo.'
      using errcode = '22023';
  end if;

  v_current_prize_pool := public.realm_siege_current_prize_pool(
    v_season.starts_at,
    v_season.ends_at,
    v_season.income_cycle_hours,
    v_season.prize_pool_base_gold,
    v_season.prize_pool_growth_per_cycle,
    v_season.prize_pool_cap_gold,
    v_season.prize_pool_awarded_gold,
    v_season.prize_pool_awarded_at
  );

  if v_current_prize_pool <= 0 then
    raise exception 'El pozo del Asedio aun no tiene oro para repartir.'
      using errcode = '22023';
  end if;

  select count(*)::integer
  into v_eligible_count
  from public.realm_siege_player_state player_state
  where player_state.season_id = v_season.id
    and player_state.faction_id = v_winner_faction_id
    and exists (
      select 1
      from public.realm_siege_actions actions
      where actions.season_id = v_season.id
        and actions.player_id = player_state.player_id
        and actions.actor_faction_id = player_state.faction_id
        and actions.action_type in ('deposit_gold', 'claim_income', 'invest_income')
    );

  if v_eligible_count <= 0 then
    raise exception 'El reino ganador no tiene integrantes activos elegibles para cobrar el pozo.'
      using errcode = '22023';
  end if;

  v_payout_per_player := floor(v_current_prize_pool::numeric / v_eligible_count)::integer;
  v_remainder_gold := v_current_prize_pool - (v_payout_per_player * v_eligible_count);

  if v_payout_per_player <= 0 then
    raise exception 'El pozo no alcanza para repartir oro entre los elegibles.'
      using errcode = '22023';
  end if;

  update public.players
  set gold = gold + v_payout_per_player
  where id in (
    select player_state.player_id
    from public.realm_siege_player_state player_state
    where player_state.season_id = v_season.id
      and player_state.faction_id = v_winner_faction_id
      and exists (
        select 1
        from public.realm_siege_actions actions
        where actions.season_id = v_season.id
          and actions.player_id = player_state.player_id
          and actions.actor_faction_id = player_state.faction_id
          and actions.action_type in ('deposit_gold', 'claim_income', 'invest_income')
      )
  );

  update public.realm_siege_seasons
  set
    status = 'completed',
    ends_at = case
      when ends_at is null or ends_at > now() then now()
      else ends_at
    end,
    prize_pool_awarded_gold = v_current_prize_pool,
    prize_pool_awarded_at = now(),
    winner_faction_id = v_winner_faction_id,
    winner_reason = v_winner_reason,
    updated_at = now()
  where id = v_season.id;

  insert into public.realm_siege_actions (
    season_id,
    actor_faction_id,
    action_type,
    amount,
    payload
  ) values (
    v_season.id,
    v_winner_faction_id,
    'prize_awarded',
    v_current_prize_pool,
    jsonb_build_object(
      'winnerReason', v_winner_reason,
      'territoriesControlled', v_winner_territories,
      'eligiblePlayers', v_eligible_count,
      'payoutPerPlayer', v_payout_per_player,
      'remainderGold', v_remainder_gold
    )
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Pozo del Asedio repartido entre el reino ganador.',
    'winnerFactionId', v_winner_faction_id,
    'prizePoolGold', v_current_prize_pool,
    'eligibleWinners', v_eligible_count,
    'payoutPerPlayer', v_payout_per_player,
    'remainderGold', v_remainder_gold,
    'state', public.get_realm_siege_state(v_season.slug, v_player.id)
  );
end;
$$;

revoke all on function public.settle_realm_siege_prize(uuid, text) from public;
grant execute on function public.settle_realm_siege_prize(uuid, text) to authenticated, service_role;

create or replace function public.run_realm_siege_ai_strategy(
  p_season_slug text default 'asedio-reinos-t1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.realm_siege_seasons%rowtype;
  v_ai record;
  v_target public.realm_siege_territories%rowtype;
  v_income integer;
  v_treasury integer;
  v_actions integer := 0;
begin
  select *
  into v_season
  from public.realm_siege_seasons
  where slug = coalesce(nullif(trim(p_season_slug), ''), 'asedio-reinos-t1')
  limit 1;

  if v_season.id is null or v_season.status <> 'active' then
    raise exception 'El Asedio no esta activo.'
      using errcode = '22023';
  end if;

  for v_ai in
    select *
    from public.realm_siege_factions
    where season_id = v_season.id
      and members_count <= 0
  loop
    select coalesce(sum(v_season.base_territory_income + income_bonus), 0)::integer
    into v_income
    from public.realm_siege_territories
    where season_id = v_season.id
      and owner_faction_id = v_ai.faction_id;

    update public.realm_siege_factions
    set
      treasury_gold = treasury_gold + greatest(v_income, 0),
      updated_at = now()
    where season_id = v_season.id
      and faction_id = v_ai.faction_id
    returning treasury_gold into v_treasury;

    select *
    into v_target
    from public.realm_siege_territories
    where season_id = v_season.id
      and owner_faction_id = v_ai.faction_id
    order by garrison_power asc, npc_defense asc
    limit 1;

    if v_target.territory_id is not null and v_treasury >= 50000 then
      update public.realm_siege_territories
      set
        garrison_power = garrison_power + 8000,
        updated_at = now()
      where season_id = v_season.id
        and territory_id = v_target.territory_id;

      update public.realm_siege_factions
      set
        treasury_gold = greatest(treasury_gold - 25000, 0),
        updated_at = now()
      where season_id = v_season.id
        and faction_id = v_ai.faction_id;

      insert into public.realm_siege_actions (
        season_id,
        actor_faction_id,
        action_type,
        territory_id,
        amount,
        payload
      ) values (
        v_season.id,
        v_ai.faction_id,
        'ai_fortify',
        v_target.territory_id,
        25000,
        jsonb_build_object('garrisonGain', 8000, 'reason', 'weakest_owned_territory')
      );
    else
      insert into public.realm_siege_actions (
        season_id,
        actor_faction_id,
        action_type,
        payload
      ) values (
        v_season.id,
        v_ai.faction_id,
        'ai_strategy_tick',
        jsonb_build_object('incomeCollected', greatest(v_income, 0), 'mode', 'economy_first')
      );
    end if;

    v_actions := v_actions + 1;
  end loop;

  return jsonb_build_object(
    'success', true,
    'message', 'Ciclo de IA ejecutado.',
    'aiActions', v_actions,
    'state', public.get_realm_siege_state(v_season.slug, null)
  );
end;
$$;

revoke all on function public.run_realm_siege_ai_strategy(text) from public;
grant execute on function public.run_realm_siege_ai_strategy(text) to service_role;
