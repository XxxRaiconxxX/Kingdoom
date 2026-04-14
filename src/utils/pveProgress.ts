import type { PvePlayerProgress, PveStatKey } from "../types";

const STORAGE_KEY = "kingdoom.pve-progress.v1";

const EMPTY_STATS = {
  strength: 0,
  life: 0,
  defense: 0,
} as const;

type ProgressStore = Record<string, PvePlayerProgress>;

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

export function createDefaultPveProgress(playerId: string): PvePlayerProgress {
  return {
    playerId,
    availablePoints: 0,
    hardVictories: 0,
    stats: { ...EMPTY_STATS },
    usage: {},
  };
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
  const base = store[playerId] ?? createDefaultPveProgress(playerId);
  const normalized: PvePlayerProgress = {
    playerId,
    availablePoints: base.availablePoints ?? 0,
    hardVictories: base.hardVictories ?? 0,
    stats: {
      strength: base.stats?.strength ?? 0,
      life: base.stats?.life ?? 0,
      defense: base.stats?.defense ?? 0,
    },
    usage: pruneUsage(base.usage ?? {}, windowMs),
  };

  store[playerId] = normalized;
  writeStore(store);
  return normalized;
}

export function savePveProgress(progress: PvePlayerProgress) {
  const store = readStore();
  store[progress.playerId] = progress;
  writeStore(store);
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

export function grantHardVictoryPoint(progress: PvePlayerProgress) {
  return {
    ...progress,
    availablePoints: progress.availablePoints + 1,
    hardVictories: progress.hardVictories + 1,
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
