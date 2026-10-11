-- Static contract checks for the migration (run against a test database).
-- The assertions intentionally avoid production writes.
do $$
declare
  v_definition text;
  v_acl text[];
begin
  select pg_get_functiondef('public.admin_set_player_gold(uuid,integer)'::regprocedure)
    into v_definition;
  if v_definition not like '%is_current_user_admin()%' or v_definition not like '%for update%' then
    raise exception 'admin_set_player_gold must enforce admin authorization and row locking';
  end if;

  select proacl into v_acl
  from pg_proc
  where oid = 'public.increment_gold(uuid,integer)'::regprocedure;
  if exists (select 1 from unnest(coalesce(v_acl, array[]::text[])) acl where acl like 'anon=%') then
    raise exception 'increment_gold must not grant anon';
  end if;
  select pg_get_functiondef('public.increment_gold(uuid,integer)'::regprocedure)
    into v_definition;
  if v_definition not like '%2147483647%' then
    raise exception 'increment_gold must enforce integer bounds';
  end if;
end;
$$;
