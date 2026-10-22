-- Idempotency and audit trail for autonomous/negotiated business upgrades.
create table if not exists public.business_upgrade_audit (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  business_id uuid not null,
  player_id uuid not null,
  source text not null default 'bot_negotiation',
  upgrade_type text not null,
  production_before integer not null,
  production_after integer not null,
  storage_before integer not null,
  storage_after integer not null,
  cost_gold integer not null,
  gold_before integer not null,
  gold_after integer not null,
  level_before integer not null,
  level_after integer not null,
  created_at timestamptz not null default now()
);

create or replace function public.upgrade_player_business_dual(
  p_business_id uuid,
  p_player_id uuid,
  p_production_value integer,
  p_storage_value integer,
  p_cost_gold integer,
  p_idempotency_key text,
  p_source text default 'bot_negotiation'
)
returns table (success boolean, message text, new_gold integer, new_level integer, new_production integer, new_storage integer)
language plpgsql security definer set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_player public.players%rowtype;
  v_previous public.business_upgrade_audit%rowtype;
  v_next_level integer;
  v_min_production integer;
  v_max_production bigint;
  v_min_storage integer;
  v_max_storage bigint;
  v_next_gold integer;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 12 or length(p_idempotency_key) > 160 then
    return query select false, 'Clave de idempotencia invalida.', 0, 0, 0, 0; return;
  end if;

  select * into v_previous from public.business_upgrade_audit where idempotency_key = p_idempotency_key;
  if v_previous.id is not null then
    return query select true, 'Ampliacion ya aplicada; reintento idempotente.', v_previous.gold_after, v_previous.level_after, v_previous.production_after, v_previous.storage_after;
    return;
  end if;

  if p_business_id is null or p_player_id is null or p_production_value is null or p_storage_value is null or p_cost_gold is null or p_cost_gold < 0 then
    return query select false, 'Parametros de ampliacion invalidos.', 0, 0, 0, 0; return;
  end if;

  select * into v_business from public.businesses where id = p_business_id and player_id = p_player_id for update;
  if v_business.id is null or v_business.status <> 'active' then
    return query select false, 'El negocio no existe o no esta activo.', 0, 0, 0, 0; return;
  end if;
  select * into v_player from public.players where id = p_player_id for update;
  if v_player.id is null then return query select false, 'Jugador no encontrado.', 0, 0, 0, 0; return; end if;

  v_min_production := greatest(1, coalesce(v_business.gold_per_hour, 0));
  v_max_production := least(2147483647::bigint, greatest(v_min_production::bigint, v_min_production::bigint * 100));
  v_min_storage := greatest(1, coalesce(v_business.max_storage, 0));
  v_max_storage := least(2147483647::bigint, greatest(v_min_storage::bigint, v_min_storage::bigint * 100));
  if p_production_value < v_min_production or p_production_value::bigint > v_max_production or p_storage_value < v_min_storage or p_storage_value::bigint > v_max_storage then
    return query select false, format('La ampliacion excede el limite automatico permitido: produccion %s-%s, almacen %s-%s.', v_min_production, v_max_production, v_min_storage, v_max_storage), coalesce(v_player.gold, 0), coalesce(v_business.level, 1), coalesce(v_business.gold_per_hour, 0), coalesce(v_business.max_storage, 0); return;
  end if;
  if coalesce(v_player.gold, 0) < p_cost_gold then
    return query select false, 'No posees suficiente oro para financiar este contrato real.', v_player.gold, v_business.level, v_business.gold_per_hour, v_business.max_storage; return;
  end if;

  v_next_level := coalesce(v_business.level, 1) + 1;
  v_next_gold := coalesce(v_player.gold, 0) - p_cost_gold;
  update public.players set gold = v_next_gold where id = p_player_id;
  update public.businesses set gold_per_hour = p_production_value, max_storage = p_storage_value, level = v_next_level, updated_at = now() where id = p_business_id;
  insert into public.business_upgrade_audit (idempotency_key,business_id,player_id,source,upgrade_type,production_before,production_after,storage_before,storage_after,cost_gold,gold_before,gold_after,level_before,level_after)
  values (p_idempotency_key,p_business_id,p_player_id,coalesce(nullif(trim(p_source),''),'bot_negotiation'),'dual',coalesce(v_business.gold_per_hour,0),p_production_value,coalesce(v_business.max_storage,0),p_storage_value,p_cost_gold,coalesce(v_player.gold,0),v_next_gold,coalesce(v_business.level,1),v_next_level);
  return query select true, 'Ampliacion combinada certificada por la Real Cancilleria.', v_next_gold, v_next_level, p_production_value, p_storage_value;
end;
$$;

revoke all on table public.business_upgrade_audit from public, anon, authenticated;
grant select, insert on table public.business_upgrade_audit to service_role;
revoke all on function public.upgrade_player_business_dual(uuid,uuid,integer,integer,integer) from public, anon, authenticated;
revoke all on function public.upgrade_player_business_dual(uuid,uuid,integer,integer,integer,text,text) from public, anon, authenticated;
grant execute on function public.upgrade_player_business_dual(uuid,uuid,integer,integer,integer,text,text) to service_role;
notify pgrst, 'reload schema';
