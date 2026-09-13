-- Códigos efímeros enviados por el bot para activar el acceso web.
create extension if not exists pgcrypto;

create table if not exists public.player_access_codes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_player_access_codes_lookup
  on public.player_access_codes (player_id, expires_at desc)
  where used_at is null;

alter table public.player_access_codes enable row level security;
revoke all on public.player_access_codes from anon, authenticated;

create or replace function public.verify_player_access_code(
  p_username text,
  p_code text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_player_id uuid;
  v_code_id uuid;
  v_code_hash text;
begin
  if length(trim(coalesce(p_username, ''))) < 2
     or p_code !~ '^[0-9]{6}$' then
    return null;
  end if;

  select p.id
    into v_player_id
    from public.players p
   where lower(p.username) = lower(trim(p_username))
   limit 1;

  if v_player_id is null then
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
   for update skip locked;

  if v_code_id is null then
    return null;
  end if;

  if v_code_hash <> encode(digest(trim(p_code), 'sha256'), 'hex') then
    update public.player_access_codes
       set attempts = attempts + 1
     where id = v_code_id;
    return null;
  end if;

  update public.player_access_codes
     set used_at = now()
   where id = v_code_id
  returning player_id into v_player_id;

  return v_player_id;
end;
$$;

revoke all on function public.verify_player_access_code(text, text) from public;
grant execute on function public.verify_player_access_code(text, text) to anon, authenticated;

create or replace function public.link_player_access(p_player_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.players
     set auth_user_id = auth.uid()
   where id = p_player_id
     and auth.uid() is not null
     and auth_user_id is null
  returning true;
$$;

revoke all on function public.link_player_access(uuid) from public;
grant execute on function public.link_player_access(uuid) to authenticated;
