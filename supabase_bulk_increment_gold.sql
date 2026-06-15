-- Kingdoom Native
-- RPC de incremento masivo de oro.
-- Ejecutar en Supabase SQL Editor.

DROP FUNCTION IF EXISTS public.bulk_increment_gold(uuid[], integer);

create or replace function public.bulk_increment_gold(
  p_player_ids uuid[],
  p_amount integer
)
returns table (
  success boolean,
  message text,
  updated_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer := 0;
  v_is_admin boolean;
begin
  -- Validate permissions: Ensure caller is a verified admin/staff member
  select is_admin into v_is_admin
  from public.players
  where auth_user_id = auth.uid();

  if coalesce(v_is_admin, false) = false then
     return query select false, 'Acceso denegado. Se requieren permisos de administrador.', 0;
     return;
  end if;

  if p_amount <= 0 then
    return query select false, 'La cantidad debe ser mayor a 0.', 0;
    return;
  end if;

  update public.players
    set gold = gold + p_amount
  where id = any(p_player_ids);

  get diagnostics v_updated_count = row_count;

  return query
    select
      true,
      'Oro añadido correctamente a múltiples jugadores.',
      v_updated_count;
end;
$$;

revoke all on function public.bulk_increment_gold(uuid[], integer) from public;
grant execute on function public.bulk_increment_gold(uuid[], integer) to authenticated, service_role;
