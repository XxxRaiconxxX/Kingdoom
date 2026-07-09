import { supabase } from "./supabaseClient";

export const REALM_SIEGE_SLUG = "asedio-reinos-t1";

export const REALM_SIEGE_CATALOG_ENTRY = {
  id: "asedio-reinos",
  title: "El Asedio de los Reinos",
  eyebrow: "Catalogo exclusivo",
  description:
    "Campana estrategica de una semana: elige faccion, fortalece el tesoro diario, produce por territorio y compite por conquistar el mapa.",
  route: "/asedio-reinos",
} as const;

export type RealmSiegeFactionId = "kaelum" | "oakhaven" | "arcania" | "paramos";
export type RealmSiegeStatus = "draft" | "active" | "completed" | "archived";

export type RealmSiegeSeason = {
  id: string;
  slug: string;
  title: string;
  status: RealmSiegeStatus;
  startsAt: string;
  endsAt: string | null;
  minDurationDays: number;
  incomeCycleHours: number;
  aiStrategyCycleHours: number;
  dailyDepositLimit: number;
  kingdomMemberCap: number;
  baseTerritoryIncome: number;
  conquestReward: number;
  incomeInvestBaseCost: number;
  incomeInvestCostStep: number;
  incomeInvestGain: number;
  maxIncomeInvestLevel: number;
};

export type RealmSiegeFaction = {
  id: RealmSiegeFactionId;
  displayName: string;
  accent: string;
  membersCount: number;
  treasuryGold: number;
  isAiManaged: boolean;
};

export type RealmSiegeTerritory = {
  id: string;
  shortName: string;
  displayName: string;
  ownerFactionId: RealmSiegeFactionId | null;
  wallLevel: number;
  npcDefense: number;
  garrisonPower: number;
  terrain: string;
  favoredClass: string | null;
  disfavoredClass: string | null;
  incomeBonus: number;
  investLevel: number;
  adjacentTerritoryIds: string[];
  positionX: number;
  positionY: number;
};

export type RealmSiegePlayerState = {
  factionId: RealmSiegeFactionId;
  factionLocked: boolean;
  lastIncomeClaimAt: string | null;
  nextIncomeAt: string | null;
  depositedToday: number;
  availableDeposit: number;
  dailyDepositLimit: number;
};

export type RealmSiegeAction = {
  id: string;
  playerId: string | null;
  actorFactionId: RealmSiegeFactionId | null;
  actionType: string;
  territoryId: string | null;
  amount: number | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type RealmSiegeState = {
  season: RealmSiegeSeason;
  factions: RealmSiegeFaction[];
  territories: RealmSiegeTerritory[];
  playerState: RealmSiegePlayerState | null;
  recentActions: RealmSiegeAction[];
};

export type RealmSiegeMutationResult = {
  success: boolean;
  message: string;
  state?: RealmSiegeState;
  remainingGold?: number;
  newGold?: number;
  depositedToday?: number;
  availableDeposit?: number;
  treasuryGold?: number;
  income?: number;
  cost?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asFactionId(value: unknown): RealmSiegeFactionId {
  if (value === "oakhaven" || value === "arcania" || value === "paramos") {
    return value;
  }

  return "kaelum";
}

function normalizeFaction(value: unknown): RealmSiegeFaction {
  const row = isRecord(value) ? value : {};

  return {
    id: asFactionId(row.id),
    displayName: String(row.displayName ?? "Reino"),
    accent: String(row.accent ?? "#f4c95d"),
    membersCount: toNumber(row.membersCount),
    treasuryGold: toNumber(row.treasuryGold),
    isAiManaged: Boolean(row.isAiManaged),
  };
}

function normalizeTerritory(value: unknown): RealmSiegeTerritory {
  const row = isRecord(value) ? value : {};

  return {
    id: String(row.id ?? ""),
    shortName: String(row.shortName ?? "Territorio"),
    displayName: String(row.displayName ?? "Territorio sin nombre"),
    ownerFactionId: row.ownerFactionId ? asFactionId(row.ownerFactionId) : null,
    wallLevel: toNumber(row.wallLevel),
    npcDefense: toNumber(row.npcDefense),
    garrisonPower: toNumber(row.garrisonPower),
    terrain: String(row.terrain ?? "neutral"),
    favoredClass: toStringOrNull(row.favoredClass),
    disfavoredClass: toStringOrNull(row.disfavoredClass),
    incomeBonus: toNumber(row.incomeBonus),
    investLevel: toNumber(row.investLevel),
    adjacentTerritoryIds: Array.isArray(row.adjacentTerritoryIds)
      ? row.adjacentTerritoryIds.map(String)
      : [],
    positionX: toNumber(row.positionX, 50),
    positionY: toNumber(row.positionY, 50),
  };
}

function normalizePlayerState(value: unknown): RealmSiegePlayerState | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    factionId: asFactionId(value.factionId),
    factionLocked: Boolean(value.factionLocked),
    lastIncomeClaimAt: toStringOrNull(value.lastIncomeClaimAt),
    nextIncomeAt: toStringOrNull(value.nextIncomeAt),
    depositedToday: toNumber(value.depositedToday),
    availableDeposit: toNumber(value.availableDeposit),
    dailyDepositLimit: toNumber(value.dailyDepositLimit, 25000),
  };
}

function normalizeAction(value: unknown): RealmSiegeAction {
  const row = isRecord(value) ? value : {};

  return {
    id: String(row.id ?? crypto.randomUUID()),
    playerId: toStringOrNull(row.playerId),
    actorFactionId: row.actorFactionId ? asFactionId(row.actorFactionId) : null,
    actionType: String(row.actionType ?? "strategy"),
    territoryId: toStringOrNull(row.territoryId),
    amount: row.amount === null || row.amount === undefined ? null : toNumber(row.amount),
    payload: isRecord(row.payload) ? row.payload : {},
    createdAt: String(row.createdAt ?? new Date().toISOString()),
  };
}

function normalizeState(value: unknown): RealmSiegeState {
  if (!isRecord(value) || !isRecord(value.season)) {
    throw new Error("Supabase devolvio un estado invalido para el Asedio.");
  }

  const season = value.season;

  return {
    season: {
      id: String(season.id ?? ""),
      slug: String(season.slug ?? REALM_SIEGE_SLUG),
      title: String(season.title ?? REALM_SIEGE_CATALOG_ENTRY.title),
      status: String(season.status ?? "active") as RealmSiegeStatus,
      startsAt: String(season.startsAt ?? new Date().toISOString()),
      endsAt: toStringOrNull(season.endsAt),
      minDurationDays: toNumber(season.minDurationDays, 7),
      incomeCycleHours: toNumber(season.incomeCycleHours, 24),
      aiStrategyCycleHours: toNumber(season.aiStrategyCycleHours, 12),
      dailyDepositLimit: toNumber(season.dailyDepositLimit, 25000),
      kingdomMemberCap: toNumber(season.kingdomMemberCap, 3),
      baseTerritoryIncome: toNumber(season.baseTerritoryIncome, 4000),
      conquestReward: toNumber(season.conquestReward, 20000),
      incomeInvestBaseCost: toNumber(season.incomeInvestBaseCost, 100000),
      incomeInvestCostStep: toNumber(season.incomeInvestCostStep, 50000),
      incomeInvestGain: toNumber(season.incomeInvestGain, 1000),
      maxIncomeInvestLevel: toNumber(season.maxIncomeInvestLevel, 5),
    },
    factions: Array.isArray(value.factions) ? value.factions.map(normalizeFaction) : [],
    territories: Array.isArray(value.territories)
      ? value.territories.map(normalizeTerritory)
      : [],
    playerState: normalizePlayerState(value.playerState),
    recentActions: Array.isArray(value.recentActions)
      ? value.recentActions.map(normalizeAction)
      : [],
  };
}

function normalizeMutationResult(value: unknown): RealmSiegeMutationResult {
  const row = isRecord(value) ? value : {};

  return {
    success: Boolean(row.success),
    message: String(row.message ?? "Operacion completada."),
    state: row.state ? normalizeState(row.state) : undefined,
    remainingGold:
      row.remainingGold === undefined ? undefined : toNumber(row.remainingGold),
    newGold: row.newGold === undefined ? undefined : toNumber(row.newGold),
    depositedToday:
      row.depositedToday === undefined ? undefined : toNumber(row.depositedToday),
    availableDeposit:
      row.availableDeposit === undefined ? undefined : toNumber(row.availableDeposit),
    treasuryGold: row.treasuryGold === undefined ? undefined : toNumber(row.treasuryGold),
    income: row.income === undefined ? undefined : toNumber(row.income),
    cost: row.cost === undefined ? undefined : toNumber(row.cost),
  };
}

function getSupabaseErrorMessage(error: { message?: string }) {
  return error.message || "Supabase no pudo completar la operacion del Asedio.";
}

export function formatRealmSiegeGold(amount: number) {
  return `${Math.max(0, Math.floor(amount)).toLocaleString("es-PY")} oro`;
}

export function getRealmSiegeStandaloneUrl(returnTo = "/") {
  if (typeof window === "undefined") {
    return `${REALM_SIEGE_CATALOG_ENTRY.route}?returnTo=${encodeURIComponent(returnTo)}`;
  }

  const url = new URL(REALM_SIEGE_CATALOG_ENTRY.route, window.location.origin);
  url.searchParams.set("returnTo", returnTo);
  return url.toString();
}

export function openRealmSiegeWindow(returnTo = "/") {
  const targetUrl = getRealmSiegeStandaloneUrl(returnTo);

  const popup = window.open(
    targetUrl,
    "kingdoom-asedio",
    "width=1440,height=980,noopener,noreferrer"
  );

  if (!popup) {
    window.location.href = targetUrl;
  }
}

export async function fetchRealmSiegeState(playerId?: string | null) {
  const { data, error } = await supabase.rpc("get_realm_siege_state", {
    p_season_slug: REALM_SIEGE_SLUG,
    p_player_id: playerId || null,
  });

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return normalizeState(data);
}

export async function joinRealmSiegeFaction(
  playerId: string,
  factionId: RealmSiegeFactionId
) {
  const { data, error } = await supabase.rpc("join_realm_siege_faction", {
    p_player_id: playerId,
    p_faction_id: factionId,
    p_season_slug: REALM_SIEGE_SLUG,
  });

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return normalizeMutationResult(data);
}

export async function depositRealmSiegeGold(playerId: string, amount: number) {
  const safeAmount = Math.max(0, Math.floor(amount));
  const { data, error } = await supabase.rpc("deposit_realm_siege_gold", {
    p_player_id: playerId,
    p_amount: safeAmount,
    p_season_slug: REALM_SIEGE_SLUG,
  });

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return normalizeMutationResult(data);
}

export async function claimRealmSiegeIncome(playerId: string) {
  const { data, error } = await supabase.rpc("claim_realm_siege_income", {
    p_player_id: playerId,
    p_season_slug: REALM_SIEGE_SLUG,
  });

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return normalizeMutationResult(data);
}

export async function investRealmSiegeIncome(playerId: string, territoryId: string) {
  const { data, error } = await supabase.rpc("invest_realm_siege_income", {
    p_player_id: playerId,
    p_territory_id: territoryId,
    p_season_slug: REALM_SIEGE_SLUG,
  });

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return normalizeMutationResult(data);
}
