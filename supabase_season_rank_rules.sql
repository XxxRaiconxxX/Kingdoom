create extension if not exists pgcrypto;

create table if not exists public.season_rank_point_rules (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('mission', 'event')),
  rule_key text not null,
  mission_difficulty text check (mission_difficulty in ('easy', 'medium', 'hard', 'elite')),
  base_points integer not null default 0 check (base_points >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, rule_key)
);

create table if not exists public.season_rank_thresholds (
  id uuid primary key default gen_random_uuid(),
  rank_name text not null check (rank_name in ('siervo', 'escudero', 'caballero', 'senor', 'senor-oscuro')),
  rank_tier text not null check (rank_tier in ('I', 'II', 'III')),
  min_points integer not null default 0 check (min_points >= 0),
  is_active boolean not null default true,
  sort_order integer not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rank_name, rank_tier)
);

alter table public.season_rank_point_rules enable row level security;
alter table public.season_rank_thresholds enable row level security;

drop policy if exists "Allow public season rank point rules read" on public.season_rank_point_rules;
create policy "Allow public season rank point rules read"
on public.season_rank_point_rules
for select
using (true);

drop policy if exists "Allow season rank point rules write" on public.season_rank_point_rules;
create policy "Allow season rank point rules write"
on public.season_rank_point_rules
for all
using (true)
with check (true);

drop policy if exists "Allow public season rank thresholds read" on public.season_rank_thresholds;
create policy "Allow public season rank thresholds read"
on public.season_rank_thresholds
for select
using (true);

drop policy if exists "Allow season rank thresholds write" on public.season_rank_thresholds;
create policy "Allow season rank thresholds write"
on public.season_rank_thresholds
for all
using (true)
with check (true);

create or replace function public.set_season_rank_point_rules_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_season_rank_thresholds_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_season_rank_point_rules_updated_at on public.season_rank_point_rules;
create trigger set_season_rank_point_rules_updated_at
before update on public.season_rank_point_rules
for each row
execute function public.set_season_rank_point_rules_updated_at();

drop trigger if exists set_season_rank_thresholds_updated_at on public.season_rank_thresholds;
create trigger set_season_rank_thresholds_updated_at
before update on public.season_rank_thresholds
for each row
execute function public.set_season_rank_thresholds_updated_at();

insert into public.season_rank_point_rules (
  scope,
  rule_key,
  mission_difficulty,
  base_points,
  sort_order,
  notes
)
values
  ('mission', 'mission_easy', 'easy', 12, 10, 'Puntaje base para misiones faciles en temporada de 10 semanas.'),
  ('mission', 'mission_medium', 'medium', 28, 20, 'Puntaje base para misiones medias en temporada de 10 semanas.'),
  ('mission', 'mission_hard', 'hard', 55, 30, 'Puntaje base para misiones hard en temporada de 10 semanas.'),
  ('mission', 'mission_elite', 'elite', 95, 40, 'Puntaje base para misiones elite en temporada de 10 semanas.'),
  ('event', 'rewarded_participation', null, 50, 100, 'Puntaje plano por evento recompensado y validado por staff.')
on conflict (scope, rule_key) do update
set
  mission_difficulty = excluded.mission_difficulty,
  base_points = excluded.base_points,
  sort_order = excluded.sort_order,
  notes = excluded.notes,
  is_active = true;

insert into public.season_rank_thresholds (
  rank_name,
  rank_tier,
  min_points,
  sort_order,
  notes
)
values
  ('siervo', 'III', 0, 10, 'Piso absoluto de temporada.'),
  ('siervo', 'II', 40, 20, 'Primer salto de progreso para jugadores nuevos o con poco tiempo.'),
  ('siervo', 'I', 90, 30, 'Cierre del rango Siervo.'),
  ('escudero', 'III', 160, 40, 'Inicio de progreso consistente.'),
  ('escudero', 'II', 240, 50, 'Escalon intermedio de Escudero.'),
  ('escudero', 'I', 340, 60, 'Cierre del rango Escudero.'),
  ('caballero', 'III', 470, 70, 'Inicio de rango competitivo medio.'),
  ('caballero', 'II', 620, 80, 'Escalon medio de Caballero.'),
  ('caballero', 'I', 790, 90, 'Cierre del rango Caballero.'),
  ('senor', 'III', 980, 100, 'Entrada al rango alto.'),
  ('senor', 'II', 1200, 110, 'Escalon medio de Senor.'),
  ('senor', 'I', 1450, 120, 'Cierre del rango Senor.'),
  ('senor-oscuro', 'III', 1730, 130, 'Entrada a la cima competitiva.'),
  ('senor-oscuro', 'II', 2050, 140, 'Escalon medio de Senor Oscuro.'),
  ('senor-oscuro', 'I', 2400, 150, 'Techo maximo de la temporada de 10 semanas.')
on conflict (rank_name, rank_tier) do update
set
  min_points = excluded.min_points,
  sort_order = excluded.sort_order,
  notes = excluded.notes,
  is_active = true;
