import type { MarketItem, MarketCategoryId, Rarity, StockStatus } from "@/src/features/shared/types";
import { formatSupabaseReadError, supabase, supabaseConfigError } from "@/src/services/supabase";

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

export async function fetchMarketItemsNative() {
  if (!supabase) {
    return { items: [] as MarketItem[], errorMessage: supabaseConfigError };
  }

  const { data, error } = await supabase
    .from("market_items")
    .select(
      "id, name, description, ability, price, rarity, image_url, image_fit, image_position, category, stock_status, featured"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      items: [] as MarketItem[],
      errorMessage: formatSupabaseReadError("el mercado", error),
    };
  }

  return {
    items: (data as MarketItemRow[]).map(mapMarketItemRow),
    errorMessage: "",
  };
}
