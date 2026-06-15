create extension if not exists pgcrypto;

create table if not exists public.season_rank_seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'closed')),
  season_weeks integer not null default 10 check (season_weeks >= 1),
  reset_drop_tiers integer not null default 6 check (reset_drop_tiers >= 0),
  notes text not null default '',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.season_rank_player_seeds (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.season_rank_seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  seed_points integer not null default 0 check (seed_points >= 0),
  seed_rank_name text not null check (seed_rank_name in ('siervo', 'escudero', 'caballero', 'senor', 'senor-oscuro')),
  seed_rank_tier text not null check (seed_rank_tier in ('I', 'II', 'III')),
  source_snapshot_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, player_id)
);

create table if not exists public.season_rank_player_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.season_rank_seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  seed_points integer not null default 0 check (seed_points >= 0),
  earned_points integer not null default 0 check (earned_points >= 0),
  final_points integer not null default 0 check (final_points >= 0),
  rewarded_missions_count integer not null default 0 check (rewarded_missions_count >= 0),
  rewarded_events_count integer not null default 0 check (rewarded_events_count >= 0),
  manual_awards_count integer not null default 0 check (manual_awards_count >= 0),
  final_rank_name text not null check (final_rank_name in ('siervo', 'escudero', 'caballero', 'senor', 'senor-oscuro')),
  final_rank_tier text not null check (final_rank_tier in ('I', 'II', 'III')),
  next_seed_points integer not null default 0 check (next_seed_points >= 0),
  next_seed_rank_name text not null check (next_seed_rank_name in ('siervo', 'escudero', 'caballero', 'senor', 'senor-oscuro')),
  next_seed_rank_tier text not null check (next_seed_rank_tier in ('I', 'II', 'III')),
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, player_id)
);

create table if not exists public.season_rank_awards (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.season_rank_seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  source_type text not null check (source_type in ('manual_mission', 'manual_event', 'special_achievement', 'gm_bonus')),
  source_key text not null,
  mission_difficulty text check (mission_difficulty in ('easy', 'medium', 'hard', 'elite')),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  awarded_by_player_id uuid references public.players(id) on delete set null,
  awarded_by_name text not null default '',
  awarded_by_phone text,
  notes text not null default '',
  external_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_season_rank_single_active
  on public.season_rank_seasons ((status))
  where status = 'active';

create index if not exists idx_season_rank_seasons_status_dates
  on public.season_rank_seasons (status, starts_at desc, ends_at desc);

create index if not exists idx_season_rank_player_seeds_player
  on public.season_rank_player_seeds (player_id, season_id);

create index if not exists idx_season_rank_player_snapshots_player
  on public.season_rank_player_snapshots (player_id, season_id);

create index if not exists idx_season_rank_awards_player
  on public.season_rank_awards (player_id, season_id, created_at desc);

create index if not exists idx_season_rank_awards_season
  on public.season_rank_awards (season_id, source_type, created_at desc);

create unique index if not exists idx_season_rank_awards_external_ref
  on public.season_rank_awards (season_id, player_id, source_type, source_key, external_ref)
  where external_ref is not null;

alter table public.season_rank_seasons enable row level security;
alter table public.season_rank_player_seeds enable row level security;
alter table public.season_rank_player_snapshots enable row level security;
alter table public.season_rank_awards enable row level security;

drop policy if exists "Allow public season rank seasons read" on public.season_rank_seasons;
create policy "Allow public season rank seasons read"
on public.season_rank_seasons
for select
using (true);

drop policy if exists "Allow season rank seasons write" on public.season_rank_seasons;
create policy "Allow season rank seasons write"
on public.season_rank_seasons
for all
using (true)
with check (true);

drop policy if exists "Allow public season rank seeds read" on public.season_rank_player_seeds;
create policy "Allow public season rank seeds read"
on public.season_rank_player_seeds
for select
using (true);

drop policy if exists "Allow season rank seeds write" on public.season_rank_player_seeds;
create policy "Allow season rank seeds write"
on public.season_rank_player_seeds
for all
using (true)
with check (true);

drop policy if exists "Allow public season rank snapshots read" on public.season_rank_player_snapshots;
create policy "Allow public season rank snapshots read"
on public.season_rank_player_snapshots
for select
using (true);

drop policy if exists "Allow season rank snapshots write" on public.season_rank_player_snapshots;
create policy "Allow season rank snapshots write"
on public.season_rank_player_snapshots
for all
using (true)
with check (true);

drop policy if exists "Allow public season rank awards read" on public.season_rank_awards;
create policy "Allow public season rank awards read"
on public.season_rank_awards
for select
using (true);

drop policy if exists "Allow season rank awards write" on public.season_rank_awards;
create policy "Allow season rank awards write"
on public.season_rank_awards
for all
using (true)
with check (true);

create or replace function public.set_season_rank_seasons_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_season_rank_player_seeds_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_season_rank_player_snapshots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_season_rank_awards_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_season_rank_seasons_updated_at on public.season_rank_seasons;
create trigger set_season_rank_seasons_updated_at
before update on public.season_rank_seasons
for each row
execute function public.set_season_rank_seasons_updated_at();

drop trigger if exists set_season_rank_player_seeds_updated_at on public.season_rank_player_seeds;
create trigger set_season_rank_player_seeds_updated_at
before update on public.season_rank_player_seeds
for each row
execute function public.set_season_rank_player_seeds_updated_at();

drop trigger if exists set_season_rank_player_snapshots_updated_at on public.season_rank_player_snapshots;
create trigger set_season_rank_player_snapshots_updated_at
before update on public.season_rank_player_snapshots
for each row
execute function public.set_season_rank_player_snapshots_updated_at();

drop trigger if exists set_season_rank_awards_updated_at on public.season_rank_awards;
create trigger set_season_rank_awards_updated_at
before update on public.season_rank_awards
for each row
execute function public.set_season_rank_awards_updated_at();

do $$
declare
  v_initial_start timestamptz := date_trunc('month', timezone('utc', now()));
begin
  if not exists (select 1 from public.season_rank_seasons) then
    insert into public.season_rank_seasons (
      name,
      starts_at,
      ends_at,
      status,
      season_weeks,
      reset_drop_tiers,
      notes
    ) values (
      'Temporada Inicial',
      v_initial_start,
      v_initial_start + interval '10 weeks',
      'active',
      10,
      6,
      'Temporada bootstrap creada automaticamente para activar el sistema clasificatorio.'
    );
  end if;
end;
$$;

create or replace function public.award_manual_mission_rank_points(
  p_player_ids uuid[],
  p_difficulty text,
  p_awarded_by_name text,
  p_awarded_by_phone text default null,
  p_notes text default '',
  p_external_ref text default null
)
returns table (
  season_id uuid,
  season_name text,
  points_per_player integer,
  awarded_players integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_season public.season_rank_seasons%rowtype;
  v_rule record;
  v_player_id uuid;
  v_awarded integer := 0;
begin
  if p_difficulty not in ('easy', 'medium', 'hard', 'elite') then
    raise exception 'Dificultad invalida para premio manual: %', p_difficulty;
  end if;

  if p_player_ids is null or array_length(p_player_ids, 1) is null then
    raise exception 'Debes enviar al menos un player_id.';
  end if;

  select *
  into v_season
  from public.season_rank_seasons
  where status = 'active'
  order by starts_at desc
  limit 1;

  if not found then
    raise exception 'No hay una temporada activa para otorgar puntos.';
  end if;

  select
    base_points,
    mission_difficulty
  into v_rule
  from public.season_rank_point_rules
  where scope = 'mission'
    and mission_difficulty = p_difficulty
    and is_active = true
  order by sort_order asc
  limit 1;

  if not found then
    raise exception 'No existe una regla activa de puntos para la dificultad %.', p_difficulty;
  end if;

  foreach v_player_id in array p_player_ids
  loop
    insert into public.season_rank_awards (
      season_id,
      player_id,
      source_type,
      source_key,
      mission_difficulty,
      points_awarded,
      awarded_by_name,
      awarded_by_phone,
      notes,
      external_ref,
      metadata
    ) values (
      v_season.id,
      v_player_id,
      'manual_mission',
      'mission_' || p_difficulty,
      p_difficulty,
      v_rule.base_points,
      coalesce(p_awarded_by_name, ''),
      p_awarded_by_phone,
      coalesce(p_notes, ''),
      p_external_ref,
      jsonb_build_object(
        'difficulty', p_difficulty,
        'origin', 'whatsapp-bot'
      )
    )
    on conflict (season_id, player_id, source_type, source_key, external_ref)
    where external_ref is not null
    do nothing;

    if found then
      v_awarded := v_awarded + 1;
    elsif p_external_ref is null then
      v_awarded := v_awarded + 1;
    end if;
  end loop;

  return query
  select
    v_season.id,
    v_season.name,
    v_rule.base_points::integer,
    v_awarded;
end;
$$;

create or replace function public.close_and_rollover_active_season_rank(p_force boolean default false)
returns table (
  closed_season_id uuid,
  next_season_id uuid,
  processed_players integer,
  closed_season_name text,
  next_season_name text,
  next_starts_at timestamptz,
  next_ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season public.season_rank_seasons%rowtype;
  v_next_season public.season_rank_seasons%rowtype;
  v_player record;
  v_final_step record;
  v_next_seed_step record;
  v_snapshot_id uuid;
  v_processed integer := 0;
  v_seed_points integer := 0;
  v_earned_points integer := 0;
  v_final_points integer := 0;
  v_reset_step_index integer := 1;
begin
  select *
  into v_season
  from public.season_rank_seasons
  where status = 'active'
  order by starts_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No hay una temporada activa para cerrar.';
  end if;

  if not p_force and timezone('utc', now()) < v_season.ends_at then
    raise exception 'La temporada activa aun no termino. Finaliza en %.', v_season.ends_at;
  end if;

  if exists (
    select 1
    from public.season_rank_player_snapshots
    where season_id = v_season.id
    limit 1
  ) then
    raise exception 'La temporada % ya fue procesada anteriormente.', v_season.name;
  end if;

  update public.season_rank_seasons
  set status = 'closed',
      closed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = v_season.id;

  select *
  into v_next_season
  from public.season_rank_seasons
  where status = 'upcoming'
    and starts_at = v_season.ends_at
  order by starts_at asc
  limit 1
  for update;

  if not found then
    insert into public.season_rank_seasons (
      name,
      starts_at,
      ends_at,
      status,
      season_weeks,
      reset_drop_tiers,
      notes
    ) values (
      'Temporada ' || to_char(v_season.ends_at at time zone 'utc', 'YYYY-MM-DD'),
      v_season.ends_at,
      v_season.ends_at + make_interval(weeks => coalesce(v_season.season_weeks, 10)),
      'active',
      coalesce(v_season.season_weeks, 10),
      coalesce(v_season.reset_drop_tiers, 6),
      'Temporada creada automaticamente al cerrar ' || v_season.name || '.'
    )
    returning * into v_next_season;
  else
    update public.season_rank_seasons
    set status = 'active',
        updated_at = timezone('utc', now())
    where id = v_next_season.id
    returning * into v_next_season;
  end if;

  for v_player in
    with seed_points as (
      select
        player_id,
        seed_points
      from public.season_rank_player_seeds
      where season_id = v_season.id
    ),
    mission_points as (
      select
        mc.player_id,
        count(*)::integer as rewarded_missions_count,
        coalesce(sum(coalesce(rule.base_points, 0)), 0)::integer as mission_points
      from public.realm_mission_claims mc
      join public.realm_missions mission
        on mission.id = mc.mission_id
      left join public.season_rank_point_rules rule
        on rule.scope = 'mission'
       and rule.mission_difficulty = mission.difficulty
       and rule.is_active = true
      where mc.reward_delivered = true
        and mc.status = 'rewarded'
        and mc.reward_delivered_at >= v_season.starts_at
        and mc.reward_delivered_at < v_season.ends_at
      group by mc.player_id
    ),
    event_rule as (
      select coalesce(max(base_points), 0)::integer as base_points
      from public.season_rank_point_rules
      where scope = 'event'
        and rule_key = 'rewarded_participation'
        and is_active = true
    ),
    event_points as (
      select
        ep.player_id,
        count(*)::integer as rewarded_events_count,
        (count(*)::integer * coalesce((select base_points from event_rule), 0))::integer as event_points
      from public.realm_event_participants ep
      where ep.reward_delivered = true
        and ep.status = 'rewarded'
        and ep.reward_delivered_at >= v_season.starts_at
        and ep.reward_delivered_at < v_season.ends_at
      group by ep.player_id
    ),
    manual_award_points as (
      select
        award.player_id,
        count(*)::integer as manual_awards_count,
        coalesce(sum(award.points_awarded), 0)::integer as award_points
      from public.season_rank_awards award
      where award.season_id = v_season.id
      group by award.player_id
    )
    select
      coalesce(seed.player_id, mission.player_id, event.player_id, award.player_id) as player_id,
      coalesce(seed.seed_points, 0)::integer as seed_points,
      coalesce(mission.rewarded_missions_count, 0)::integer as rewarded_missions_count,
      coalesce(mission.mission_points, 0)::integer as mission_points,
      coalesce(event.rewarded_events_count, 0)::integer as rewarded_events_count,
      coalesce(event.event_points, 0)::integer as event_points,
      coalesce(award.manual_awards_count, 0)::integer as manual_awards_count,
      coalesce(award.award_points, 0)::integer as award_points
    from seed_points seed
    full outer join mission_points mission
      on mission.player_id = seed.player_id
    full outer join event_points event
      on event.player_id = coalesce(seed.player_id, mission.player_id)
    full outer join manual_award_points award
      on award.player_id = coalesce(seed.player_id, mission.player_id, event.player_id)
    where coalesce(seed.player_id, mission.player_id, event.player_id, award.player_id) is not null
  loop
    v_seed_points := coalesce(v_player.seed_points, 0);
    v_earned_points :=
      coalesce(v_player.mission_points, 0)
      + coalesce(v_player.event_points, 0)
      + coalesce(v_player.award_points, 0);
    v_final_points := v_seed_points + v_earned_points;

    select *
    into v_final_step
    from (
      select
        rank_name,
        rank_tier,
        min_points,
        row_number() over (order by sort_order asc, min_points asc) as step_index
      from public.season_rank_thresholds
      where is_active = true
    ) threshold_steps
    where min_points <= v_final_points
    order by step_index desc
    limit 1;

    if not found then
      select *
      into v_final_step
      from (
        select
          rank_name,
          rank_tier,
          min_points,
          row_number() over (order by sort_order asc, min_points asc) as step_index
        from public.season_rank_thresholds
        where is_active = true
      ) threshold_steps
      order by step_index asc
      limit 1;
    end if;

    v_reset_step_index := greatest(1, coalesce(v_final_step.step_index, 1) - coalesce(v_season.reset_drop_tiers, 6));

    select *
    into v_next_seed_step
    from (
      select
        rank_name,
        rank_tier,
        min_points,
        row_number() over (order by sort_order asc, min_points asc) as step_index
      from public.season_rank_thresholds
      where is_active = true
    ) threshold_steps
    where step_index = v_reset_step_index
    limit 1;

    insert into public.season_rank_player_snapshots (
      season_id,
      player_id,
      seed_points,
      earned_points,
      final_points,
      rewarded_missions_count,
      rewarded_events_count,
      manual_awards_count,
      final_rank_name,
      final_rank_tier,
      next_seed_points,
      next_seed_rank_name,
      next_seed_rank_tier,
      processed_at
    ) values (
      v_season.id,
      v_player.player_id,
      v_seed_points,
      v_earned_points,
      v_final_points,
      coalesce(v_player.rewarded_missions_count, 0),
      coalesce(v_player.rewarded_events_count, 0),
      coalesce(v_player.manual_awards_count, 0),
      coalesce(v_final_step.rank_name, 'siervo'),
      coalesce(v_final_step.rank_tier, 'III'),
      coalesce(v_next_seed_step.min_points, 0),
      coalesce(v_next_seed_step.rank_name, 'siervo'),
      coalesce(v_next_seed_step.rank_tier, 'III'),
      timezone('utc', now())
    )
    returning id into v_snapshot_id;

    insert into public.season_rank_player_seeds (
      season_id,
      player_id,
      seed_points,
      seed_rank_name,
      seed_rank_tier,
      source_snapshot_id
    ) values (
      v_next_season.id,
      v_player.player_id,
      coalesce(v_next_seed_step.min_points, 0),
      coalesce(v_next_seed_step.rank_name, 'siervo'),
      coalesce(v_next_seed_step.rank_tier, 'III'),
      v_snapshot_id
    )
    on conflict (season_id, player_id) do update
    set
      seed_points = excluded.seed_points,
      seed_rank_name = excluded.seed_rank_name,
      seed_rank_tier = excluded.seed_rank_tier,
      source_snapshot_id = excluded.source_snapshot_id,
      updated_at = timezone('utc', now());

    v_processed := v_processed + 1;
  end loop;

  return query
  select
    v_season.id,
    v_next_season.id,
    v_processed,
    v_season.name,
    v_next_season.name,
    v_next_season.starts_at,
    v_next_season.ends_at;
end;
$$;
