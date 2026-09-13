-- Public login lookup exposes only non-sensitive profile fields.
create or replace view public.player_profiles_public
with (security_invoker = true)
as
select id, username, avatar_gif_url, max_character_sheets
from public.players;

grant select on public.player_profiles_public to anon, authenticated;

revoke select on public.players from anon;
grant select (id, username, avatar_gif_url, max_character_sheets)
on public.players to anon;
