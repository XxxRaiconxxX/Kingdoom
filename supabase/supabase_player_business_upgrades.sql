-- ============================================================================
-- RPC: upgrade_player_business
-- Permite aplicar mejoras de producción o capacidad a negocios descontando oro
-- de forma atómica en Supabase.
-- ============================================================================

create or replace function public.upgrade_player_business(
  p_business_id uuid,
  p_player_id uuid,
  p_upgrade_type text, -- 'production' o 'storage'
  p_new_value integer,
  p_cost_gold integer
)
returns table (
  success boolean,
  message text,
  new_gold integer,
  new_level integer,
  new_value integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_player public.players%rowtype;
  v_next_gold integer;
  v_next_level integer;
begin
  select *
  into v_business
  from public.businesses
  where id = p_business_id
    and player_id = p_player_id
  limit 1;

  if v_business.id is null then
    return query select false, 'El negocio no existe o no pertenece a este jugador.', 0, 0, 0;
    return;
  end if;

  if v_business.status <> 'active' then
    return query select false, 'El negocio no se encuentra activo actualmente.', 0, 0, 0;
    return;
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
  limit 1;

  if v_player.id is null then
    return query select false, 'Jugador no encontrado.', 0, 0, 0;
    return;
  end if;

  if coalesce(v_player.gold, 0) < p_cost_gold then
    return query select false, 'No posees suficiente oro en tu bolsa para financiar este contrato real.', coalesce(v_player.gold, 0), coalesce(v_business.level, 1), 0;
    return;
  end if;

  v_next_gold := coalesce(v_player.gold, 0) - p_cost_gold;
  v_next_level := coalesce(v_business.level, 1) + 1;

  update public.players
  set gold = v_next_gold
  where id = v_player.id;

  if p_upgrade_type = 'production' then
    update public.businesses
    set gold_per_hour = p_new_value,
        level = v_next_level,
        updated_at = now()
    where id = v_business.id;
  elsif p_upgrade_type = 'storage' then
    update public.businesses
    set max_storage = p_new_value,
        level = v_next_level,
        updated_at = now()
    where id = v_business.id;
  else
    return query select false, 'Tipo de mejora no válido.', coalesce(v_player.gold, 0), coalesce(v_business.level, 1), 0;
    return;
  end if;

  return query select true, 'Ampliación certificada por la Real Cancillería.', v_next_gold, v_next_level, p_new_value;
end;
$$;

revoke all on function public.upgrade_player_business(uuid, uuid, text, integer, integer) from public;
grant execute on function public.upgrade_player_business(uuid, uuid, text, integer, integer) to anon, authenticated;
