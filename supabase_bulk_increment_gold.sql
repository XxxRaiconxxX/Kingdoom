-- Kingdoom Native - Fase 2
-- RPC de incremento masivo de oro.
-- Ejecutar en Supabase SQL Editor.

create or replace function public.bulk_increment_gold(
  p_player_ids uuid[],
  p_amount integer
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.players
  set gold = greatest(0, gold + p_amount)
  where id = any(p_player_ids);
$$;

revoke all on function public.bulk_increment_gold(uuid[], integer) from public;
grant execute on function public.bulk_increment_gold(uuid[], integer) to anon, authenticated, service_role;
