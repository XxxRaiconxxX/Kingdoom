export const VIP_JACKPOT_CHANCE = 0.05;
export const VIP_JACKPOT_PRIZE = 10000;
export const NORMAL_MIN_PRIZE = 200;
export const NORMAL_MAX_PRIZE = 2500;

export interface DailyScratchConfig {
  cost: number;
  winChance: number;
  dateKey: string;
  maxDailyLimit: number;
}

function getScratchSeed(seedStr: string): number {
  let h = 0n;

  for (let index = 0; index < seedStr.length; index += 1) {
    h = (h * 31n + BigInt(seedStr.charCodeAt(index))) % 2147483647n;
  }

  if (h <= 0n) {
    h += 2147483646n;
  }

  return Number(h) / 2147483647;
}

export function buildScratchDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getDailyScratchConfig(): DailyScratchConfig {
  const dateKey = buildScratchDateKey();
  const seed = getScratchSeed(dateKey);

  let cost: number;
  let winChance: number;

  if (seed < 0.5) {
    const normalizedSeed = seed * 2;
    cost = 200 + Math.floor(normalizedSeed * 149);
    winChance = 0.10 + normalizedSeed * 0.14;
  } else {
    const normalizedSeed = (seed - 0.5) * 2;
    cost = 350 + Math.floor(normalizedSeed * 150);
    winChance = 0.25 + normalizedSeed * 0.15;
  }

  const maxDailyLimit = Math.floor(seed * (150000 - 10000 + 1)) + 10000;

  return {
    cost,
    winChance,
    dateKey,
    maxDailyLimit,
  };
}
