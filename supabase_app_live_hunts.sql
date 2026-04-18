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

create table if not exists public.app_live_hunt_results (
  id uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references public.app_live_hunts(id) on delete cascade,
  player_id text not null,
  username text not null,
  sheet_id uuid not null,
  sheet_name text not null,
  outcome text not null,
  gold_reward integer not null default 0,
  participation_score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (hunt_id, player_id)
);

alter table public.app_live_hunts enable row level security;
alter table public.app_live_hunt_members enable row level security;
alter table public.app_live_hunt_actions enable row level security;
alter table public.app_live_hunt_rounds enable row level security;
alter table public.app_live_hunt_results enable row level security;

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

drop policy if exists "Live hunt results public access" on public.app_live_hunt_results;
create policy "Live hunt results public access"
on public.app_live_hunt_results
for all
to public
using (true)
with check (true);

create or replace function public.settle_app_live_hunt(
  p_hunt_id uuid,
  p_round_number integer,
  p_summary text,
  p_enemy_damage integer,
  p_threat_delta integer,
  p_reward_delta integer,
  p_next_status text,
  p_next_round integer,
  p_next_enemy_hp integer,
  p_next_threat integer,
  p_next_reward_pool integer,
  p_rewards jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  reward_entry jsonb;
  inserted_result_id uuid;
begin
  insert into public.app_live_hunt_rounds (
    hunt_id,
    round_number,
    summary,
    enemy_damage,
    threat_delta,
    reward_delta
  )
  values (
    p_hunt_id,
    p_round_number,
    p_summary,
    p_enemy_damage,
    p_threat_delta,
    p_reward_delta
  )
  on conflict (hunt_id, round_number) do nothing;

  update public.app_live_hunts
  set
    status = p_next_status,
    current_round = p_next_round,
    enemy_hp = p_next_enemy_hp,
    threat = p_next_threat,
    reward_pool = p_next_reward_pool,
    updated_at = now()
  where id = p_hunt_id;

  if p_next_status in ('victory', 'defeat') then
    for reward_entry in
      select value from jsonb_array_elements(coalesce(p_rewards, '[]'::jsonb))
    loop
      inserted_result_id := null;

      insert into public.app_live_hunt_results (
        hunt_id,
        player_id,
        username,
        sheet_id,
        sheet_name,
        outcome,
        gold_reward,
        participation_score
      )
      values (
        p_hunt_id,
        reward_entry->>'player_id',
        reward_entry->>'username',
        (reward_entry->>'sheet_id')::uuid,
        reward_entry->>'sheet_name',
        p_next_status,
        greatest(0, coalesce((reward_entry->>'gold_reward')::integer, 0)),
        greatest(0, coalesce((reward_entry->>'participation_score')::integer, 0))
      )
      on conflict (hunt_id, player_id) do nothing
      returning id into inserted_result_id;

      if inserted_result_id is not null then
        update public.players
        set gold = greatest(0, gold + greatest(0, coalesce((reward_entry->>'gold_reward')::integer, 0)))
        where id = reward_entry->>'player_id';
      end if;
    end loop;
  end if;

  return true;
end;
$$;

grant execute on function public.settle_app_live_hunt(
  uuid,
  integer,
  text,
  integer,
  integer,
  integer,
  text,
  integer,
  integer,
  integer,
  integer,
  jsonb
) to anon, authenticated;
