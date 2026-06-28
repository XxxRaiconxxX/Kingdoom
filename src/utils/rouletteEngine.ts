export type RoulettePocket =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "31"
  | "32"
  | "33"
  | "34"
  | "35"
  | "36";

export type RouletteBetId =
  | `straight:${RoulettePocket}`
  | "outside:red"
  | "outside:black"
  | "outside:even"
  | "outside:odd"
  | "outside:low"
  | "outside:high";

export type RouletteResolvedBet = {
  id: RouletteBetId;
  amount: number;
  payout: number;
  label: string;
};

export type RouletteRoundResult = {
  winningPocket: RoulettePocket;
  totalBet: number;
  totalPayout: number;
  winningBets: RouletteResolvedBet[];
};

export const ROULETTE_WHEEL_ORDER: RoulettePocket[] = [
  "0",
  "32",
  "15",
  "19",
  "4",
  "21",
  "2",
  "25",
  "17",
  "34",
  "6",
  "27",
  "13",
  "36",
  "11",
  "30",
  "8",
  "23",
  "10",
  "5",
  "24",
  "16",
  "33",
  "1",
  "20",
  "14",
  "31",
  "9",
  "22",
  "18",
  "29",
  "7",
  "28",
  "12",
  "35",
  "3",
  "26",
];

export const ROULETTE_CHIPS = [1, 5, 10, 25, 100] as const;

export const ROULETTE_NUMBER_GRID: RoulettePocket[][] = [
  ["1", "2", "3", "4", "5", "6"],
  ["7", "8", "9", "10", "11", "12"],
  ["13", "14", "15", "16", "17", "18"],
  ["19", "20", "21", "22", "23", "24"],
  ["25", "26", "27", "28", "29", "30"],
  ["31", "32", "33", "34", "35", "36"],
];

const RED_POCKETS = new Set<RoulettePocket>([
  "1",
  "3",
  "5",
  "7",
  "9",
  "12",
  "14",
  "16",
  "18",
  "19",
  "21",
  "23",
  "25",
  "27",
  "30",
  "32",
  "34",
  "36",
]);

const BLACK_POCKETS = new Set<RoulettePocket>([
  "2",
  "4",
  "6",
  "8",
  "10",
  "11",
  "13",
  "15",
  "17",
  "20",
  "22",
  "24",
  "26",
  "28",
  "29",
  "31",
  "33",
  "35",
]);

type BetDefinition = {
  id: RouletteBetId;
  label: string;
  payoutMultiplier: number;
  covers: RoulettePocket[];
};

function getPocketNumberValue(pocket: RoulettePocket) {
  return Number(pocket);
}

function getOutsideBetDefinition(id: RouletteBetId): BetDefinition {
  switch (id) {
    case "outside:red":
      return {
        id,
        label: "Rojo",
        payoutMultiplier: 1,
        covers: [...RED_POCKETS],
      };
    case "outside:black":
      return {
        id,
        label: "Negro",
        payoutMultiplier: 1,
        covers: [...BLACK_POCKETS],
      };
    case "outside:even":
      return {
        id,
        label: "Par",
        payoutMultiplier: 1,
        covers: ["2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "32", "34", "36"],
      };
    case "outside:odd":
      return {
        id,
        label: "Impar",
        payoutMultiplier: 1,
        covers: ["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23", "25", "27", "29", "31", "33", "35"],
      };
    case "outside:low":
      return {
        id,
        label: "1 a 18",
        payoutMultiplier: 1,
        covers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
      };
    case "outside:high":
      return {
        id,
        label: "19 a 36",
        payoutMultiplier: 1,
        covers: ["19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"],
      };
    default:
      throw new Error(`Apuesta fuera de rango no soportada: ${id}`);
  }
}

export function getBetDefinition(id: RouletteBetId): BetDefinition {
  if (id.startsWith("straight:")) {
    const pocket = id.replace("straight:", "") as RoulettePocket;
    return {
      id,
      label: pocket,
      payoutMultiplier: 35,
      covers: [pocket],
    };
  }

  return getOutsideBetDefinition(id);
}

export function getPocketColor(pocket: RoulettePocket) {
  if (pocket === "0") return "green" as const;
  return RED_POCKETS.has(pocket) ? ("red" as const) : ("black" as const);
}

export function spinRoulette(): RoulettePocket {
  const index = Math.floor(Math.random() * ROULETTE_WHEEL_ORDER.length);
  return ROULETTE_WHEEL_ORDER[index];
}

export function resolveRouletteRound(
  bets: Partial<Record<RouletteBetId, number>>,
  winningPocket: RoulettePocket,
): RouletteRoundResult {
  const winningBets: RouletteResolvedBet[] = [];
  let totalBet = 0;
  let totalPayout = 0;
 
  for (const [betId, amount] of Object.entries(bets) as Array<[RouletteBetId, number | undefined]>) {
    if (!amount || amount <= 0) {
      continue;
    }

    totalBet += amount;

    const definition = getBetDefinition(betId);
    if (!definition.covers.includes(winningPocket)) {
      continue;
    }

    const payout = amount + amount * definition.payoutMultiplier;
    totalPayout += payout;
    winningBets.push({
      id: betId,
      amount,
      payout,
      label: definition.label,
    });
  }

  return {
    winningPocket,
    totalBet,
    totalPayout,
    winningBets,
  };
}

export function getWinningPocketIndex(pocket: RoulettePocket) {
  return ROULETTE_WHEEL_ORDER.findIndex((value) => value === pocket);
}

export function formatBetLabel(id: RouletteBetId) {
  return getBetDefinition(id).label;
}

export function getNeighborPreview(pocket: RoulettePocket) {
  const index = getWinningPocketIndex(pocket);
  if (index < 0) {
    return [];
  }

  const previous = ROULETTE_WHEEL_ORDER[(index - 1 + ROULETTE_WHEEL_ORDER.length) % ROULETTE_WHEEL_ORDER.length];
  const next = ROULETTE_WHEEL_ORDER[(index + 1) % ROULETTE_WHEEL_ORDER.length];
  return [previous, pocket, next];
}

export function getPocketParityLabel(pocket: RoulettePocket) {
  if (pocket === "0") return "Cero";
  return getPocketNumberValue(pocket) % 2 === 0 ? "Par" : "Impar";
}
