import type { InventoryCategoryId, InventoryEntry, MarketItem } from "../types";
import { supabase } from "./supabaseClient";

// SQL sugerido para Supabase:
//
// create table player_inventory (
//   id uuid primary key default gen_random_uuid(),
//   player_id uuid not null references players(id) on delete cascade,
//   item_id text not null,
//   item_name text not null,
//   item_category text not null,
//   item_description text not null,
//   item_ability text,
//   item_image_url text not null default '',
//   item_image_fit text,
//   item_image_position text,
//   item_rarity text not null,
//   quantity integer not null default 1 check (quantity > 0),
//   created_at timestamptz default now(),
//   updated_at timestamptz default now(),
//   unique (player_id, item_id)
// );
//
// alter table player_inventory enable row level security;
//
// create policy "Allow all inventory access" on player_inventory
//   for all using (true) with check (true);

type InventoryRow = {
  id: string;
  player_id: string;
  item_id: string;
  item_name: string;
  item_category: InventoryCategoryId;
  item_description: string;
  item_ability?: string | null;
  item_image_url: string;
  item_image_fit?: "cover" | "contain" | null;
  item_image_position?: string | null;
  item_rarity: InventoryEntry["itemRarity"];
  quantity: number;
  created_at?: string;
  updated_at?: string;
};

export type InventorySyncResult =
  | { status: "skipped" }
  | { status: "unavailable"; message: string }
  | { status: "synced"; previousQuantity: number };

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

function isTrackableItem(item: MarketItem) {
  return item.category !== "potions";
}

function buildInventoryPayload(
  playerId: string,
  item: MarketItem,
  quantity: number
) {
  return {
    player_id: playerId,
    item_id: item.id,
    item_name: item.name,
    item_category: item.category as InventoryCategoryId,
    item_description: item.description,
    item_ability: item.ability ?? null,
    item_image_url: item.imageUrl,
    item_image_fit: item.imageFit ?? null,
    item_image_position: item.imagePosition ?? null,
    item_rarity: item.rarity,
    quantity,
  };
}

export async function fetchPlayerInventory(playerId: string) {
  const { data, error } = await supabase
    .from("player_inventory")
    .select(
      "id, player_id, item_id, item_name, item_category, item_description, item_ability, item_image_url, item_image_fit, item_image_position, item_rarity, quantity, created_at, updated_at"
    )
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      status: "unavailable" as const,
      message:
        "El inventario aun no esta disponible en Supabase. Debes crear la tabla player_inventory para sincronizarlo entre dispositivos.",
      items: [] as InventoryEntry[],
    };
  }

  return {
    status: "ready" as const,
    message: "",
    items: (data as InventoryRow[]).map(mapInventoryRow),
  };
}

export async function addItemToInventory(
  playerId: string,
  item: MarketItem,
  quantity: number
): Promise<InventorySyncResult> {
  if (!isTrackableItem(item)) {
    return { status: "skipped" };
  }

  const { data: existingRow, error: readError } = await supabase
    .from("player_inventory")
    .select("id, quantity")
    .eq("player_id", playerId)
    .eq("item_id", item.id)
    .maybeSingle();

  if (readError) {
    return {
      status: "unavailable",
      message:
        "No se pudo sincronizar el inventario. La tabla player_inventory parece no estar disponible aun.",
    };
  }

  const previousQuantity = existingRow?.quantity ?? 0;
  const nextQuantity = previousQuantity + quantity;

  if (existingRow) {
    const { error: updateError } = await supabase
      .from("player_inventory")
      .update({
        ...buildInventoryPayload(playerId, item, nextQuantity),
        quantity: nextQuantity,
      })
      .eq("id", existingRow.id);

    if (updateError) {
      return {
        status: "unavailable",
        message:
          "No se pudo actualizar el inventario del jugador en la base de datos.",
      };
    }

    return { status: "synced", previousQuantity };
  }

  const { error: insertError } = await supabase
    .from("player_inventory")
    .insert(buildInventoryPayload(playerId, item, quantity));

  if (insertError) {
    return {
      status: "unavailable",
      message:
        "No se pudo registrar el objeto en el inventario del jugador.",
    };
  }

  return { status: "synced", previousQuantity: 0 };
}

export async function restoreInventoryItem(
  playerId: string,
  item: MarketItem,
  previousQuantity: number
) {
  if (!isTrackableItem(item)) {
    return true;
  }

  if (previousQuantity <= 0) {
    const { error } = await supabase
      .from("player_inventory")
      .delete()
      .eq("player_id", playerId)
      .eq("item_id", item.id);

    return !error;
  }

  const { error } = await supabase
    .from("player_inventory")
    .update({
      ...buildInventoryPayload(playerId, item, previousQuantity),
      quantity: previousQuantity,
    })
    .eq("player_id", playerId)
    .eq("item_id", item.id);

  return !error;
}
