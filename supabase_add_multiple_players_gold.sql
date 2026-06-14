-- Kingdoom Native - Fase 2
-- RPC para incrementar/decrementar oro a multiples jugadores al mismo tiempo para evitar N+1 queries.
-- Ejecutar en Supabase SQL Editor.

create or replace function public.add_multiple_players_gold(
  p_player_ids uuid[],
  p_amount integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    -- Solo soportamos incrementos de oro a traves de este endpoint.
    return false;
  end if;

  update public.players
    set gold = gold + p_amount
  where id = any(p_player_ids);

  return true;
end;
$$;

revoke all on function public.add_multiple_players_gold(uuid[], integer) from public;
grant execute on function public.add_multiple_players_gold(uuid[], integer) to anon, authenticated, service_role;
