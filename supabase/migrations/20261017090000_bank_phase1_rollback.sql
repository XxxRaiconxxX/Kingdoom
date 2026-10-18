-- Rollback local/controlled del Banco de Kingdoom Fase 1.
-- No toca payment_plans, la logica del Mercado ni pgcrypto.
-- Conserva players_gold_nonnegative: es una barrera de seguridad compartida y
-- la migracion no puede demostrar que ese constraint no existiera antes.

begin;

drop trigger if exists bank_create_account_after_player_insert on public.players;
drop trigger if exists bank_transactions_append_only_update on public.bank_transactions;

drop function if exists public.bank_collect_due_installments(text);
drop function if exists public.bank_pay_loan_early(uuid, uuid, text);
drop function if exists public.bank_pay_loan(uuid, uuid, integer, text);
drop function if exists public.bank_create_loan(uuid, integer, integer, text);
drop function if exists public.bank_withdraw_deposit(uuid, integer, text);
drop function if exists public.bank_deposit(uuid, integer, text);
drop function if exists public.bank_get_snapshot(uuid);

drop function if exists public.bank_apply_credit_progress(uuid, integer, integer, boolean);
drop function if exists public.bank_insert_notification(uuid, text, text, integer);
drop function if exists public.bank_accrue_deposit(public.bank_accounts);
drop function if exists public.bank_ensure_account(uuid);
drop function if exists public.bank_assert_player_access(uuid);
drop function if exists public.bank_add_calendar_months(timestamptz, integer);
drop function if exists public.bank_reject_ledger_mutation();
drop function if exists public.bank_create_account_for_player();

drop table if exists public.bank_transactions;
drop table if exists public.bank_loan_installments;
drop table if exists public.bank_loans;
drop table if exists public.bank_accounts;

commit;

notify pgrst, 'reload schema';
