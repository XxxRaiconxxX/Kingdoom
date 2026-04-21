-- Kingdoom Native - Fase 2
-- RPC de compra segura para mercado movil.
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.purchase_market_item(
  p_player_id uuid,
  p_item_id text,
  p_quantity integer default 1
)
returns table (
  success boolean,
  message text,
  remaining_gold integer,
  total_price integer,
  inventory_synced boolean,
  order_ref text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qty integer := greatest(1, coalesce(p_quantity, 1));
  v_player public.players%rowtype;
  v_item public.market_items%rowtype;
  v_total integer;
  v_order_ref text := concat('MKT-', upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 12)));
  v_is_inventory_trackable boolean;
begin
  select *
    into v_player
  from public.players
  where id = p_player_id
  for update;

  if not found then
    return query select false, 'Jugador no encontrado.', 0, 0, false, v_order_ref;
    return;
  end if;

  select *
    into v_item
  from public.market_items
  where id = p_item_id
  for update;

  if not found then
    return query select false, 'Item no encontrado.', v_player.gold, 0, false, v_order_ref;
    return;
  end if;

  if v_item.stock_status = 'sold-out' then
    return query select false, 'El item esta agotado.', v_player.gold, 0, false, v_order_ref;
    return;
  end if;

  v_total := v_item.price * v_qty;

  if v_player.gold < v_total then
    return query select false, 'Oro insuficiente para la compra.', v_player.gold, v_total, false, v_order_ref;
    return;
  end if;

  update public.players
    set gold = gold - v_total
  where id = p_player_id;

  v_is_inventory_trackable := v_item.category <> 'potions';

  if v_is_inventory_trackable then
    insert into public.player_inventory (
      player_id,
      item_id,
      item_name,
      item_category,
      item_description,
      item_ability,
      item_image_url,
      item_image_fit,
      item_image_position,
      item_rarity,
      quantity
    )
    values (
      p_player_id,
      v_item.id,
      v_item.name,
      v_item.category,
      v_item.description,
      v_item.ability,
      v_item.image_url,
      v_item.image_fit,
      v_item.image_position,
      v_item.rarity,
      v_qty
    )
    on conflict (player_id, item_id)
    do update set
      quantity = public.player_inventory.quantity + excluded.quantity,
      item_name = excluded.item_name,
      item_category = excluded.item_category,
      item_description = excluded.item_description,
      item_ability = excluded.item_ability,
      item_image_url = excluded.item_image_url,
      item_image_fit = excluded.item_image_fit,
      item_image_position = excluded.item_image_position,
      item_rarity = excluded.item_rarity,
      updated_at = now();
  end if;

  return query
    select
      true,
      'Compra segura confirmada.',
      v_player.gold - v_total,
      v_total,
      v_is_inventory_trackable,
      v_order_ref;
end;
$$;

revoke all on function public.purchase_market_item(uuid, text, integer) from public;
grant execute on function public.purchase_market_item(uuid, text, integer) to anon, authenticated, service_role;
