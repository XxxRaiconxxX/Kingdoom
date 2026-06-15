-- Add max_character_sheets to players
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS max_character_sheets integer DEFAULT 2 NOT NULL;

-- Function to buy character slot transactionally
CREATE OR REPLACE FUNCTION public.buy_character_slot(p_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player public.players%ROWTYPE;
  v_current_slots integer;
  v_cost numeric;
BEGIN
  -- 1. Fetch player details
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Jugador no encontrado.');
  END IF;

  v_current_slots := v_player.max_character_sheets;

  -- 2. Verify limit (max 10)
  IF v_current_slots >= 10 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Ya has alcanzado el límite máximo de 10 fichas.');
  END IF;

  -- 3. Calculate cost
  IF v_current_slots = 2 THEN
    v_cost := 1000000;
  ELSIF v_current_slots = 3 THEN
    v_cost := 2000000;
  ELSE
    v_cost := (v_current_slots - 2) * 2000000;
  END IF;

  -- 4. Check player gold
  IF v_player.gold < v_cost THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'No tienes suficiente oro. Necesitas ' || v_cost::text || ' de oro.');
  END IF;

  -- 5. Deduct gold and increment slots
  UPDATE public.players
  SET 
    gold = gold - v_cost,
    max_character_sheets = max_character_sheets + 1
  WHERE id = p_player_id;

  RETURN jsonb_build_object(
    'status', 'success', 
    'message', 'Espacio desbloqueado correctamente. Límite aumentado a ' || (v_current_slots + 1)::text || ' fichas.',
    'new_gold', v_player.gold - v_cost,
    'new_max_slots', v_current_slots + 1
  );
END;
$$;
