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
  stock_limit?: number | null;
  stock_sold?: number | null;
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
    stockLimit: row.stock_limit ?? undefined,
    stockSold: row.stock_sold ?? undefined,
    featured: row.featured,
  };
}

export async function fetchMarketItemsNative() {
  if (!supabase) {
    return { items: [] as MarketItem[], errorMessage: supabaseConfigError };
  }

  const result = await supabase
    .from("market_items")
    .select(
      "id, name, description, ability, price, rarity, image_url, image_fit, image_position, category, stock_status, stock_limit, stock_sold, featured"
    )
    .order("created_at", { ascending: false });
  let data: MarketItemRow[] | null = result.data as MarketItemRow[] | null;
  let error = result.error;

  if (error?.message.toLowerCase().includes("stock_")) {
    const legacyResult = await supabase
      .from("market_items")
      .select(
        "id, name, description, ability, price, rarity, image_url, image_fit, image_position, category, stock_status, featured"
      )
      .order("created_at", { ascending: false });

    data = legacyResult.data as MarketItemRow[] | null;
    error = legacyResult.error;
  }

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
