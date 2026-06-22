create or replace function public.add_gold_to_multiple_players(
  p_player_ids uuid[],
  p_amount integer
)
returns table (
  success boolean,
  message text,
  affected_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer;
begin
  if p_amount <= 0 then
    return query select false, 'La cantidad debe ser mayor a 0.', 0;
    return;
  end if;

  if array_length(p_player_ids, 1) is null then
    return query select false, 'La lista de jugadores esta vacia.', 0;
    return;
  end if;

  update public.players
    set gold = gold + p_amount
  where id = any(p_player_ids);

  get diagnostics v_updated_count = row_count;

  return query select true, format('Oro añadido a %s jugadores.', v_updated_count), v_updated_count;
end;
$$;

revoke all on function public.add_gold_to_multiple_players(uuid[], integer) from public;
grant execute on function public.add_gold_to_multiple_players(uuid[], integer) to anon, authenticated, service_role;
