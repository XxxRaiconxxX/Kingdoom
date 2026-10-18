-- Contrato y pruebas matematicas de Banco Fase 1.
-- Ejecutar despues de aplicar 20261017090000_bank_phase1.sql en una base de
-- pruebas Supabase/PostgreSQL. No crea ni modifica datos de jugadores.

do $$
declare
  v_definition text;
  v_security_definer boolean;
  v_deposit_30 numeric;
  v_deposit_365 numeric;
  v_payment numeric;
  v_create_loan_definition text;
  v_pay_loan_definition text;
  v_table_name text;
  v_signature text;
begin
  if to_regclass('public.bank_accounts') is null
     or to_regclass('public.bank_loans') is null
     or to_regclass('public.bank_loan_installments') is null
     or to_regclass('public.bank_transactions') is null then
    raise exception 'Faltan tablas del Banco Fase 1';
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.players'::regclass
       and conname = 'players_gold_nonnegative'
  ) then
    raise exception 'Falta la restriccion de oro no negativo';
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.bank_accounts'::regclass
       and pg_get_constraintdef(oid) like '%25000%'
  ) then
    raise exception 'Falta el limite de principal de depositos';
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.bank_transactions'::regclass
       and pg_get_constraintdef(oid) like '%idempotency_key%'
  ) then
    raise exception 'Falta la unicidad de idempotencia del ledger';
  end if;

  foreach v_signature in array array[
    'bank_get_snapshot(uuid)',
    'bank_deposit(uuid,integer,text)',
    'bank_withdraw_deposit(uuid,integer,text)',
    'bank_create_loan(uuid,integer,integer,text)',
    'bank_pay_loan(uuid,uuid,integer,text)',
    'bank_pay_loan_early(uuid,uuid,text)',
    'bank_collect_due_installments(text)'
  ] loop
    select p.prosecdef
      into v_security_definer
      from pg_proc p
     where p.oid = ('public.' || v_signature)::regprocedure;
    if not coalesce(v_security_definer, false) then
      raise exception 'La RPC % no es SECURITY DEFINER', v_signature;
    end if;
    if has_function_privilege('anon', ('public.' || v_signature)::regprocedure, 'EXECUTE') then
      raise exception 'La RPC % no debe ser ejecutable por anon', v_signature;
    end if;
    if not exists (
      select 1
        from pg_proc p
       where p.oid = ('public.' || v_signature)::regprocedure
         and 'search_path=public' = any(coalesce(p.proconfig, array[]::text[]))
    ) then
      raise exception 'La RPC % no fija search_path = public', v_signature;
    end if;
    select pg_get_functiondef(('public.' || v_signature)::regprocedure)
      into v_definition;
    if v_signature <> 'bank_get_snapshot(uuid)'
       and v_definition not like '%pg_advisory_xact_lock%' then
      raise exception 'La RPC % no contiene bloqueo advisory transaccional', v_signature;
    end if;
  end loop;

  foreach v_signature in array array[
    'bank_create_account_for_player()',
    'bank_reject_ledger_mutation()',
    'bank_add_calendar_months(timestamptz,integer)',
    'bank_assert_player_access(uuid)',
    'bank_ensure_account(uuid)',
    'bank_accrue_deposit(public.bank_accounts)',
    'bank_insert_notification(uuid,text,text,integer)',
    'bank_apply_credit_progress(uuid,integer,integer,boolean)'
  ] loop
    if has_function_privilege('anon', ('public.' || v_signature)::regprocedure, 'EXECUTE')
       or has_function_privilege('authenticated', ('public.' || v_signature)::regprocedure, 'EXECUTE') then
      raise exception 'El helper % no debe ser ejecutable por el cliente', v_signature;
    end if;
  end loop;

  select pg_get_functiondef('public.bank_create_loan(uuid,integer,integer,text)'::regprocedure)
    into v_create_loan_definition;
  -- Caso limite documentado: 253 oro, 12 meses, APR 12%. La construccion
  -- debe reservar capacidad principal futura y no depender de interes negativo
  -- en la ultima cuota despues del redondeo entero.
  if v_create_loan_definition not like '%v_future_capacity%'
     or v_create_loan_definition not like '%v_principal_floor%'
     or v_create_loan_definition not like '%v_principal_due := greatest%'
     or v_create_loan_definition not like '%v_interest_due := v_installment_amount - v_principal_due%' then
    raise exception 'bank_create_loan no contiene el ajuste de calendario para 253/12/APR 12%%';
  end if;
  if v_create_loan_definition not like '%v_amount is null or v_amount < 250%'
     or v_create_loan_definition not like '%v_term is null or v_term not in (3, 6, 12)%'
     or v_create_loan_definition not like '%metadata->>''amount''%'
     or v_create_loan_definition not like '%metadata->>''termMonths''%'
     or v_create_loan_definition not like '%errcode = ''23505''%' then
    raise exception 'bank_create_loan no contiene validacion/metadata de amount y termMonths';
  end if;

  select pg_get_functiondef('public.bank_pay_loan(uuid,uuid,integer,text)'::regprocedure)
    into v_pay_loan_definition;
  if v_pay_loan_definition like '%v.player.id%'
     or v_pay_loan_definition not like '%v_installment.status = ''in_mora''%'
     or v_pay_loan_definition not like '%v_installment.due_at < clock_timestamp()%'
  then
    raise exception 'bank_pay_loan no trata correctamente una cuota vencida aun en estado scheduled';
  end if;

  foreach v_table_name in array array[
    'public.bank_accounts',
    'public.bank_loans',
    'public.bank_loan_installments',
    'public.bank_transactions'
  ] loop
    if has_table_privilege('anon', v_table_name, 'SELECT')
       or has_table_privilege('anon', v_table_name, 'INSERT')
       or has_table_privilege('anon', v_table_name, 'UPDATE')
       or has_table_privilege('anon', v_table_name, 'DELETE')
       or has_table_privilege('anon', v_table_name, 'TRUNCATE')
       or has_table_privilege('anon', v_table_name, 'REFERENCES')
       or has_table_privilege('anon', v_table_name, 'TRIGGER') then
      raise exception 'anon conserva privilegios sobre %', v_table_name;
    end if;
    if not has_table_privilege('authenticated', v_table_name, 'SELECT')
       or has_table_privilege('authenticated', v_table_name, 'INSERT')
       or has_table_privilege('authenticated', v_table_name, 'UPDATE')
       or has_table_privilege('authenticated', v_table_name, 'DELETE')
       or has_table_privilege('authenticated', v_table_name, 'TRUNCATE')
       or has_table_privilege('authenticated', v_table_name, 'REFERENCES')
       or has_table_privilege('authenticated', v_table_name, 'TRIGGER') then
      raise exception 'authenticated no tiene exactamente SELECT sobre %', v_table_name;
    end if;
  end loop;

  -- APY efectivo 4.8%: limites de referencia aprobados.
  v_deposit_30 := 300 * (power(1.048::numeric, 30 / 365.0) - 1);
  v_deposit_365 := 10000 * (power(1.048::numeric, 1) - 1);
  if v_deposit_30 < 1.10 or v_deposit_30 > 1.22 then
    raise exception 'Interes de 300 a 30 dias fuera de rango: %', v_deposit_30;
  end if;
  if v_deposit_365 < 479.9 or v_deposit_365 > 480.1 then
    raise exception 'Interes de 10000 a 365 dias fuera de rango: %', v_deposit_365;
  end if;

  -- Cuota amortizada de 1500 al 18% durante 12 meses: ~137.52.
  v_payment := 1500 * (0.18 / 12) / (1 - power(1 + 0.18 / 12, -12));
  if v_payment < 137.4 or v_payment > 137.7 then
    raise exception 'Cuota amortizada fuera de rango: %', v_payment;
  end if;

  if not exists (
    select 1 from pg_trigger
     where tgrelid = 'public.bank_transactions'::regclass
       and tgname = 'bank_transactions_append_only_update'
  ) then
    raise exception 'Falta el trigger append-only del ledger';
  end if;

end;
$$;
