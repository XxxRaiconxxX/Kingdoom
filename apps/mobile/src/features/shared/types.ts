export type Rarity = "legendary" | "epic" | "rare" | "common";
export type MarketCategoryId = "potions" | "armors" | "swords" | "others";
export type InventoryCategoryId = Exclude<MarketCategoryId, "potions">;
export type EventStatus = "active" | "in-production" | "finished";
export type StockStatus = "available" | "limited" | "sold-out";

export type MarketItem = {
  id: string;
  name: string;
  description: string;
  ability?: string;
  price: number;
  rarity: Rarity;
  imageUrl: string;
  imageFit?: "cover" | "contain";
  imagePosition?: string;
  category: MarketCategoryId;
  stockStatus: StockStatus;
  featured?: boolean;
};

export type RealmEvent = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  factions: string[];
  rewards: string;
  requirements: string;
};

export type InventoryEntry = {
  id: string;
  playerId: string;
  itemId: string;
  itemName: string;
  itemCategory: InventoryCategoryId;
  itemDescription: string;
  itemAbility?: string;
  itemImageUrl: string;
  itemImageFit?: "cover" | "contain";
  itemImagePosition?: string;
  itemRarity: Rarity;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
};
