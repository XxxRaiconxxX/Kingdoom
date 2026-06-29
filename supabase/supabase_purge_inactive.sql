-- 1. Añadir columna last_active_at a players (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='last_active_at') THEN
        ALTER TABLE public.players ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Habilitar extensión pg_cron si no está activa
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Crear tarea cron para eliminar jugadores inactivos por más de 15 días
-- Se ejecutará todos los días a medianoche.
SELECT cron.schedule(
  'purge-inactive-players',
  '0 0 * * *',
  $$ 
    -- Borramos todos los jugadores cuya última actividad registrada fue hace más de 15 días.
    -- NOTA: Esto asume que las llaves foráneas en character_sheets, player_auth_links, etc. 
    -- tienen configurado ON DELETE CASCADE. Si falla la ejecución, se debe hacer un script
    -- adicional para añadir cascada a las foráneas.
    DELETE FROM public.players 
    WHERE last_active_at < NOW() - INTERVAL '15 days' 
  $$
);
