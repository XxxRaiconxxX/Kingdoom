/**
 * scratchUtils.ts
 * Utilidades para la loteria diaria dinamica del Reino.
 */

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

/**
 * Genera un numero pseudo-aleatorio determinista compatible con frontend y SQL.
 */
export function getScratchSeed(seedStr: string): number {
  let h = 0n;

  for (let i = 0; i < seedStr.length; i++) {
    h = (h * 31n + BigInt(seedStr.charCodeAt(i))) % 2147483647n;
  }

  if (h <= 0n) {
    h += 2147483646n;
  }

  return Number(h) / 2147483647;
}

export function buildScratchDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Retorna la configuracion matematica del minijuego dictada para el dia local actual.
 */
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

// -- TavernCards daily limit -------------------------------------------------
export const MAX_DAILY_CARDS_WIN_LIMIT = 350000;

export function getPlayerDailyCardsGrossWins(
  playerId: string,
  dateKey: string
): number {
  const stored = window.localStorage.getItem(keyForCards(playerId, dateKey));
  return stored ? parseInt(stored, 10) : 0;
}

export function addPlayerDailyCardsGrossWins(
  playerId: string,
  dateKey: string,
  amount: number
): number {
  const current = getPlayerDailyCardsGrossWins(playerId, dateKey);
  const newValue = current + amount;
  window.localStorage.setItem(keyForCards(playerId, dateKey), newValue.toString());
  return newValue;
}

function keyForCards(playerId: string, dateKey: string) {
  return `kingdoom.daily-cards.${playerId}.${dateKey}`;
}
