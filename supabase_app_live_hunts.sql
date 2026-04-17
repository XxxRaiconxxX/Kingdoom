create table if not exists public.app_live_hunts (
  id uuid primary key default gen_random_uuid(),
  template_id text not null,
  title text not null,
  description text not null default '',
  enemy_name text not null,
  host_player_id text not null,
  host_username text not null,
  host_sheet_id uuid not null,
  host_sheet_name text not null,
  status text not null default 'lobby',
  current_round integer not null default 1,
  max_rounds integer not null default 6,
  enemy_hp integer not null,
  enemy_max_hp integer not null,
  threat integer not null default 20,
  threat_cap integer not null default 100,
  reward_pool integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_live_hunt_members (
  id uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references public.app_live_hunts(id) on delete cascade,
  player_id text not null,
  username text not null,
  sheet_id uuid not null,
  sheet_name text not null,
  sheet_level integer not null default 1,
  sheet_power integer not null default 12,
  joined_at timestamptz not null default now(),
  unique (hunt_id, player_id)
);

create table if not exists public.app_live_hunt_actions (
  id uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references public.app_live_hunts(id) on delete cascade,
  round_number integer not null,
  player_id text not null,
  player_username text not null,
  sheet_id uuid not null,
  sheet_name text not null,
  action_type text not null,
  created_at timestamptz not null default now(),
  unique (hunt_id, round_number, player_id)
);

create table if not exists public.app_live_hunt_rounds (
  id uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references public.app_live_hunts(id) on delete cascade,
  round_number integer not null,
  summary text not null,
  enemy_damage integer not null default 0,
  threat_delta integer not null default 0,
  reward_delta integer not null default 0,
  created_at timestamptz not null default now(),
  unique (hunt_id, round_number)
);

alter table public.app_live_hunts enable row level security;
alter table public.app_live_hunt_members enable row level security;
alter table public.app_live_hunt_actions enable row level security;
alter table public.app_live_hunt_rounds enable row level security;

drop policy if exists "Live hunts public access" on public.app_live_hunts;
create policy "Live hunts public access"
on public.app_live_hunts
for all
to public
using (true)
with check (true);

drop policy if exists "Live hunt members public access" on public.app_live_hunt_members;
create policy "Live hunt members public access"
on public.app_live_hunt_members
for all
to public
using (true)
with check (true);

drop policy if exists "Live hunt actions public access" on public.app_live_hunt_actions;
create policy "Live hunt actions public access"
on public.app_live_hunt_actions
for all
to public
using (true)
with check (true);

drop policy if exists "Live hunt rounds public access" on public.app_live_hunt_rounds;
create policy "Live hunt rounds public access"
on public.app_live_hunt_rounds
for all
to public
using (true)
with check (true);
