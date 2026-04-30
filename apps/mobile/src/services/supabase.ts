import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";

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

export function formatSupabaseReadError(scope: string, error?: PostgrestError | null) {
  if (!error) return `No se pudo cargar ${scope}.`;

  if (error.code === "42P01") {
    return `${scope} no esta disponible en la base de datos.`;
  }

  if (error.code === "42501" || error.message.toLowerCase().includes("permission")) {
    return `${scope} no tiene permisos publicos de lectura. Revisa RLS en Supabase.`;
  }

  if (error.code === "42703" || error.message.toLowerCase().includes("column")) {
    return `${scope} cambio de estructura. Revisa columnas en Supabase.`;
  }

  return `No se pudo cargar ${scope}. Revisa la conexion o permisos de Supabase.`;
}
