import { supabase } from "./supabaseClient";
import { getGifDuration } from "./gifUtils";
import type { PlayerAccount } from "../types";

type PlayerRow = {
  id: string;
  username: string;
  gold: number;
  is_admin?: boolean | null;
  auth_user_id?: string | null;
  phone?: string | null;
  avatar_gif_url?: string | null;
  max_character_sheets?: number | null;
};

// ponytail: consultamos columnas completas directamente sin sondeo previo. Si la columna o tabla no existe (42703 / 42P01), se degrada limpiamente.
let supportsAuthUserId: boolean | null = null;
let supportsPlayerAuthLinks: boolean | null = null;
let supportsRoleplayAccess: boolean | null = null;
let roleplayAccessRelation: "player_roleplay_access_public" | "player_roleplay_access" =
  "player_roleplay_access_public";
const PLAYER_QUERY_TIMEOUT_MS = 15000;

function isAbortLikeError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedName = error.name.toLowerCase();
  const normalizedMessage = error.message.toLowerCase();

  return (
    normalizedName.includes("abort") ||
    normalizedMessage.includes("abort") ||
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("timeout")
  );
}

function getPlayersConnectionErrorMessage(error: unknown) {
  if (isAbortLikeError(error)) {
    return "La conexion con Supabase demoro demasiado en responder.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "No se pudo consultar Supabase en este momento.";
}

async function runPlayerQueryWithTimeout<T>(
  createQuery: (signal: AbortSignal) => PromiseLike<T> | T,
  timeoutMs: number = PLAYER_QUERY_TIMEOUT_MS
) {
  const controller = new AbortController();
  let timeoutId = 0;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      controller.abort();
      reject(new DOMException("Supabase query timed out", "AbortError"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      Promise.resolve(createQuery(controller.signal)),
      timeoutPromise,
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function mapPlayerRow(row: PlayerRow): PlayerAccount {
  return {
    id: row.id,
    username: row.username,
    gold: row.gold,
    isAdmin: Boolean(row.is_admin),
    authUserId: row.auth_user_id ?? null,
    phone: row.phone ?? null,
    avatar_gif_url: row.avatar_gif_url ?? null,
    maxCharacterSheets: row.max_character_sheets ?? 2,
  };
}

function mapRoleplayAccessRow(row: {
  last_roleplay_at?: string | null;
  grace_until?: string | null;
  locked_at?: string | null;
  lock_reason?: string | null;
  is_exempt?: boolean | null;
  exempt_reason?: string | null;
} | null | undefined) {
  return {
    lastRoleplayAt: row?.last_roleplay_at ?? null,
    graceUntil: row?.grace_until ?? null,
    lockedAt: row?.locked_at ?? null,
    lockReason: row?.lock_reason ?? null,
    isExempt: Boolean(row?.is_exempt),
    exemptReason: row?.exempt_reason ?? null,
    isLocked: Boolean(row?.locked_at) && !Boolean(row?.is_exempt),
  };
}

function isMissingRelationError(error: { code?: string | null } | null | undefined) {
  return error?.code === "42P01";
}

async function attachRoleplayAccess(player: PlayerAccount | null): Promise<PlayerAccount | null> {
  if (!player) {
    return null;
  }

  if (supportsRoleplayAccess === false) {
    return player;
  }

  try {
    const { data, error } = await runPlayerQueryWithTimeout((signal) =>
      supabase
        .from(roleplayAccessRelation)
        .select(
          "last_roleplay_at, grace_until, locked_at, lock_reason, is_exempt, exempt_reason"
        )
        .eq("player_id", player.id)
        .abortSignal(signal)
        .maybeSingle(),
      4000
    );

    if (!error) {
      supportsRoleplayAccess = true;
      return {
        ...player,
        roleplayAccess: mapRoleplayAccessRow(data),
      };
    }

    if (isMissingRelationError(error) && roleplayAccessRelation === "player_roleplay_access_public") {
      roleplayAccessRelation = "player_roleplay_access";
      const fallbackResult = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("player_roleplay_access")
          .select(
            "last_roleplay_at, grace_until, locked_at, lock_reason, is_exempt, exempt_reason"
          )
          .eq("player_id", player.id)
          .abortSignal(signal)
          .maybeSingle(),
        4000
      );
      if (!fallbackResult.error) {
        supportsRoleplayAccess = true;
        return {
          ...player,
          roleplayAccess: mapRoleplayAccessRow(fallbackResult.data),
        };
      }
    }

    return player;
  } catch {
    // Non-blocking: metadatos secundarios de roleplay no deben romper el perfil
    return player;
  }
}

async function attachRoleplayAccessToMany(players: PlayerAccount[]): Promise<PlayerAccount[]> {
  if (!players.length || supportsRoleplayAccess === false) {
    return players;
  }

  try {
    const { data, error } = await runPlayerQueryWithTimeout((signal) =>
      supabase
        .from(roleplayAccessRelation)
        .select(
          "player_id, last_roleplay_at, grace_until, locked_at, lock_reason, is_exempt, exempt_reason"
        )
        .in(
          "player_id",
          players.map((player) => player.id)
        )
        .abortSignal(signal),
      5000
    );

    if (error) {
      return players;
    }

    const roleplayMap = new Map(
      ((data ?? []) as Array<Record<string, unknown>>).map((entry) => [
        String(entry.player_id),
        mapRoleplayAccessRow(entry as never),
      ])
    );

    return players.map((player) => ({
      ...player,
      roleplayAccess: roleplayMap.get(player.id),
    }));
  } catch {
    return players;
  }
}

export async function fetchPlayerByUsername(
  username: string
): Promise<PlayerAccount | null> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  try {
    // ponytail: Consulta directa sin waterfall. Si auth_user_id no existe (42703), reintento inmediato sin esa columna.
    let response = await runPlayerQueryWithTimeout((signal) =>
      supabase
        .from("players")
        .select("id, username, gold, is_admin, auth_user_id, phone, avatar_gif_url, max_character_sheets")
        .ilike("username", normalizedUsername)
        .abortSignal(signal)
        .maybeSingle()
    );

    if (response.error && response.error.code === "42703") {
      supportsAuthUserId = false;
      response = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("players")
          .select("id, username, gold, is_admin, phone, avatar_gif_url, max_character_sheets")
          .ilike("username", normalizedUsername)
          .abortSignal(signal)
          .maybeSingle()
      );
    } else if (!response.error) {
      supportsAuthUserId = true;
    }

    if (response.error || !response.data) {
      return null;
    }

    return await attachRoleplayAccess(mapPlayerRow(response.data as PlayerRow));
  } catch (error) {
    throw new Error(getPlayersConnectionErrorMessage(error));
  }
}

export async function fetchPlayerByAuthUserId(
  authUserId: string
): Promise<PlayerAccount | null> {
  const normalizedAuthUserId = authUserId.trim();

  if (!normalizedAuthUserId) {
    return null;
  }

  try {
    if (supportsPlayerAuthLinks !== false) {
      const linkResult = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("player_auth_links")
          .select(
            "player:players(id, username, gold, is_admin, auth_user_id, phone, avatar_gif_url, max_character_sheets)"
          )
          .eq("auth_user_id", normalizedAuthUserId)
          .limit(1)
          .abortSignal(signal)
          .maybeSingle(),
        6000
      );

      if (linkResult.error && linkResult.error.code === "42P01") {
        supportsPlayerAuthLinks = false;
      } else if (!linkResult.error && linkResult.data) {
        supportsPlayerAuthLinks = true;
        const linkedRaw = (linkResult.data as unknown as { player?: PlayerRow | PlayerRow[] | null }).player;
        const linkedPlayer = Array.isArray(linkedRaw) ? linkedRaw[0] : linkedRaw;
        if (linkedPlayer) {
          return await attachRoleplayAccess(mapPlayerRow(linkedPlayer));
        }
      }
    }

    if (supportsAuthUserId !== false) {
      const directResult = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("players")
          .select("id, username, gold, is_admin, auth_user_id, phone, avatar_gif_url, max_character_sheets")
          .eq("auth_user_id", normalizedAuthUserId)
          .abortSignal(signal)
          .maybeSingle()
      );

      if (directResult.error && directResult.error.code === "42703") {
        supportsAuthUserId = false;
        return null;
      }

      if (!directResult.error && directResult.data) {
        supportsAuthUserId = true;
        return await attachRoleplayAccess(mapPlayerRow(directResult.data as PlayerRow));
      }
    }

    return null;
  } catch (error) {
    throw new Error(getPlayersConnectionErrorMessage(error));
  }
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

  try {
    if (supportsPlayerAuthLinks !== false) {
      const linkCheck = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("player_auth_links")
          .select("player_id")
          .eq("player_id", normalizedPlayerId)
          .eq("auth_user_id", normalizedAuthUserId)
          .limit(1)
          .abortSignal(signal)
          .maybeSingle(),
        5000
      );

      if (linkCheck.error && linkCheck.error.code === "42P01") {
        supportsPlayerAuthLinks = false;
      } else if (!linkCheck.error && linkCheck.data) {
        supportsPlayerAuthLinks = true;
        return true;
      }
    }

    if (supportsAuthUserId !== false) {
      const directCheck = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("players")
          .select("id")
          .eq("id", normalizedPlayerId)
          .eq("auth_user_id", normalizedAuthUserId)
          .limit(1)
          .abortSignal(signal)
          .maybeSingle(),
        5000
      );

      if (directCheck.error && directCheck.error.code === "42703") {
        supportsAuthUserId = false;
        return false;
      }

      return !directCheck.error && Boolean(directCheck.data);
    }

    return false;
  } catch {
    return false;
  }
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

export async function incrementPlayerGold(
  playerId: string,
  delta: number
): Promise<number | null> {
  const { data, error } = await supabase.rpc("increment_gold", {
    p_player_id: playerId,
    p_amount: Math.trunc(delta),
  });

  if (error || !Array.isArray(data) || !data[0]?.success) {
    return null;
  }

  const nextGold = Number(data[0].new_gold);
  return Number.isFinite(nextGold) ? nextGold : null;
}

export async function touchPlayerActivity(playerId: string): Promise<boolean> {
  const { error } = await supabase
    .from("players")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", playerId);
  
  return !error;
}

export async function fetchAllPlayers(): Promise<PlayerAccount[]> {
  try {
    const fullResponse = await runPlayerQueryWithTimeout((signal) =>
      supabase
        .from("players")
        .select("id, username, gold, is_admin, auth_user_id, phone, avatar_gif_url, max_character_sheets")
        .order("username", { ascending: true })
        .abortSignal(signal)
    );

    if (!fullResponse.error && fullResponse.data) {
      supportsAuthUserId = true;
      return await attachRoleplayAccessToMany((fullResponse.data as PlayerRow[]).map(mapPlayerRow));
    }

    if (fullResponse.error && fullResponse.error.code === "42703") {
      supportsAuthUserId = false;
      const fallbackResponse = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("players")
          .select("id, username, gold, is_admin, phone, avatar_gif_url, max_character_sheets")
          .order("username", { ascending: true })
          .abortSignal(signal)
      );

      if (!fallbackResponse.error && fallbackResponse.data) {
        return await attachRoleplayAccessToMany((fallbackResponse.data as PlayerRow[]).map(mapPlayerRow));
      }
    }

    return [];
  } catch (error) {
    if (isAbortLikeError(error)) {
      return [];
    }

    throw error;
  }
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

  const insertPayload = {
    username: normalizedUsername,
    gold: Math.max(0, input.gold),
    is_admin: Boolean(input.isAdmin),
    ...(input.authUserId ? { auth_user_id: input.authUserId.trim() } : {}),
  };

  try {
    let result = await runPlayerQueryWithTimeout((signal) =>
      supabase
        .from("players")
        .insert(insertPayload)
        .select("id, username, gold, is_admin, auth_user_id, phone, avatar_gif_url, max_character_sheets")
        .abortSignal(signal)
        .single()
    );

    if (result.error && result.error.code === "42703") {
      supportsAuthUserId = false;
      result = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("players")
          .insert({
            username: normalizedUsername,
            gold: Math.max(0, input.gold),
            is_admin: Boolean(input.isAdmin),
          })
          .select("id, username, gold, is_admin, phone, avatar_gif_url, max_character_sheets")
          .abortSignal(signal)
          .single()
      );
    }

    if (!result.error && result.data) {
      return {
        status: "created" as const,
        message: "Jugador creado correctamente.",
        player: mapPlayerRow(result.data as PlayerRow),
      };
    }

    if (result.error?.code === "23505") {
      return {
        status: "exists" as const,
        message: "Ese jugador ya existe en la base de datos.",
        player: null as PlayerAccount | null,
      };
    }
  } catch (error) {
    return {
      status: "error" as const,
      message: getPlayersConnectionErrorMessage(error),
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

  try {
    const { data: currentPlayer, error: playerError } = await runPlayerQueryWithTimeout((signal) =>
      supabase
        .from("players")
        .select("id, username, auth_user_id")
        .eq("id", normalizedPlayerId)
        .abortSignal(signal)
        .maybeSingle()
    );

    if (playerError || !currentPlayer) {
      return {
        status: "error" as const,
        message: "No se pudo leer el jugador que quieres vincular.",
      };
    }

    if (supportsPlayerAuthLinks !== false) {
      const linkInsert = await runPlayerQueryWithTimeout((signal) =>
        supabase
          .from("player_auth_links")
          .insert({
            player_id: normalizedPlayerId,
            auth_user_id: normalizedAuthUserId,
          })
          .abortSignal(signal)
      );

      if (!linkInsert.error || linkInsert.error.code === "23505") {
        supportsPlayerAuthLinks = true;
        return {
          status: "linked" as const,
          message: "Jugador vinculado correctamente con la cuenta segura.",
        };
      }

      if (linkInsert.error.code === "42P01") {
        supportsPlayerAuthLinks = false;
      }
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

    const { error } = await runPlayerQueryWithTimeout((signal) =>
      supabase
        .from("players")
        .update({ auth_user_id: normalizedAuthUserId })
        .eq("id", normalizedPlayerId)
        .abortSignal(signal)
    );

    if (error) {
      if (error.code === "42703") {
        supportsAuthUserId = false;
        return {
          status: "unavailable" as const,
          message: "La vinculacion segura aun no esta activada en Supabase.",
        };
      }

      return {
        status: "error" as const,
        message: "No se pudo guardar la vinculacion segura del jugador.",
      };
    }

    return {
      status: "linked" as const,
      message: "Jugador vinculado correctamente con la cuenta segura.",
    };
  } catch (error) {
    return {
      status: "error" as const,
      message: getPlayersConnectionErrorMessage(error),
    };
  }
}

export async function uploadPlayerAvatarGif(
  playerId: string,
  file: File
) {
  const path = `${playerId}.gif`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: "image/gif",
    });

  if (uploadError) {
    return {
      status: "error" as const,
      message: `Error al subir el GIF: ${uploadError.message}`,
    };
  }

  const durationMs = await getGifDuration(file);
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  const finalUrl = `${urlData.publicUrl}?duration=${durationMs}&t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("players")
    .update({ avatar_gif_url: finalUrl })
    .eq("id", playerId);

  if (updateError) {
    return {
      status: "error" as const,
      message: `Error al guardar la URL en la base de datos: ${updateError.message}`,
    };
  }

  return {
    status: "saved" as const,
    message: "Avatar GIF actualizado correctamente.",
    url: urlData.publicUrl,
  };
}

export async function buyCharacterSlot(playerId: string) {
  const { data, error } = await supabase.rpc("buy_character_slot", { p_player_id: playerId });
  if (error || !data) {
    return {
      status: "error" as const,
      message: error?.message ?? "No se pudo completar la transaccion en el servidor.",
    };
  }

  return data as {
    status: "success" | "error";
    message: string;
    new_gold?: number;
    new_max_slots?: number;
  };
}
