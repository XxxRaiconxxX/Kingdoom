create extension if not exists pgcrypto;

create table if not exists public.realm_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  instructions text not null default '',
  reward_gold integer not null default 0 check (reward_gold >= 0),
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard', 'elite')),
  type text not null default 'story' check (type in ('story', 'hunt', 'escort', 'investigation', 'event')),
  status text not null default 'available' check (status in ('available', 'in-progress', 'closed')),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.realm_missions enable row level security;

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
