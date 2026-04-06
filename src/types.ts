import type { LucideIcon } from "lucide-react";

export type TabId = "home" | "lore" | "world" | "market" | "ranking";
export type Rarity = "legendary" | "epic" | "rare" | "common";
export type PlayerStatus = "alive" | "dead";
export type MarketCategoryId = "potions" | "armors" | "swords" | "others";
export type InventoryCategoryId = Exclude<MarketCategoryId, "potions">;
export type EventStatus = "active" | "in-production" | "finished";
export type StockStatus = "available" | "limited" | "sold-out";

export type PlayerAccount = {
  id: string;
  username: string;
  gold: number;
  isAdmin?: boolean;
};

export type NavItem = {
  id: TabId;
  label: string;
  icon: LucideIcon;
};

export type MarketCategory = {
  id: MarketCategoryId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

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

export type RankingPlayer = {
  id: string;
  name: string;
  faction: string;
  activityPoints: number;
  missionsCompleted: number;
  eventsJoined: number;
  streakDays?: number;
  status: PlayerStatus;
  weekStartsAt?: string;
  weekEndsAt?: string;
};

export type RankingWindow = {
  weekStartsAt: string;
  weekEndsAt: string;
};

export type WeeklyRankingState = {
  status: "ready" | "fallback";
  message: string;
  window: RankingWindow;
  players: RankingPlayer[];
};

export type AdminTemplate = {
  id: string;
  title: string;
  description: string;
  scoring: Array<{
    label: string;
    points: number;
  }>;
};

export type RealmEvent = {
  id?: string;
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

export type HomeStat = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export type KingdomAnnouncement = {
  title: string;
  content: string;
};

export type JoinStep = {
  title: string;
  description: string;
};

export type LoreRule = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type LoreChapter = {
  title: string;
  summary: string;
  content: string;
};

export type RealmFaction = {
  name: string;
  motto: string;
  description: string;
};

export type PopulationGroup = {
  title: string;
  races: string[];
};

export type DemographicBloc = {
  realm: string;
  epithet: string;
  groups: PopulationGroup[];
};

export type GeopoliticalNote = {
  title: string;
  description: string;
};

export type PurchaseFormValues = {
  whatsapp: string;
  quantity: number;
  gotcha: string;
};
