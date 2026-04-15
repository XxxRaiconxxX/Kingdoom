export type RoulettePocket =
  | "0"
  | "00"
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
  | "outside:high"
  | "dozen:1"
  | "dozen:2"
  | "dozen:3"
  | "column:1"
  | "column:2"
  | "column:3";

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

export const AMERICAN_WHEEL_ORDER: RoulettePocket[] = [
  "0",
  "28",
  "9",
  "26",
  "30",
  "11",
  "7",
  "20",
  "32",
  "17",
  "5",
  "22",
  "34",
  "15",
  "3",
  "24",
  "36",
  "13",
  "1",
  "00",
  "27",
  "10",
  "25",
  "29",
  "12",
  "8",
  "19",
  "31",
  "18",
  "6",
  "21",
  "33",
  "16",
  "4",
  "23",
  "35",
  "14",
  "2",
];

export const ROULETTE_CHIPS = [1, 5, 10, 25, 100] as const;

export const ROULETTE_NUMBER_GRID: RoulettePocket[][] = [
  ["3", "6", "9", "12", "15", "18", "21", "24", "27", "30", "33", "36"],
  ["2", "5", "8", "11", "14", "17", "20", "23", "26", "29", "32", "35"],
  ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31", "34"],
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
  if (pocket === "0" || pocket === "00") {
    return null;
  }

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
        covers: Array.from({ length: 18 }, (_, index) => `${(index + 1) * 2}` as RoulettePocket),
      };
    case "outside:odd":
      return {
        id,
        label: "Impar",
        payoutMultiplier: 1,
        covers: Array.from({ length: 18 }, (_, index) => `${index * 2 + 1}` as RoulettePocket),
      };
    case "outside:low":
      return {
        id,
        label: "1 a 18",
        payoutMultiplier: 1,
        covers: Array.from({ length: 18 }, (_, index) => `${index + 1}` as RoulettePocket),
      };
    case "outside:high":
      return {
        id,
        label: "19 a 36",
        payoutMultiplier: 1,
        covers: Array.from({ length: 18 }, (_, index) => `${index + 19}` as RoulettePocket),
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

  if (id.startsWith("dozen:")) {
    const dozen = Number(id.replace("dozen:", ""));
    const start = (dozen - 1) * 12 + 1;
    const covers = Array.from({ length: 12 }, (_, index) => `${start + index}` as RoulettePocket);

    return {
      id,
      label: `${dozen}a docena`,
      payoutMultiplier: 2,
      covers,
    };
  }

  if (id.startsWith("column:")) {
    const column = Number(id.replace("column:", ""));
    const covers = ROULETTE_NUMBER_GRID[3 - column] ?? [];

    return {
      id,
      label: `${column}a columna`,
      payoutMultiplier: 2,
      covers,
    };
  }

  return getOutsideBetDefinition(id);
}

export function getPocketColor(pocket: RoulettePocket) {
  if (pocket === "0" || pocket === "00") {
    return "green" as const;
  }

  if (RED_POCKETS.has(pocket)) {
    return "red" as const;
  }

  return "black" as const;
}

export function spinAmericanRoulette(): RoulettePocket {
  const index = Math.floor(Math.random() * AMERICAN_WHEEL_ORDER.length);
  return AMERICAN_WHEEL_ORDER[index];
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
  return AMERICAN_WHEEL_ORDER.findIndex((value) => value === pocket);
}

export function formatBetLabel(id: RouletteBetId) {
  return getBetDefinition(id).label;
}

export function isWinningRedBlackBet(pocket: RoulettePocket, betId: RouletteBetId) {
  return (
    (betId === "outside:red" && RED_POCKETS.has(pocket)) ||
    (betId === "outside:black" && BLACK_POCKETS.has(pocket))
  );
}

export function getNeighborPreview(pocket: RoulettePocket) {
  const index = getWinningPocketIndex(pocket);
  if (index < 0) {
    return [];
  }

  const previous = AMERICAN_WHEEL_ORDER[(index - 1 + AMERICAN_WHEEL_ORDER.length) % AMERICAN_WHEEL_ORDER.length];
  const next = AMERICAN_WHEEL_ORDER[(index + 1) % AMERICAN_WHEEL_ORDER.length];
  return [previous, pocket, next];
}

export function isOutsidePocket(pocket: RoulettePocket) {
  return pocket === "0" || pocket === "00";
}

export function getPocketParityLabel(pocket: RoulettePocket) {
  const value = getPocketNumberValue(pocket);
  if (value === null) {
    return "Casa";
  }

  return value % 2 === 0 ? "Par" : "Impar";
}
