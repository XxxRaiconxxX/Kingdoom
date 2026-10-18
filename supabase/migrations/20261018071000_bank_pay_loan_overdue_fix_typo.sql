-- Banco de Kingdoom - correccion de identificador en pagos vencidos
-- Reaplica de forma idempotente la referencia correcta del jugador.

do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.bank_pay_loan(uuid,uuid,integer,text)'::regprocedure)
    into v_definition;

  if position('v.player.id' in v_definition) > 0 then
    execute replace(v_definition, 'v.player.id', 'v_player.id');
  end if;

  select pg_get_functiondef('public.bank_pay_loan(uuid,uuid,integer,text)'::regprocedure)
    into v_definition;
  if position('v.player.id' in v_definition) > 0 then
    raise exception 'bank_pay_loan conserva una referencia invalida al jugador';
  end if;
  if position('v_installment.due_at < clock_timestamp()' in v_definition) = 0 then
    raise exception 'bank_pay_loan no conserva la comprobacion de cuota vencida';
  end if;
end;
$$;

notify pgrst, 'reload schema';
