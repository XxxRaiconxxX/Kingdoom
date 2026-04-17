create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to public
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings
for all
to authenticated
using (exists (
  select 1
  from public.players
  where players.auth_user_id = auth.uid()
    and coalesce(players.is_admin, false) = true
))
with check (exists (
  select 1
  from public.players
  where players.auth_user_id = auth.uid()
    and coalesce(players.is_admin, false) = true
));

insert into public.site_settings (key, value)
values ('community_app_download_url', '')
on conflict (key) do nothing;
