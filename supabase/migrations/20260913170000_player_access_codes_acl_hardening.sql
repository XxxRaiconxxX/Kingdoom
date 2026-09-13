-- El enlace de perfil solo se puede ejecutar con una sesion autenticada.
revoke all on function public.link_player_access(uuid) from public, anon;
grant execute on function public.link_player_access(uuid) to authenticated, service_role;
