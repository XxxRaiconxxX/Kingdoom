create table if not exists public.player_realm_exchange_states (
  player_id uuid primary key references public.players(id) on delete cascade,
  positions jsonb not null default '[]'::jsonb,
  predictions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_realm_exchange_states enable row level security;

drop policy if exists "Allow all realm exchange state access" on public.player_realm_exchange_states;

create policy "Allow all realm exchange state access"
on public.player_realm_exchange_states
for all
using (true)
with check (true);

create index if not exists player_realm_exchange_states_updated_at_idx
  on public.player_realm_exchange_states (updated_at desc);
