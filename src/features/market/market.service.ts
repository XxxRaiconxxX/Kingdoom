import { MARKET_ITEMS } from "../../data/market";
import { formatAdminPermissionMessage } from "../../utils/supabaseErrors";
import { supabase } from "../../utils/supabaseClient";
import { buildMarketItemPayload, mapMarketItemRow } from "./market.adapter";
import type { AdminMarketItemInput, MarketItemRow, MarketItemsState } from "./market.types";

const MARKET_ITEMS_SELECT =
  "id, name, description, ability, price, rarity, image_url, image_fit, image_position, category, stock_status, stock_limit, stock_sold, featured";
const MARKET_ITEMS_LEGACY_SELECT =
  "id, name, description, ability, price, rarity, image_url, image_fit, image_position, category, stock_status, featured";

export async function fetchMarketItems(): Promise<MarketItemsState> {
  const result = await supabase
    .from("market_items")
    .select(MARKET_ITEMS_SELECT)
    .order("created_at", { ascending: false });
  let data: MarketItemRow[] | null = result.data as MarketItemRow[] | null;
  let error = result.error;

  if (error?.message.toLowerCase().includes("stock_")) {
    const legacyResult = await supabase
      .from("market_items")
      .select(MARKET_ITEMS_LEGACY_SELECT)
      .order("created_at", { ascending: false });

    data = legacyResult.data as MarketItemRow[] | null;
    error = legacyResult.error;
  }

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

  let { error } = await supabase
    .from("market_items")
    .upsert(payload, { onConflict: "id" });

  if (error?.message.toLowerCase().includes("stock_")) {
    const { stock_limit: _stockLimit, stock_sold: _stockSold, ...legacyPayload } = payload;
    const legacyResult = await supabase
      .from("market_items")
      .upsert(legacyPayload, { onConflict: "id" });

    error = legacyResult.error;
  }

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
