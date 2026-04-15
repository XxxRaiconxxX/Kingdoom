/**
 * scratchUtils.ts
 * Utilidades para la lotería diaria dinámica del Reino.
 */

// Límite de seguridad para evitar quiebres en la economía (Solo para Rasca y Gana)
// Límite de seguridad dinámico se calcula en getDailyScratchConfig
// export const MAX_DAILY_WIN_LIMIT = 50000; (Deprecado por límite aleatorio)
export const VIP_JACKPOT_CHANCE = 0.05;
export const VIP_JACKPOT_PRIZE = 10000;
export const NORMAL_MIN_PRIZE = 200;
export const NORMAL_MAX_PRIZE = 2500; // Un premio jugoso diario de los normales

export interface ScratchRefundOutcome {
  refundedTickets: number;
  refundedGold: number;
  mode: "none" | "half" | "full";
}

export interface DailyScratchConfig {
  cost: number;
  winChance: number;
  dateKey: string;
  maxDailyLimit: number;
}

/**
 * Genera un número pseudo-aleatorio basado en una semilla compartida (yyyy-mm-dd)
 */
function seededRandom(seedStr: string): number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  
  // Algoritmo mulberry32
  let t = h += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/**
 * Retorna la configuración matemática del minijuego dictada para el día local actual.
 */
export function getDailyScratchConfig(): DailyScratchConfig {
  const d = new Date();
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  
  const seed = seededRandom(dateKey);

  let cost: number;
  let winChance: number;

  // Lógica: La semilla divide en "Días baratos" o "Días caros"
  if (seed < 0.5) {
    // 50% de las veces: Días baratos (200 - 349), Prob baja (10% - 24%)
    // Escalamos la semilla [0, 0.5) a [0, 1)
    const normalizedSeed = seed * 2;
    cost = 200 + Math.floor(normalizedSeed * 149);
    winChance = 0.10 + (normalizedSeed * 0.14);
  } else {
    // 50% de las veces: Días caros de ballenas (350 - 500), Prob alta (25% - 40%)
    // Escalamos la semilla [0.5, 1) a [0, 1)
    const normalizedSeed = (seed - 0.5) * 2;
    cost = 350 + Math.floor(normalizedSeed * 150);
    winChance = 0.25 + (normalizedSeed * 0.15);
  }

  // Límite aleatorio: 10,000 - 150,000 (Entero)
  const maxDailyLimit = Math.floor(seed * (150000 - 10000 + 1)) + 10000;

  return {
    cost,
    winChance,
    dateKey,
    maxDailyLimit,
  };
}

export function getScratchRefundOutcome(
  quantity: number,
  losingTickets: number,
  ticketCost: number,
): ScratchRefundOutcome {
  if (losingTickets <= 0 || ticketCost <= 0) {
    return {
      refundedTickets: 0,
      refundedGold: 0,
      mode: "none",
    };
  }

  if (quantity > 50) {
    const shouldRefundFullLosses = Math.random() < 0.5;

    return {
      refundedTickets: shouldRefundFullLosses ? losingTickets : 0,
      refundedGold: shouldRefundFullLosses ? losingTickets * ticketCost : 0,
      mode: shouldRefundFullLosses ? "full" : "none",
    };
  }

  return {
    refundedTickets: losingTickets,
    refundedGold: Math.floor((losingTickets * ticketCost) / 2),
    mode: "half",
  };
}

/**
 * Retorna la cantidad bruta que un jugador en específico ha ganado el "DÍA ACTUAL" únicamente en Scratch.
 */
export function getPlayerDailyScratchGrossWins(playerId: string, dateKey: string): number {
  const key = `kingdoom.daily-scratch.${playerId}.${dateKey}`;
  const stored = window.localStorage.getItem(key);
  return stored ? parseInt(stored, 10) : 0;
}

/**
 * Añade ORO BRUTO a la cuenta diaria del jugador. Los días que no coincidan serán simplemente ignorados/borrados después si quisieramos limpiarlos.
 */
export function addPlayerDailyScratchGrossWins(playerId: string, dateKey: string, amount: number): number {
  const current = getPlayerDailyScratchGrossWins(playerId, dateKey);
  const newValue = current + amount;
  window.localStorage.setItem(`kingdoom.daily-scratch.${playerId}.${dateKey}`, newValue.toString());
  return newValue;
}
// ── TavernCards daily limit ──────────────────────────────────────────────────
export const MAX_DAILY_CARDS_WIN_LIMIT = 350000;

export function getPlayerDailyCardsGrossWins(playerId: string, dateKey: string): number {
  const key = `kingdoom.daily-cards.${playerId}.${dateKey}`;
  const stored = window.localStorage.getItem(key);
  return stored ? parseInt(stored, 10) : 0;
}

export function addPlayerDailyCardsGrossWins(playerId: string, dateKey: string, amount: number): number {
  const current = getPlayerDailyCardsGrossWins(playerId, dateKey);
  const newValue = current + amount;
  window.localStorage.setItem(`kingdoom.daily-cards.${playerId}.${dateKey}`, newValue.toString());
  return newValue;
}
