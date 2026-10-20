-- VERSIONADA PARA APLICACION CONTROLADA. Validada localmente con T4/PGlite y matematica semanal.
-- Fase T4: Banco V2. No se ejecuta porque T0 no pudo levantar un PostgreSQL
-- aislado; los cambios de comportamiento están explícitamente desactivados.
-- No contiene UPDATE de saldos existentes ni cambia players.gold a bigint.
-- Las definiciones vivas se consultaron en solo lectura el 2026-10-18.

/*
FINGERPRINT D2 NORMALIZADA DE LAS 15 FUNCIONES VIVAS
(normalización: quitar CR, saltos LF, espacios finales por línea y salto final)

bank_accrue_deposit(public.bank_accounts)                              44ed81aff7ef16f5b24877b2555f175d  len 976
bank_add_calendar_months(timestamptz, integer)                         0cb67efbd73604545533db9a1aa42644  len 937
bank_apply_credit_progress(uuid, integer, integer, boolean)             8a591ab500c7b7299a251819d8da4c13  len 2591
bank_assert_player_access(uuid)                                         1d206c0a25ede37d7110c306dab7a321  len 886
bank_collect_due_installments(text)                                    710754a36639643edb07fb5c6423384b  len 7654
bank_create_account_for_player()                                       7643e90e56a9f246ee46d5c3025c6385  len 301
bank_create_loan(uuid, integer, integer, text)                          ac17fb54aa3f7efa4fed85781b821ffd  len 7934
bank_deposit(uuid, integer, text)                                       25b6f0f9ba162c3c65637eb2b3b2666d  len 3434
bank_ensure_account(uuid)                                               e1de2156f8b312f6d6831b5a1b66175c  len 596
bank_get_snapshot(uuid)                                                 3aec20c52145db501b0f414c15ef0efb  len 2523
bank_insert_notification(uuid, text, text, integer)                     0169680a9ac84f560aef34724e5a070f  len 471
bank_pay_loan(uuid, uuid, integer, text)                                 487dc9cf5ba74c6429e8bb0ff4bc1ccc  len 6789
bank_pay_loan_early(uuid, uuid, text)                                   c2e2837b75f2abfaa7a5b07ceff475b0  len 6233
bank_reject_ledger_mutation()                                           4376fefeae1f1f61f6cd5fb4b29db6c3  len 261
bank_withdraw_deposit(uuid, integer, text)                              f824f96184078c8770a2dce20ab751b7  len 5261

El archivo no se puede considerar rollback exacto hasta conservar los 15 cuerpos
completos de pg_get_functiondef en DEFINICIONES_VIVAS/. Ese paso quedó pendiente
por la condición T0 y se bloquea cualquier aplicación.
*/

-- Constantes de diseño aprobadas para la propuesta.
-- No son cambios efectivos mientras este archivo conserve la extensión .PROPUESTA.
-- CREDIT_INITIAL_MIN: 1000000; CREDIT_LIMIT_MAX: 5000000.
-- WEEKLY_TERMS: 4, 8, 12; WEEKLY_CADENCE_DAYS: 7.
-- LEGACY_CADENCE_DAYS: 30 para filas existentes; no reprogramar cuotas mensuales abiertas.
-- APR_BY_CREDIT_TIER (fuente viva: bank_phase1.sql:78 y bank_v2.sql:898-902):
--   tier 0 = 1800 bps (18% anual, predeterminado), tier 1 = 1500 bps (15%),
--   tier 2 = 1200 bps (12%). El cliente no puede elegir un APR distinto a su tier.
-- APR_PERIODS: apr_bps / 10000 / 52.
-- GRACE_HOURS: 48.
-- ACCOUNT_AGE_DAYS_BEFORE_FULL_LIMIT: 7.
-- PRE_AGE_LIMIT: 100000.
-- GLOBAL_DAILY_LOAN_CAP: 5000000 (regla configurable antes de activar).
-- INTEGER_MAX: 2147483647.

-- DDL propuesto, pendiente de pruebas de compatibilidad con las filas históricas.
-- ALTER TABLE public.bank_accounts
--   DROP CONSTRAINT IF EXISTS bank_accounts_credit_limit_gold_check;
-- ALTER TABLE public.bank_accounts
--   ADD CONSTRAINT bank_accounts_credit_limit_gold_check
--   CHECK (credit_limit_gold >= 1000000 AND credit_limit_gold <= 5000000);
-- ALTER TABLE public.bank_loans ADD COLUMN IF NOT EXISTS cadence_days integer;
-- ALTER TABLE public.bank_loans ADD COLUMN IF NOT EXISTS term_weeks integer;
-- ALTER TABLE public.bank_loans ADD COLUMN IF NOT EXISTS request_hash text;
-- ALTER TABLE public.bank_loan_installments ADD COLUMN IF NOT EXISTS request_hash text;
-- ALTER TABLE public.bank_transactions ADD COLUMN IF NOT EXISTS request_hash text;
-- ALTER TABLE public.bank_loans
--   ADD CONSTRAINT bank_loans_cadence_days_check
--   CHECK (cadence_days IN (7, 30));
-- ALTER TABLE public.bank_loans
--   ADD CONSTRAINT bank_loans_term_weeks_check
--   CHECK (term_weeks IS NULL OR term_weeks IN (4, 8, 12));
-- No se ejecuta el UPDATE de cuentas existentes a 1000000.

create table if not exists public.bank_daily_loan_totals (
  date_key date primary key,
  total_disbursed_gold bigint not null default 0 check (total_disbursed_gold >= 0),
  updated_at timestamptz not null default clock_timestamp()
);
alter table public.bank_daily_loan_totals enable row level security;
revoke all on table public.bank_daily_loan_totals from public, anon, authenticated;
-- Esta tabla solo se crea al activar la migración; el bloque sigue siendo propuesta.

-- Contrato de las 15 funciones, partiendo de los cuerpos vivos anteriores:
--
-- 1  bank_create_account_for_player(): trigger; fija search_path y no cambia semántica.
-- 2  bank_reject_ledger_mutation(): append-only; fija search_path.
-- 3  bank_add_calendar_months(): se conserva para filas legacy de 30 días.
-- 4  bank_assert_player_access(uuid): identidad auth.uid()/link y FOR UPDATE.
-- 5  bank_ensure_account(uuid): mantiene creación/lock de cuenta.
-- 6  bank_accrue_deposit(bank_accounts): cálculos numeric; cast solo tras validar integer.
-- 7  bank_insert_notification(...): mantiene notificaciones de operaciones.
-- 8  bank_apply_credit_progress(...): regla A nueva: el límite solo sube con
--    2 cuotas puntuales o préstamo con >=14 días; progreso cada 6 cuotas o préstamo
--    completado sin mora; tiers reescalados y nunca sobre 5000000.
-- 9  bank_get_snapshot(uuid): devuelve cadenceDays, weeklyTerm, nextDueAt,
--    liquidationFee y límites; no expone filas de otro jugador.
-- 10 bank_deposit(uuid, integer, text): conserva firma vieja, identidad y
--    idempotencia histórica; requestHash nuevo; toda suma en bigint.
-- 11 bank_withdraw_deposit(uuid, integer, text): misma compatibilidad y chequeo
--    explícito de INTEGER_MAX antes del cast.
-- 12 bank_create_loan(uuid, integer, integer, text): conserva para cliente viejo
--    con meses hasta despliegue del cliente nuevo; nuevas filas semanales deben
--    entrar por una variante opcional/función nueva y no reinterpretar meses.
-- 13 bank_pay_loan(uuid, uuid, integer, text): paga cuotas vencidas según
--    cadence_days; gracia de 48 h y aviso previo; requestHash falla cerrado si
--    la fila histórica no tiene huella verificable.
-- 14 bank_pay_loan_early(uuid, uuid, text): comisión mínima igual al interés de
--    una cuota semanal si la primera cuota no venció; si interés proporcional es
--    mayor, cobra el proporcional; regla A nueva y sin interés futuro no ganado.
-- 15 bank_collect_due_installments(text): scheduler idempotente; no marca mora
--    antes de 48 h de gracia y aviso; cadencia 7 para nuevas filas y 30 para legacy.
--
-- Matemática semanal obligatoria:
--   rate_period = apr_bps::numeric / 10000 / 52
--   payment_exact = principal * rate_period /
--                   (1 - power(1 + rate_period, -term_weeks))
--   cuotas 1..n-1 redondeadas con bigint/numeric;
--   cuota n = total_due - suma(cuotas anteriores);
--   suma principal = principal y suma cuotas = total_due exactos.
--
-- Idempotencia:
--   requestHash = md5(canonical JSON de todos los parámetros de intención).
--   Misma clave + misma huella devuelve el resultado histórico.
--   Misma clave + huella diferente falla cerrado, incluso si la fila histórica
--   no contiene metadata suficiente para comparar.
--
-- Mercado, transferencias y pujas: assert_not_in_mora se documenta en una
-- propuesta separada; no se incluye dentro de bank_v2 ni modifica RPCs existentes.

-- ACL objetivo: las funciones de usuario solo authenticated/service_role;
-- helpers internos sin EXECUTE para public/anon/authenticated. No se ejecuta
-- ningún REVOKE de increment_gold aquí.

-- ROLLBACK comentado y bloqueado hasta tener snapshots completos:
-- 1. detener el scheduler nuevo;
-- 2. restaurar los 15 cuerpos desde DEFINICIONES_VIVAS/ y sus ACL live;
-- 3. retirar columnas nuevas solo si no contienen datos de operaciones activas;
-- 4. retirar bank_daily_loan_totals solo después de exportar su agregado;
-- 5. no borrar ni reprogramar cuotas existentes;
-- 6. no ejecutar DROP TABLE sobre bank_* con filas.


-- BEGIN LIVE BANK FUNCTION BODIES
-- Copia de los 15 cuerpos vivos de Fase 1, con search_path fijo.
-- Las firmas legacy se conservan para compatibilidad; las variantes semanales nuevas
-- se definen después y no reinterpretan meses existentes.
create or replace function public.bank_create_account_for_player()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  insert into public.bank_accounts (player_id)
  values (new.id)
  on conflict (player_id) do nothing;
  return new;
end;
$$;

drop trigger if exists bank_create_account_after_player_insert on public.players;
create trigger bank_create_account_after_player_insert
after insert on public.players
for each row execute function public.bank_create_account_for_player();

create or replace function public.bank_reject_ledger_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  raise exception 'El ledger bancario es append-only.' using errcode = '42501';
end;
$$;

drop trigger if exists bank_transactions_append_only_update on public.bank_transactions;
create trigger bank_transactions_append_only_update
before update or delete on public.bank_transactions
for each row execute function public.bank_reject_ledger_mutation();

-- Fechas de cuotas en UTC, con ajuste seguro para dias 29/30/31.
create or replace function public.bank_add_calendar_months(
  p_base timestamptz,
  p_months integer
)
returns timestamptz
language plpgsql
immutable
strict
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_source_date date;
  v_target_month date;
  v_last_day date;
  v_day integer;
begin
  if p_months < 0 then
    raise exception 'Los meses no pueden ser negativos.' using errcode = '22023';
  end if;

  v_source_date := (p_base at time zone 'UTC')::date;
  v_day := extract(day from v_source_date)::integer;
  v_target_month := (
    date_trunc('month', v_source_date::timestamp)
    + make_interval(months => p_months)
  )::date;
  v_last_day := (
    date_trunc('month', v_target_month::timestamp + interval '1 month')
    - interval '1 day'
  )::date;

  return (
    least(
      v_target_month + (v_day - 1),
      v_last_day
    )::timestamp at time zone 'UTC'
  );
end;
$$;

create or replace function public.bank_assert_player_access(p_player_id uuid)
returns public.players
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_player public.players;
begin
  if v_auth_user_id is null then
    raise exception 'Debes iniciar sesion segura para usar el Banco.' using errcode = '42501';
  end if;

  select p.*
    into v_player
    from public.players p
   where p.id = p_player_id
     and (
       p.auth_user_id = v_auth_user_id
       or exists (
         select 1
           from public.player_auth_links pal
          where pal.player_id = p.id
            and pal.auth_user_id = v_auth_user_id
       )
     )
   for update;

  if not found then
    raise exception 'Tu cuenta segura no coincide con este jugador.' using errcode = '42501';
  end if;

  return v_player;
end;
$$;

create or replace function public.bank_ensure_account(p_player_id uuid)
returns public.bank_accounts
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_account public.bank_accounts;
begin
  insert into public.bank_accounts (player_id)
  values (p_player_id)
  on conflict (player_id) do nothing;

  select a.*
    into v_account
    from public.bank_accounts a
   where a.player_id = p_player_id
   for update;

  if not found then
    raise exception 'No se pudo abrir la cuenta bancaria.' using errcode = 'P0001';
  end if;

  return v_account;
end;
$$;

create or replace function public.bank_accrue_deposit(p_account public.bank_accounts)
returns public.bank_accounts
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_elapsed_seconds numeric;
  v_accrued numeric;
  v_residue numeric;
  v_account public.bank_accounts;
begin
  v_elapsed_seconds := greatest(
    extract(epoch from (v_now - p_account.deposit_last_accrued_at)),
    0
  );
  v_accrued := p_account.deposit_principal_gold::numeric
    * (
      power(
        1.048::numeric,
        v_elapsed_seconds / 31536000::numeric
      ) - 1
    );
  v_residue := round(
    greatest(p_account.deposit_interest_residue + v_accrued, 0),
    8
  );

  update public.bank_accounts
     set deposit_interest_residue = v_residue,
         deposit_last_accrued_at = v_now,
         updated_at = v_now
   where player_id = p_account.player_id
   returning * into v_account;

  return v_account;
end;
$$;

create or replace function public.bank_insert_notification(
  p_player_id uuid,
  p_title text,
  p_message text,
  p_amount integer
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  insert into public.player_notifications (
    player_id,
    sender_name,
    kind,
    title,
    message,
    amount
  ) values (
    p_player_id,
    'Banco del Reino',
    'gold',
    p_title,
    p_message,
    p_amount
  );
end;
$$;

create or replace function public.bank_apply_credit_progress(
  p_player_id uuid,
  p_on_time_installments integer,
  p_liquidated_loans integer,
  p_reset_streak boolean
)
returns public.bank_accounts
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_account public.bank_accounts;
  v_old_streak integer;
  v_new_streak integer;
  v_credit_limit integer;
  v_step integer;
  v_has_mora boolean;
begin
  select a.*
    into v_account
    from public.bank_accounts a
   where a.player_id = p_player_id
   for update;

  if not found then
    raise exception 'Cuenta bancaria inexistente.' using errcode = 'P0001';
  end if;

  v_has_mora := exists (
    select 1
      from public.bank_loans l
      join public.bank_loan_installments i on i.loan_id = l.id
     where l.player_id = p_player_id
       and i.status = 'in_mora'
  );

  if coalesce(p_reset_streak, false) then
    v_old_streak := 0;
    v_new_streak := 0;
    v_credit_limit := v_account.credit_limit_gold;
    update public.bank_accounts
       set on_time_streak = 0,
           credit_tier = 0,
           last_delinquency_at = case
             when v_has_mora then coalesce(last_delinquency_at, clock_timestamp())
             else null
           end,
           updated_at = clock_timestamp()
     where player_id = p_player_id
     returning * into v_account;
    return v_account;
  end if;

  v_old_streak := v_account.on_time_streak;
  v_new_streak := v_old_streak + greatest(coalesce(p_on_time_installments, 0), 0);
  v_credit_limit := v_account.credit_limit_gold;

  if p_on_time_installments > 0 then
    for v_step in (v_old_streak + 1)..v_new_streak loop
      if mod(v_step, 3) = 0 then
        v_credit_limit := least(
          12000,
          greatest(3500, round(v_credit_limit * 1.10)::integer)
        );
      end if;
    end loop;
  end if;

  if greatest(coalesce(p_liquidated_loans, 0), 0) > 0 then
    for v_step in 1..p_liquidated_loans loop
      v_credit_limit := least(
        12000,
        greatest(3500, round(v_credit_limit * 1.15)::integer)
      );
    end loop;
  end if;

  update public.bank_accounts
     set on_time_streak = v_new_streak,
         credit_tier = case
           when v_new_streak >= 9 then 2
           when v_new_streak >= 3 then 1
           else 0
         end,
         credit_limit_gold = v_credit_limit,
         last_delinquency_at = case when v_has_mora then last_delinquency_at else null end,
         updated_at = clock_timestamp()
   where player_id = p_player_id
   returning * into v_account;

  return v_account;
end;
$$;

create or replace function public.bank_get_snapshot(p_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player public.players;
  v_account public.bank_accounts;
  v_exposure integer;
  v_loans jsonb;
  v_installments jsonb;
  v_transactions jsonb;
begin
  v_player := public.bank_assert_player_access(p_player_id);
  v_account := public.bank_ensure_account(v_player.id);
  v_account := public.bank_accrue_deposit(v_account);

  v_exposure := coalesce(
    (
      select sum(l.outstanding_due_gold)::integer
        from public.bank_loans l
       where l.player_id = v_player.id
         and l.status in ('active', 'in_mora')
    ),
    0
  );

  select coalesce(
    jsonb_agg(to_jsonb(l) order by l.created_at desc),
    '[]'::jsonb
  ) into v_loans
  from public.bank_loans l
  where l.player_id = v_player.id;

  select coalesce(
    jsonb_agg(to_jsonb(i) order by i.due_at, i.installment_number),
    '[]'::jsonb
  ) into v_installments
  from public.bank_loan_installments i
  join public.bank_loans l on l.id = i.loan_id
  where l.player_id = v_player.id;

  select coalesce(
    jsonb_agg(to_jsonb(t) order by t.created_at desc),
    '[]'::jsonb
  ) into v_transactions
  from (
    select t.*
      from public.bank_transactions t
     where t.player_id = v_player.id
     order by t.created_at desc
     limit 100
  ) t;

  return jsonb_build_object(
    'player', jsonb_build_object(
      'id', v_player.id,
      'gold', v_player.gold
    ),
    'account', jsonb_build_object(
      'playerId', v_account.player_id,
      'depositPrincipalGold', v_account.deposit_principal_gold,
      'depositInterestResidue', v_account.deposit_interest_residue,
      'depositBalanceGold', v_account.deposit_principal_gold
        + floor(v_account.deposit_interest_residue)::integer,
      'depositLastAccruedAt', v_account.deposit_last_accrued_at,
      'creditLimitGold', v_account.credit_limit_gold,
      'onTimeStreak', v_account.on_time_streak,
      'creditTier', v_account.credit_tier,
      'lastDelinquencyAt', v_account.last_delinquency_at
    ),
    'credit', jsonb_build_object(
      'exposureGold', v_exposure,
      'availableLimitGold', greatest(v_account.credit_limit_gold - v_exposure, 0),
      'aprBps', case v_account.credit_tier
        when 2 then 1200
        when 1 then 1500
        else 1800
      end
    ),
    'loans', v_loans,
    'installments', v_installments,
    'transactions', v_transactions
  );
end;
$$;

create or replace function public.bank_deposit(
  p_player_id uuid,
  p_amount integer,
  p_idempotency_key text
)
returns table (
  success boolean,
  transaction_id uuid,
  player_gold integer,
  deposit_principal_gold integer,
  deposit_interest_residue numeric,
  message text
)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player public.players;
  v_account public.bank_accounts;
  v_existing public.bank_transactions;
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_amount integer := p_amount;
  v_next_gold bigint;
  v_transaction_id uuid;
begin
  if v_key = '' or length(v_key) > 200 or v_amount is null or v_amount < 300 then
    raise exception 'El deposito minimo es de 300 de oro y requiere una clave valida.' using errcode = '22023';
  end if;

  v_player := public.bank_assert_player_access(p_player_id);
  perform pg_advisory_xact_lock(
    hashtextextended(format('kingdoom:bank:deposit:%s:%s', v_player.id, v_key), 0)
  );
  v_account := public.bank_ensure_account(v_player.id);

  select * into v_existing
    from public.bank_transactions
   where player_id = v_player.id and idempotency_key = v_key;
  if found then
    if v_existing.operation_type <> 'deposit' then
      raise exception 'La clave de idempotencia ya pertenece a otra operacion.' using errcode = '23505';
    end if;
    return query select
      true,
      v_existing.id,
      (v_existing.metadata->'result'->>'playerGold')::integer,
      (v_existing.metadata->'result'->>'depositPrincipalGold')::integer,
      (v_existing.metadata->'result'->>'depositInterestResidue')::numeric,
      coalesce(v_existing.metadata->'result'->>'message', 'Deposito ya procesado.');
    return;
  end if;

  v_account := public.bank_accrue_deposit(v_account);
  if v_account.deposit_principal_gold + v_amount > 25000 then
    raise exception 'El principal protegido no puede superar 25000 de oro.' using errcode = '22023';
  end if;
  if v_player.gold < v_amount then
    raise exception 'No tienes suficiente oro para depositar.' using errcode = '22023';
  end if;

  v_next_gold := v_player.gold::bigint - v_amount;
  update public.players
     set gold = v_next_gold::integer
   where id = v_player.id;
  update public.bank_accounts as a
     set deposit_principal_gold = a.deposit_principal_gold + v_amount,
         updated_at = clock_timestamp()
   where a.player_id = v_player.id
   returning a.* into v_account;

  insert into public.bank_transactions (
    player_id, operation_type, amount_gold, player_gold_after,
    reference_type, reference_id, idempotency_key, metadata
  ) values (
    v_player.id, 'deposit', -v_amount, v_next_gold::integer,
    'bank_account', v_player.id, v_key,
    jsonb_build_object('result', jsonb_build_object(
      'playerGold', v_next_gold::integer,
      'depositPrincipalGold', v_account.deposit_principal_gold,
      'depositInterestResidue', v_account.deposit_interest_residue,
      'message', 'Deposito realizado correctamente.'
    ))
  ) returning id into v_transaction_id;

  perform public.bank_insert_notification(
    v_player.id,
    'Deposito realizado',
    format('Has protegido %s de oro en el Banco del Reino.', v_amount),
    -v_amount
  );

  return query select
    true,
    v_transaction_id,
    v_next_gold::integer,
    v_account.deposit_principal_gold,
    v_account.deposit_interest_residue,
    'Deposito realizado correctamente.'::text;
end;
$$;

create or replace function public.bank_withdraw_deposit(
  p_player_id uuid,
  p_amount integer,
  p_idempotency_key text
)
returns table (
  success boolean,
  transaction_id uuid,
  player_gold integer,
  deposit_principal_gold integer,
  deposit_interest_residue numeric,
  withdrawn_interest_gold integer,
  message text
)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player public.players;
  v_account public.bank_accounts;
  v_existing public.bank_transactions;
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_amount integer := p_amount;
  v_principal_withdraw integer;
  v_interest_withdraw integer;
  v_next_gold bigint;
  v_transaction_id uuid;
begin
  if v_key = '' or length(v_key) > 180 or v_amount is null or v_amount <= 0 then
    raise exception 'El retiro debe ser positivo y requiere una clave valida.' using errcode = '22023';
  end if;

  v_player := public.bank_assert_player_access(p_player_id);
  perform pg_advisory_xact_lock(
    hashtextextended(format('kingdoom:bank:withdraw_deposit:%s:%s', v_player.id, v_key), 0)
  );
  v_account := public.bank_ensure_account(v_player.id);

  select * into v_existing
    from public.bank_transactions
   where player_id = v_player.id and idempotency_key = v_key;
  if found then
    if v_existing.operation_type not in ('withdrawal', 'interest_credit') then
      raise exception 'La clave de idempotencia ya pertenece a otra operacion.' using errcode = '23505';
    end if;
    return query select
      true,
      v_existing.id,
      (v_existing.metadata->'result'->>'playerGold')::integer,
      (v_existing.metadata->'result'->>'depositPrincipalGold')::integer,
      (v_existing.metadata->'result'->>'depositInterestResidue')::numeric,
      (v_existing.metadata->'result'->>'withdrawnInterestGold')::integer,
      coalesce(v_existing.metadata->'result'->>'message', 'Retiro ya procesado.');
    return;
  end if;

  v_account := public.bank_accrue_deposit(v_account);
  if v_amount > v_account.deposit_principal_gold
      + floor(v_account.deposit_interest_residue)::integer then
    raise exception 'El retiro supera el saldo protegido disponible.' using errcode = '22023';
  end if;

  v_principal_withdraw := least(v_amount, v_account.deposit_principal_gold);
  v_interest_withdraw := v_amount - v_principal_withdraw;
  v_next_gold := v_player.gold::bigint + v_amount;
  if v_next_gold > 2147483647 then
    raise exception 'El oro resultante queda fuera de rango.' using errcode = '22023';
  end if;

  update public.players
     set gold = v_next_gold::integer
   where id = v_player.id;
  update public.bank_accounts as a
     set deposit_principal_gold = a.deposit_principal_gold - v_principal_withdraw,
         deposit_interest_residue = round(
           greatest(a.deposit_interest_residue - v_interest_withdraw, 0),
           8
         ),
         updated_at = clock_timestamp()
   where a.player_id = v_player.id
   returning a.* into v_account;

  if v_principal_withdraw > 0 and v_interest_withdraw > 0 then
    insert into public.bank_transactions (
      player_id, operation_type, amount_gold, player_gold_after,
      reference_type, reference_id, idempotency_key, metadata
    ) values (
      v_player.id, 'withdrawal', v_principal_withdraw,
      (v_player.gold + v_principal_withdraw),
      'bank_account', v_player.id, v_key || ':principal',
      '{}'::jsonb
    );
  end if;

  if v_interest_withdraw > 0 then
    insert into public.bank_transactions (
      player_id, operation_type, amount_gold, player_gold_after,
      reference_type, reference_id, idempotency_key, metadata
    ) values (
      v_player.id, 'interest_credit', v_interest_withdraw, v_next_gold::integer,
      'bank_account', v_player.id, v_key,
      jsonb_build_object('result', jsonb_build_object(
        'playerGold', v_next_gold::integer,
        'depositPrincipalGold', v_account.deposit_principal_gold,
        'depositInterestResidue', v_account.deposit_interest_residue,
        'withdrawnInterestGold', v_interest_withdraw,
        'message', 'Retiro realizado correctamente.'
      ))
    ) returning id into v_transaction_id;
  else
    insert into public.bank_transactions (
      player_id, operation_type, amount_gold, player_gold_after,
      reference_type, reference_id, idempotency_key, metadata
    ) values (
      v_player.id, 'withdrawal', v_principal_withdraw, v_next_gold::integer,
      'bank_account', v_player.id, v_key,
      jsonb_build_object('result', jsonb_build_object(
        'playerGold', v_next_gold::integer,
        'depositPrincipalGold', v_account.deposit_principal_gold,
        'depositInterestResidue', v_account.deposit_interest_residue,
        'withdrawnInterestGold', 0,
        'message', 'Retiro realizado correctamente.'
      ))
    ) returning id into v_transaction_id;
  end if;

  perform public.bank_insert_notification(
    v_player.id,
    'Retiro de deposito',
    format('Has retirado %s de oro del Banco del Reino.', v_amount),
    v_amount
  );

  return query select
    true,
    v_transaction_id,
    v_next_gold::integer,
    v_account.deposit_principal_gold,
    v_account.deposit_interest_residue,
    v_interest_withdraw,
    'Retiro realizado correctamente.'::text;
end;
$$;

create or replace function public.bank_create_loan(
  p_player_id uuid,
  p_amount integer,
  p_term_months integer,
  p_idempotency_key text
)
returns table (
  success boolean,
  loan_id uuid,
  player_gold integer,
  total_due_gold integer,
  outstanding_due_gold integer,
  credit_limit_gold integer,
  apr_bps integer,
  message text
)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player public.players;
  v_account public.bank_accounts;
  v_existing public.bank_transactions;
  v_loan public.bank_loans;
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_amount integer := p_amount;
  v_term integer := p_term_months;
  v_apr_bps integer;
  v_monthly_rate numeric;
  v_payment_exact numeric;
  v_total_due integer;
  v_installment_amount integer;
  v_interest_due integer;
  v_principal_due integer;
  v_remaining_principal integer;
  v_sum_due integer := 0;
  v_future_capacity integer;
  v_principal_floor integer;
  v_exposure integer := 0;
  v_next_gold bigint;
  v_loan_id uuid;
  v_loan_cursor uuid;
  v_installment_number integer;
  v_due_at timestamptz;
begin
  if v_key = '' or length(v_key) > 200
     or v_amount is null or v_amount < 250
     or v_term is null or v_term not in (3, 6, 12) then
    raise exception 'El prestamo requiere al menos 250 de oro, un plazo valido y una clave valida.'
      using errcode = '22023';
  end if;

  v_player := public.bank_assert_player_access(p_player_id);
  perform pg_advisory_xact_lock(
    hashtextextended(format('kingdoom:bank:create_loan:%s:%s', v_player.id, v_key), 0)
  );
  v_account := public.bank_ensure_account(v_player.id);

  select * into v_existing
    from public.bank_transactions
   where player_id = v_player.id and idempotency_key = v_key;
  if found then
    if v_existing.operation_type <> 'loan_disbursement'
       or v_existing.metadata->>'amount' is distinct from v_amount::text
       or v_existing.metadata->>'termMonths' is distinct from v_term::text then
      raise exception 'La clave de idempotencia ya pertenece a un prestamo con otros parametros.'
        using errcode = '23505';
    end if;
    return query select
      true,
      (v_existing.metadata->'result'->>'loanId')::uuid,
      (v_existing.metadata->'result'->>'playerGold')::integer,
      (v_existing.metadata->'result'->>'totalDueGold')::integer,
      (v_existing.metadata->'result'->>'outstandingDueGold')::integer,
      (v_existing.metadata->'result'->>'creditLimitGold')::integer,
      (v_existing.metadata->'result'->>'aprBps')::integer,
      coalesce(v_existing.metadata->'result'->>'message', 'Prestamo ya procesado.');
    return;
  end if;

  if exists (
    select 1
      from public.bank_loans l
      join public.bank_loan_installments i on i.loan_id = l.id
     where l.player_id = v_player.id
       and i.status = 'in_mora'
  ) then
    raise exception 'Debes regularizar tus cuotas en mora antes de solicitar otro prestamo.'
      using errcode = '22023';
  end if;

  -- Se mantiene el orden players -> bank_accounts -> loans -> installments.
  for v_loan_cursor in
    select l.id
      from public.bank_loans l
     where l.player_id = v_player.id
       and l.status in ('active', 'in_mora')
     order by l.id
     for update
  loop
    perform 1
      from public.bank_loan_installments i
     where i.loan_id = v_loan_cursor
     order by i.id
     for update;
  end loop;

  select coalesce(sum(l.outstanding_due_gold), 0)::integer
    into v_exposure
    from public.bank_loans l
   where l.player_id = v_player.id
     and l.status in ('active', 'in_mora');

  if v_exposure + v_amount > v_account.credit_limit_gold then
    raise exception 'El prestamo supera tu limite de exposicion disponible.' using errcode = '22023';
  end if;
  if v_player.gold::bigint + v_amount > 2147483647 then
    raise exception 'El oro resultante queda fuera de rango.' using errcode = '22023';
  end if;

  v_apr_bps := case v_account.credit_tier
    when 2 then 1200
    when 1 then 1500
    else 1800
  end;
  v_monthly_rate := v_apr_bps::numeric / 10000 / 12;
  v_payment_exact := v_amount::numeric * v_monthly_rate
    / (1 - power(1 + v_monthly_rate, -v_term));
  v_total_due := round(v_payment_exact * v_term)::integer;
  v_remaining_principal := v_amount;

  insert into public.bank_loans (
    player_id, principal_gold, apr_bps, term_months,
    total_due_gold, outstanding_due_gold, status
  ) values (
    v_player.id, v_amount, v_apr_bps, v_term,
    v_total_due, v_total_due, 'active'
  ) returning * into v_loan;
  v_loan_id := v_loan.id;

  for v_installment_number in 1..v_term loop
    if v_installment_number < v_term then
      v_installment_amount := greatest(1, round(v_payment_exact)::integer);
    else
      v_installment_amount := v_total_due - v_sum_due;
    end if;

    if v_installment_number < v_term then
      -- Reserva capacidad de las cuotas restantes para que la ultima nunca
      -- necesite intereses negativos por efecto del redondeo.
      v_future_capacity := v_total_due - v_sum_due - v_installment_amount;
      v_principal_floor := greatest(
        v_remaining_principal - v_future_capacity,
        0
      );
      v_interest_due := least(
        greatest(v_installment_amount - 1, 0),
        greatest(round(v_remaining_principal * v_monthly_rate)::integer, 0)
      );
      v_principal_due := v_installment_amount - v_interest_due;
      v_principal_due := greatest(v_principal_due, v_principal_floor);
      v_principal_due := least(
        v_principal_due,
        least(v_remaining_principal, v_installment_amount)
      );
      v_interest_due := v_installment_amount - v_principal_due;
    else
      v_principal_due := v_remaining_principal;
      v_interest_due := v_installment_amount - v_principal_due;
    end if;

    if v_principal_due < 0 or v_interest_due < 0
       or v_principal_due + v_interest_due <> v_installment_amount then
      raise exception 'No se pudo construir un calendario de cuotas entero.' using errcode = 'P0001';
    end if;

    v_due_at := public.bank_add_calendar_months(v_loan.created_at, v_installment_number);
    insert into public.bank_loan_installments (
      loan_id, installment_number, due_at,
      principal_due_gold, interest_due_gold, amount_due_gold
    ) values (
      v_loan_id, v_installment_number, v_due_at,
      v_principal_due, v_interest_due, v_installment_amount
    );

    v_remaining_principal := v_remaining_principal - v_principal_due;
    v_sum_due := v_sum_due + v_installment_amount;
  end loop;

  if v_remaining_principal <> 0 or v_sum_due <> v_total_due then
    raise exception 'El calendario no coincide con el total del prestamo.' using errcode = 'P0001';
  end if;

  v_next_gold := v_player.gold::bigint + v_amount;
  update public.players
     set gold = v_next_gold::integer
   where id = v_player.id;

  insert into public.bank_transactions (
    player_id, operation_type, amount_gold, player_gold_after,
    reference_type, reference_id, idempotency_key, metadata
  ) values (
    v_player.id, 'loan_disbursement', v_amount, v_next_gold::integer,
    'bank_loan', v_loan_id, v_key,
    jsonb_build_object(
      'amount', v_amount,
      'termMonths', v_term,
      'result', jsonb_build_object(
      'loanId', v_loan_id,
      'playerGold', v_next_gold::integer,
      'totalDueGold', v_total_due,
      'outstandingDueGold', v_total_due,
      'creditLimitGold', v_account.credit_limit_gold,
      'aprBps', v_apr_bps,
      'message', 'Prestamo aprobado correctamente.'
      )
    )
  );

  perform public.bank_insert_notification(
    v_player.id,
    'Prestamo aprobado',
    format('Has recibido %s de oro. La primera cuota vence en un mes.', v_amount),
    v_amount
  );

  return query select
    true,
    v_loan_id,
    v_next_gold::integer,
    v_total_due,
    v_total_due,
    v_account.credit_limit_gold,
    v_apr_bps,
    'Prestamo aprobado correctamente.'::text;
end;
$$;

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
set search_path = pg_catalog, public, pg_temp
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
    v_had_mora := v_had_mora or v_installment.status = 'in_mora';
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

create or replace function public.bank_pay_loan_early(
  p_player_id uuid,
  p_loan_id uuid,
  p_idempotency_key text
)
returns table (
  success boolean,
  loan_id uuid,
  paid_gold integer,
  player_gold integer,
  credit_limit_gold integer,
  on_time_streak integer,
  message text
)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player public.players;
  v_account public.bank_accounts;
  v_loan public.bank_loans;
  v_installment public.bank_loan_installments;
  v_existing public.bank_transactions;
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_principal integer := 0;
  v_interest_accrued numeric := 0;
  v_settlement integer;
  v_next_gold bigint;
  v_previous_due timestamptz;
  v_ratio numeric;
  v_had_mora boolean;
  v_regularized_mora boolean := false;
  v_transaction_id uuid;
begin
  if v_key = '' or length(v_key) > 200 then
    raise exception 'La clave de idempotencia es obligatoria.' using errcode = '22023';
  end if;

  v_player := public.bank_assert_player_access(p_player_id);
  perform pg_advisory_xact_lock(
    hashtextextended(format('kingdoom:bank:pay_loan_early:%s:%s', v_player.id, v_key), 0)
  );
  v_account := public.bank_ensure_account(v_player.id);

  select * into v_existing
    from public.bank_transactions
   where player_id = v_player.id and idempotency_key = v_key;
  if found then
    if v_existing.operation_type <> 'loan_early_payment' then
      raise exception 'La clave de idempotencia ya pertenece a otra operacion.' using errcode = '23505';
    end if;
    return query select
      true,
      (v_existing.metadata->'result'->>'loanId')::uuid,
      (v_existing.metadata->'result'->>'paidGold')::integer,
      (v_existing.metadata->'result'->>'playerGold')::integer,
      (v_existing.metadata->'result'->>'creditLimitGold')::integer,
      (v_existing.metadata->'result'->>'onTimeStreak')::integer,
      coalesce(v_existing.metadata->'result'->>'message', 'Liquidacion ya procesada.');
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

  v_had_mora := exists (
    select 1 from public.bank_loan_installments i
     where i.loan_id = v_loan.id and i.status = 'in_mora'
  );

  v_previous_due := v_loan.created_at;
  for v_installment in
    select i.*
      from public.bank_loan_installments i
     where i.loan_id = v_loan.id
       and i.status in ('scheduled', 'in_mora')
     order by i.installment_number
     for update
  loop
    v_principal := v_principal + v_installment.principal_due_gold;
    if clock_timestamp() >= v_installment.due_at then
      v_ratio := 1;
    else
      v_ratio := greatest(
        0,
        least(
          1,
          extract(epoch from (clock_timestamp() - v_previous_due))
            / greatest(extract(epoch from (v_installment.due_at - v_previous_due)), 1)
        )
      );
    end if;
    v_interest_accrued := v_interest_accrued
      + v_installment.interest_due_gold::numeric * v_ratio;
    v_previous_due := v_installment.due_at;
  end loop;

  v_settlement := v_principal + floor(v_interest_accrued)::integer;
  if v_settlement <= 0 then
    raise exception 'El prestamo no tiene saldo liquidable.' using errcode = '22023';
  end if;
  if v_player.gold < v_settlement then
    raise exception 'No tienes suficiente oro para liquidar el prestamo.' using errcode = '22023';
  end if;

  v_next_gold := v_player.gold::bigint - v_settlement;
  update public.players
     set gold = v_next_gold::integer
   where id = v_player.id;
  update public.bank_loan_installments as i
     set status = 'cancelled', paid_at = null, attempt_count = attempt_count + 1
   where i.loan_id = v_loan.id
     and i.status in ('scheduled', 'in_mora');
  update public.bank_loans
     set outstanding_due_gold = 0,
         paid_installments = (
           select count(*)::integer from public.bank_loan_installments i
            where i.loan_id = v_loan.id and i.status = 'paid'
         ),
         status = 'paid',
         closed_at = clock_timestamp(),
         updated_at = clock_timestamp()
   where id = v_loan.id;

  v_regularized_mora := v_had_mora and not exists (
    select 1
      from public.bank_loan_installments i
      join public.bank_loans l on l.id = i.loan_id
     where l.player_id = v_player.id and i.status = 'in_mora'
  );
  v_had_mora := v_had_mora or exists (
    select 1
      from public.bank_loan_installments i
      join public.bank_loans l on l.id = i.loan_id
     where l.player_id = v_player.id and i.status = 'in_mora'
  );

  v_account := public.bank_apply_credit_progress(
    v_player.id,
    0,
    case when v_had_mora then 0 else 1 end,
    v_had_mora
  );

  insert into public.bank_transactions (
    player_id, operation_type, amount_gold, player_gold_after,
    reference_type, reference_id, idempotency_key, metadata
  ) values (
    v_player.id, 'loan_early_payment', -v_settlement,
    v_next_gold::integer, 'bank_loan', v_loan.id, v_key,
    jsonb_build_object('result', jsonb_build_object(
      'loanId', v_loan.id,
      'paidGold', v_settlement,
      'playerGold', v_next_gold::integer,
      'creditLimitGold', v_account.credit_limit_gold,
      'onTimeStreak', v_account.on_time_streak,
      'message', 'Prestamo liquidado sin intereses futuros.'
    ))
  ) returning id into v_transaction_id;

  perform public.bank_insert_notification(
    v_player.id,
    'Prestamo liquidado',
    format('Has liquidado anticipadamente %s de oro. Los intereses futuros fueron eliminados.', v_settlement),
    -v_settlement
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
    v_settlement,
    v_next_gold::integer,
    v_account.credit_limit_gold,
    v_account.on_time_streak,
    'Prestamo liquidado sin intereses futuros.'::text;
end;
$$;

create or replace function public.bank_collect_due_installments(p_run_key text)
returns table (
  run_key text,
  processed_count integer,
  delinquent_count integer,
  collected_gold integer
)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_run_key text := trim(coalesce(p_run_key, ''));
  v_now timestamptz := clock_timestamp();
  v_player_id uuid;
  v_loan_id uuid;
  v_player public.players;
  v_account public.bank_accounts;
  v_loan public.bank_loans;
  v_installment public.bank_loan_installments;
  v_existing public.bank_transactions;
  v_key text;
  v_next_gold bigint;
  v_processed integer := 0;
  v_delinquent integer := 0;
  v_collected integer := 0;
  v_player_on_time integer;
  v_player_liquidations integer;
  v_player_had_late boolean;
  v_loan_had_late boolean;
  v_remaining integer;
  v_was_mora boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'El cobro automatico requiere service_role.' using errcode = '42501';
  end if;
  if v_run_key = '' or length(v_run_key) > 120 then
    raise exception 'El run_key del cobro automatico es obligatorio.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(
    hashtextextended(format('kingdoom:bank:collect_due_installments:%s', v_run_key), 0)
  );

  for v_player_id in
    select distinct l.player_id
      from public.bank_loans l
      join public.bank_loan_installments i on i.loan_id = l.id
     where l.status in ('active', 'in_mora')
       and i.status in ('scheduled', 'in_mora')
       and i.due_at <= v_now
     order by l.player_id
  loop
    -- Orden determinista: players -> bank_accounts -> loans -> installments.
    select p.* into v_player
      from public.players p
     where p.id = v_player_id
     for update;
    if not found then
      continue;
    end if;

    v_account := public.bank_ensure_account(v_player_id);
    v_player_on_time := 0;
    v_player_liquidations := 0;
    v_player_had_late := false;

    for v_loan_id in
      select l.id
        from public.bank_loans l
       where l.player_id = v_player_id
         and l.status in ('active', 'in_mora')
       order by l.id
       for update
    loop
      select l.* into v_loan from public.bank_loans l where l.id = v_loan_id;
      v_loan_had_late := exists (
        select 1 from public.bank_loan_installments i
         where i.loan_id = v_loan.id and i.status = 'in_mora'
      );

      for v_installment in
        select i.*
          from public.bank_loan_installments i
         where i.loan_id = v_loan.id
           and i.status in ('scheduled', 'in_mora')
           and i.due_at <= v_now
         order by i.installment_number
         for update
      loop
        v_key := format('collect:%s:%s', v_run_key, v_installment.id);
        select * into v_existing
          from public.bank_transactions
         where player_id = v_player_id and idempotency_key = v_key;
        if found then
          continue;
        end if;

        v_processed := v_processed + 1;
        v_was_mora := v_installment.status = 'in_mora';
        if v_player.gold < v_installment.amount_due_gold then
          update public.bank_loan_installments
             set status = 'in_mora', attempt_count = attempt_count + 1
           where id = v_installment.id;
          update public.bank_loans
             set status = 'in_mora', updated_at = v_now
           where id = v_loan.id;
          update public.bank_accounts
             set last_delinquency_at = coalesce(last_delinquency_at, v_now),
                 on_time_streak = 0,
                 credit_tier = 0,
                 updated_at = v_now
           where player_id = v_player_id;
          if not v_was_mora then
            v_delinquent := v_delinquent + 1;
            perform public.bank_insert_notification(
              v_player_id,
              'Cuota en mora',
              'No habia oro suficiente para cobrar la cuota completa. Tu credito queda bloqueado hasta regularizar.',
              0
            );
          end if;
          v_player_had_late := true;
          continue;
        end if;

        v_next_gold := v_player.gold::bigint - v_installment.amount_due_gold;
        update public.players
           set gold = v_next_gold::integer
         where id = v_player_id;
        v_player.gold := v_next_gold::integer;
        update public.bank_loan_installments
           set status = 'paid', paid_at = v_now, attempt_count = attempt_count + 1
         where id = v_installment.id;
        insert into public.bank_transactions (
          player_id, operation_type, amount_gold, player_gold_after,
          reference_type, reference_id, idempotency_key, metadata
        ) values (
          v_player_id, 'loan_payment', -v_installment.amount_due_gold,
          v_player.gold, 'bank_loan_installment', v_installment.id, v_key,
          jsonb_build_object('runKey', v_run_key, 'installmentId', v_installment.id)
        );
        v_collected := v_collected + v_installment.amount_due_gold;
        perform public.bank_insert_notification(
          v_player_id,
          'Cuota cobrada',
          format('Se cobro automaticamente una cuota de %s de oro.', v_installment.amount_due_gold),
          -v_installment.amount_due_gold
        );

        if v_was_mora then
          v_player_had_late := true;
        else
          v_player_on_time := v_player_on_time + 1;
        end if;
      end loop;

      select coalesce(sum(i.amount_due_gold), 0)::integer
        into v_remaining
        from public.bank_loan_installments i
       where i.loan_id = v_loan.id
         and i.status in ('scheduled', 'in_mora');
      update public.bank_loans
         set outstanding_due_gold = v_remaining,
             paid_installments = (
               select count(*)::integer from public.bank_loan_installments i
                where i.loan_id = v_loan.id and i.status = 'paid'
             ),
             status = case when v_remaining = 0 then 'paid' else
               case when exists (
                 select 1 from public.bank_loan_installments i
                  where i.loan_id = v_loan.id and i.status = 'in_mora'
               ) then 'in_mora' else 'active' end
             end,
             closed_at = case when v_remaining = 0 then coalesce(closed_at, v_now) else null end,
             updated_at = v_now
       where id = v_loan.id;
      if v_remaining = 0 and not v_loan_had_late then
        v_player_liquidations := v_player_liquidations + 1;
      end if;
    end loop;

    if v_player_had_late or exists (
      select 1
        from public.bank_loan_installments i
        join public.bank_loans l on l.id = i.loan_id
       where l.player_id = v_player_id and i.status = 'in_mora'
    ) then
      perform public.bank_apply_credit_progress(v_player_id, 0, 0, true);
      if v_player_had_late and not exists (
        select 1
          from public.bank_loan_installments i
          join public.bank_loans l on l.id = i.loan_id
         where l.player_id = v_player_id and i.status = 'in_mora'
      ) then
        perform public.bank_insert_notification(
          v_player_id,
          'Credito regularizado',
          'Tu mora fue regularizada. El acceso crediticio queda desbloqueado y tu racha se reinicia.',
          0
        );
      end if;
    elsif v_player_on_time > 0 or v_player_liquidations > 0 then
      perform public.bank_apply_credit_progress(
        v_player_id,
        v_player_on_time,
        v_player_liquidations,
        false
      );
    end if;
  end loop;

  return query select v_run_key, v_processed, v_delinquent, v_collected;
end;
$$;


-- END LIVE BANK FUNCTION BODIES

-- V2 aditivo para préstamos semanales. No reprograma filas mensuales existentes.
alter table public.bank_loans alter column term_months drop not null;
alter table public.bank_loans add column if not exists term_weeks integer;
alter table public.bank_loans add column if not exists cadence_days integer not null default 30;
alter table public.bank_loans add column if not exists request_hash text;
alter table public.bank_loan_installments add column if not exists request_hash text;
alter table public.bank_transactions add column if not exists request_hash text;

create or replace function public.bank_v2_current_player()
returns uuid language plpgsql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_uid uuid := auth.uid(); v_player uuid;
begin
  if coalesce(auth.role(), 'anon') not in ('authenticated','service_role') or v_uid is null then raise exception 'Sesión autenticada requerida.' using errcode='42501'; end if;
  select id into v_player from public.players where auth_user_id = v_uid limit 1;
  if v_player is null then select player_id into v_player from public.player_auth_links where auth_user_id = v_uid order by created_at limit 1; end if;
  if v_player is null then raise exception 'Jugador no vinculado.' using errcode='42501'; end if;
  return v_player;
end;
$$;

create or replace function public.bank_v2_assert_not_in_mora(p_player_id uuid)
returns void language plpgsql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if exists (select 1 from public.bank_loans where player_id=p_player_id and status='in_mora')
     or exists (select 1 from public.bank_loan_installments i join public.bank_loans l on l.id=i.loan_id where l.player_id=p_player_id and i.status='in_mora') then
    raise exception 'El jugador tiene una cuota en mora.' using errcode='42501';
  end if;
end;
$$;

-- Nuevo préstamo semanal: solo auth.uid(), 4/8/12 semanas y cálculos intermedios numeric/bigint.
create or replace function public.bank_create_weekly_loan(
  p_amount integer,
  p_term_weeks integer,
  p_request_hash text,
  p_apr_bps integer default null
)
returns jsonb language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player_id uuid := public.bank_v2_current_player();
  v_player public.players;
  v_account public.bank_accounts;
  v_loan_id uuid := gen_random_uuid();
  v_apr_bps integer;
  v_rate numeric;
  v_payment numeric;
  v_payment_int integer;
  v_total bigint := 0;
  v_principal_left bigint := p_amount;
  v_principal integer;
  v_interest integer;
  v_n integer := p_term_weeks;
  v_i integer;
  v_due timestamptz;
  v_next bigint;
  v_daily bigint;
  v_hash text;
  v_existing public.bank_transactions;
begin
  if p_amount is null or p_amount <= 0 or p_term_weeks not in (4,8,12)
     or (p_apr_bps is not null and p_apr_bps not in (1200,1500,1800))
     or length(trim(coalesce(p_request_hash,''))) < 8 then
    raise exception 'Parámetros de préstamo semanal inválidos.' using errcode='22023';
  end if;
  perform public.bank_v2_assert_not_in_mora(v_player_id);
  select * into v_player from public.players where id=v_player_id for update;
  if not found then raise exception 'Jugador no encontrado.' using errcode='P0002'; end if;
  select * into v_account from public.bank_accounts where player_id=v_player_id for update;
  if not found then v_account := public.bank_ensure_account(v_player_id); end if;
  v_apr_bps := case v_account.credit_tier
    when 2 then 1200
    when 1 then 1500
    else 1800
  end;
  if p_apr_bps is not null and p_apr_bps <> v_apr_bps then
    raise exception 'El APR no coincide con el tier de crédito.' using errcode='22023';
  end if;
  v_hash := md5(format('weekly|%s|%s|%s|%s', p_amount,p_term_weeks,p_request_hash,v_apr_bps));
  select * into v_existing from public.bank_transactions where player_id=v_player_id and idempotency_key=trim(p_request_hash) for update;
  if found then
    if coalesce(v_existing.metadata->>'requestHash','') <> v_hash then raise exception 'requestHash reutilizado con parámetros distintos.' using errcode='23505'; end if;
    return v_existing.metadata;
  end if;
  if p_amount > v_account.credit_limit_gold then raise exception 'El importe supera el límite de crédito.' using errcode='22023'; end if;
  if v_player.created_at > clock_timestamp() - interval '7 days' and p_amount > 100000 then raise exception 'La cuenta aún no puede usar el límite completo.' using errcode='42501'; end if;
  select coalesce(total_disbursed_gold,0) into v_daily from public.bank_daily_loan_totals where date_key=(clock_timestamp() at time zone 'America/Asuncion')::date for update;
  if coalesce(v_daily,0) + p_amount > 5000000 then raise exception 'Tope diario global de préstamos alcanzado.' using errcode='22023'; end if;
  v_rate := v_apr_bps::numeric / 10000 / 52;
  v_payment := p_amount::numeric * v_rate / (1 - power(1 + v_rate, -v_n));
  for v_i in 1..v_n loop
    v_payment_int := case when v_i < v_n then round(v_payment)::integer else 0 end;
    if v_i < v_n then v_principal := round(p_amount::numeric / v_n)::integer; else v_principal := v_principal_left::integer; end if;
    if v_i < v_n then v_principal_left := v_principal_left - v_principal; end if;
    if v_i < v_n then v_interest := greatest(v_payment_int - v_principal, 0); else v_interest := greatest(round(v_payment * v_n)::bigint - v_total - v_principal, 0)::integer; end if;
    if v_i < v_n then v_total := v_total + v_principal + v_interest; end if;
  end loop;
  v_total := round(v_payment * v_n);
  if v_total > 2147483647 or p_amount::bigint + v_player.gold > 2147483647 then raise exception 'El préstamo excede el máximo integer.' using errcode='22003'; end if;
  insert into public.bank_loans(id,player_id,principal_gold,apr_bps,term_months,term_weeks,cadence_days,total_due_gold,outstanding_due_gold,status,request_hash)
  values(v_loan_id,v_player_id,p_amount,v_apr_bps,null,p_term_weeks,7,v_total::integer,v_total::integer,'active',v_hash);
  v_principal_left := p_amount;
  for v_i in 1..v_n loop
    v_payment_int := case when v_i < v_n then round(v_payment)::integer else (v_total - coalesce((select sum(amount_due_gold) from public.bank_loan_installments where loan_id=v_loan_id),0))::integer end;
    if v_i < v_n then v_principal := round(p_amount::numeric / v_n)::integer; else v_principal := v_principal_left::integer; end if;
    if v_i < v_n then v_principal_left := v_principal_left - v_principal; end if;
    v_interest := v_payment_int - v_principal;
    v_due := clock_timestamp() + make_interval(days => 7 * v_i);
    insert into public.bank_loan_installments(loan_id,installment_number,due_at,principal_due_gold,interest_due_gold,amount_due_gold,request_hash)
    values(v_loan_id,v_i,v_due,v_principal,v_interest,v_payment_int,v_hash);
  end loop;
  v_next := v_player.gold::bigint + p_amount;
  update public.players set gold=v_next::integer where id=v_player_id;
  insert into public.bank_transactions(player_id,operation_type,amount_gold,player_gold_after,reference_type,reference_id,idempotency_key,request_hash,metadata)
  values(v_player_id,'loan_disbursement',p_amount,v_next::integer,'bank_loan',v_loan_id,trim(p_request_hash),v_hash,jsonb_build_object('requestHash',v_hash,'loanId',v_loan_id,'termWeeks',p_term_weeks,'weeklyPayment',round(v_payment)));
  insert into public.bank_daily_loan_totals(date_key,total_disbursed_gold) values((clock_timestamp() at time zone 'America/Asuncion')::date,p_amount) on conflict(date_key) do update set total_disbursed_gold=bank_daily_loan_totals.total_disbursed_gold+excluded.total_disbursed_gold,updated_at=clock_timestamp();
  return jsonb_build_object('loanId',v_loan_id,'principal',p_amount,'termWeeks',p_term_weeks,'totalDue',v_total,'weeklyPayment',round(v_payment),'cadenceDays',7);
end;
$$;

-- Liquidación anticipada semanal con comisión mínima y regla de no cobrar interés futuro no ganado.
create or replace function public.bank_pay_weekly_loan_early(p_loan_id uuid, p_request_hash text)
returns jsonb language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player_id uuid := public.bank_v2_current_player();
  v_loan public.bank_loans;
  v_player public.players;
  v_outstanding bigint;
  v_first_interest integer;
  v_proportional bigint;
  v_commission bigint;
  v_settlement bigint;
  v_next bigint;
  v_hash text := md5(format('early|%s|%s',p_loan_id,p_request_hash));
begin
  if p_loan_id is null or length(trim(coalesce(p_request_hash,''))) < 8 then raise exception 'Solicitud de liquidación inválida.' using errcode='22023'; end if;
  select * into v_loan from public.bank_loans where id=p_loan_id and player_id=v_player_id for update;
  if not found or v_loan.status not in ('active','in_mora') or coalesce(v_loan.cadence_days,30) <> 7 then raise exception 'Préstamo semanal no liquidable.' using errcode='55000'; end if;
  select * into v_player from public.players where id=v_player_id for update;
  select coalesce(sum(amount_due_gold),0)::bigint, coalesce((select interest_due_gold from public.bank_loan_installments where loan_id=p_loan_id and installment_number=1),0) into v_outstanding,v_first_interest from public.bank_loan_installments where loan_id=p_loan_id and status in ('scheduled','in_mora');
  v_proportional := ceil(v_outstanding * v_loan.apr_bps::numeric / 10000 / 52 * greatest(extract(epoch from ((select due_at from public.bank_loan_installments where loan_id=p_loan_id and installment_number=1)-clock_timestamp())) / 604800,0));
  v_commission := greatest(v_first_interest::bigint,v_proportional);
  v_settlement := v_outstanding + v_commission;
  if v_settlement > v_player.gold then raise exception 'Saldo insuficiente para liquidar.' using errcode='22023'; end if;
  v_next := v_player.gold::bigint - v_settlement;
  update public.players set gold=v_next::integer where id=v_player_id;
  update public.bank_loan_installments set status='cancelled' where loan_id=p_loan_id and status in ('scheduled','in_mora');
  update public.bank_loans set status='paid',outstanding_due_gold=0,closed_at=clock_timestamp(),updated_at=clock_timestamp() where id=p_loan_id;
  insert into public.bank_transactions(player_id,operation_type,amount_gold,player_gold_after,reference_type,reference_id,idempotency_key,request_hash,metadata)
  values(v_player_id,'loan_early_payment',-v_settlement,v_next::integer,'bank_loan',p_loan_id,trim(p_request_hash),v_hash,jsonb_build_object('requestHash',v_hash,'commission',v_commission,'outstanding',v_outstanding));
  return jsonb_build_object('loanId',p_loan_id,'settlement',v_settlement,'commission',v_commission,'newGold',v_next);
end;
$$;

-- Scheduler V2: aviso previo, gracia de 48 h e idempotencia por runKey.
create or replace function public.bank_collect_due_installments_v2(p_run_key text)
returns table(run_key text, processed_count integer, delinquent_count integer, collected_gold integer)
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp(); v_i public.bank_loan_installments; v_l public.bank_loans; v_p public.players; v_key text; v_processed integer:=0; v_delinquent integer:=0; v_collected integer:=0; v_next bigint;
begin
  if auth.role() <> 'service_role' or length(trim(coalesce(p_run_key,'')))=0 then raise exception 'Scheduler no autorizado.' using errcode='42501'; end if;
  for v_i in select i.* from public.bank_loan_installments i join public.bank_loans l on l.id=i.loan_id where i.status='scheduled' and i.due_at <= v_now order by i.due_at,i.id for update loop
    v_key := format('weekly:%s:%s',trim(p_run_key),v_i.id);
    if exists(select 1 from public.bank_transactions where idempotency_key=v_key) then continue; end if;
    v_processed := v_processed + 1;
    select l.* into v_l from public.bank_loans l where l.id=v_i.loan_id for update;
    select p.* into v_p from public.players p where p.id=v_l.player_id for update;
    if v_now < v_i.due_at + interval '48 hours' then
      perform public.bank_insert_notification(v_l.player_id,'Aviso de cuota','Tu cuota semanal venció; tienes 48 horas de gracia antes de mora.',0);
      continue;
    end if;
    if v_p.gold < v_i.amount_due_gold then
      update public.bank_loan_installments set status='in_mora',attempt_count=attempt_count+1 where id=v_i.id;
      update public.bank_loans set status='in_mora',updated_at=v_now where id=v_l.id;
      perform public.bank_insert_notification(v_l.player_id,'Cuota en mora','La gracia de 48 horas terminó sin saldo suficiente.',0);
      v_delinquent := v_delinquent + 1;
      continue;
    end if;
    v_next := v_p.gold::bigint - v_i.amount_due_gold;
    update public.players set gold=v_next::integer where id=v_p.id;
    update public.bank_loan_installments set status='paid',paid_at=v_now,attempt_count=attempt_count+1 where id=v_i.id;
    insert into public.bank_transactions(player_id,operation_type,amount_gold,player_gold_after,reference_type,reference_id,idempotency_key,metadata) values(v_p.id,'loan_payment',-v_i.amount_due_gold,v_next::integer,'bank_loan_installment',v_i.id,v_key,jsonb_build_object('runKey',p_run_key,'graceHours',48));
    v_collected := v_collected + v_i.amount_due_gold;
  end loop;
  return query select trim(p_run_key),v_processed,v_delinquent,v_collected;
end;
$$;

revoke all on function public.bank_create_weekly_loan(integer,integer,text,integer) from public, anon;
revoke all on function public.bank_pay_weekly_loan_early(uuid,text) from public, anon;
revoke all on function public.bank_collect_due_installments_v2(text) from public, anon, authenticated;
grant execute on function public.bank_create_weekly_loan(integer,integer,text,integer) to authenticated, service_role;
grant execute on function public.bank_pay_weekly_loan_early(uuid,text) to authenticated, service_role;
grant execute on function public.bank_collect_due_installments_v2(text) to service_role;

-- ROLLBACK V2 comentado:
-- revoke execute on function public.bank_create_weekly_loan(integer,integer,text,integer) from authenticated,service_role;
-- revoke execute on function public.bank_pay_weekly_loan_early(uuid,text) from authenticated,service_role;
-- revoke execute on function public.bank_collect_due_installments_v2(text) from service_role;
-- drop function if exists public.bank_collect_due_installments_v2(text);
-- drop function if exists public.bank_pay_weekly_loan_early(uuid,text);
-- drop function if exists public.bank_create_weekly_loan(integer,integer,text,integer);
-- alter table public.bank_loans drop column if exists request_hash, drop column if exists cadence_days, drop column if exists term_weeks;
-- alter table public.bank_loan_installments drop column if exists request_hash;
-- alter table public.bank_transactions drop column if exists request_hash;
