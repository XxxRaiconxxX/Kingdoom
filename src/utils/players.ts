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
