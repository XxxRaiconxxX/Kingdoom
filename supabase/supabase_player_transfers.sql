-- Atomic and authorized player-to-player transfers.
-- Apply this file in the primary Kingdoom Supabase SQL Editor before deploying
-- the matching web and bot changes.

create or replace function public.transfer_player_gold(
  p_from_player_id uuid,
  p_to_player_id uuid,
  p_amount integer
)
returns table (
  success boolean,
  message text,
  sender_gold integer,
  recipient_gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender public.players%rowtype;
  v_recipient public.players%rowtype;
  v_authorized boolean := false;
begin
  if p_amount is null or p_amount < 1 then
    return query select false, 'La cantidad debe ser mayor a cero.', null::integer, null::integer;
    return;
  end if;

  if p_from_player_id is null or p_to_player_id is null or p_from_player_id = p_to_player_id then
    return query select false, 'La transferencia necesita dos jugadores distintos.', null::integer, null::integer;
    return;
  end if;

  if coalesce(auth.role(), '') = 'service_role' then
    v_authorized := true;
  else
    select exists (
      select 1
      from public.players player
      where player.id = p_from_player_id
        and (
          player.auth_user_id::text = auth.uid()::text
          or exists (
            select 1
            from public.player_auth_links link
            where link.player_id = player.id
              and link.auth_user_id = auth.uid()
          )
        )
    ) into v_authorized;
  end if;

  if not v_authorized then
    return query select false, 'Vincula el jugador con tu sesion segura antes de transferir.', null::integer, null::integer;
    return;
  end if;

  -- Lock both balances in deterministic order to avoid races and deadlocks.
  perform player.id
  from public.players player
  where player.id in (p_from_player_id, p_to_player_id)
  order by player.id
  for update;

  select * into v_sender
  from public.players
  where id = p_from_player_id;

  select * into v_recipient
  from public.players
  where id = p_to_player_id;

  if v_sender.id is null or v_recipient.id is null then
    return query select false, 'Uno de los jugadores ya no existe.', null::integer, null::integer;
    return;
  end if;

  if coalesce(v_sender.banned, false) then
    return query select false, 'El jugador remitente no puede transferir bienes.', v_sender.gold, v_recipient.gold;
    return;
  end if;

  if coalesce(v_sender.gold, 0) < p_amount then
    return query select false, 'Oro insuficiente.', v_sender.gold, v_recipient.gold;
    return;
  end if;

  update public.players
  set gold = gold - p_amount
  where id = v_sender.id
  returning gold into v_sender.gold;

  update public.players
  set gold = gold + p_amount
  where id = v_recipient.id
  returning gold into v_recipient.gold;

  insert into public.player_notifications (
    player_id,
    sender_player_id,
    sender_name,
    kind,
    title,
    message,
    amount
  ) values (
    v_recipient.id,
    v_sender.id,
    v_sender.username,
    'gold',
    'Oro recibido',
    v_sender.username || ' te envio ' || p_amount || ' de oro.',
    p_amount
  );

  return query select true, 'Oro enviado correctamente.', v_sender.gold, v_recipient.gold;
end;
$$;

create or replace function public.transfer_player_item(
  p_from_player_id uuid,
  p_to_player_id uuid,
  p_inventory_id uuid,
  p_amount integer
)
returns table (
  success boolean,
  message text,
  sender_quantity integer,
  recipient_quantity integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender public.players%rowtype;
  v_recipient public.players%rowtype;
  v_source public.player_inventory%rowtype;
  v_target public.player_inventory%rowtype;
  v_authorized boolean := false;
  v_sender_quantity integer := 0;
  v_recipient_quantity integer := 0;
begin
  if p_amount is null or p_amount < 1 then
    return query select false, 'La cantidad debe ser mayor a cero.', null::integer, null::integer;
    return;
  end if;

  if p_from_player_id is null or p_to_player_id is null or p_from_player_id = p_to_player_id then
    return query select false, 'La transferencia necesita dos jugadores distintos.', null::integer, null::integer;
    return;
  end if;

  if coalesce(auth.role(), '') = 'service_role' then
    v_authorized := true;
  else
    select exists (
      select 1
      from public.players player
      where player.id = p_from_player_id
        and (
          player.auth_user_id::text = auth.uid()::text
          or exists (
            select 1
            from public.player_auth_links link
            where link.player_id = player.id
              and link.auth_user_id = auth.uid()
          )
        )
    ) into v_authorized;
  end if;

  if not v_authorized then
    return query select false, 'Vincula el jugador con tu sesion segura antes de transferir.', null::integer, null::integer;
    return;
  end if;

  perform player.id
  from public.players player
  where player.id in (p_from_player_id, p_to_player_id)
  order by player.id
  for update;

  select * into v_sender
  from public.players
  where id = p_from_player_id;

  select * into v_recipient
  from public.players
  where id = p_to_player_id;

  if v_sender.id is null or v_recipient.id is null then
    return query select false, 'Uno de los jugadores ya no existe.', null::integer, null::integer;
    return;
  end if;

  if coalesce(v_sender.banned, false) then
    return query select false, 'El jugador remitente no puede transferir bienes.', null::integer, null::integer;
    return;
  end if;

  select * into v_source
  from public.player_inventory
  where id = p_inventory_id
    and player_id = p_from_player_id
  for update;

  if v_source.id is null then
    return query select false, 'El objeto ya no esta disponible en tu inventario.', null::integer, null::integer;
    return;
  end if;

  if coalesce(v_source.is_locked, false) then
    return query select false, 'Ese objeto esta bloqueado por un plan de pago activo.', v_source.quantity, null::integer;
    return;
  end if;

  if coalesce(v_source.quantity, 0) < p_amount then
    return query select false, 'No tienes suficientes unidades de ese objeto.', v_source.quantity, null::integer;
    return;
  end if;

  select * into v_target
  from public.player_inventory
  where player_id = p_to_player_id
    and item_id = v_source.item_id
    and coalesce(is_locked, false) = false
  order by created_at asc
  limit 1
  for update;

  v_sender_quantity := v_source.quantity - p_amount;
  if v_sender_quantity = 0 then
    delete from public.player_inventory where id = v_source.id;
  else
    update public.player_inventory
    set quantity = v_sender_quantity,
        updated_at = now()
    where id = v_source.id;
  end if;

  if v_target.id is null then
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
      v_recipient.id,
      v_source.item_id,
      v_source.item_name,
      v_source.item_category,
      v_source.item_description,
      v_source.item_ability,
      v_source.item_image_url,
      v_source.item_image_fit,
      v_source.item_image_position,
      v_source.item_rarity,
      p_amount,
      false
    )
    returning quantity into v_recipient_quantity;
  else
    update public.player_inventory
    set quantity = quantity + p_amount,
        updated_at = now()
    where id = v_target.id
    returning quantity into v_recipient_quantity;
  end if;

  insert into public.player_notifications (
    player_id,
    sender_player_id,
    sender_name,
    kind,
    title,
    message,
    amount,
    item_name
  ) values (
    v_recipient.id,
    v_sender.id,
    v_sender.username,
    'item',
    'Objeto recibido',
    v_sender.username || ' te envio ' || p_amount || ' x ' || v_source.item_name || '.',
    p_amount,
    v_source.item_name
  );

  return query select true, 'Objeto enviado correctamente.', v_sender_quantity, v_recipient_quantity;
end;
$$;

revoke all on function public.transfer_player_gold(uuid, uuid, integer) from public;
revoke all on function public.transfer_player_item(uuid, uuid, uuid, integer) from public;
grant execute on function public.transfer_player_gold(uuid, uuid, integer) to authenticated, service_role;
grant execute on function public.transfer_player_item(uuid, uuid, uuid, integer) to authenticated, service_role;

-- Replace the legacy open policy: notifications belong only to the linked player.
alter table public.player_notifications enable row level security;

drop policy if exists "Allow player notification access" on public.player_notifications;
drop policy if exists "Players can read own notifications" on public.player_notifications;
drop policy if exists "Players can mark own notifications" on public.player_notifications;

create policy "Players can read own notifications"
on public.player_notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.players player
    where player.id = player_notifications.player_id
      and (
        player.auth_user_id::text = auth.uid()::text
        or exists (
          select 1
          from public.player_auth_links link
          where link.player_id = player.id
            and link.auth_user_id = auth.uid()
        )
      )
  )
);

create policy "Players can mark own notifications"
on public.player_notifications
for update
to authenticated
using (
  exists (
    select 1
    from public.players player
    where player.id = player_notifications.player_id
      and (
        player.auth_user_id::text = auth.uid()::text
        or exists (
          select 1
          from public.player_auth_links link
          where link.player_id = player.id
            and link.auth_user_id = auth.uid()
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.players player
    where player.id = player_notifications.player_id
      and (
        player.auth_user_id::text = auth.uid()::text
        or exists (
          select 1
          from public.player_auth_links link
          where link.player_id = player.id
            and link.auth_user_id = auth.uid()
        )
      )
  )
);

revoke all on table public.player_notifications from anon;
revoke insert, delete, update on table public.player_notifications from authenticated;
grant select on table public.player_notifications to authenticated;
grant update (is_read) on table public.player_notifications to authenticated;
