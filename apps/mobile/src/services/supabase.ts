import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "La conexion del reino no esta configurada para esta beta. Revisa las variables de Supabase en Expo."
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
