import type { InventoryCategoryId, InventoryEntry, Rarity } from "@/src/features/shared/types";
import { supabase, supabaseConfigError } from "@/src/services/supabase";

type InventoryRow = {
  id: string;
  player_id: string;
  item_id: string;
  item_name: string;
  item_category: InventoryCategoryId;
  item_description: string;
  item_ability: string | null;
  item_image_url: string;
  item_image_fit: "cover" | "contain" | null;
  item_image_position: string | null;
  item_rarity: Rarity;
  quantity: number;
  created_at?: string;
  updated_at?: string;
};

function mapInventoryRow(row: InventoryRow): InventoryEntry {
  return {
    id: row.id,
    playerId: row.player_id,
    itemId: row.item_id,
    itemName: row.item_name,
    itemCategory: row.item_category,
    itemDescription: row.item_description,
    itemAbility: row.item_ability ?? undefined,
    itemImageUrl: row.item_image_url,
    itemImageFit: row.item_image_fit ?? undefined,
    itemImagePosition: row.item_image_position ?? undefined,
    itemRarity: row.item_rarity,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchPlayerInventoryNative(playerId: string) {
  if (!supabase) {
    return { items: [] as InventoryEntry[], errorMessage: supabaseConfigError };
  }

  const { data, error } = await supabase
    .from("player_inventory")
    .select(
      "id, player_id, item_id, item_name, item_category, item_description, item_ability, item_image_url, item_image_fit, item_image_position, item_rarity, quantity, created_at, updated_at"
    )
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      items: [] as InventoryEntry[],
      errorMessage: "No se pudo leer el inventario desde Supabase.",
    };
  }

  return {
    items: (data as InventoryRow[]).map(mapInventoryRow),
    errorMessage: "",
  };
}
