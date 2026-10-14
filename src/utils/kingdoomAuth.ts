import { supabase } from "./supabaseClient";

const AUTH_DOMAIN = "auth.kingdoom.app";

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
  let result = await supabase.auth.signUp({
    email: getKingdoomAuthEmail(username),
    password: input.password,
    options: { data: { username } },
  });

  const canRetryExistingAccount = result.error?.message.toLowerCase().includes("already registered") ||
    result.error?.message.toLowerCase().includes("already exists");
  if (result.error && !canRetryExistingAccount) {
    return result;
  }

  if (!result.data.session) {
    result = await supabase.auth.signInWithPassword({
      email: getKingdoomAuthEmail(username),
      password: input.password,
    });
  }

  if (result.error || !result.data.user || !result.data.session) {
    return {
      data: null,
      error: result.error ?? new Error("No se pudo iniciar la cuenta segura."),
    };
  }

  const { data: playerId, error: activationError } = await supabase.rpc(
    "activate_player_access",
    { p_username: username, p_code: input.code.trim() }
  );

  if (activationError || !playerId) {
    return {
      data: result.data,
      error: activationError ?? new Error("El codigo es invalido, ya fue usado o caduco."),
    };
  }

  return result;
}

export async function signOutKingdoom() {
  return supabase.auth.signOut();
}
