import { MARKET_ITEMS } from "../data/market";
import type { MarketCategoryId, MarketItem, Rarity, StockStatus } from "../types";
import { supabase } from "./supabaseClient";

// SQL sugerido para Supabase:
//
// create table if not exists market_items (
//   id text primary key,
//   name text not null,
//   description text not null,
//   ability text,
//   price integer not null default 0,
//   rarity text not null default 'common',
//   image_url text not null default '',
//   image_fit text,
//   image_position text,
//   category text not null,
//   stock_status text not null default 'available',
//   featured boolean not null default false,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now()
// );
//
// alter table market_items enable row level security;
//
// create policy "Allow all market access" on market_items
//   for all using (true) with check (true);

type MarketItemRow = {
  id: string;
  name: string;
  description: string;
  ability: string | null;
  price: number;
  rarity: Rarity;
  image_url: string;
  image_fit: "cover" | "contain" | null;
  image_position: string | null;
  category: MarketCategoryId;
  stock_status: StockStatus;
  featured: boolean;
};

export type MarketItemsState = {
  status: "ready" | "fallback";
  message: string;
  items: MarketItem[];
};

export type AdminMarketItemInput = {
  id: string;
  name: string;
  description: string;
  ability: string;
  price: number;
  rarity: Rarity;
  imageUrl: string;
  imageFit: "cover" | "contain" | "";
  imagePosition: string;
  category: MarketCategoryId;
  stockStatus: StockStatus;
  featured: boolean;
};

/** Converts a human-readable name + category prefix into a URL-safe slug. */
export function slugifyMarketItem(name: string, category: MarketCategoryId): string {
  const prefixMap: Record<MarketCategoryId, string> = {
    potions: "potion",
    armors: "armor",
    swords: "sword",
    others: "other",
  };

  const prefix = prefixMap[category] ?? "item";
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return `${prefix}-${slug}`;
}

function mapMarketItemRow(row: MarketItemRow): MarketItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ability: row.ability ?? undefined,
    price: row.price,
    rarity: row.rarity,
    imageUrl: row.image_url,
    imageFit: row.image_fit ?? undefined,
    imagePosition: row.image_position ?? undefined,
    category: row.category,
    stockStatus: row.stock_status,
    featured: row.featured,
  };
}

function buildMarketItemPayload(input: AdminMarketItemInput) {
  return {
    id: input.id,
    name: input.name.trim(),
    description: input.description.trim(),
    ability: input.ability.trim() || null,
    price: input.price,
    rarity: input.rarity,
    image_url: input.imageUrl.trim(),
    image_fit: input.imageFit || null,
    image_position: input.imagePosition.trim() || null,
    category: input.category,
    stock_status: input.stockStatus,
    featured: input.featured,
  };
}

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
      message:
        "Todavia no hay items administrados desde Supabase. Se muestra el catalogo local del proyecto.",
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
      message: "No se pudo guardar el item en Supabase: " + error.message,
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
      message: "No se pudo borrar el item en Supabase.",
    };
  }

  return {
    status: "deleted" as const,
    message: "Item borrado correctamente.",
  };
}
