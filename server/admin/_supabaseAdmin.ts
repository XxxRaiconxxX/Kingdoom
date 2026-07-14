import { createClient } from "@supabase/supabase-js";

declare const process: {
  env: Record<string, string | undefined>;
};

export function readSupabaseAdminConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim();

  return {
    url: url || "",
    serviceRoleKey: serviceRoleKey || "",
  };
}

export function ensureSupabaseAdminConfig() {
  const config = readSupabaseAdminConfig();

  if (!config.url || !config.serviceRoleKey) {
    throw new Error(
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el backend."
    );
  }

  return config;
}

export function createSupabaseAdminClient() {
  const config = ensureSupabaseAdminConfig();

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
