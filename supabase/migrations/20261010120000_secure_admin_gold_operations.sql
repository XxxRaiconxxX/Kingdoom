-- Secure administrative gold adjustments and constrain the generic atomic helper.
create or replace function public.admin_set_player_gold(
  p_player_id uuid,
  p_new_gold integer
)
returns table (success boolean, message text, new_gold integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current integer;
begin
  if not public.is_current_user_admin() then
    return query select false, 'No tienes permisos de administrador.', null::integer;
    return;
  end if;

  if p_player_id is null or p_new_gold is null or p_new_gold < 0 then
    return query select false, 'El jugador y el oro deben ser validos.', null::integer;
    return;
  end if;

  select gold into v_current
  from public.players
  where id = p_player_id
  for update;

  if not found then
    return query select false, 'Jugador no encontrado.', null::integer;
    return;
  end if;

  update public.players set gold = p_new_gold where id = p_player_id;
  return query select true, 'Oro actualizado correctamente.', p_new_gold;
end;
$$;

revoke all on function public.admin_set_player_gold(uuid, integer) from public;
grant execute on function public.admin_set_player_gold(uuid, integer) to authenticated;

create or replace function public.increment_gold(
  p_player_id uuid,
  p_amount integer
)
returns table (success boolean, message text, new_gold integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gold integer;
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

  select gold into v_gold from public.players where id = p_player_id for update;
  if not found then
    return query select false, 'Jugador no encontrado.', null::integer;
    return;
  end if;

  v_next := v_gold::bigint + p_amount::bigint;
  if v_next < 0 or v_next > 2147483647 then
    return query select false, 'El oro resultante queda fuera de rango.', v_gold;
    return;
  end if;

  update public.players set gold = v_next::integer where id = p_player_id;
  return query select true,
    case when p_amount > 0 then 'Oro anadido correctamente.' else 'Oro descontado correctamente.' end,
    v_next::integer;
end;
$$;

revoke all on function public.increment_gold(uuid, integer) from public;
grant execute on function public.increment_gold(uuid, integer) to authenticated, service_role;

notify pgrst, 'reload schema';
