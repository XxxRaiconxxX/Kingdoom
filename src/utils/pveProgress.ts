import type { PvePlayerProgress, PveStatKey } from "../types";

const STORAGE_KEY = "kingdoom.pve-progress.v1";
const ACTIVE_SHEET_KEY = "kingdoom.pve-active-sheet.v1";

const EMPTY_STATS = {
  strength: 0,
  life: 0,
  defense: 0,
} as const;

type ProgressStore = Record<string, PvePlayerProgress>;
type ActiveSheetStore = Record<string, string>;

function readStore(): ProgressStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as ProgressStore;
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function readActiveSheetStore(): ActiveSheetStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_SHEET_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as ActiveSheetStore;
  } catch {
    return {};
  }
}

function writeActiveSheetStore(store: ActiveSheetStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_SHEET_KEY, JSON.stringify(store));
}

export function createDefaultPveProgress(playerId: string, sheetId: string): PvePlayerProgress {
  return {
    playerId,
    sheetId,
    level: 1,
    exp: 0,
    availablePoints: 0,
    hardVictories: 0,
    stats: { ...EMPTY_STATS },
    usage: {},
  };
}

export function getExperienceForNextLevel(level: number) {
  return 40 + 25 * Math.max(2, level + 1);
}

export function getTotalExperienceForLevel(level: number) {
  if (level <= 1) {
    return 0;
  }

  let total = 0;
  for (let targetLevel = 2; targetLevel <= level; targetLevel += 1) {
    total += 40 + 25 * targetLevel;
  }
  return total;
}

export function getLevelFromExperience(exp: number) {
  let level = 1;

  while (exp >= getTotalExperienceForLevel(level + 1)) {
    level += 1;
  }

  return level;
}

export function getPveProgressToNextLevel(progress: PvePlayerProgress) {
  const currentLevelFloor = getTotalExperienceForLevel(progress.level);
  const nextLevelFloor = getTotalExperienceForLevel(progress.level + 1);
  return {
    current: Math.max(0, progress.exp - currentLevelFloor),
    required: nextLevelFloor - currentLevelFloor,
  };
}

export function getPvePower(progress: Pick<PvePlayerProgress, "level" | "stats">) {
  return (
    progress.level * 12 +
    progress.stats.strength * 8 +
    progress.stats.life * 7 +
    progress.stats.defense * 7
  );
}

export function pruneUsage(
  usage: Record<string, number[]>,
  windowMs: number,
  now = Date.now()
) {
  const nextUsage: Record<string, number[]> = {};

  Object.entries(usage).forEach(([encounterId, timestamps]) => {
    const valid = timestamps.filter((timestamp) => now - timestamp < windowMs);
    if (valid.length > 0) {
      nextUsage[encounterId] = valid;
    }
  });

  return nextUsage;
}

export function loadPveProgress(playerId: string, windowMs: number): PvePlayerProgress {
  const store = readStore();
  const activeSheetId = getActivePveSheetId(playerId);
  if (!activeSheetId) {
    return createDefaultPveProgress(playerId, "guest-sheet");
  }
  return loadPveProgressForSheet(playerId, activeSheetId, windowMs);
}

export function loadPveProgressForSheet(
  playerId: string,
  sheetId: string,
  windowMs: number
): PvePlayerProgress {
  const store = readStore();
  const progressKey = `${playerId}:${sheetId}`;
  const base = store[progressKey] ?? createDefaultPveProgress(playerId, sheetId);
  const normalized: PvePlayerProgress = {
    playerId,
    sheetId,
    level: Math.max(1, base.level ?? getLevelFromExperience(base.exp ?? 0)),
    exp: Math.max(0, base.exp ?? 0),
    availablePoints: base.availablePoints ?? 0,
    hardVictories: base.hardVictories ?? 0,
    stats: {
      strength: base.stats?.strength ?? 0,
      life: base.stats?.life ?? 0,
      defense: base.stats?.defense ?? 0,
    },
    usage: pruneUsage(base.usage ?? {}, windowMs),
  };

  store[progressKey] = normalized;
  writeStore(store);
  return normalized;
}

export function savePveProgress(progress: PvePlayerProgress) {
  const store = readStore();
  store[`${progress.playerId}:${progress.sheetId}`] = progress;
  writeStore(store);
}

export function getActivePveSheetId(playerId: string) {
  const store = readActiveSheetStore();
  return store[playerId] ?? null;
}

export function setActivePveSheetId(playerId: string, sheetId: string | null) {
  const store = readActiveSheetStore();

  if (sheetId) {
    store[playerId] = sheetId;
  } else {
    delete store[playerId];
  }

  writeActiveSheetStore(store);
}

export function resolveActivePveSheetId(playerId: string, availableSheetIds: string[]) {
  const stored = getActivePveSheetId(playerId);
  if (stored && availableSheetIds.includes(stored)) {
    return stored;
  }

  const fallback = availableSheetIds[0] ?? null;
  setActivePveSheetId(playerId, fallback);
  return fallback;
}

export function getEncounterUsageCount(
  progress: PvePlayerProgress,
  encounterId: string,
  windowMs: number,
  now = Date.now()
) {
  return (progress.usage[encounterId] ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  ).length;
}

export function getNextResetAt(
  progress: PvePlayerProgress,
  encounterId: string,
  windowMs: number
) {
  const timestamps = progress.usage[encounterId] ?? [];
  if (timestamps.length === 0) {
    return null;
  }

  return Math.min(...timestamps) + windowMs;
}

export function consumeEncounterAttempt(
  progress: PvePlayerProgress,
  encounterId: string,
  windowMs: number,
  now = Date.now()
) {
  const usage = pruneUsage(progress.usage, windowMs, now);
  const timestamps = usage[encounterId] ?? [];

  return {
    ...progress,
    usage: {
      ...usage,
      [encounterId]: [...timestamps, now],
    },
  };
}

export function grantVictoryPoint(
  progress: PvePlayerProgress,
  options?: { countHardVictory?: boolean }
) {
  return {
    ...progress,
    availablePoints: progress.availablePoints + 1,
    hardVictories: progress.hardVictories + (options?.countHardVictory ? 1 : 0),
  };
}

export function grantPveExperience(progress: PvePlayerProgress, expReward: number) {
  const nextExp = progress.exp + Math.max(0, expReward);
  const previousLevel = progress.level;
  const nextLevel = getLevelFromExperience(nextExp);
  const previousMilestones = Math.floor(previousLevel / 5);
  const nextMilestones = Math.floor(nextLevel / 5);
  const milestonePoints = Math.max(0, nextMilestones - previousMilestones);

  return {
    progress: {
      ...progress,
      exp: nextExp,
      level: nextLevel,
      availablePoints: progress.availablePoints + milestonePoints,
    },
    levelsGained: Math.max(0, nextLevel - previousLevel),
    milestonePoints,
  };
}

export function spendPvePoint(progress: PvePlayerProgress, stat: PveStatKey) {
  if (progress.availablePoints <= 0) {
    return progress;
  }

  return {
    ...progress,
    availablePoints: progress.availablePoints - 1,
    stats: {
      ...progress.stats,
      [stat]: progress.stats[stat] + 1,
    },
  };
}
