import type { LucideIcon } from "lucide-react";

export type TabId = "home" | "grimoire" | "library" | "market" | "archivist";
export type Rarity = "mythic" | "legendary" | "epic" | "rare" | "common";
export type PlayerStatus = "alive" | "dead";
export type MarketCategoryId = "potions" | "armors" | "swords" | "others";
export type InventoryCategoryId = Exclude<MarketCategoryId, "potions">;
export type EventStatus = "active" | "in-production" | "finished";
export type MissionStatus = "available" | "in-progress" | "closed";
export type MissionDifficulty = "easy" | "medium" | "hard" | "elite";
export type MissionType = "story" | "hunt" | "escort" | "investigation" | "event";
export type StockStatus = "available" | "limited" | "sold-out";

export type PlayerAccount = {
  id: string;
  username: string;
  gold: number;
  isAdmin?: boolean;
  authUserId?: string | null;
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
  stockLimit?: number;
  stockSold?: number;
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
  participationRewardGold?: number;
  maxParticipants?: number;
};

export type RealmEventParticipationStatus = "joined" | "rewarded";

export type RealmEventParticipant = {
  id: string;
  eventId: string;
  playerId: string;
  playerName: string;
  status: RealmEventParticipationStatus;
  rewardDelivered: boolean;
  rewardDeliveredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type EventRewardNotification = {
  participationId: string;
  eventId: string;
  eventTitle: string;
  playerId: string;
  playerName: string;
  joinedAt?: string;
};

export type RealmMission = {
  id?: string;
  title: string;
  description: string;
  instructions: string;
  rewardGold: number;
  maxParticipants: number;
  difficulty: MissionDifficulty;
  type: MissionType;
  status: MissionStatus;
  visible: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type RealmMissionClaimStatus = "claimed" | "completed" | "rewarded";

export type RealmMissionClaim = {
  id: string;
  missionId: string;
  playerId: string;
  playerName: string;
  playerGold: number;
  status: RealmMissionClaimStatus;
  rewardDelivered: boolean;
  proofText: string;
  proofLink: string;
  proofImageUrl: string;
  proofImagePath: string;
  submittedAt?: string | null;
  rewardDeliveredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MissionReviewNotification = {
  claimId: string;
  missionId: string;
  missionTitle: string;
  playerId: string;
  playerName: string;
  submittedAt?: string | null;
  proofText: string;
  proofLink: string;
  proofImageUrl: string;
  proofImagePath: string;
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

export type FactionRelation = {
  realm: string;
  description: string;
};

export type FactionDossier = {
  id: string;
  name: string;
  motto: string;
  alignedRealm: string;
  history: string;
  specialization: string;
  tactics: string;
  equipment: string;
  headquarters: string;
  relations: FactionRelation[];
  playerDetails: string;
  startingItem?: string;
  bonuses?: string[];
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

// --- GRIMORIO TYPES ---

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
  title: string;
  description: string;
  levels: Record<number, AbilityLevel[]>;
};

export type GrimoireCategory = {
  id: string;
  title: string;
  styles: MagicStyle[];
};

export type BestiaryRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "legendary"
  | "calamity";

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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
};

export type KnowledgeDocumentType =
  | "lore"
  | "rules"
  | "magic"
  | "bestiary"
  | "flora"
  | "event"
  | "mission"
  | "faction"
  | "other";

export type KnowledgeDocument = {
  id: string;
  title: string;
  type: KnowledgeDocumentType;
  category: string;
  tags: string[];
  source: string;
  content: string;
  summary: string;
  visible: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// --- FICHA (CHARACTER SHEET) TYPES ---

export type CharacterStats = {
  strength: number;
  agility: number;
  intelligence: number;
  defense: number;
  magicDefense: number;
};

export type PveStatKey = "strength" | "life" | "defense";

export type PveCombatStats = {
  strength: number;
  life: number;
  defense: number;
};

export type PvePlayerProgress = {
  playerId: string;
  sheetId: string;
  level: number;
  exp: number;
  availablePoints: number;
  hardVictories: number;
  stats: PveCombatStats;
  usage: Record<string, number[]>;
};

export type AppLiveHuntStatus = "lobby" | "active" | "victory" | "defeat";
export type AppLiveHuntActionType = "attack" | "guard" | "channel" | "sabotage";
export type AppLiveHuntSpecialization =
  | "vanguard"
  | "bastion"
  | "warden"
  | "strategist";

export type AppLiveHuntTemplate = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  enemyName: string;
  minLevel: number;
  recommendedPower: number;
  maxRounds: number;
  baseEnemyHp: number;
  threatCap: number;
  rewardBase: number;
  tone: "emerald" | "amber" | "rose";
  mutatorPool: string[];
};

export type AppLiveHuntMutator = {
  id: string;
  title: string;
  summary: string;
  effectLine: string;
  tone: "emerald" | "amber" | "rose";
  damageMod: number;
  threatMod: number;
  rewardMod: number;
};

export type AppLiveHuntRoom = {
  id: string;
  templateId: string;
  title: string;
  description: string;
  enemyName: string;
  hostPlayerId: string;
  hostUsername: string;
  hostSheetId: string;
  hostSheetName: string;
  mutatorId: string;
  mutatorTitle: string;
  mutatorSummary: string;
  status: AppLiveHuntStatus;
  currentRound: number;
  maxRounds: number;
  enemyHp: number;
  enemyMaxHp: number;
  threat: number;
  threatCap: number;
  rewardPool: number;
  createdAt: string;
  updatedAt: string;
};

export type AppLiveHuntMember = {
  id: string;
  huntId: string;
  playerId: string;
  username: string;
  sheetId: string;
  sheetName: string;
  sheetLevel: number;
  sheetPower: number;
  specialization: AppLiveHuntSpecialization;
  specializationTitle: string;
  joinedAt: string;
};

export type AppLiveHuntAction = {
  id: string;
  huntId: string;
  roundNumber: number;
  playerId: string;
  playerUsername: string;
  sheetId: string;
  sheetName: string;
  actionType: AppLiveHuntActionType;
  createdAt: string;
};

export type AppLiveHuntRound = {
  id: string;
  huntId: string;
  roundNumber: number;
  summary: string;
  enemyDamage: number;
  threatDelta: number;
  rewardDelta: number;
  createdAt: string;
};

export type AppLiveHuntResult = {
  id: string;
  huntId: string;
  playerId: string;
  username: string;
  sheetId: string;
  sheetName: string;
  outcome: AppLiveHuntStatus;
  goldReward: number;
  participationScore: number;
  createdAt: string;
};

export type CharacterSheet = {
  id: string;
  playerId: string;
  /**
   * Optional display helper. If your Supabase table includes this column,
   * the Registry can show/search by username instead of a UUID.
   */
  playerUsername?: string;
  portraitUrl?: string;
  name: string;
  age: string;
  gender: string;
  height: string;
  race: string;
  powers: string;
  stats: CharacterStats;
  weapon: string;
  combatStyle: string;
  birthRealm: string;
  socialClass: string;
  nobleTitle: string;
  profession: string;
  nonMagicSkills: string;
  personality: string;
  history: string;
  extras: string;
  weaknesses: string;
  inventory: string;
  createdAt: string;
};
