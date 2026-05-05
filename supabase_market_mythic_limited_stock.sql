-- Kingdoom - Mercado mitico y stock limitado.
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table public.market_items
add column if not exists stock_limit integer not null default 0 check (stock_limit >= 0),
add column if not exists stock_sold integer not null default 0 check (stock_sold >= 0);

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.market_items'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%rarity%'
  loop
    execute format('alter table public.market_items drop constraint %I', constraint_record.conname);
  end loop;
end $$;

alter table public.market_items
add constraint market_items_rarity_check
check (rarity in ('mythic', 'legendary', 'epic', 'rare', 'common'));

update public.market_items
set stock_status = 'sold-out'
where stock_limit > 0
  and stock_sold >= stock_limit;

create table if not exists public.market_orders (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  item_id text not null,
  item_name text not null,
  item_category text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total_price integer not null check (total_price >= 0),
  whatsapp text not null default 'app',
  order_ref text not null unique,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create index if not exists idx_market_orders_player_id
  on public.market_orders(player_id);

alter table public.market_orders enable row level security;

drop policy if exists "Players can read own market orders" on public.market_orders;
create policy "Players can read own market orders"
on public.market_orders
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = market_orders.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

create or replace function public.purchase_market_item(
  p_player_id uuid,
  p_item_id text,
  p_quantity integer,
  p_whatsapp text,
  p_order_ref text
)
returns table (
  order_ref text,
  remaining_gold integer,
  total_price integer,
  item_name text,
  inventory_synced boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid;
  v_player public.players%rowtype;
  v_item public.market_items%rowtype;
  v_total_price integer;
  v_next_gold integer;
  v_existing_inventory public.player_inventory%rowtype;
  v_inventory_synced boolean := false;
  v_stock_limit integer;
  v_stock_sold integer;
  v_remaining_stock integer;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Debes iniciar sesion antes de comprar.' using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception 'La cantidad debe estar entre 1 y 99.' using errcode = '22023';
  end if;

  if coalesce(trim(p_whatsapp), '') = '' then
    raise exception 'Debes indicar un WhatsApp valido.' using errcode = '22023';
  end if;

  if coalesce(trim(p_order_ref), '') = '' then
    raise exception 'Falta el identificador del pedido.' using errcode = '22023';
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
    and auth_user_id = v_auth_user_id
  for update;

  if v_player.id is null then
    raise exception 'Tu cuenta segura aun no esta vinculada a ese jugador del reino.' using errcode = '42501';
  end if;

  select *
  into v_item
  from public.market_items
  where id = trim(p_item_id)
  for update;

  if v_item.id is null then
    raise exception 'El item solicitado no existe.' using errcode = 'P0002';
  end if;

  v_stock_limit := greatest(0, coalesce(v_item.stock_limit, 0));
  v_stock_sold := greatest(0, coalesce(v_item.stock_sold, 0));
  v_remaining_stock := case
    when v_stock_limit > 0 then greatest(0, v_stock_limit - v_stock_sold)
    else 999999
  end;

  if v_item.stock_status = 'sold-out' or v_remaining_stock <= 0 then
    update public.market_items
    set stock_status = 'sold-out'
    where id = v_item.id
      and stock_status <> 'sold-out';

    raise exception 'Ese item esta agotado.' using errcode = '22023';
  end if;

  if v_stock_limit > 0 and p_quantity > v_remaining_stock then
    raise exception 'Solo quedan % unidades disponibles.', v_remaining_stock using errcode = '22023';
  end if;

  v_total_price := v_item.price * p_quantity;

  if v_player.gold < v_total_price then
    raise exception 'No tienes suficiente oro para completar la compra.' using errcode = '22023';
  end if;

  v_next_gold := greatest(v_player.gold - v_total_price, 0);

  update public.players
  set gold = v_next_gold
  where id = v_player.id;

  if v_stock_limit > 0 then
    update public.market_items
    set
      stock_sold = v_stock_sold + p_quantity,
      stock_status = case
        when v_stock_sold + p_quantity >= v_stock_limit then 'sold-out'
        else 'limited'
      end
    where id = v_item.id;
  end if;

  insert into public.market_orders (
    player_id,
    item_id,
    item_name,
    item_category,
    quantity,
    unit_price,
    total_price,
    whatsapp,
    order_ref,
    status
  ) values (
    v_player.id,
    v_item.id,
    v_item.name,
    v_item.category,
    p_quantity,
    v_item.price,
    v_total_price,
    trim(p_whatsapp),
    trim(p_order_ref),
    'submitted'
  );

  if v_item.category <> 'potions' then
    select *
    into v_existing_inventory
    from public.player_inventory
    where player_id = v_player.id
      and item_id = v_item.id
    limit 1;

    if v_existing_inventory.id is null then
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
      ) values (
        v_player.id,
        v_item.id,
        v_item.name,
        v_item.category,
        v_item.description,
        v_item.ability,
        v_item.image_url,
        v_item.image_fit,
        v_item.image_position,
        v_item.rarity,
        p_quantity
      );
    else
      update public.player_inventory
      set
        quantity = v_existing_inventory.quantity + p_quantity,
        item_name = v_item.name,
        item_category = v_item.category,
        item_description = v_item.description,
        item_ability = v_item.ability,
        item_image_url = v_item.image_url,
        item_image_fit = v_item.image_fit,
        item_image_position = v_item.image_position,
        item_rarity = v_item.rarity,
        updated_at = now()
      where id = v_existing_inventory.id;
    end if;

    v_inventory_synced := true;
  end if;

  return query
  select
    trim(p_order_ref),
    v_next_gold,
    v_total_price,
    v_item.name,
    v_inventory_synced;
end;
$$;

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
  v_qty integer := least(99, greatest(1, coalesce(p_quantity, 1)));
  v_player public.players%rowtype;
  v_item public.market_items%rowtype;
  v_existing_inventory public.player_inventory%rowtype;
  v_total integer;
  v_order_ref text := concat('MKT-', upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 12)));
  v_is_inventory_trackable boolean := false;
  v_stock_limit integer;
  v_stock_sold integer;
  v_remaining_stock integer;
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

  v_stock_limit := greatest(0, coalesce(v_item.stock_limit, 0));
  v_stock_sold := greatest(0, coalesce(v_item.stock_sold, 0));
  v_remaining_stock := case
    when v_stock_limit > 0 then greatest(0, v_stock_limit - v_stock_sold)
    else 999999
  end;

  if v_item.stock_status = 'sold-out' or v_remaining_stock <= 0 then
    update public.market_items
    set stock_status = 'sold-out'
    where id = v_item.id
      and stock_status <> 'sold-out';

    return query select false, 'El item esta agotado.', v_player.gold, 0, false, v_order_ref;
    return;
  end if;

  if v_stock_limit > 0 and v_qty > v_remaining_stock then
    return query select false, concat('Solo quedan ', v_remaining_stock, ' unidades disponibles.'), v_player.gold, 0, false, v_order_ref;
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

  if v_stock_limit > 0 then
    update public.market_items
    set
      stock_sold = v_stock_sold + v_qty,
      stock_status = case
        when v_stock_sold + v_qty >= v_stock_limit then 'sold-out'
        else 'limited'
      end
    where id = v_item.id;
  end if;

  insert into public.market_orders (
    player_id,
    item_id,
    item_name,
    item_category,
    quantity,
    unit_price,
    total_price,
    whatsapp,
    order_ref,
    status
  )
  values (
    p_player_id,
    v_item.id,
    v_item.name,
    v_item.category,
    v_qty,
    v_item.price,
    v_total,
    'app',
    v_order_ref,
    'submitted'
  );

  v_is_inventory_trackable := v_item.category <> 'potions';

  if v_is_inventory_trackable then
    select *
      into v_existing_inventory
    from public.player_inventory
    where player_id = p_player_id
      and item_id = v_item.id
    limit 1;

    if v_existing_inventory.id is null then
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
      );
    else
      update public.player_inventory
      set
        quantity = v_existing_inventory.quantity + v_qty,
        item_name = v_item.name,
        item_category = v_item.category,
        item_description = v_item.description,
        item_ability = v_item.ability,
        item_image_url = v_item.image_url,
        item_image_fit = v_item.image_fit,
        item_image_position = v_item.image_position,
        item_rarity = v_item.rarity,
        updated_at = now()
      where id = v_existing_inventory.id;
    end if;
  end if;

  return query
  select
    true,
    'Compra segura confirmada.',
    v_player.gold - v_total,
    v_total,
    v_is_inventory_trackable,
    v_order_ref;
exception
  when others then
    return query
    select
      false,
      sqlerrm,
      0,
      0,
      false,
      v_order_ref;
end;
$$;

revoke all on function public.purchase_market_item(uuid, text, integer, text, text) from public;
grant execute on function public.purchase_market_item(uuid, text, integer, text, text) to authenticated;

revoke all on function public.purchase_market_item(uuid, text, integer) from public;
grant execute on function public.purchase_market_item(uuid, text, integer) to anon, authenticated, service_role;
