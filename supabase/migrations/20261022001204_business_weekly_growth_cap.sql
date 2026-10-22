-- Weekly autonomous business-growth policy.
-- Base is frozen from the active value at migration time.
-- Autonomous growth: +50% of base per rolling 7-day window, +100% total.

create table if not exists public.business_upgrade_limits (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  base_production integer not null check (base_production > 0),
  base_storage integer not null check (base_storage > 0),
  week_started_at timestamptz not null default now(),
  week_production_start integer not null check (week_production_start > 0),
  week_storage_start integer not null check (week_storage_start > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.business_upgrade_limits
  (business_id, player_id, base_production, base_storage, week_production_start, week_storage_start)
select id, player_id, greatest(1, gold_per_hour), greatest(1, max_storage), greatest(1, gold_per_hour), greatest(1, max_storage)
from public.businesses
where status = 'active'
on conflict (business_id) do nothing;

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
  v_policy public.business_upgrade_limits%rowtype;
  v_next_level integer;
  v_week_prod_limit bigint;
  v_week_storage_limit bigint;
  v_total_prod_limit bigint;
  v_total_storage_limit bigint;
  v_next_gold integer;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 12 or length(p_idempotency_key) > 160 then
    return query select false, 'Clave de idempotencia invalida.', 0, 0, 0, 0; return;
  end if;
  select * into v_previous from public.business_upgrade_audit where idempotency_key = p_idempotency_key;
  if v_previous.id is not null then
    return query select true, 'Ampliacion ya aplicada; reintento idempotente.', v_previous.gold_after, v_previous.level_after, v_previous.production_after, v_previous.storage_after; return;
  end if;
  if p_business_id is null or p_player_id is null or p_production_value is null or p_storage_value is null or p_cost_gold is null or p_cost_gold < 0 then
    return query select false, 'Parametros de ampliacion invalidos.', 0, 0, 0, 0; return;
  end if;

  select * into v_business from public.businesses where id = p_business_id and player_id = p_player_id for update;
  if v_business.id is null or v_business.status <> 'active' then return query select false, 'El negocio no existe o no esta activo.', 0, 0, 0, 0; return; end if;
  select * into v_policy from public.business_upgrade_limits where business_id = p_business_id for update;
  if v_policy.business_id is null then
    insert into public.business_upgrade_limits (business_id, player_id, base_production, base_storage, week_production_start, week_storage_start)
    values (p_business_id, p_player_id, greatest(1,v_business.gold_per_hour), greatest(1,v_business.max_storage), greatest(1,v_business.gold_per_hour), greatest(1,v_business.max_storage))
    returning * into v_policy;
  end if;
  if v_policy.week_started_at <= now() - interval '7 days' then
    v_policy.week_started_at := now();
    v_policy.week_production_start := v_business.gold_per_hour;
    v_policy.week_storage_start := v_business.max_storage;
    update public.business_upgrade_limits set week_started_at=v_policy.week_started_at, week_production_start=v_policy.week_production_start, week_storage_start=v_policy.week_storage_start, updated_at=now() where business_id=p_business_id;
  end if;

  v_week_prod_limit := v_policy.week_production_start + floor(v_policy.base_production * 0.50);
  v_week_storage_limit := v_policy.week_storage_start + floor(v_policy.base_storage * 0.50);
  v_total_prod_limit := v_policy.base_production + v_policy.base_production;
  v_total_storage_limit := v_policy.base_storage + v_policy.base_storage;
  if p_production_value < v_business.gold_per_hour or p_storage_value < v_business.max_storage then
    return query select false, 'Una ampliacion no puede reducir produccion ni almacen.', 0, coalesce(v_business.level,1), v_business.gold_per_hour, v_business.max_storage; return;
  end if;
  if p_production_value::bigint > v_total_prod_limit or p_storage_value::bigint > v_total_storage_limit then
    return query select false, 'Limite autonomo total alcanzado (+100% de la base). Debes negociar esta ampliacion con el staff.', 0, coalesce(v_business.level,1), v_business.gold_per_hour, v_business.max_storage; return;
  end if;
  if p_production_value::bigint > v_week_prod_limit or p_storage_value::bigint > v_week_storage_limit then
    return query select false, format('Limite semanal alcanzado: cada parametro puede crecer como maximo +50%% de su base por semana. Proximo reinicio: %s.', to_char(v_policy.week_started_at + interval '7 days','YYYY-MM-DD HH24:MI')), 0, coalesce(v_business.level,1), v_business.gold_per_hour, v_business.max_storage; return;
  end if;

  select * into v_player from public.players where id = p_player_id for update;
  if v_player.id is null then return query select false, 'Jugador no encontrado.', 0, 0, 0, 0; return; end if;
  if coalesce(v_player.gold,0) < p_cost_gold then return query select false, 'No posees suficiente oro para financiar este contrato real.', v_player.gold, v_business.level, v_business.gold_per_hour, v_business.max_storage; return; end if;

  v_next_level := coalesce(v_business.level,1)+1;
  v_next_gold := v_player.gold-p_cost_gold;
  update public.players set gold=v_next_gold where id=p_player_id;
  update public.businesses set gold_per_hour=p_production_value, max_storage=p_storage_value, level=v_next_level, updated_at=now() where id=p_business_id;
  insert into public.business_upgrade_audit (idempotency_key,business_id,player_id,source,upgrade_type,production_before,production_after,storage_before,storage_after,cost_gold,gold_before,gold_after,level_before,level_after)
  values (p_idempotency_key,p_business_id,p_player_id,coalesce(nullif(trim(p_source),''),'bot_negotiation'),'dual',v_business.gold_per_hour,p_production_value,v_business.max_storage,p_storage_value,p_cost_gold,v_player.gold,v_next_gold,v_business.level,v_next_level);
  return query select true, 'Ampliacion combinada certificada por la Real Cancilleria.', v_next_gold,v_next_level,p_production_value,p_storage_value;
end;
$$;

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
  v_policy public.business_upgrade_limits%rowtype;
  v_current integer;
  v_week_limit bigint;
  v_total_limit bigint;
  v_next integer;
begin
  if p_upgrade_type not in ('production','storage') or p_new_value is null or p_new_value < 1 or p_cost_gold is null or p_cost_gold < 0 then
    return query select false,'Parametros de mejora invalidos.',0,0,0; return;
  end if;
  select * into v_business from public.businesses where id=p_business_id and player_id=p_player_id for update;
  if v_business.id is null or v_business.status <> 'active' then return query select false,'El negocio no existe o no esta activo.',0,0,0; return; end if;
  select * into v_policy from public.business_upgrade_limits where business_id=p_business_id for update;
  if v_policy.business_id is null then
    insert into public.business_upgrade_limits (business_id, player_id, base_production, base_storage, week_production_start, week_storage_start)
    values (p_business_id, p_player_id, greatest(1,v_business.gold_per_hour), greatest(1,v_business.max_storage), greatest(1,v_business.gold_per_hour), greatest(1,v_business.max_storage))
    returning * into v_policy;
  end if;
  if v_policy.week_started_at <= now() - interval '7 days' then
    v_policy.week_started_at:=now();
    v_policy.week_production_start:=v_business.gold_per_hour;
    v_policy.week_storage_start:=v_business.max_storage;
    update public.business_upgrade_limits set week_started_at=v_policy.week_started_at,week_production_start=v_policy.week_production_start,week_storage_start=v_policy.week_storage_start,updated_at=now() where business_id=p_business_id;
  end if;
  v_current:=case when p_upgrade_type='production' then v_business.gold_per_hour else v_business.max_storage end;
  v_week_limit:=case when p_upgrade_type='production' then v_policy.week_production_start+floor(v_policy.base_production*0.50) else v_policy.week_storage_start+floor(v_policy.base_storage*0.50) end;
  v_total_limit:=case when p_upgrade_type='production' then v_policy.base_production*2 else v_policy.base_storage*2 end;
  if p_new_value < v_current then return query select false,'Una ampliacion no puede reducir produccion ni almacen.',0,v_business.level,v_current; return; end if;
  if p_new_value::bigint > v_total_limit then return query select false,'Limite autonomo total alcanzado (+100% de la base). Debes negociar esta ampliacion con el staff.',coalesce(v_player.gold,0),v_business.level,v_current; return; end if;
  if p_new_value::bigint > v_week_limit then return query select false,'Limite semanal alcanzado: el parametro solo puede crecer +50% de su base por semana.',0,v_business.level,v_current; return; end if;
  select * into v_player from public.players where id=p_player_id for update;
  if coalesce(v_player.gold,0)<p_cost_gold then return query select false,'No posees suficiente oro para financiar este contrato real.',v_player.gold,v_business.level,v_current; return; end if;
  v_next:=v_business.level+1;
  update public.players set gold=v_player.gold-p_cost_gold where id=p_player_id;
  if p_upgrade_type='production' then update public.businesses set gold_per_hour=p_new_value,level=v_next,updated_at=now() where id=p_business_id; else update public.businesses set max_storage=p_new_value,level=v_next,updated_at=now() where id=p_business_id; end if;
  return query select true,'Ampliacion certificada por la Real Cancilleria.',v_player.gold-p_cost_gold,v_next,p_new_value;
end;
$$;

revoke all on table public.business_upgrade_limits from public,anon,authenticated;
grant select,insert,update on table public.business_upgrade_limits to service_role;
revoke all on function public.upgrade_player_business_dual(uuid,uuid,integer,integer,integer,text,text) from public,anon,authenticated;
revoke all on function public.upgrade_player_business(uuid,uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.upgrade_player_business_dual(uuid,uuid,integer,integer,integer,text,text) to service_role;
grant execute on function public.upgrade_player_business(uuid,uuid,text,integer,integer) to service_role;
notify pgrst, 'reload schema';
