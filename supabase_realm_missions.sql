create extension if not exists pgcrypto;

create table if not exists public.realm_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  instructions text not null default '',
  reward_gold integer not null default 0 check (reward_gold >= 0),
  max_participants integer not null default 1 check (max_participants >= 1),
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard', 'elite')),
  type text not null default 'story' check (type in ('story', 'hunt', 'escort', 'investigation', 'event')),
  status text not null default 'available' check (status in ('available', 'in-progress', 'closed')),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.realm_mission_claims (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.realm_missions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'claimed' check (status in ('claimed', 'completed', 'rewarded')),
  proof_text text not null default '',
  proof_link text not null default '',
  proof_image_url text not null default '',
  submitted_at timestamptz,
  reward_delivered boolean not null default false,
  reward_delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, player_id)
);

alter table public.realm_missions
  add column if not exists max_participants integer not null default 1;

alter table public.realm_mission_claims
  add column if not exists proof_text text not null default '',
  add column if not exists proof_link text not null default '',
  add column if not exists proof_image_url text not null default '',
  add column if not exists submitted_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'realm_missions_max_participants_check'
      and conrelid = 'public.realm_missions'::regclass
  ) then
    alter table public.realm_missions
      add constraint realm_missions_max_participants_check check (max_participants >= 1);
  end if;
end $$;

alter table public.realm_missions enable row level security;
alter table public.realm_mission_claims enable row level security;

drop policy if exists "Allow public realm missions read" on public.realm_missions;
create policy "Allow public realm missions read"
on public.realm_missions
for select
using (true);

drop policy if exists "Allow realm missions write" on public.realm_missions;
create policy "Allow realm missions write"
on public.realm_missions
for all
using (true)
with check (true);

drop policy if exists "Allow public mission claims read" on public.realm_mission_claims;
create policy "Allow public mission claims read"
on public.realm_mission_claims
for select
using (true);

drop policy if exists "Allow mission claims write" on public.realm_mission_claims;
create policy "Allow mission claims write"
on public.realm_mission_claims
for all
using (true)
with check (true);

create or replace function public.set_realm_missions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_realm_missions_updated_at on public.realm_missions;
create trigger set_realm_missions_updated_at
before update on public.realm_missions
for each row
execute function public.set_realm_missions_updated_at();

create or replace function public.set_realm_mission_claims_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_realm_mission_claims_updated_at on public.realm_mission_claims;
create trigger set_realm_mission_claims_updated_at
before update on public.realm_mission_claims
for each row
execute function public.set_realm_mission_claims_updated_at();

create index if not exists idx_realm_mission_claims_mission_status
  on public.realm_mission_claims (mission_id, status, reward_delivered);

create index if not exists idx_realm_mission_claims_player
  on public.realm_mission_claims (player_id, created_at desc);
