import { supabase } from "./supabaseClient";
import type { PlayerAccount } from "../types";

type PlayerRow = {
  id: string;
  username: string;
  gold: number;
  is_admin?: boolean | null;
  auth_user_id?: string | null;
};

let supportsAuthUserId: boolean | null = null;

function mapPlayerRow(row: PlayerRow): PlayerAccount {
  return {
    id: row.id,
    username: row.username,
    gold: row.gold,
    isAdmin: Boolean(row.is_admin),
    authUserId: row.auth_user_id ?? null,
  };
}

async function detectAuthUserIdSupport() {
  if (supportsAuthUserId !== null) {
    return supportsAuthUserId;
  }

  const { error } = await supabase.from("players").select("auth_user_id").limit(1);

  if (!error) {
    supportsAuthUserId = true;
    return true;
  }

  supportsAuthUserId = error.code !== "42703";
  return supportsAuthUserId;
}

export async function fetchPlayerByUsername(
  username: string
): Promise<PlayerAccount | null> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  const supportsAuthLink = await detectAuthUserIdSupport();
  const { data, error } = supportsAuthLink
    ? await supabase
        .from("players")
        .select("id, username, gold, is_admin, auth_user_id")
        .ilike("username", normalizedUsername)
        .single()
    : await supabase
        .from("players")
        .select("id, username, gold, is_admin")
        .ilike("username", normalizedUsername)
        .single();

  if (error || !data) {
    return null;
  }

  return mapPlayerRow(data as PlayerRow);
}

export async function fetchPlayerByAuthUserId(
  authUserId: string
): Promise<PlayerAccount | null> {
  const normalizedAuthUserId = authUserId.trim();

  if (!normalizedAuthUserId) {
    return null;
  }

  const supportsAuthLink = await detectAuthUserIdSupport();

  if (!supportsAuthLink) {
    return null;
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, username, gold, is_admin, auth_user_id")
    .eq("auth_user_id", normalizedAuthUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapPlayerRow(data as PlayerRow);
}

export async function updatePlayerGold(
  playerId: string,
  nextGold: number
): Promise<boolean> {
  const { error } = await supabase
    .from("players")
    .update({ gold: Math.max(0, nextGold) })
    .eq("id", playerId);

  return !error;
}

export async function fetchAllPlayers(): Promise<PlayerAccount[]> {
  const supportsAuthLink = await detectAuthUserIdSupport();
  const { data, error } = supportsAuthLink
    ? await supabase
        .from("players")
        .select("id, username, gold, is_admin, auth_user_id")
        .order("username", { ascending: true })
    : await supabase
        .from("players")
        .select("id, username, gold, is_admin")
        .order("username", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as PlayerRow[]).map(mapPlayerRow);
}

export async function createPlayerAccount(input: {
  username: string;
  gold: number;
  isAdmin?: boolean;
  authUserId?: string;
}) {
  const normalizedUsername = input.username.trim();

  if (!normalizedUsername) {
    return {
      status: "error" as const,
      message: "El nombre del jugador no puede quedar vacio.",
      player: null as PlayerAccount | null,
    };
  }

  const supportsAuthLink = await detectAuthUserIdSupport();
  const insertPayload = {
    username: normalizedUsername,
    gold: Math.max(0, input.gold),
    is_admin: Boolean(input.isAdmin),
    ...(supportsAuthLink && input.authUserId
      ? { auth_user_id: input.authUserId.trim() }
      : {}),
  };

  const adminAttempt = supportsAuthLink
    ? await supabase
        .from("players")
        .insert(insertPayload)
        .select("id, username, gold, is_admin, auth_user_id")
        .single()
    : await supabase
        .from("players")
        .insert(insertPayload)
        .select("id, username, gold, is_admin")
        .single();

  if (!adminAttempt.error && adminAttempt.data) {
    return {
      status: "created" as const,
      message: "Jugador creado correctamente.",
      player: mapPlayerRow(adminAttempt.data as PlayerRow),
    };
  }

  if (adminAttempt.error?.code === "23505") {
    return {
      status: "exists" as const,
      message: "Ese jugador ya existe en la base de datos.",
      player: null as PlayerAccount | null,
    };
  }

  const fallbackAttempt = await supabase
    .from("players")
    .insert({
      username: normalizedUsername,
      gold: Math.max(0, input.gold),
    })
    .select("id, username, gold")
    .single();

  if (!fallbackAttempt.error && fallbackAttempt.data) {
    return {
      status: "created" as const,
      message:
        "Jugador creado correctamente. La columna is_admin aun no esta disponible, asi que se guardo como jugador normal.",
      player: mapPlayerRow(fallbackAttempt.data as PlayerRow),
    };
  }

  if (fallbackAttempt.error?.code === "23505") {
    return {
      status: "exists" as const,
      message: "Ese jugador ya existe en la base de datos.",
      player: null as PlayerAccount | null,
    };
  }

  return {
    status: "error" as const,
    message: "No se pudo crear el jugador en Supabase.",
    player: null as PlayerAccount | null,
  };
}

export async function linkPlayerToAuthUser(playerId: string, authUserId: string) {
  const normalizedPlayerId = playerId.trim();
  const normalizedAuthUserId = authUserId.trim();

  if (!normalizedPlayerId || !normalizedAuthUserId) {
    return {
      status: "error" as const,
      message: "Faltan datos para vincular la cuenta segura con el jugador.",
    };
  }

  const supportsAuthLink = await detectAuthUserIdSupport();

  if (!supportsAuthLink) {
    return {
      status: "unavailable" as const,
      message:
        "La columna auth_user_id aun no existe en players. Crea esa columna antes de vincular cuentas seguras.",
    };
  }

  const { data: claimedByAnother, error: claimError } = await supabase
    .from("players")
    .select("id, username")
    .eq("auth_user_id", normalizedAuthUserId)
    .neq("id", normalizedPlayerId)
    .maybeSingle();

  if (claimError) {
    return {
      status: "error" as const,
      message: "No se pudo comprobar si la cuenta segura ya estaba vinculada.",
    };
  }

  if (claimedByAnother) {
    return {
      status: "claimed" as const,
      message: `La cuenta segura ya esta vinculada a ${claimedByAnother.username}.`,
    };
  }

  const { data: currentPlayer, error: playerError } = await supabase
    .from("players")
    .select("id, username, auth_user_id")
    .eq("id", normalizedPlayerId)
    .maybeSingle();

  if (playerError || !currentPlayer) {
    return {
      status: "error" as const,
      message: "No se pudo leer el jugador que quieres vincular.",
    };
  }

  if (
    currentPlayer.auth_user_id &&
    String(currentPlayer.auth_user_id) !== normalizedAuthUserId
  ) {
    return {
      status: "claimed" as const,
      message: `El jugador ${currentPlayer.username} ya esta ligado a otra cuenta segura.`,
    };
  }

  const { error } = await supabase
    .from("players")
    .update({ auth_user_id: normalizedAuthUserId })
    .eq("id", normalizedPlayerId);

  if (error) {
    return {
      status: "error" as const,
      message: "No se pudo guardar la vinculacion segura del jugador.",
    };
  }

  return {
    status: "linked" as const,
    message: "Jugador vinculado correctamente con la cuenta segura.",
  };
}
