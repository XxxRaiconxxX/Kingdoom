-- Activacion segura de perfiles legacy con WhatsApp vinculado.
insert into public.player_auth_links (player_id, auth_user_id)
select id, auth_user_id::uuid
from public.players
where trim(coalesce(auth_user_id::text, '')) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
on conflict (player_id, auth_user_id) do nothing;

create or replace function public.activate_player_access(
  p_username text,
  p_code text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_player_id uuid;
  v_existing_auth_user_id text;
  v_code_id uuid;
  v_code_hash text;
begin
  if v_auth_user_id is null
     or length(trim(coalesce(p_username, ''))) < 2
     or p_code !~ '^[0-9]{6}$' then
    return null;
  end if;

  select p.id, p.auth_user_id::text
    into v_player_id, v_existing_auth_user_id
    from public.players p
   where lower(p.username) = lower(trim(p_username))
   order by p.id
   limit 1
   for update;

  if v_player_id is null or nullif(trim(coalesce(v_existing_auth_user_id, '')), '') is not null
     or exists (select 1 from public.player_auth_links where player_id = v_player_id) then
    return null;
  end if;

  select id, code_hash
    into v_code_id, v_code_hash
    from public.player_access_codes
   where player_id = v_player_id
     and used_at is null
     and expires_at > now()
     and attempts < 5
   order by created_at desc
   limit 1
   for update;

  if v_code_id is null then
    return null;
  end if;

  if v_code_hash <> encode(digest(trim(p_code), 'sha256'), 'hex') then
    update public.player_access_codes
       set attempts = attempts + 1
     where id = v_code_id;
    return null;
  end if;

  update public.players
     set auth_user_id = v_auth_user_id
   where id = v_player_id
     and nullif(trim(auth_user_id::text), '') is null;

  if not found then
    return null;
  end if;

  update public.player_access_codes
     set used_at = now()
   where id = v_code_id;

  insert into public.player_auth_links (player_id, auth_user_id)
  values (v_player_id, v_auth_user_id)
  on conflict (player_id, auth_user_id) do nothing;

  return v_player_id;
end;
$$;

revoke all on function public.activate_player_access(text, text) from public, anon;
grant execute on function public.activate_player_access(text, text) to authenticated;
revoke execute on function public.link_player_access(uuid) from public, anon, authenticated;
grant execute on function public.link_player_access(uuid) to service_role;
