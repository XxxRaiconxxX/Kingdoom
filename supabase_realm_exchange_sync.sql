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
