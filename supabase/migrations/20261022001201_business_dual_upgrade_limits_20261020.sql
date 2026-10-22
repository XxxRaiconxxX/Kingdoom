-- Atomic business upgrades for bot negotiations.
-- Limits are enforced here; the bot/AI only proposes values.

create or replace function public.upgrade_player_business_dual(
  p_business_id uuid,
  p_player_id uuid,
  p_production_value integer,
  p_storage_value integer,
  p_cost_gold integer
)
returns table (
  success boolean,
  message text,
  new_gold integer,
  new_level integer,
  new_production integer,
  new_storage integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_player public.players%rowtype;
  v_next_level integer;
  v_min_production integer;
  v_max_production integer;
  v_min_storage integer;
  v_max_storage integer;
  v_next_gold integer;
begin
  if p_business_id is null or p_player_id is null
     or p_production_value is null or p_storage_value is null
     or p_cost_gold is null or p_cost_gold < 0 then
    return query select false, 'Parametros de ampliacion invalidos.', 0, 0, 0, 0;
    return;
  end if;

  select * into v_business
  from public.businesses
  where id = p_business_id and player_id = p_player_id
  for update;

  if v_business.id is null then
    return query select false, 'El negocio no existe o no pertenece a este jugador.', 0, 0, 0, 0;
    return;
  end if;
  if v_business.status <> 'active' then
    return query select false, 'El negocio no se encuentra activo actualmente.', 0, 0, 0, 0;
    return;
  end if;

  select * into v_player from public.players where id = p_player_id for update;
  if v_player.id is null then
    return query select false, 'Jugador no encontrado.', 0, 0, 0, 0;
    return;
  end if;

  -- Broad but bounded autonomous ceiling: 100x current value, capped at PostgreSQL integer.
  v_min_production := greatest(1, coalesce(v_business.gold_per_hour, 0));
  v_max_production := least(2147483647, greatest(v_min_production::bigint, v_min_production::bigint * 100));
  v_min_storage := greatest(1, coalesce(v_business.max_storage, 0));
  v_max_storage := least(2147483647, greatest(v_min_storage::bigint, v_min_storage::bigint * 100));

  if p_production_value < v_min_production or p_production_value > v_max_production
     or p_storage_value < v_min_storage or p_storage_value > v_max_storage then
    return query select false, format('La ampliacion excede el limite automatico permitido: produccion %s-%s, almacen %s-%s.', v_min_production, v_max_production, v_min_storage, v_max_storage), coalesce(v_player.gold, 0), coalesce(v_business.level, 1), coalesce(v_business.gold_per_hour, 0), coalesce(v_business.max_storage, 0);
    return;
  end if;
  if coalesce(v_player.gold, 0) < p_cost_gold then
    return query select false, 'No posees suficiente oro para financiar este contrato real.', coalesce(v_player.gold, 0), coalesce(v_business.level, 1), coalesce(v_business.gold_per_hour, 0), coalesce(v_business.max_storage, 0);
    return;
  end if;

  v_next_level := coalesce(v_business.level, 1) + 1;
  v_next_gold := coalesce(v_player.gold, 0) - p_cost_gold;

  update public.players set gold = v_next_gold where id = p_player_id;
  update public.businesses
  set gold_per_hour = p_production_value,
      max_storage = p_storage_value,
      level = v_next_level,
      updated_at = now()
  where id = p_business_id;

  return query select true, 'Ampliacion combinada certificada por la Real Cancilleria.', v_next_gold, v_next_level, p_production_value, p_storage_value;
end;
$$;

revoke all on function public.upgrade_player_business_dual(uuid, uuid, integer, integer, integer) from public;
revoke all on function public.upgrade_player_business_dual(uuid, uuid, integer, integer, integer) from anon;
revoke all on function public.upgrade_player_business_dual(uuid, uuid, integer, integer, integer) from authenticated;
grant execute on function public.upgrade_player_business_dual(uuid, uuid, integer, integer, integer) to service_role;

-- Keep the single-attribute RPC bounded too; it remains available to staff/admin flows.
create or replace function public.upgrade_player_business(
  p_business_id uuid,
  p_player_id uuid,
  p_upgrade_type text,
  p_new_value integer,
  p_cost_gold integer
)
returns table (success boolean, message text, new_gold integer, new_level integer, new_value integer)
language plpgsql security definer set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_player public.players%rowtype;
  v_current integer;
  v_max integer;
  v_next integer;
begin
  if p_upgrade_type not in ('production', 'storage') or p_new_value is null or p_new_value < 1 or p_cost_gold is null or p_cost_gold < 0 then
    return query select false, 'Parametros de mejora invalidos.', 0, 0, 0; return;
  end if;
  select * into v_business from public.businesses where id = p_business_id and player_id = p_player_id for update;
  if v_business.id is null or v_business.status <> 'active' then return query select false, 'El negocio no existe o no esta activo.', 0, 0, 0; return; end if;
  select * into v_player from public.players where id = p_player_id for update;
  v_current := case when p_upgrade_type = 'production' then greatest(1, v_business.gold_per_hour) else greatest(1, v_business.max_storage) end;
  v_max := least(2147483647, greatest(v_current::bigint, v_current::bigint * 100));
  if p_new_value < v_current or p_new_value > v_max then return query select false, format('La mejora excede el limite automatico permitido: %s-%s.', v_current, v_max), coalesce(v_player.gold,0), coalesce(v_business.level,1), v_current; return; end if;
  if coalesce(v_player.gold,0) < p_cost_gold then return query select false, 'No posees suficiente oro para financiar este contrato real.', v_player.gold, v_business.level, v_current; return; end if;
  v_next := v_business.level + 1;
  update public.players set gold = v_player.gold - p_cost_gold where id = p_player_id;
  if p_upgrade_type = 'production' then update public.businesses set gold_per_hour=p_new_value, level=v_next, updated_at=now() where id=p_business_id;
  else update public.businesses set max_storage=p_new_value, level=v_next, updated_at=now() where id=p_business_id; end if;
  return query select true, 'Ampliacion certificada por la Real Cancilleria.', v_player.gold-p_cost_gold, v_next, p_new_value;
end;
$$;

revoke all on function public.upgrade_player_business(uuid, uuid, text, integer, integer) from public;
revoke all on function public.upgrade_player_business(uuid, uuid, text, integer, integer) from anon;
revoke all on function public.upgrade_player_business(uuid, uuid, text, integer, integer) from authenticated;
grant execute on function public.upgrade_player_business(uuid, uuid, text, integer, integer) to service_role;

notify pgrst, 'reload schema';
