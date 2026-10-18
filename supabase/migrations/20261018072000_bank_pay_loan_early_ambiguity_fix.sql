-- Banco de Kingdoom - correccion de referencia ambigua en liquidacion anticipada
-- Evita que el parametro RETURNS TABLE loan_id colisione con la columna de la tabla.

do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.bank_pay_loan_early(uuid,uuid,text)'::regprocedure)
    into v_definition;

  if position('where loan_id = v_loan.id' in v_definition) > 0 then
    v_definition := replace(
      v_definition,
      'update public.bank_loan_installments',
      'update public.bank_loan_installments as i'
    );
    v_definition := replace(v_definition, 'where loan_id = v_loan.id', 'where i.loan_id = v_loan.id');
    v_definition := replace(
      v_definition,
      'and status in (''scheduled'', ''in_mora'')',
      'and i.status in (''scheduled'', ''in_mora'')'
    );
    execute v_definition;
  end if;

  select pg_get_functiondef('public.bank_pay_loan_early(uuid,uuid,text)'::regprocedure)
    into v_definition;
  if position('where loan_id = v_loan.id' in v_definition) > 0
     or position('update public.bank_loan_installments as i' in v_definition) = 0
     or position('where i.loan_id = v_loan.id' in v_definition) = 0 then
    raise exception 'bank_pay_loan_early conserva una referencia ambigua a loan_id';
  end if;
end;
$$;

notify pgrst, 'reload schema';
