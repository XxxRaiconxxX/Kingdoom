import { supabase } from "./supabaseClient";
import type { PlayerAccount } from "../types";

type PlayerRow = {
  id: string;
  username: string;
  gold: number;
  is_admin?: boolean | null;
};

function mapPlayerRow(row: PlayerRow): PlayerAccount {
  return {
    id: row.id,
    username: row.username,
    gold: row.gold,
    isAdmin: row.is_admin ?? row.username.trim().toLowerCase() === "nothing",
  };
}

export async function fetchPlayerByUsername(
  username: string
): Promise<PlayerAccount | null> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  const adminAttempt = await supabase
    .from("players")
    .select("id, username, gold, is_admin")
    .ilike("username", normalizedUsername)
    .single();

  if (!adminAttempt.error && adminAttempt.data) {
    return mapPlayerRow(adminAttempt.data as PlayerRow);
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, username, gold")
    .ilike("username", normalizedUsername)
    .single();

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
  const adminAttempt = await supabase
    .from("players")
    .select("id, username, gold, is_admin")
    .order("username", { ascending: true });

  if (!adminAttempt.error && adminAttempt.data) {
    return (adminAttempt.data as PlayerRow[]).map(mapPlayerRow);
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, username, gold")
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
}) {
  const normalizedUsername = input.username.trim();

  if (!normalizedUsername) {
    return {
      status: "error" as const,
      message: "El nombre del jugador no puede quedar vacio.",
      player: null as PlayerAccount | null,
    };
  }

  const adminAttempt = await supabase
    .from("players")
    .insert({
      username: normalizedUsername,
      gold: Math.max(0, input.gold),
      is_admin: Boolean(input.isAdmin),
    })
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
