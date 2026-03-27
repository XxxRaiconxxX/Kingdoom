import type { LucideIcon } from "lucide-react";

export type TabId = "home" | "lore" | "world" | "market" | "ranking";
export type Rarity = "legendary" | "epic" | "rare" | "common";
export type PlayerStatus = "alive" | "dead";
export type MarketCategoryId = "potions" | "armors" | "swords" | "others";
export type EventStatus = "active" | "in-production" | "finished";
export type StockStatus = "available" | "limited" | "sold-out";

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
  name: string;
  description: string;
  ability?: string;
  price: number;
  rarity: Rarity;
  imageUrl: string;
  category: MarketCategoryId;
  stockStatus: StockStatus;
  featured?: boolean;
};

export type RankingPlayer = {
  name: string;
  faction: string;
  level: number;
  gold: number;
  status: PlayerStatus;
};

export type RealmEvent = {
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
  buyerName: string;
  whatsapp: string;
  quantity: number;
  gotcha: string;
};
