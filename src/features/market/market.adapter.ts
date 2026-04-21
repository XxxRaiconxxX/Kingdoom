import type { MarketCategoryId, MarketItem } from "../../types";
import type { AdminMarketItemInput, MarketItemRow } from "./market.types";

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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return `${prefix}-${slug}`;
}

export function mapMarketItemRow(row: MarketItemRow): MarketItem {
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

export function buildMarketItemPayload(input: AdminMarketItemInput) {
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

