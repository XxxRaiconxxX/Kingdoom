import { supabase } from "./supabaseClient";

const AUTH_DOMAIN = "auth.kingdoom.local";

export function normalizeKingdoomUsername(username: string) {
  return username.trim().replace(/\s+/g, " ");
}

export function getKingdoomAuthEmail(username: string) {
  const normalized = normalizeKingdoomUsername(username).toLowerCase();
  return `${encodeURIComponent(normalized)}@${AUTH_DOMAIN}`;
}

export async function signInKingdoom(username: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: getKingdoomAuthEmail(username),
    password,
  });
}

export async function activateKingdoomAccount(input: {
  username: string;
  password: string;
  code: string;
}) {
  const username = normalizeKingdoomUsername(input.username);
  const { data: verified, error: verifyError } = await supabase.rpc(
    "verify_player_access_code",
    { p_username: username, p_code: input.code.trim() }
  );

  if (verifyError) {
    return { data: null, error: verifyError };
  }

  if (!verified) {
    return {
      data: null,
      error: new Error("El codigo es invalido, ya fue usado o caduco."),
    };
  }

  const result = await supabase.auth.signUp({
    email: getKingdoomAuthEmail(username),
    password: input.password,
    options: { data: { username } },
  });

  if (result.error || !result.data.user) {
    return result;
  }

  if (!result.data.session) {
    return {
      data: null,
      error: new Error("La cuenta requiere confirmacion de correo en Supabase; desactiva esa confirmacion para el acceso del reino."),
    };
  }

  const { data: linked, error: linkError } = await supabase.rpc(
    "link_player_access",
    { p_player_id: verified }
  );

  if (linkError || linked !== true) {
    return {
      data: null,
      error: linkError ?? new Error("La cuenta no pudo vincularse al perfil."),
    };
  }

  return result;
}

export async function signOutKingdoom() {
  return supabase.auth.signOut();
}
