-- Kingdoom Native - Fase 2
-- RPC de incremento/decremento atomico de oro.
-- Ejecutar en Supabase SQL Editor.

create or replace function public.increment_gold(
  p_player_id uuid,
  p_amount integer
)
returns table (
  success boolean,
  message text,
  new_gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
begin
  select *
    into v_player
  from public.players
  where id = p_player_id
  for update;

  if not found then
    return query select false, 'Jugador no encontrado.', 0;
    return;
  end if;

  if p_amount < 0 and v_player.gold < abs(p_amount) then
    return query select false, 'Oro insuficiente.', v_player.gold;
    return;
  end if;

  update public.players
    set gold = gold + p_amount
  where id = p_player_id
  returning gold into v_player.gold;

  return query
    select
      true,
      case when p_amount >= 0 then 'Oro anadido correctamente.' else 'Oro descontado correctamente.' end,
      v_player.gold;
end;
$$;

revoke all on function public.increment_gold(uuid, integer) from public;
grant execute on function public.increment_gold(uuid, integer) to anon, authenticated, service_role;
