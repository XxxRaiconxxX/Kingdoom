create table if not exists public.player_auth_links (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  auth_user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (player_id, auth_user_id)
);

create index if not exists idx_player_auth_links_player_id
  on public.player_auth_links(player_id);

create index if not exists idx_player_auth_links_auth_user_id
  on public.player_auth_links(auth_user_id);

insert into public.player_auth_links (player_id, auth_user_id)
select id, auth_user_id::uuid
from public.players
where auth_user_id is not null
  and auth_user_id::text <> ''
on conflict (player_id, auth_user_id) do nothing;

alter table public.player_auth_links enable row level security;

drop policy if exists "Users can read own auth links" on public.player_auth_links;
create policy "Users can read own auth links"
on public.player_auth_links
for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "Users can create own auth links" on public.player_auth_links;
create policy "Users can create own auth links"
on public.player_auth_links
for insert
to authenticated
with check (auth_user_id = auth.uid());

grant select, insert on public.player_auth_links to authenticated;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.player_auth_links links
    inner join public.players players on players.id = links.player_id
    where links.auth_user_id = auth.uid()
      and players.is_admin = true
  )
  or exists (
    select 1
    from public.players
    where auth_user_id::text = auth.uid()::text
      and is_admin = true
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;
