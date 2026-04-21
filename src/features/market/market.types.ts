import type { MarketCategoryId, MarketItem, Rarity, StockStatus } from "../../types";

export type MarketItemRow = {
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

