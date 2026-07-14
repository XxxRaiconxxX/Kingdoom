import type {
  BestiaryEntry,
  FloraEntry,
  GrimoireCategory,
  KnowledgeDocument,
  MarketItem,
  PlayerAccount,
  RealmEvent,
  RealmMission,
} from "../../types";

export type ArchivistCardKind =
  | "market"
  | "event"
  | "mission"
  | "magic"
  | "bestiary"
  | "flora"
  | "document"
  | "player";

export type ArchivistActionKind =
  | "create_player"
  | "set_player_gold"
  | "add_player_gold"
  | "add_all_players_gold"
  | "add_multiple_players_gold"
  | "subtract_player_gold"
  | "upsert_mission"
  | "delete_mission"
  | "upsert_event"
  | "delete_event"
  | "upsert_market_item"
  | "delete_market_item"
  | "upsert_magic"
  | "delete_magic"
  | "upsert_bestiary"
  | "delete_bestiary"
  | "upsert_flora"
  | "delete_flora"
  | "upsert_document"
  | "delete_document";

export type ArchivistCard = {
  id: string;
  kind: ArchivistCardKind;
  title: string;
  eyebrow: string;
  description: string;
  detail: string;
  accent: "amber" | "emerald" | "cyan" | "rose" | "violet";
  imageUrl?: string;
};

export type ArchivistLiveContext = {
  marketItems: MarketItem[];
  events: RealmEvent[];
  missions: RealmMission[];
  grimoireCategories: GrimoireCategory[];
  bestiary: BestiaryEntry[];
  flora: FloraEntry[];
  documents: KnowledgeDocument[];
  players: PlayerAccount[];
};

export type ArchivistActionDraft = {
  kind: ArchivistActionKind;
  label: string;
  confirmationPrompt: string;
  payload: Record<string, unknown>;
};

export type ArchivistSourceStatus = {
  id: "market" | "events" | "missions" | "grimoire" | "documents" | "players";
  label: string;
  status: "ready" | "fallback" | "error";
  count: number;
  message: string;
};

export type ArchivistStructuredAnswer = {
  answer: string;
  intent:
    | "answer"
    | "admin_action"
    | "clarify"
    | "recommendation";
  followUpQuestion?: string;
  actionDraft?: ArchivistActionDraft | null;
  notes?: string[];
};

export type ArchivistLiveState = {
  status: "ready" | "partial";
  message: string;
  context: ArchivistLiveContext;
  sources: ArchivistSourceStatus[];
  updatedAt: string;
};
