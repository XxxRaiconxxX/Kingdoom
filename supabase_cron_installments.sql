-- Función para procesar los cobros automáticos de las cuotas del mercado.
-- Esta función debe ser llamada por el bot una vez al día.

create or replace function public.process_market_installments()
returns table (
  processed_plans integer,
  successful_payments integer,
  penalized_plans integer,
  defaulted_plans integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan record;
  v_player public.players%rowtype;
  v_item_name text;
  v_grace_period interval := interval '1 day';
  v_penalty_rate numeric := 0.05; -- 5% de interés diario sobre la cuota vencida
  v_late_fee integer;
  v_inventory_qty integer;
  v_res_processed integer := 0;
  v_res_success integer := 0;
  v_res_penalized integer := 0;
  v_res_defaulted integer := 0;
begin
  -- Seleccionar todos los planes activos cuya fecha de pago ya pasó
  for v_plan in
    select * from public.payment_plans
    where status = 'active' and next_payment_date <= now()
  loop
    v_res_processed := v_res_processed + 1;
    
    -- Obtener datos del jugador (para ver si tiene oro)
    select * into v_player from public.players where id = v_plan.player_id for update;
    
    -- Obtener nombre del ítem
    select name into v_item_name from public.market_items where id = v_plan.item_id;
    if v_item_name is null then
      v_item_name := 'Objeto del Mercado';
    end if;
    
    if v_player.gold >= v_plan.installment_amount then
      -- Tiene oro: Cobrar la cuota
      update public.players
      set gold = gold - v_plan.installment_amount
      where id = v_player.id;
      
      -- Actualizar el plan de pago
      update public.payment_plans
      set
        paid_installments = paid_installments + 1,
        remaining_balance = remaining_balance - v_plan.installment_amount,
        next_payment_date = next_payment_date + interval '3 days',
        penalty_days = 0,
        updated_at = now()
      where id = v_plan.id;
      
      -- Insertar notificación de cobro exitoso
      insert into public.player_notifications (
        player_id,
        sender_name,
        kind,
        title,
        message,
        amount,
        item_name
      ) values (
        v_player.id,
        'Banquero del Reino',
        'gold',
        'Pago de Cuota Exitoso 💰',
        'Se ha cobrado la cuota de ' || v_plan.installment_amount || ' de oro para tu plan de pago de ' || v_item_name || '. Restan ' || (v_plan.total_installments - (v_plan.paid_installments + 1)) || ' cuotas.',
        v_plan.installment_amount,
        v_item_name
      );
      
      -- Verificar si ya completó el pago
      if (v_plan.paid_installments + 1) >= v_plan.total_installments or (v_plan.remaining_balance - v_plan.installment_amount) <= 0 then
        update public.payment_plans
        set status = 'completed', updated_at = now()
        where id = v_plan.id;
        
        -- Desbloquear el ítem en el inventario
        update public.player_inventory
        set is_locked = false
        where id = v_plan.inventory_id;
        
        -- Insertar notificación de plan completado
        insert into public.player_notifications (
          player_id,
          sender_name,
          kind,
          title,
          message,
          amount,
          item_name
        ) values (
          v_player.id,
          'Banquero del Reino',
          'item',
          '¡Plan de Pago Completado! 🎉',
          'Has saldado la deuda total de tu ' || v_item_name || '. El objeto ha sido desbloqueado en tu inventario y ahora es completamente tuyo.',
          0,
          v_item_name
        );
      end if;
      
      v_res_success := v_res_success + 1;
      
    else
      -- No tiene oro suficiente: Verificar periodo de gracia o aplicar mora
      if now() > (v_plan.next_payment_date + v_grace_period) then
        -- Pasó el periodo de gracia
        -- Si llega a 5 días de penalización, se embarga el ítem
        if v_plan.penalty_days + 1 >= 5 then
          -- EMBARGO: Marcar como defaulted (bloquea nuevas compras por 2 semanas)
          update public.payment_plans
          set status = 'defaulted', updated_at = now()
          where id = v_plan.id;
          
          -- Retirar el ítem del inventario (reducir 1 cantidad)
          select quantity into v_inventory_qty from public.player_inventory where id = v_plan.inventory_id;
          
          if v_inventory_qty > 1 then
            update public.player_inventory
            set quantity = quantity - 1, updated_at = now()
            where id = v_plan.inventory_id;
          else
            delete from public.player_inventory where id = v_plan.inventory_id;
          end if;
          
          -- Insertar notificación de embargo
          insert into public.player_notifications (
            player_id,
            sender_name,
            kind,
            title,
            message,
            amount,
            item_name
          ) values (
            v_player.id,
            'Juez del Reino',
            'item',
            'Orden de Embargo Ejecutada ⚖️',
            'Por falta de pago de tu plan de cuotas, tu ' || v_item_name || ' ha sido embargado y confiscado de tu inventario. Tu crédito en el mercado ha sido suspendido por 14 días.',
            0,
            v_item_name
          );
          
          v_res_defaulted := v_res_defaulted + 1;
        else
          -- Aplicar interés de mora (5% de la cuota multiplicado por los días de mora)
          v_late_fee := ceil(v_plan.installment_amount * v_penalty_rate * (v_plan.penalty_days + 1));
          
          update public.payment_plans
          set
            penalty_days = penalty_days + 1,
            remaining_balance = remaining_balance + v_late_fee,
            updated_at = now()
          where id = v_plan.id;
          
          -- Insertar notificación de mora
          insert into public.player_notifications (
            player_id,
            sender_name,
            kind,
            title,
            message,
            amount,
            item_name
          ) values (
            v_player.id,
            'Banquero del Reino',
            'gold',
            'Mora Aplicada por Impago 🚨',
            'No se ha podido cobrar la cuota de tu ' || v_item_name || '. Se aplicó un recargo de mora del 5% (' || v_late_fee || ' de oro). Tienes ' || (5 - (v_plan.penalty_days + 1)) || ' días antes del embargo de tu pertenencia.',
            v_late_fee,
            v_item_name
          );
          
          v_res_penalized := v_res_penalized + 1;
        end if;
      else
        -- Aún está en periodo de gracia (porque next_payment_date <= now() pero now() <= next_payment_date + grace_period)
        -- Insertar notificación de advertencia de gracia
        insert into public.player_notifications (
          player_id,
          sender_name,
          kind,
          title,
          message,
          amount,
          item_name
        ) values (
          v_player.id,
          'Banquero del Reino',
          'gold',
          'Advertencia de Pago Atrasado ⚠️',
          'No tienes suficiente oro para la cuota de tu ' || v_item_name || ' (' || v_plan.installment_amount || ' de oro). Estás en período de gracia de 24 horas. Evita cargos adicionales depositando oro pronto.',
          0,
          v_item_name
        );
      end if;
    end if;
  end loop;

  return query select v_res_processed, v_res_success, v_res_penalized, v_res_defaulted;
end;
$$;

-- Actualizamos el RPC de compra para que el bloqueo de 2 semanas funcione correctamente
-- basándose en la fecha de 'updated_at' cuando el status es 'defaulted'.
create or replace function public.check_player_credit_status(p_player_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_is_blocked boolean;
begin
  select exists (
    select 1 
    from public.payment_plans 
    where player_id = p_player_id 
      and status = 'defaulted' 
      and updated_at > now() - interval '14 days'
  ) into v_is_blocked;
  
  return v_is_blocked;
end;
$$;
