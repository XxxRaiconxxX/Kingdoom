create or replace function public.increment_players_gold(
  p_player_ids uuid[],
  p_amount integer
)
returns table (
  success boolean,
  message text,
  updated_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer;
begin
  update public.players
  set gold = gold + p_amount
  where id = any(p_player_ids);

  get diagnostics v_updated_count = row_count;

  return query
    select
      true,
      case when p_amount >= 0 then 'Oro añadido correctamente.' else 'Oro descontado correctamente.' end,
      v_updated_count;
end;
$$;

revoke all on function public.increment_players_gold(uuid[], integer) from public;
grant execute on function public.increment_players_gold(uuid[], integer) to anon, authenticated, service_role;
