-- Banco de Kingdoom - correccion de pagos manuales vencidos
--
-- Una cuota scheduled que ya paso su due_at no debe otorgar progreso puntual
-- aunque el cobrador automatico aun no la haya marcado como in_mora.

create or replace function public.bank_pay_loan(
  p_player_id uuid,
  p_loan_id uuid,
  p_installment_count integer,
  p_idempotency_key text
)
returns table (
  success boolean,
  loan_id uuid,
  paid_gold integer,
  player_gold integer,
  outstanding_due_gold integer,
  credit_limit_gold integer,
  on_time_streak integer,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players;
  v_account public.bank_accounts;
  v_loan public.bank_loans;
  v_installment public.bank_loan_installments;
  v_existing public.bank_transactions;
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_count integer := p_installment_count;
  v_total integer := 0;
  v_paid integer := 0;
  v_selected integer := 0;
  v_next_gold bigint;
  v_had_mora boolean := false;
  v_regularized_mora boolean := false;
  v_loan_paid boolean := false;
  v_transaction_id uuid;
begin
  if v_key = '' or length(v_key) > 200 or v_count is null or v_count < 1 then
    raise exception 'La cantidad de cuotas y la clave de idempotencia son invalidas.' using errcode = '22023';
  end if;

  v_player := public.bank_assert_player_access(p_player_id);
  perform pg_advisory_xact_lock(
    hashtextextended(format('kingdoom:bank:pay_loan:%s:%s', v_player.id, v_key), 0)
  );
  v_account := public.bank_ensure_account(v_player.id);

  select * into v_existing
    from public.bank_transactions
   where player_id = v_player.id and idempotency_key = v_key;
  if found then
    if v_existing.operation_type <> 'loan_payment' then
      raise exception 'La clave de idempotencia ya pertenece a otra operacion.' using errcode = '23505';
    end if;
    return query select
      true,
      (v_existing.metadata->'result'->>'loanId')::uuid,
      (v_existing.metadata->'result'->>'paidGold')::integer,
      (v_existing.metadata->'result'->>'playerGold')::integer,
      (v_existing.metadata->'result'->>'outstandingDueGold')::integer,
      (v_existing.metadata->'result'->>'creditLimitGold')::integer,
      (v_existing.metadata->'result'->>'onTimeStreak')::integer,
      coalesce(v_existing.metadata->'result'->>'message', 'Pago ya procesado.');
    return;
  end if;

  select l.*
    into v_loan
    from public.bank_loans l
   where l.id = p_loan_id
     and l.player_id = v_player.id
     and l.status in ('active', 'in_mora')
   for update;
  if not found then
    raise exception 'El prestamo no existe o ya esta liquidado.' using errcode = 'P0002';
  end if;

  for v_installment in
    select i.*
      from public.bank_loan_installments i
     where i.loan_id = v_loan.id
       and i.status in ('scheduled', 'in_mora')
       and i.due_at <= clock_timestamp()
     order by i.installment_number
     limit v_count
     for update
  loop
    v_selected := v_selected + 1;
    v_total := v_total + v_installment.amount_due_gold;
    -- Una cuota scheduled que ya vencio tambien cuenta como pago tardio.
    v_had_mora := v_had_mora
      or v_installment.status = 'in_mora'
      or v_installment.due_at < clock_timestamp();
  end loop;

  if v_selected <> v_count then
    raise exception 'No hay suficientes cuotas vencidas disponibles para ese pago.' using errcode = '22023';
  end if;
  if v_player.gold < v_total then
    raise exception 'No tienes suficiente oro para pagar la cuota completa.' using errcode = '22023';
  end if;
  v_paid := v_total;

  v_next_gold := v_player.gold::bigint - v_total;
  update public.players
     set gold = v_next_gold::integer
   where id = v_player.id;

  for v_installment in
    select i.*
      from public.bank_loan_installments i
     where i.loan_id = v_loan.id
       and i.status in ('scheduled', 'in_mora')
       and i.due_at <= clock_timestamp()
     order by i.installment_number
     limit v_count
     for update
  loop
    update public.bank_loan_installments
       set status = 'paid', paid_at = clock_timestamp(), attempt_count = attempt_count + 1
     where id = v_installment.id;
  end loop;

  select coalesce(sum(i.amount_due_gold), 0)::integer
    into v_total
    from public.bank_loan_installments i
   where i.loan_id = v_loan.id
     and i.status in ('scheduled', 'in_mora');
  v_loan_paid := v_total = 0;

  update public.bank_loans
     set outstanding_due_gold = v_total,
         paid_installments = (
           select count(*)::integer from public.bank_loan_installments i
            where i.loan_id = v_loan.id and i.status = 'paid'
         ),
         status = case when v_loan_paid then 'paid' else
           case when exists (
             select 1 from public.bank_loan_installments i
              where i.loan_id = v_loan.id and i.status = 'in_mora'
           ) then 'in_mora' else 'active' end
         end,
         closed_at = case when v_loan_paid then clock_timestamp() else null end,
         updated_at = clock_timestamp()
   where id = v_loan.id;

  v_regularized_mora := v_had_mora and not exists (
    select 1
      from public.bank_loan_installments i
      join public.bank_loans l on l.id = i.loan_id
     where l.player_id = v_player.id and i.status = 'in_mora'
  );
  v_had_mora := v_had_mora or exists (
    select 1 from public.bank_loan_installments i
     join public.bank_loans l on l.id = i.loan_id
     where l.player_id = v_player.id and i.status = 'in_mora'
  );

  v_account := public.bank_apply_credit_progress(
    v_player.id,
    case when v_had_mora then 0 else p_installment_count end,
    case when v_loan_paid and not v_had_mora then 1 else 0 end,
    v_had_mora
  );

  insert into public.bank_transactions (
    player_id, operation_type, amount_gold, player_gold_after,
    reference_type, reference_id, idempotency_key, metadata
  ) values (
    v_player.id, 'loan_payment', -v_paid,
    v_next_gold::integer, 'bank_loan', v_loan.id, v_key,
    jsonb_build_object('result', jsonb_build_object(
      'loanId', v_loan.id,
      'paidGold', v_paid,
      'playerGold', v_next_gold::integer,
      'outstandingDueGold', v_total,
      'creditLimitGold', v_account.credit_limit_gold,
      'onTimeStreak', v_account.on_time_streak,
      'message', 'Cuota pagada correctamente.'
    ))
  ) returning id into v_transaction_id;

  perform public.bank_insert_notification(
    v_player.id,
    'Cuota pagada',
    format('Has pagado %s de oro de tu prestamo.', v_paid),
    -v_paid
  );

  if v_regularized_mora then
    perform public.bank_insert_notification(
      v_player.id,
      'Credito regularizado',
      'Tu mora fue regularizada. El acceso crediticio queda desbloqueado y tu racha se reinicia.',
      0
    );
  end if;

  return query select
    true,
    v_loan.id,
    v_paid,
    v_next_gold::integer,
    v_total,
    v_account.credit_limit_gold,
    v_account.on_time_streak,
    'Cuota pagada correctamente.'::text;
end;
$$;

notify pgrst, 'reload schema';
