-- The public roleplay view must honor the base table RLS policy.
drop policy if exists "Public can read roleplay access" on public.player_roleplay_access;
create policy "Public can read roleplay access"
on public.player_roleplay_access
for select
to anon, authenticated
using (true);

create or replace view public.player_roleplay_access_public
with (security_invoker = true)
as
select
  player_id,
  last_roleplay_at,
  grace_until,
  locked_at,
  lock_reason,
  is_exempt,
  exempt_reason,
  created_at,
  updated_at
from public.player_roleplay_access;

grant select on public.player_roleplay_access_public to anon, authenticated;
