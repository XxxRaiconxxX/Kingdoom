-- Banco de Kingdoom - Fase 1
--
-- Esta migracion contiene exclusivamente el backend transaccional del Banco.
-- Las operaciones financieras pasan por las RPCs SECURITY DEFINER de este
-- archivo; las tablas no conceden mutaciones al cliente.

create extension if not exists pgcrypto;

-- El oro compartido del reino es entero y nunca puede ser negativo.
do $$
declare
  v_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into v_type
    from pg_attribute a
   where a.attrelid = 'public.players'::regclass
     and a.attname = 'gold'
     and not a.attisdropped;

  if v_type is null then
    raise exception 'public.players.gold no existe';
  end if;

  if v_type <> 'integer' then
    if exists (
      select 1
        from public.players
       where gold is null
          or gold <> trunc(gold)
          or gold < 0
    ) then
      raise exception 'players.gold contiene valores nulos, fraccionarios o negativos';
    end if;

    alter table public.players
      alter column gold type integer using gold::integer;
  end if;

  alter table public.players alter column gold set not null;
end;
$$;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.players'::regclass
       and conname = 'players_gold_nonnegative'
  ) then
    alter table public.players
      add constraint players_gold_nonnegative check (gold >= 0);
  end if;
end;
$$;

create table if not exists public.bank_accounts (
  player_id uuid primary key references public.players(id) on delete cascade,
  deposit_principal_gold integer not null default 0
    check (deposit_principal_gold >= 0 and deposit_principal_gold <= 25000),
  deposit_interest_residue numeric(20,8) not null default 0
    check (deposit_interest_residue >= 0),
  deposit_last_accrued_at timestamptz not null default now(),
  credit_limit_gold integer not null default 3500
    check (credit_limit_gold >= 3500 and credit_limit_gold <= 12000),
  on_time_streak integer not null default 0 check (on_time_streak >= 0),
  credit_tier integer not null default 0 check (credit_tier in (0, 1, 2)),
  last_delinquency_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_loans (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  principal_gold integer not null check (principal_gold >= 250),
  apr_bps integer not null check (apr_bps in (1200, 1500, 1800)),
  term_months integer not null check (term_months in (3, 6, 12)),
  total_due_gold integer not null check (total_due_gold >= principal_gold),
  outstanding_due_gold integer not null check (outstanding_due_gold >= 0),
  paid_installments integer not null default 0 check (paid_installments >= 0),
  status text not null default 'active'
    check (status in ('active', 'in_mora', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.bank_loan_installments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.bank_loans(id) on delete cascade,
  installment_number integer not null check (installment_number > 0),
  due_at timestamptz not null,
  principal_due_gold integer not null check (principal_due_gold >= 0),
  interest_due_gold integer not null check (interest_due_gold >= 0),
  amount_due_gold integer not null check (amount_due_gold > 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'paid', 'in_mora', 'cancelled')),
  paid_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  created_at timestamptz not null default now(),
  unique (loan_id, installment_number),
  check (principal_due_gold + interest_due_gold = amount_due_gold)
);

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  operation_type text not null check (
    operation_type in (
      'deposit',
      'withdrawal',
      'interest_credit',
      'loan_disbursement',
      'loan_payment',
      'loan_early_payment'
    )
  ),
  amount_gold integer not null check (amount_gold <> 0),
  player_gold_after integer not null check (player_gold_after >= 0),
  reference_type text,
  reference_id uuid,
  idempotency_key text not null check (length(trim(idempotency_key)) between 1 and 200),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (player_id, idempotency_key)
);

create index if not exists bank_loans_player_status_idx
  on public.bank_loans(player_id, status, created_at desc);
create index if not exists bank_loan_installments_due_idx
  on public.bank_loan_installments(status, due_at, loan_id);
create index if not exists bank_loan_installments_loan_status_idx
  on public.bank_loan_installments(loan_id, status, installment_number);
create index if not exists bank_transactions_player_created_idx
  on public.bank_transactions(player_id, created_at desc);

-- Todas las cuentas existentes reciben su fila consolidada. El trigger cubre
-- jugadores creados despues de aplicar la migracion.
insert into public.bank_accounts (player_id)
select id from public.players
on conflict (player_id) do nothing;

create or replace function public.bank_create_account_for_player()
returns trigger
language plpgsql
security definer
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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

-- El cliente solo puede leer sus filas. Todas las escrituras pasan por RPC.
alter table public.bank_accounts enable row level security;
alter table public.bank_loans enable row level security;
alter table public.bank_loan_installments enable row level security;
alter table public.bank_transactions enable row level security;

drop policy if exists "Bank players read own account" on public.bank_accounts;
create policy "Bank players read own account"
on public.bank_accounts for select to authenticated
using (
  exists (
    select 1 from public.players p
     where p.id = bank_accounts.player_id
       and (
         p.auth_user_id = (select auth.uid())
         or exists (
           select 1 from public.player_auth_links pal
            where pal.player_id = p.id and pal.auth_user_id = (select auth.uid())
         )
       )
  )
);

drop policy if exists "Bank players read own loans" on public.bank_loans;
create policy "Bank players read own loans"
on public.bank_loans for select to authenticated
using (
  exists (
    select 1 from public.players p
     where p.id = bank_loans.player_id
       and (
         p.auth_user_id = (select auth.uid())
         or exists (
           select 1 from public.player_auth_links pal
            where pal.player_id = p.id and pal.auth_user_id = (select auth.uid())
         )
       )
  )
);

drop policy if exists "Bank players read own installments" on public.bank_loan_installments;
create policy "Bank players read own installments"
on public.bank_loan_installments for select to authenticated
using (
  exists (
    select 1
      from public.bank_loans l
      join public.players p on p.id = l.player_id
     where l.id = bank_loan_installments.loan_id
       and (
         p.auth_user_id = (select auth.uid())
         or exists (
           select 1 from public.player_auth_links pal
            where pal.player_id = p.id and pal.auth_user_id = (select auth.uid())
         )
       )
  )
);

drop policy if exists "Bank players read own transactions" on public.bank_transactions;
create policy "Bank players read own transactions"
on public.bank_transactions for select to authenticated
using (
  exists (
    select 1 from public.players p
     where p.id = bank_transactions.player_id
       and (
         p.auth_user_id = (select auth.uid())
         or exists (
           select 1 from public.player_auth_links pal
            where pal.player_id = p.id and pal.auth_user_id = (select auth.uid())
         )
       )
  )
);

revoke all privileges on table public.bank_accounts,
  public.bank_loans,
  public.bank_loan_installments,
  public.bank_transactions
from public, anon, authenticated;
grant select on table public.bank_accounts,
  public.bank_loans,
  public.bank_loan_installments,
  public.bank_transactions to authenticated;

revoke all on function public.bank_get_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.bank_deposit(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.bank_withdraw_deposit(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.bank_create_loan(uuid, integer, integer, text) from public, anon, authenticated;
revoke all on function public.bank_pay_loan(uuid, uuid, integer, text) from public, anon, authenticated;
revoke all on function public.bank_pay_loan_early(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.bank_collect_due_installments(text) from public, anon, authenticated;

grant execute on function public.bank_get_snapshot(uuid) to authenticated;
grant execute on function public.bank_deposit(uuid, integer, text) to authenticated;
grant execute on function public.bank_withdraw_deposit(uuid, integer, text) to authenticated;
grant execute on function public.bank_create_loan(uuid, integer, integer, text) to authenticated;
grant execute on function public.bank_pay_loan(uuid, uuid, integer, text) to authenticated;
grant execute on function public.bank_pay_loan_early(uuid, uuid, text) to authenticated;
grant execute on function public.bank_collect_due_installments(text) to service_role;

revoke all on function public.bank_create_account_for_player() from public, anon, authenticated;
revoke all on function public.bank_reject_ledger_mutation() from public, anon, authenticated;
revoke all on function public.bank_add_calendar_months(timestamptz, integer) from public, anon, authenticated;
revoke all on function public.bank_assert_player_access(uuid) from public, anon, authenticated;
revoke all on function public.bank_ensure_account(uuid) from public, anon, authenticated;
revoke all on function public.bank_accrue_deposit(public.bank_accounts) from public, anon, authenticated;
revoke all on function public.bank_insert_notification(uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.bank_apply_credit_progress(uuid, integer, integer, boolean) from public, anon, authenticated;

notify pgrst, 'reload schema';
