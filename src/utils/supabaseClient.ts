// src/utils/supabaseClient.ts
// ============================================================
// 🔧 CONFIGURACIÓN DE SUPABASE
//
// 1. Ve a https://supabase.com y crea un proyecto gratis
// 2. En tu proyecto ve a: Settings → API
// 3. Copia los valores y pégalos aquí:
//    - "Project URL"  → reemplaza SUPABASE_URL
//    - "anon public"  → reemplaza SUPABASE_ANON_KEY
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sibisgiwmgdrpfkzmkkw.supabase.co";       // ← pega tu URL aquí
const SUPABASE_ANON_KEY = "sb_publishable_Y8Dk0GxPacMnHDDWmT3DcQ_fptqtC3h";   // ← pega tu anon key aquí

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// 📋 SQL PARA CREAR LA TABLA (ejecútalo en Supabase → SQL Editor)
//
// create table players (
//   id uuid primary key default gen_random_uuid(),
//   username text unique not null,
//   gold integer not null default 0,
//   created_at timestamptz default now()
// );
//
// -- Seguridad: solo lectura/escritura con la anon key
// alter table players enable row level security;
//
// create policy "Allow all" on players
//   for all using (true) with check (true);
// ============================================================
