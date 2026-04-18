import { fetchPlayerByUsername, updatePlayerGold } from "./players";
import {
  buildScratchDateKey,
  getDailyScratchConfig,
  NORMAL_MAX_PRIZE,
  NORMAL_MIN_PRIZE,
  VIP_JACKPOT_CHANCE,
  VIP_JACKPOT_PRIZE,
} from "./scratchUtils";

const PLAYER_STORAGE_KEY = "kingdoom.active-player";
const SCRATCH_TOTALS_KEY = "kingdoom.scratch.daily-totals.v1";

type ScratchTotalsStore = Record<string, number>;

export type ScratchDailyStateResult =
  | {
      status: "ready";
      grossWins: number;
    }
  | {
      status: "unavailable";
      grossWins: number;
      message: string;
    };

export type ScratchBatchPlayResult =
  | {
      status: "success";
      totalCost: number;
      costPerTicket: number;
      quantity: number;
      usedTickets: number;
      winningTickets: number;
      jackpotWins: number;
      losingTickets: number;
      totalPrize: number;
      refundedTickets: number;
      refundedGold: number;
      remainingGold: number;
      dailyGrossWins: number;
      maxDailyLimit: number;
      dateKey: string;
    }
  | {
      status: "error";
      message: string;
    };

function readTotalsStore(): ScratchTotalsStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(SCRATCH_TOTALS_KEY);
    return raw ? (JSON.parse(raw) as ScratchTotalsStore) : {};
  } catch {
    return {};
  }
}

function writeTotalsStore(store: ScratchTotalsStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SCRATCH_TOTALS_KEY, JSON.stringify(store));
}

function buildScratchPlayerKey(playerId: string, dateKey: string) {
  return `${playerId}:${dateKey}`;
}

function getStoredGrossWins(playerId: string, dateKey: string) {
  const store = readTotalsStore();
  return Number(store[buildScratchPlayerKey(playerId, dateKey)] ?? 0);
}

function setStoredGrossWins(playerId: string, dateKey: string, grossWins: number) {
  const store = readTotalsStore();
  store[buildScratchPlayerKey(playerId, dateKey)] = grossWins;
  writeTotalsStore(store);
}

async function getActivePlayer() {
  if (typeof window === "undefined") {
    return null;
  }

  const username = window.localStorage.getItem(PLAYER_STORAGE_KEY)?.trim();
  if (!username) {
    return null;
  }

  return fetchPlayerByUsername(username);
}

function randomPrize() {
  return Math.floor(Math.random() * (NORMAL_MAX_PRIZE - NORMAL_MIN_PRIZE + 1)) + NORMAL_MIN_PRIZE;
}

export async function fetchScratchDailyState(
  dateKey: string
): Promise<ScratchDailyStateResult> {
  const player = await getActivePlayer();

  if (!player) {
    return {
      status: "unavailable",
      grossWins: 0,
      message: "Conecta tu perfil del reino antes de usar Rasca y gana.",
    };
  }

  return {
    status: "ready",
    grossWins: getStoredGrossWins(player.id, dateKey),
  };
}

export async function playScratchBatchSecure(
  quantity: number
): Promise<ScratchBatchPlayResult> {
  const player = await getActivePlayer();

  if (!player) {
    return {
      status: "error",
      message: "Conecta tu perfil del reino antes de usar Rasca y gana.",
    };
  }

  const safeQuantity = Math.max(1, Math.floor(quantity));
  const config = getDailyScratchConfig();
  const startingGold = player.gold;
  const totalCost = config.cost * safeQuantity;

  if (startingGold < totalCost) {
    return {
      status: "error",
      message: "No tienes suficiente oro para comprar esa tanda de tickets.",
    };
  }

  let dailyGrossWins = getStoredGrossWins(player.id, config.dateKey);
  let usedTickets = 0;
  let winningTickets = 0;
  let jackpotWins = 0;
  let totalPrize = 0;

  for (let index = 0; index < safeQuantity; index += 1) {
    if (dailyGrossWins >= config.maxDailyLimit) {
      break;
    }

    usedTickets += 1;

    let ticketPrize = 0;
    if (Math.random() < VIP_JACKPOT_CHANCE) {
      ticketPrize = VIP_JACKPOT_PRIZE;
      jackpotWins += 1;
      winningTickets += 1;
    } else if (Math.random() < config.winChance) {
      ticketPrize = randomPrize();
      winningTickets += 1;
    }

    totalPrize += ticketPrize;
    dailyGrossWins += ticketPrize;
  }

  const refundedTickets = Math.max(0, safeQuantity - usedTickets);
  const losingTickets = Math.max(0, usedTickets - winningTickets);
  let refundedGold = refundedTickets * config.cost;

  if (losingTickets > 0) {
    if (safeQuantity > 50) {
      if (Math.random() < 0.5) {
        refundedGold += losingTickets * config.cost;
      }
    } else {
      refundedGold += Math.floor(losingTickets * config.cost * 0.5);
    }
  }

  const remainingGold = Math.max(0, startingGold - totalCost + refundedGold + totalPrize);
  const updated = await updatePlayerGold(player.id, remainingGold);

  if (!updated) {
    return {
      status: "error",
      message: "No se pudo actualizar el oro del jugador tras resolver el rasca.",
    };
  }

  setStoredGrossWins(player.id, config.dateKey, dailyGrossWins);

  return {
    status: "success",
    totalCost,
    costPerTicket: config.cost,
    quantity: safeQuantity,
    usedTickets,
    winningTickets,
    jackpotWins,
    losingTickets,
    totalPrize,
    refundedTickets,
    refundedGold,
    remainingGold,
    dailyGrossWins,
    maxDailyLimit: config.maxDailyLimit,
    dateKey: buildScratchDateKey(),
  };
}
