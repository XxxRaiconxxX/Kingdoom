CREATE TABLE IF NOT EXISTS public.bot_active_missions (
    short_id TEXT PRIMARY KEY,
    mission_id TEXT,
    title TEXT,
    instructions TEXT,
    gm_config JSONB,
    max_participants INTEGER DEFAULT 0,
    player_message_count INTEGER DEFAULT 0,
    gm_round_count INTEGER DEFAULT 0,
    context JSONB DEFAULT '[]'::jsonb,
    participants_counted JSONB DEFAULT '[]'::jsonb,
    resolved BOOLEAN DEFAULT false,
    final_state TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.bot_active_missions ENABLE ROW LEVEL SECURITY;

-- Política RLS (permitir todo por simplicidad como en las otras del bot)
CREATE POLICY "Enable all access for bot_active_missions" ON public.bot_active_missions
    FOR ALL USING (true) WITH CHECK (true);
