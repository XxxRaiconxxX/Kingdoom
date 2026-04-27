export type Rarity = "legendary" | "epic" | "rare" | "common";
export type MarketCategoryId = "potions" | "armors" | "swords" | "others";
export type InventoryCategoryId = Exclude<MarketCategoryId, "potions">;
export type EventStatus = "active" | "in-production" | "finished";
export type StockStatus = "available" | "limited" | "sold-out";
export type MissionStatus = "available" | "in-progress" | "closed";
export type MissionDifficulty = "easy" | "medium" | "hard" | "elite";
export type MissionType = "story" | "hunt" | "escort" | "investigation" | "event";
export type BestiaryRarity = "common" | "uncommon" | "rare" | "legendary" | "calamity";

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

export type AbilityLevel = {
  level: number;
  name: string;
  effect: string;
  cd: string;
  limit: string;
  antiManoNegra: string;
};

export type MagicStyle = {
  id: string;
  categoryId: string;
  categoryTitle: string;
  title: string;
  description: string;
  levels: Record<number, AbilityLevel[]>;
};

export type BestiaryEntry = {
  id: string;
  name: string;
  category: string;
  type: string;
  generalData: string;
  threatLevel: string;
  domestication: string;
  usage: string;
  originPlace: string;
  foundAt: string;
  description: string;
  ability: string;
  rarity: BestiaryRarity;
  imageUrl: string;
};

export type FloraEntry = {
  id: string;
  name: string;
  category: string;
  type: string;
  generalData: string;
  properties: string;
  usage: string;
  originPlace: string;
  foundAt: string;
  description: string;
  rarity: BestiaryRarity;
  imageUrl: string;
};

export type RealmMission = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  rewardGold: number;
  maxParticipants: number;
  difficulty: MissionDifficulty;
  type: MissionType;
  status: MissionStatus;
  visible: boolean;
};
