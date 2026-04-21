import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en apps/mobile/.env."
    : "";

const resolvedSupabaseUrl = supabaseUrl ?? "";
const resolvedSupabaseAnonKey = supabaseAnonKey ?? "";

export const supabase: SupabaseClient | null = supabaseConfigError
  ? null
  : createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
