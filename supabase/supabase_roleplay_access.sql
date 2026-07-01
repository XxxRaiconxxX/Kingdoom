create extension if not exists pgcrypto;

create table if not exists public.player_roleplay_access (
  player_id uuid primary key references public.players(id) on delete cascade,
  last_roleplay_at timestamptz,
  grace_until timestamptz,
  locked_at timestamptz,
  lock_reason text,
  last_roleplay_group_jid text,
  last_human_roleplay_phone text,
  is_exempt boolean not null default false,
  exempt_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lock_reason is null or length(trim(lock_reason)) > 0),
  check (exempt_reason is null or length(trim(exempt_reason)) > 0)
);

create table if not exists public.roleplay_phone_activity (
  phone text primary key,
  last_roleplay_at timestamptz not null,
  last_roleplay_group_jid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(phone)) > 0)
);

create table if not exists public.player_roleplay_access_log (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  phone text,
  action text not null check (
    action in (
      'roleplay_detected',
      'auto_locked',
      'auto_unlocked',
      'manual_locked',
      'manual_unlocked',
      'manual_grace_extended',
      'manual_forced_activity',
      'exempt_synced'
    )
  ),
  details jsonb not null default '{}'::jsonb,
  performed_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists idx_player_roleplay_access_locked_at
  on public.player_roleplay_access (locked_at desc nulls last);

create index if not exists idx_player_roleplay_access_grace_until
  on public.player_roleplay_access (grace_until asc nulls last);

create index if not exists idx_player_roleplay_access_last_roleplay_at
  on public.player_roleplay_access (last_roleplay_at desc nulls last);

create index if not exists idx_player_roleplay_access_log_player
  on public.player_roleplay_access_log (player_id, created_at desc);

create index if not exists idx_player_roleplay_access_log_phone
  on public.player_roleplay_access_log (phone, created_at desc);

alter table public.player_roleplay_access enable row level security;
alter table public.roleplay_phone_activity enable row level security;
alter table public.player_roleplay_access_log enable row level security;

drop policy if exists "Allow public roleplay access read" on public.player_roleplay_access;
create policy "Allow public roleplay access read"
on public.player_roleplay_access
for select
to public
using (true);

drop policy if exists "Allow roleplay access write" on public.player_roleplay_access;
create policy "Allow roleplay access write"
on public.player_roleplay_access
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

drop policy if exists "Allow public roleplay phone read" on public.roleplay_phone_activity;
create policy "Allow public roleplay phone read"
on public.roleplay_phone_activity
for select
to public
using (true);

drop policy if exists "Allow roleplay phone write" on public.roleplay_phone_activity;
create policy "Allow roleplay phone write"
on public.roleplay_phone_activity
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

drop policy if exists "Allow public roleplay access log read" on public.player_roleplay_access_log;
create policy "Allow public roleplay access log read"
on public.player_roleplay_access_log
for select
to public
using (true);

drop policy if exists "Allow roleplay access log write" on public.player_roleplay_access_log;
create policy "Allow roleplay access log write"
on public.player_roleplay_access_log
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

create or replace function public.set_player_roleplay_access_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_roleplay_phone_activity_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_player_roleplay_access_updated_at on public.player_roleplay_access;
create trigger set_player_roleplay_access_updated_at
before update on public.player_roleplay_access
for each row
execute function public.set_player_roleplay_access_updated_at();

drop trigger if exists set_roleplay_phone_activity_updated_at on public.roleplay_phone_activity;
create trigger set_roleplay_phone_activity_updated_at
before update on public.roleplay_phone_activity
for each row
execute function public.set_roleplay_phone_activity_updated_at();

insert into public.player_roleplay_access (
  player_id,
  grace_until,
  is_exempt,
  exempt_reason
)
select
  p.id,
  timezone('utc', now()) + interval '3 days',
  coalesce(p.is_admin, false),
  case when coalesce(p.is_admin, false) then 'player_is_admin' else null end
from public.players p
where not exists (
  select 1
  from public.player_roleplay_access access
  where access.player_id = p.id
);
