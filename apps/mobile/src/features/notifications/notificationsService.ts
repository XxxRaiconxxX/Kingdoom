import { supabase } from "@/src/services/supabase";

export type PlayerNotificationKind = "gold" | "item";

export type PlayerNotification = {
  id: string;
  playerId: string;
  senderPlayerId: string | null;
  senderName: string;
  kind: PlayerNotificationKind;
  title: string;
  message: string;
  amount: number;
  itemName: string | null;
  isRead: boolean;
  createdAt: string;
};

type PlayerNotificationRow = {
  id: string;
  player_id: string;
  sender_player_id: string | null;
  sender_name: string;
  kind: PlayerNotificationKind;
  title: string;
  message: string;
  amount: number;
  item_name: string | null;
  is_read: boolean;
  created_at: string;
};

export async function fetchPlayerNotificationsNative(
  playerId: string,
  limit = 8
): Promise<PlayerNotification[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("player_notifications")
      .select(
        "id, player_id, sender_player_id, sender_name, kind, title, message, amount, item_name, is_read, created_at"
      )
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return (data as PlayerNotificationRow[]).map(mapNotificationRow);
  } catch {
    return [];
  }
}

export async function markPlayerNotificationsReadNative(playerId: string): Promise<void> {
  try {
    if (!supabase) return;

    await supabase
      .from("player_notifications")
      .update({ is_read: true })
      .eq("player_id", playerId)
      .eq("is_read", false);
  } catch {
    // Notifications must never block the player flow.
  }
}

function mapNotificationRow(row: PlayerNotificationRow): PlayerNotification {
  return {
    id: row.id,
    playerId: row.player_id,
    senderPlayerId: row.sender_player_id,
    senderName: row.sender_name,
    kind: row.kind,
    title: row.title,
    message: row.message,
    amount: row.amount,
    itemName: row.item_name,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}
