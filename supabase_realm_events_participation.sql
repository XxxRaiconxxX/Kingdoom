create extension if not exists pgcrypto;

alter table public.realm_events
  add column if not exists participation_reward_gold integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'realm_events_participation_reward_gold_check'
      and conrelid = 'public.realm_events'::regclass
  ) then
    alter table public.realm_events
      add constraint realm_events_participation_reward_gold_check
      check (participation_reward_gold >= 0);
  end if;
end $$;

create table if not exists public.realm_event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.realm_events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'joined' check (status in ('joined', 'rewarded')),
  reward_delivered boolean not null default false,
  reward_delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, player_id)
);

alter table public.realm_event_participants
  add column if not exists reward_delivered boolean not null default false,
  add column if not exists reward_delivered_at timestamptz;

alter table public.realm_event_participants enable row level security;

drop policy if exists "Allow public event participants read" on public.realm_event_participants;
create policy "Allow public event participants read"
on public.realm_event_participants
for select
using (true);

drop policy if exists "Allow event participants write" on public.realm_event_participants;
create policy "Allow event participants write"
on public.realm_event_participants
for all
using (true)
with check (true);

create or replace function public.set_realm_event_participants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_realm_event_participants_updated_at on public.realm_event_participants;
create trigger set_realm_event_participants_updated_at
before update on public.realm_event_participants
for each row
execute function public.set_realm_event_participants_updated_at();

create index if not exists idx_realm_event_participants_event
  on public.realm_event_participants (event_id, created_at asc);

create index if not exists idx_realm_event_participants_player
  on public.realm_event_participants (player_id, created_at desc);
