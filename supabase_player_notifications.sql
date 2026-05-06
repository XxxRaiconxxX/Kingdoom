create extension if not exists pgcrypto;

create table if not exists public.player_notifications (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  sender_player_id uuid references public.players(id) on delete set null,
  sender_name text not null,
  kind text not null check (kind in ('gold', 'item')),
  title text not null,
  message text not null,
  amount integer not null default 0,
  item_name text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.player_notifications enable row level security;

drop policy if exists "Allow player notification access" on public.player_notifications;
create policy "Allow player notification access"
  on public.player_notifications
  for all
  using (true)
  with check (true);

create index if not exists player_notifications_player_created_idx
  on public.player_notifications(player_id, created_at desc);

create index if not exists player_notifications_unread_idx
  on public.player_notifications(player_id, is_read, created_at desc);
