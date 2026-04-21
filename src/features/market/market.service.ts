import { MARKET_ITEMS } from "../../data/market";
import { formatAdminPermissionMessage } from "../../utils/supabaseErrors";
import { supabase } from "../../utils/supabaseClient";
import { buildMarketItemPayload, mapMarketItemRow } from "./market.adapter";
import type { AdminMarketItemInput, MarketItemRow, MarketItemsState } from "./market.types";

export async function fetchMarketItems(): Promise<MarketItemsState> {
  const { data, error } = await supabase
    .from("market_items")
    .select(
      "id, name, description, ability, price, rarity, image_url, image_fit, image_position, category, stock_status, featured"
    )
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return {
      status: "fallback",
      message: "Se muestra el catalogo local del proyecto.",
      items: MARKET_ITEMS,
    };
  }

  return {
    status: "ready",
    message: "",
    items: (data as MarketItemRow[]).map(mapMarketItemRow),
  };
}

export async function upsertMarketItem(input: AdminMarketItemInput) {
  const payload = buildMarketItemPayload(input);

  const { error } = await supabase
    .from("market_items")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo guardar el item.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Item guardado correctamente.",
  };
}

export async function deleteMarketItem(id: string) {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return {
      status: "error" as const,
      message: "Selecciona un item valido para borrarlo.",
    };
  }

  const { error } = await supabase
    .from("market_items")
    .delete()
    .eq("id", normalizedId);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo borrar el item.",
        error.message
      ),
    };
  }

  return {
    status: "deleted" as const,
    message: "Item borrado correctamente.",
  };
}

