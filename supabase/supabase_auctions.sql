-- 1. Tablas para el sistema de subastas
CREATE TABLE IF NOT EXISTS public.market_auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT REFERENCES public.market_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    item_description TEXT,
    item_category TEXT NOT NULL,
    item_rarity TEXT NOT NULL,
    item_image_url TEXT,
    start_price INTEGER NOT NULL DEFAULT 0,
    min_increment INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    highest_bid INTEGER NOT NULL DEFAULT 0,
    highest_bidder_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    whatsapp_message_id TEXT,
    whatsapp_chat_id TEXT,
    created_by UUID REFERENCES public.players(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.market_auction_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES public.market_auctions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.market_auction_participants (
    auction_id UUID NOT NULL REFERENCES public.market_auctions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    has_withdrawn BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (auction_id, player_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_market_auctions_status ON public.market_auctions(status);
CREATE INDEX IF NOT EXISTS idx_market_auction_bids_auction_id ON public.market_auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_market_auction_bids_player_id ON public.market_auction_bids(player_id);

-- Habilitar RLS
ALTER TABLE public.market_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_auction_participants ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Anyone can select auctions" ON public.market_auctions;
CREATE POLICY "Anyone can select auctions" ON public.market_auctions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage auctions" ON public.market_auctions;
CREATE POLICY "Admins can manage auctions" ON public.market_auctions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE players.auth_user_id = auth.uid() AND players.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Anyone can select bids" ON public.market_auction_bids;
CREATE POLICY "Anyone can select bids" ON public.market_auction_bids
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can select participants" ON public.market_auction_participants;
CREATE POLICY "Anyone can select participants" ON public.market_auction_participants
    FOR SELECT USING (true);


-- 2. RPC para Crear Subasta (Admin solamente)
CREATE OR REPLACE FUNCTION public.create_market_auction(
    p_item_id TEXT,
    p_item_name TEXT,
    p_item_description TEXT,
    p_item_category TEXT,
    p_item_rarity TEXT,
    p_item_image_url TEXT,
    p_start_price INTEGER,
    p_min_increment INTEGER,
    p_duration_minutes INTEGER,
    p_whatsapp_chat_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    v_admin_player public.players%rowtype;
    v_auction_id uuid;
begin
    -- Validar que sea admin o bot service_role
    if auth.role() <> 'service_role' then
        select * into v_admin_player
        from public.players
        where auth_user_id = auth.uid() and is_admin = true;

        if v_admin_player.id is null then
            raise exception 'No tienes permisos de administrador para crear subastas.' using errcode = '42501';
        end if;
    else
        -- Para el bot, asignamos un admin cualquiera o nulo
        select * into v_admin_player
        from public.players
        where is_admin = true
        limit 1;
    end if;

    insert into public.market_auctions (
        item_id,
        item_name,
        item_description,
        item_category,
        item_rarity,
        item_image_url,
        start_price,
        min_increment,
        status,
        expires_at,
        whatsapp_chat_id,
        created_by
    ) values (
        p_item_id,
        p_item_name,
        p_item_description,
        p_item_category,
        p_item_rarity,
        p_item_image_url,
        p_start_price,
        p_min_increment,
        'active',
        now() + (p_duration_minutes || ' minutes')::interval,
        p_whatsapp_chat_id,
        v_admin_player.id
    ) returning id into v_auction_id;

    return v_auction_id;
end;
$$;


-- 3. RPC para Pujar (Sunk-cost / Fondo perdido)
CREATE OR REPLACE FUNCTION public.place_auction_bid(
    p_player_id UUID,
    p_auction_id UUID,
    p_amount INTEGER
)
RETURNS TABLE (
    auction_id UUID,
    highest_bid INTEGER,
    highest_bidder_id UUID,
    remaining_gold INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    v_player public.players%rowtype;
    v_auction public.market_auctions%rowtype;
    v_min_bid integer;
    v_is_linked boolean := false;
begin
    -- 1. Validar que el usuario autenticado tiene permiso sobre p_player_id
    if auth.role() <> 'service_role' then
        if not exists (
            select 1 from public.players p
            where p.id = p_player_id
              and (
                p.auth_user_id = auth.uid() 
                or exists (
                    select 1 from public.player_auth_links pal
                    where pal.player_id = p_player_id and pal.auth_user_id = auth.uid()
                )
              )
        ) then
            raise exception 'No tienes permiso para pujar por este jugador.' using errcode = '42501';
        end if;
    end if;

    -- 2. Bloquear y leer el jugador
    select * into v_player
    from public.players
    where id = p_player_id
    for update;

    if v_player.id is null then
        raise exception 'El jugador no existe.' using errcode = 'P0002';
    end if;

    -- 3. Bloquear y leer la subasta
    select * into v_auction
    from public.market_auctions
    where id = p_auction_id
    for update;

    if v_auction.id is null then
        raise exception 'La subasta no existe.' using errcode = 'P0002';
    end if;

    if v_auction.status <> 'active' then
        raise exception 'La subasta ya no esta activa.' using errcode = '22023';
    end if;

    if v_auction.expires_at <= now() then
        raise exception 'La subasta ha expirado.' using errcode = '22023';
    end if;

    -- 4. Verificar si el jugador se ha retirado
    if exists (
        select 1 from public.market_auction_participants
        where auction_id = p_auction_id and player_id = p_player_id and has_withdrawn = true
    ) then
        raise exception 'Te has retirado de esta subasta y no puedes volver a pujar.' using errcode = '22023';
    end if;

    -- 5. Calcular la puja mínima requerida
    if v_auction.highest_bid = 0 then
        v_min_bid := v_auction.start_price;
    else
        v_min_bid := v_auction.highest_bid + v_auction.min_increment;
    end if;

    if p_amount < v_min_bid then
        raise exception 'La puja debe ser de al menos % de oro.' , v_min_bid using errcode = '22023';
    end if;

    -- 6. Verificar fondos
    if v_player.gold < p_amount then
        raise exception 'No tienes suficiente oro para pujar % (tienes %).', p_amount, v_player.gold using errcode = '22023';
    end if;

    -- 7. Deducción de oro permanente (Fondo perdido)
    update public.players
    set gold = gold - p_amount
    where id = p_player_id;

    -- 8. Registrar puja
    insert into public.market_auction_bids (auction_id, player_id, amount)
    values (p_auction_id, p_player_id, p_amount);

    -- 9. Registrar participación
    insert into public.market_auction_participants (auction_id, player_id, has_withdrawn)
    values (p_auction_id, p_player_id, false)
    on conflict (auction_id, player_id) do nothing;

    -- 10. Actualizar subasta con el nuevo líder y monto
    update public.market_auctions
    set highest_bid = p_amount,
        highest_bidder_id = p_player_id
    where id = p_auction_id;

    return query
    select
        p_auction_id,
        p_amount,
        p_player_id,
        (v_player.gold - p_amount);
end;
$$;


-- 4. RPC para Retirarse
CREATE OR REPLACE FUNCTION public.withdraw_from_auction(
    p_player_id UUID,
    p_auction_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
    -- Validar que el usuario autenticado tiene permiso sobre p_player_id
    if auth.role() <> 'service_role' then
        if not exists (
            select 1 from public.players p
            where p.id = p_player_id
              and (
                p.auth_user_id = auth.uid() 
                or exists (
                    select 1 from public.player_auth_links pal
                    where pal.player_id = p_player_id and pal.auth_user_id = auth.uid()
                )
              )
        ) then
            raise exception 'No tienes permiso para retirarte en nombre de este jugador.' using errcode = '42501';
        end if;
    end if;

    if not exists (
        select 1 from public.market_auctions
        where id = p_auction_id and status = 'active'
    ) then
        raise exception 'La subasta no esta activa.' using errcode = '22023';
    end if;

    insert into public.market_auction_participants (auction_id, player_id, has_withdrawn)
    values (p_auction_id, p_player_id, true)
    on conflict (auction_id, player_id)
    do update set has_withdrawn = true;

    return true;
end;
$$;


-- 5. RPC para Resolver Subasta
CREATE OR REPLACE FUNCTION public.resolve_market_auction(
    p_auction_id UUID
)
RETURNS TABLE (
    auction_id UUID,
    status TEXT,
    winner_id UUID,
    item_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    v_auction public.market_auctions%rowtype;
    v_is_admin boolean := false;
    v_existing_inventory public.player_inventory%rowtype;
    v_item_id text;
begin
    -- 1. Bloquear y leer la subasta
    select * into v_auction
    from public.market_auctions
    where id = p_auction_id
    for update;

    if v_auction.id is null then
        raise exception 'La subasta no existe.' using errcode = 'P0002';
    end if;

    if v_auction.status <> 'active' then
        raise exception 'La subasta ya no esta activa.' using errcode = '22023';
    end if;

    -- 2. Validar expiración o rol admin
    if auth.role() = 'service_role' then
        v_is_admin := true;
    else
        select is_admin into v_is_admin from public.players where auth_user_id = auth.uid();
    end if;

    if not v_is_admin and v_auction.expires_at > now() then
        raise exception 'La subasta aun no ha terminado.' using errcode = '22023';
    end if;

    -- 3. Si hay ganador, entregar item
    if v_auction.highest_bidder_id is not null then
        v_item_id := coalesce(v_auction.item_id, v_auction.id::text);

        select * into v_existing_inventory
        from public.player_inventory
        where player_id = v_auction.highest_bidder_id
          and item_id = v_item_id
        limit 1;

        if v_existing_inventory.id is null then
            insert into public.player_inventory (
                player_id,
                item_id,
                item_name,
                item_category,
                item_description,
                item_rarity,
                item_image_url,
                quantity,
                is_locked
            ) values (
                v_auction.highest_bidder_id,
                v_item_id,
                v_auction.item_name,
                v_auction.item_category,
                v_auction.item_description,
                v_auction.item_rarity,
                coalesce(v_auction.item_image_url, ''),
                1,
                false
            );
        else
            update public.player_inventory
            set quantity = v_existing_inventory.quantity + 1,
                updated_at = now()
            where id = v_existing_inventory.id;
        end if;

        -- Registrar orden completada en market_orders para historial
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
            v_auction.highest_bidder_id,
            v_item_id,
            v_auction.item_name,
            v_auction.item_category,
            1,
            v_auction.highest_bid,
            v_auction.highest_bid,
            'subasta',
            'AUC-' || substring(v_auction.id::text from 1 for 8),
            'completed'
        );

        -- Enviar notificación al jugador
        insert into public.player_notifications (
            player_id,
            sender_name,
            kind,
            title,
            message,
            amount,
            item_name
        ) values (
            v_auction.highest_bidder_id,
            'Subasta',
            'item',
            '¡Subasta Ganada!',
            'Felicidades, has ganado la subasta de ' || v_auction.item_name || ' con una puja de ' || v_auction.highest_bid || ' de oro.',
            v_auction.highest_bid,
            v_auction.item_name
        );
    end if;

    -- 4. Cerrar subasta
    update public.market_auctions
    set status = 'completed',
        closed_at = now()
    where id = p_auction_id;

    return query
    select
        p_auction_id,
        'completed'::text,
        v_auction.highest_bidder_id,
        v_auction.item_name;
end;
$$;

-- Otorgar permisos de ejecución
grant execute on function public.create_market_auction to authenticated;
grant execute on function public.place_auction_bid to authenticated;
grant execute on function public.withdraw_from_auction to authenticated;
grant execute on function public.resolve_market_auction to authenticated;
