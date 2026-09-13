-- Cierra escritura directa de saldos e inventario desde Data API.
drop policy if exists "Allow all" on public.players;
drop policy if exists "Allow all inventory access" on public.player_inventory;
revoke insert, update, delete on public.players from anon, authenticated;
revoke insert, update, delete on public.player_inventory from anon, authenticated;
create policy "Players can read public profile" on public.players for select to anon, authenticated using (true);
create policy "Players can read own inventory" on public.player_inventory for select to authenticated using (
  exists (select 1 from public.players p left join public.player_auth_links pal on pal.player_id = p.id
    where p.id = player_inventory.player_id and (p.auth_user_id = (select auth.uid()) or pal.auth_user_id = (select auth.uid())))
);
drop policy if exists "Users can create own auth links" on public.player_auth_links;
revoke insert, update, delete on public.player_auth_links from anon, authenticated;
