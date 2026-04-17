create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.players
    where auth_user_id = (select auth.uid())
      and is_admin = true
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

alter table public.market_items enable row level security;
alter table public.realm_events enable row level security;
alter table public.weekly_activity_rankings enable row level security;

drop policy if exists "Public can read market items" on public.market_items;
create policy "Public can read market items"
on public.market_items
for select
to public
using (true);

drop policy if exists "Admins can write market items" on public.market_items;
create policy "Admins can write market items"
on public.market_items
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

drop policy if exists "Public can read realm events" on public.realm_events;
create policy "Public can read realm events"
on public.realm_events
for select
to public
using (true);

drop policy if exists "Admins can write realm events" on public.realm_events;
create policy "Admins can write realm events"
on public.realm_events
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

drop policy if exists "Public can read weekly ranking" on public.weekly_activity_rankings;
create policy "Public can read weekly ranking"
on public.weekly_activity_rankings
for select
to public
using (true);

drop policy if exists "Admins can write weekly ranking" on public.weekly_activity_rankings;
create policy "Admins can write weekly ranking"
on public.weekly_activity_rankings
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

drop policy if exists "Admins can read all market orders" on public.market_orders;
create policy "Admins can read all market orders"
on public.market_orders
for select
to authenticated
using ((select public.is_current_user_admin()));
