-- Migración para el sistema de cuotas (Installments) en el Mercado

-- 1. Añadir is_locked al inventario
alter table public.player_inventory 
add column if not exists is_locked boolean not null default false;

-- 2. Tabla para los planes de pago
create table if not exists public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  item_id text not null,
  inventory_id uuid references public.player_inventory(id) on delete set null,
  order_ref text not null,
  total_installments integer not null check (total_installments > 0),
  paid_installments integer not null default 1 check (paid_installments >= 0),
  installment_amount integer not null check (installment_amount >= 0),
  remaining_balance integer not null check (remaining_balance >= 0),
  next_payment_date timestamptz not null,
  status text not null default 'active' check (status in ('active', 'completed', 'defaulted')),
  penalty_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_plans_player_id on public.payment_plans(player_id);
create index if not exists idx_payment_plans_status on public.payment_plans(status);

alter table public.payment_plans enable row level security;

drop policy if exists "Players can read own payment plans" on public.payment_plans;
create policy "Players can read own payment plans"
on public.payment_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = payment_plans.player_id
      and players.auth_user_id = (select auth.uid())
  )
);

-- 3. Actualizar la función purchase_market_item
-- Como vamos a cambiar la firma, es mejor usar DROP FUNCTION IF EXISTS o cambiar el nombre.
-- Vamos a crear purchase_market_item_v2
drop function if exists public.purchase_market_item_v2(text, integer, text, text, integer);
drop function if exists public.purchase_market_item_v2(uuid, text, integer, text, text, integer);

create or replace function public.purchase_market_item_v2(
  p_player_id uuid,
  p_item_id text,
  p_quantity integer,
  p_whatsapp text,
  p_order_ref text,
  p_installments integer default 1
)
returns table (
  order_ref text,
  remaining_gold integer,
  total_price integer,
  item_name text,
  inventory_synced boolean,
  paid_now integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid;
  v_player public.players%rowtype;
  v_item public.market_items%rowtype;
  v_base_total integer;
  v_total_price integer;
  v_installment_amount integer;
  v_paid_now integer;
  v_next_gold integer;
  v_existing_inventory public.player_inventory%rowtype;
  v_inventory_synced boolean := false;
  v_interest_rate numeric := 0.0;
  v_is_locked boolean := false;
  v_new_inventory_id uuid;
  v_is_linked boolean := false;
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
  
  if p_installments not in (1, 3, 6) then
    raise exception 'Las cuotas solo pueden ser 1, 3 o 6.' using errcode = '22023';
  end if;

  -- Buscar jugador: acepta vinculacion directa, service_role, o via player_auth_links.
  select *
  into v_player
  from public.players
  where id = p_player_id
    and (
      auth_user_id = v_auth_user_id
      or auth.role() = 'service_role'
      or exists (
        select 1
        from public.player_auth_links pal
        where pal.player_id = p_player_id
          and pal.auth_user_id = v_auth_user_id
      )
    )
  for update;

  -- Si no se encontro con las condiciones anteriores, permitir sesion anonima nueva
  -- (jugadores del bot que aun no vincularon su cuenta en la web).
  if v_player.id is null and auth.role() = 'authenticated' and v_auth_user_id is not null then
    select *
    into v_player
    from public.players
    where id = p_player_id
    for update;
  end if;

  if v_player.id is null then
    raise exception 'Tu cuenta segura aun no esta vinculada a un jugador del reino.' using errcode = '42501';
  end if;

  -- Auto-vincular la sesion anonima con el jugador si aun no esta vinculada.
  -- Solo aplica para jugadores del bot (auth_user_id IS NULL en players).
  if v_auth_user_id is not null and auth.role() <> 'service_role' then
    select exists(
      select 1 from public.player_auth_links pal
      where pal.player_id = v_player.id
        and pal.auth_user_id = v_auth_user_id
    ) into v_is_linked;

    if not v_is_linked and v_player.auth_user_id is null then
      insert into public.player_auth_links (player_id, auth_user_id)
      values (v_player.id, v_auth_user_id)
      on conflict do nothing;
    end if;
  end if;
  
  -- Verificar penalización
  -- Asumimos que si tiene planes defaulteados recientes (últimos 14 días) no puede comprar a cuotas
  if p_installments > 1 then
    if exists (
      select 1 
      from public.payment_plans 
      where player_id = v_player.id 
        and status = 'defaulted'
        and updated_at > now() - interval '14 days'
    ) then
      raise exception 'No puedes comprar a cuotas por tener deudas impagas o penalizaciones recientes.' using errcode = '22023';
    end if;
  end if;

  select *
  into v_item
  from public.market_items
  where id = trim(p_item_id)
  for update;

  if v_item.id is null then
    raise exception 'El item solicitado no existe.' using errcode = 'P0002';
  end if;

  if v_item.stock_status = 'sold-out' then
    raise exception 'Ese item esta agotado.' using errcode = '22023';
  end if;

  v_base_total := v_item.price * p_quantity;
  
  -- Calcular intereses
  if p_installments = 3 then
    v_interest_rate := 0.10; -- 10%
  elsif p_installments = 6 then
    v_interest_rate := 0.18; -- 18%
  end if;
  
  v_total_price := ceil(v_base_total * (1 + v_interest_rate));
  
  if p_installments > 1 then
    v_installment_amount := ceil(v_total_price::numeric / p_installments);
    v_paid_now := v_installment_amount;
    v_is_locked := true;
  else
    v_paid_now := v_total_price;
  end if;

  if v_player.gold < v_paid_now then
    raise exception 'No tienes suficiente oro para pagar al contado o la primera cuota.' using errcode = '22023';
  end if;

  v_next_gold := greatest(v_player.gold - v_paid_now, 0);

  update public.players
  set gold = v_next_gold
  where id = v_player.id;

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
        quantity,
        is_locked
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
        p_quantity,
        v_is_locked
      ) returning id into v_new_inventory_id;
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
        is_locked = v_is_locked or v_existing_inventory.is_locked,
        updated_at = now()
      where id = v_existing_inventory.id returning id into v_new_inventory_id;
    end if;

    v_inventory_synced := true;
  end if;
  
  if p_installments > 1 then
    insert into public.payment_plans (
      player_id,
      item_id,
      inventory_id,
      order_ref,
      total_installments,
      paid_installments,
      installment_amount,
      remaining_balance,
      next_payment_date
    ) values (
      v_player.id,
      v_item.id,
      v_new_inventory_id,
      p_order_ref,
      p_installments,
      1,
      v_installment_amount,
      v_total_price - v_paid_now,
      now() + interval '3 days'
    );
  end if;

  return query
  select
    trim(p_order_ref),
    v_next_gold,
    v_total_price,
    v_item.name,
    v_inventory_synced,
    v_paid_now;
end;
$$;

revoke all on function public.purchase_market_item_v2(uuid, text, integer, text, text, integer) from public;
grant execute on function public.purchase_market_item_v2(uuid, text, integer, text, text, integer) to authenticated;
