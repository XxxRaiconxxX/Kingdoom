import { supabase } from "./supabaseClient";
import type { PlayerAccount } from "../types";

export async function fetchPlayerByUsername(
  username: string
): Promise<PlayerAccount | null> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, username, gold")
    .ilike("username", normalizedUsername)
    .single();

  if (error || !data) {
    return null;
  }

  return data as PlayerAccount;
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
