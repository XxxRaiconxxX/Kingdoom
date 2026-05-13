import { addPlayerDailyPlinkoNetWins, getPlayerDailyPlinkoNetWins } from "./scratchUtils";

export type PlinkoDecision = "L" | "R";

export type PlinkoPath = {
  decisions: PlinkoDecision[];
  slot: number;
};

export const PLINKO_ROWS = 8;
export const PLINKO_SLOTS = PLINKO_ROWS + 1;
export const PLINKO_MULTIPLIERS = [10, 4, 1.3, 0.5, 0.2, 0.5, 1.3, 4, 10] as const;

export function computePlinkoPath(rows = PLINKO_ROWS): PlinkoPath {
  const decisions = Array.from({ length: rows }, () => (Math.random() < 0.5 ? "L" : "R"));
  const slot = decisions.reduce((total, decision) => total + (decision === "R" ? 1 : 0), 0);

  return {
    decisions,
    slot,
  };
}

export function getPlinkoMultiplier(slot: number): number {
  const safeSlot = Math.max(0, Math.min(PLINKO_MULTIPLIERS.length - 1, Math.floor(slot)));
  return PLINKO_MULTIPLIERS[safeSlot];
}

export function getPlinkoExpectedReturn(): number {
  const outcomes = 2 ** PLINKO_ROWS;
  let expected = 0;

  for (let slot = 0; slot < PLINKO_SLOTS; slot++) {
    expected += (binomial(PLINKO_ROWS, slot) / outcomes) * getPlinkoMultiplier(slot);
  }

  return expected;
}

export function saveDailyResult(
  playerId: string,
  dateKey: string,
  netWin: number
): number {
  if (netWin <= 0) {
    return getPlayerDailyPlinkoNetWins(playerId, dateKey);
  }

  return addPlayerDailyPlinkoNetWins(playerId, dateKey, netWin);
}

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;

  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }

  return result;
}
