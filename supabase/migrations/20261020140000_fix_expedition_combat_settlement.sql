-- Migración: Liquidación segura de combate para Expedición Arcade y Narrativa
-- Fecha: 2026-10-20
-- Permite que tavern_step_configured_run reciba acciones de combate finales:
-- 'victory' -> liquida dentro de [reward_min, reward_max] configurado en servidor.
-- 'defeat'  -> cierra la sesión como perdida (payout 0).
-- 'retreat' -> retirada táctica (payout 35% del bet).
-- 'advance' -> conserva compatibilidad hacia atrás.

create or replace function public.tavern_step_configured_run(
  p_session_id uuid,
  p_action text,
  p_idempotency_key text,
  p_expected_game text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_player uuid := public.tavern_current_player();
  v_s public.game_sessions;
  v_d public.tavern_action_dedup;
  v_action text := lower(trim(coalesce(p_action, '')));
  v_step integer;
  v_max integer;
  v_reward_min integer;
  v_reward_max integer;
  v_payout bigint := 0;
  v_status text;
  v_hash text := md5(format('run-step|%s|%s|%s', p_expected_game, v_action, p_session_id));
  v_result jsonb;
  v_gold integer;
  v_next bigint;
  v_roll numeric;
begin
  if p_expected_game not in ('expedition', 'expedition_arcade') or
     v_action not in ('advance', 'retreat', 'victory', 'defeat') or
     length(trim(coalesce(p_idempotency_key, ''))) = 0 then
    raise exception 'Paso de expedición inválido.' using errcode = '22023';
  end if;

  select * into v_s from public.game_sessions
   where id = p_session_id and player_id = v_player
     for update;
  if not found or v_s.game <> p_expected_game then
    raise exception 'Sesión de expedición no válida.' using errcode = '55000';
  end if;

  select * into v_d from public.tavern_action_dedup
   where session_id = p_session_id and idempotency_key = trim(p_idempotency_key)
     for update;
  if found then
    if v_d.request_hash <> v_hash then
      raise exception 'La clave de paso ya fue usada con otros parámetros.' using errcode = '23505';
    end if;
    return v_d.result;
  end if;

  if v_s.status <> 'active' then
    raise exception 'Sesión de expedición no activa.' using errcode = '55000';
  end if;

  v_step := coalesce((v_s.state->>'step')::integer, 0) + 1;
  v_max := coalesce((v_s.state->>'maxSteps')::integer, 6);
  v_reward_min := coalesce((v_s.state->>'rewardMin')::integer, 0);
  v_reward_max := coalesce((v_s.state->>'rewardMax')::integer, v_reward_min);

  if v_action = 'victory' then
    v_status := 'won';
    v_roll := public.tavern_random_unit();
    v_payout := v_reward_min + floor(v_roll * (v_reward_max - v_reward_min + 1));
  elsif v_action = 'defeat' then
    v_status := 'lost';
    v_payout := 0;
  elsif v_action = 'retreat' then
    v_status := 'cashed_out';
    v_payout := floor(v_s.bet * 0.35);
  else
    -- 'advance' legado:
    if public.tavern_random_unit() < 0.25 then
      v_status := 'lost';
    elsif v_step >= v_max then
      v_status := 'won';
      v_roll := public.tavern_random_unit();
      v_payout := v_reward_min + floor(v_roll * (v_reward_max - v_reward_min + 1));
    else
      v_status := 'active';
    end if;
  end if;

  if v_status = 'active' then
    update public.game_sessions
       set state = state || jsonb_build_object('step', v_step, 'lastAction', v_action),
           updated_at = clock_timestamp()
     where id = p_session_id;
  else
    if v_payout > 0 then
      select gold into v_gold from public.players where id = v_player for update;
      v_next := v_gold::bigint + v_payout;
      if v_next > 2147483647 then
        raise exception 'Premio de expedición fuera de integer.' using errcode = '22003';
      end if;
      update public.players set gold = v_next::integer where id = v_player;
    else
      v_next := null;
    end if;

    update public.game_sessions
       set status = v_status,
           state = state || jsonb_build_object('step', v_step, 'lastAction', v_action, 'payout', v_payout),
           updated_at = clock_timestamp()
     where id = p_session_id;
  end if;

  v_result := jsonb_build_object(
    'sessionId', p_session_id,
    'status', v_status,
    'step', v_step,
    'payout', v_payout,
    'newGold', v_next
  );

  if v_status <> 'active' then
    insert into public.game_rounds(player_id, game, bet, payout, outcome, idempotency_key, request_hash)
    values(v_player, v_s.game, v_s.bet, v_payout::integer, v_result, trim(p_idempotency_key), v_hash);
  end if;

  insert into public.tavern_action_dedup(session_id, idempotency_key, request_hash, result)
  values(p_session_id, trim(p_idempotency_key), v_hash, v_result);

  return v_result;
end;
$$;
