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
  v_next bigint;
begin
  if p_player_id is null or p_amount is null or p_amount = 0
     or abs(p_amount::bigint) > 2147483647 then
    return query select false, 'La cantidad de oro no es valida.', null::integer;
    return;
  end if;

  if auth.role() <> 'service_role'
     and not public.is_current_user_admin()
     and not exists (
       select 1 from public.players p
       left join public.player_auth_links pal on pal.player_id = p.id
       where p.id = p_player_id
         and (p.auth_user_id = auth.uid() or pal.auth_user_id = auth.uid())
     ) then
    return query select false, 'No tienes permiso para modificar este jugador.', null::integer;
    return;
  end if;

  select *
    into v_player
  from public.players
  where id = p_player_id
  for update;

  if not found then
    return query select false, 'Jugador no encontrado.', 0;
    return;
  end if;

  v_next := v_player.gold::bigint + p_amount::bigint;
  if v_next < 0 then
    return query select false, 'Oro insuficiente.', v_player.gold;
    return;
  end if;
  if v_next > 2147483647 then
    return query select false, 'El oro resultante queda fuera de rango.', v_player.gold;
    return;
  end if;

  update public.players
    set gold = v_next::integer
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
grant execute on function public.increment_gold(uuid, integer) to authenticated, service_role;
