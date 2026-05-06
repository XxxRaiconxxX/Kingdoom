create table if not exists public.player_realm_exchange_states (
  player_id uuid primary key references public.players(id) on delete cascade,
  positions jsonb not null default '[]'::jsonb,
  predictions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_realm_exchange_states enable row level security;

drop policy if exists "Allow all realm exchange state access" on public.player_realm_exchange_states;

create policy "Allow all realm exchange state access"
on public.player_realm_exchange_states
for all
using (true)
with check (true);

create index if not exists player_realm_exchange_states_updated_at_idx
  on public.player_realm_exchange_states (updated_at desc);

create or replace function public.sell_realm_exchange_shares(
  p_player_id uuid,
  p_asset_id text,
  p_shares integer,
  p_revenue integer,
  p_remaining_total_invested integer,
  p_average_price integer
)
returns table (
  success boolean,
  message text,
  remaining_gold integer,
  positions jsonb,
  predictions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_state public.player_realm_exchange_states%rowtype;
  v_position jsonb;
  v_entry jsonb;
  v_current_shares integer := 0;
  v_remaining_shares integer := 0;
  v_next_positions jsonb := '[]'::jsonb;
  v_updated_at bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if p_player_id is null or coalesce(p_asset_id, '') = '' then
    return query select false, 'Venta invalida.', 0, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  if coalesce(p_shares, 0) <= 0 or coalesce(p_revenue, 0) < 0 then
    return query select false, 'Cantidad de venta invalida.', 0, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
  for update;

  if not found then
    return query select false, 'Jugador no encontrado.', 0, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  select *
  into v_state
  from public.player_realm_exchange_states
  where player_id = p_player_id
  for update;

  if not found then
    return query select false, 'No hay cartera de bolsa para vender.', v_player.gold, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  for v_entry in
    select value from jsonb_array_elements(coalesce(v_state.positions, '[]'::jsonb))
  loop
    if v_entry->>'assetId' = p_asset_id then
      v_position := v_entry;
    else
      v_next_positions := v_next_positions || jsonb_build_array(v_entry);
    end if;
  end loop;

  if v_position is null then
    return query select false, 'No tienes acciones de ese activo.', v_player.gold, v_state.positions, v_state.predictions;
    return;
  end if;

  v_current_shares := greatest(coalesce((v_position->>'sharesOwned')::integer, 0), 0);

  if v_current_shares < p_shares then
    return query select false, 'No tienes suficientes acciones para vender.', v_player.gold, v_state.positions, v_state.predictions;
    return;
  end if;

  v_remaining_shares := v_current_shares - p_shares;

  if v_remaining_shares > 0 then
    v_next_positions := v_next_positions || jsonb_build_array(
      jsonb_build_object(
        'assetId', p_asset_id,
        'sharesOwned', v_remaining_shares,
        'totalInvested', greatest(coalesce(p_remaining_total_invested, 0), 0),
        'averagePrice', greatest(coalesce(p_average_price, 0), 0),
        'updatedAt', v_updated_at
      )
    );
  end if;

  update public.player_realm_exchange_states
  set
    positions = v_next_positions,
    updated_at = now()
  where player_id = p_player_id;

  update public.players
  set gold = greatest(0, gold + p_revenue)
  where id = p_player_id
  returning * into v_player;

  return query
    select
      true,
      'Venta confirmada.',
      v_player.gold,
      v_next_positions,
      coalesce(v_state.predictions, '[]'::jsonb);
end;
$$;

revoke all on function public.sell_realm_exchange_shares(uuid, text, integer, integer, integer, integer) from public;
grant execute on function public.sell_realm_exchange_shares(uuid, text, integer, integer, integer, integer) to anon, authenticated, service_role;

create or replace function public.resolve_realm_exchange_predictions(
  p_player_id uuid,
  p_resolved_predictions jsonb
)
returns table (
  success boolean,
  message text,
  remaining_gold integer,
  payout_gold integer,
  positions jsonb,
  predictions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_state public.player_realm_exchange_states%rowtype;
  v_entry jsonb;
  v_resolved jsonb;
  v_next_predictions jsonb := '[]'::jsonb;
  v_total_payout integer := 0;
  v_resolved_count integer := 0;
  v_prediction_payout integer := 0;
begin
  if p_player_id is null or jsonb_typeof(coalesce(p_resolved_predictions, '[]'::jsonb)) <> 'array' then
    return query select false, 'Resolucion invalida.', 0, 0, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
  for update;

  if not found then
    return query select false, 'Jugador no encontrado.', 0, 0, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  select *
  into v_state
  from public.player_realm_exchange_states
  where player_id = p_player_id
  for update;

  if not found then
    return query select false, 'No hay cartera de bolsa para resolver.', v_player.gold, 0, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  for v_entry in
    select value from jsonb_array_elements(coalesce(v_state.predictions, '[]'::jsonb))
  loop
    v_resolved := null;

    select value
    into v_resolved
    from jsonb_array_elements(p_resolved_predictions)
    where value->>'id' = v_entry->>'id'
    limit 1;

    if
      v_resolved is not null
      and coalesce(v_entry->>'status', '') = 'active'
      and coalesce(v_resolved->>'status', '') <> 'active'
    then
      v_prediction_payout := 0;

      if coalesce(v_resolved->>'payoutGold', '') ~ '^[0-9]+$' then
        v_prediction_payout := greatest((v_resolved->>'payoutGold')::integer, 0);
      end if;

      v_total_payout := v_total_payout + v_prediction_payout;
      v_resolved_count := v_resolved_count + 1;
      v_next_predictions := v_next_predictions || jsonb_build_array(v_resolved);
    else
      v_next_predictions := v_next_predictions || jsonb_build_array(v_entry);
    end if;
  end loop;

  if v_resolved_count = 0 then
    return query
      select true, 'No habia predicciones pendientes de cobro.', v_player.gold, 0, v_state.positions, v_state.predictions;
    return;
  end if;

  update public.player_realm_exchange_states
  set
    predictions = v_next_predictions,
    updated_at = now()
  where player_id = p_player_id;

  if v_total_payout > 0 then
    update public.players
    set gold = greatest(0, gold + v_total_payout)
    where id = p_player_id
    returning * into v_player;
  end if;

  return query
    select
      true,
      case
        when v_total_payout > 0 then 'Prediccion confirmada.'
        else 'Prediccion resuelta sin premio.'
      end,
      v_player.gold,
      v_total_payout,
      coalesce(v_state.positions, '[]'::jsonb),
      v_next_predictions;
end;
$$;

revoke all on function public.resolve_realm_exchange_predictions(uuid, jsonb) from public;
grant execute on function public.resolve_realm_exchange_predictions(uuid, jsonb) to anon, authenticated, service_role;

create or replace function public.open_realm_exchange_prediction(
  p_player_id uuid,
  p_prediction jsonb,
  p_stake_gold integer
)
returns table (
  success boolean,
  message text,
  remaining_gold integer,
  positions jsonb,
  predictions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_state public.player_realm_exchange_states%rowtype;
  v_entry jsonb;
  v_asset_id text := coalesce(p_prediction->>'assetId', '');
  v_status text := coalesce(p_prediction->>'status', '');
begin
  if p_player_id is null or v_asset_id = '' or v_status <> 'active' or coalesce(p_stake_gold, 0) <= 0 then
    return query select false, 'Prediccion invalida.', 0, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
  for update;

  if not found then
    return query select false, 'Jugador no encontrado.', 0, '[]'::jsonb, '[]'::jsonb;
    return;
  end if;

  insert into public.player_realm_exchange_states (player_id, positions, predictions)
  values (p_player_id, '[]'::jsonb, '[]'::jsonb)
  on conflict (player_id) do nothing;

  select *
  into v_state
  from public.player_realm_exchange_states
  where player_id = p_player_id
  for update;

  if v_player.gold < p_stake_gold then
    return query select false, 'Oro insuficiente para abrir prediccion.', v_player.gold, v_state.positions, v_state.predictions;
    return;
  end if;

  for v_entry in
    select value from jsonb_array_elements(coalesce(v_state.predictions, '[]'::jsonb))
  loop
    if v_entry->>'assetId' = v_asset_id and coalesce(v_entry->>'status', '') = 'active' then
      return query select false, 'Ya tienes una prediccion activa en este reino.', v_player.gold, v_state.positions, v_state.predictions;
      return;
    end if;
  end loop;

  update public.players
  set gold = greatest(0, gold - p_stake_gold)
  where id = p_player_id
  returning * into v_player;

  update public.player_realm_exchange_states
  set
    predictions = coalesce(v_state.predictions, '[]'::jsonb) || jsonb_build_array(p_prediction),
    updated_at = now()
  where player_id = p_player_id
  returning * into v_state;

  return query
    select true, 'Prediccion abierta por 2 horas.', v_player.gold, v_state.positions, v_state.predictions;
end;
$$;

revoke all on function public.open_realm_exchange_prediction(uuid, jsonb, integer) from public;
grant execute on function public.open_realm_exchange_prediction(uuid, jsonb, integer) to anon, authenticated, service_role;
