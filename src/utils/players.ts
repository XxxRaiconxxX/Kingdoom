import { supabase } from "./supabaseClient";
import type { PlayerAccount } from "../types";

type PlayerRow = {
  id: string;
  username: string;
  gold: number;
  is_admin?: boolean | null;
  auth_user_id?: string | null;
  phone?: string | null;
};

let supportsAuthUserId: boolean | null = null;
let supportsPlayerAuthLinks: boolean | null = null;

function mapPlayerRow(row: PlayerRow): PlayerAccount {
  return {
    id: row.id,
    username: row.username,
    gold: row.gold,
    isAdmin: Boolean(row.is_admin),
    authUserId: row.auth_user_id ?? null,
    phone: row.phone ?? null,
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

async function detectPlayerAuthLinksSupport() {
  if (supportsPlayerAuthLinks !== null) {
    return supportsPlayerAuthLinks;
  }

  const { error } = await supabase.from("player_auth_links").select("player_id").limit(1);

  if (!error) {
    supportsPlayerAuthLinks = true;
    return true;
  }

  supportsPlayerAuthLinks = error.code !== "42P01";
  return supportsPlayerAuthLinks;
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
        .select("id, username, gold, is_admin, auth_user_id, phone")
        .ilike("username", normalizedUsername)
        .single()
    : await supabase
        .from("players")
        .select("id, username, gold, is_admin, phone")
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

  const supportsAuthLinkTable = await detectPlayerAuthLinksSupport();

  if (supportsAuthLinkTable) {
    const { data, error } = await supabase
      .from("player_auth_links")
      .select(
        "player:players(id, username, gold, is_admin, auth_user_id, phone)"
      )
      .eq("auth_user_id", normalizedAuthUserId)
      .limit(1)
      .maybeSingle();

    const linkedPlayer = (data as { player?: PlayerRow | null } | null)?.player;

    if (!error && linkedPlayer) {
      return mapPlayerRow(linkedPlayer);
    }
  }

  const supportsAuthLinkColumn = await detectAuthUserIdSupport();

  if (!supportsAuthLinkColumn) {
    return null;
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, username, gold, is_admin, auth_user_id, phone")
    .eq("auth_user_id", normalizedAuthUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapPlayerRow(data as PlayerRow);
}

export async function isPlayerLinkedToAuthUser(
  playerId: string,
  authUserId: string
): Promise<boolean> {
  const normalizedPlayerId = playerId.trim();
  const normalizedAuthUserId = authUserId.trim();

  if (!normalizedPlayerId || !normalizedAuthUserId) {
    return false;
  }

  const supportsAuthLinkTable = await detectPlayerAuthLinksSupport();

  if (supportsAuthLinkTable) {
    const { data, error } = await supabase
      .from("player_auth_links")
      .select("player_id")
      .eq("player_id", normalizedPlayerId)
      .eq("auth_user_id", normalizedAuthUserId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return true;
    }
  }

  const supportsAuthLinkColumn = await detectAuthUserIdSupport();

  if (!supportsAuthLinkColumn) {
    return false;
  }

  const { data, error } = await supabase
    .from("players")
    .select("id")
    .eq("id", normalizedPlayerId)
    .eq("auth_user_id", normalizedAuthUserId)
    .limit(1)
    .maybeSingle();

  return !error && Boolean(data);
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
        .select("id, username, gold, is_admin, auth_user_id, phone")
        .order("username", { ascending: true })
    : await supabase
        .from("players")
        .select("id, username, gold, is_admin, phone")
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
        .select("id, username, gold, is_admin, auth_user_id, phone")
        .single()
    : await supabase
        .from("players")
        .insert(insertPayload)
        .select("id, username, gold, is_admin, phone")
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
    .select("id, username, gold, phone")
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

  const supportsAuthLinkTable = await detectPlayerAuthLinksSupport();

  if (supportsAuthLinkTable) {
    const alreadyLinked = await isPlayerLinkedToAuthUser(
      normalizedPlayerId,
      normalizedAuthUserId
    );

    if (alreadyLinked) {
      return {
        status: "linked" as const,
        message: "El jugador ya estaba vinculado a esta cuenta segura.",
      };
    }

    const { error } = await supabase.from("player_auth_links").insert({
      player_id: normalizedPlayerId,
      auth_user_id: normalizedAuthUserId,
    });

    if (error && error.code !== "23505") {
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

  const supportsAuthLinkColumn = await detectAuthUserIdSupport();

  if (!supportsAuthLinkColumn) {
    return {
      status: "unavailable" as const,
      message:
        "La vinculacion segura aun no esta activada en Supabase. Ejecuta el SQL de enlaces seguros antes de continuar.",
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
