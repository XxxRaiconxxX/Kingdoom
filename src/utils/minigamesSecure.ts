import { buildScratchDateKey, getPlayerDailyCardsGrossWins, MAX_DAILY_CARDS_WIN_LIMIT } from "./scratchUtils";
import { fetchPlayerByUsername, updatePlayerGold } from "./players";

const PLAYER_STORAGE_KEY = "kingdoom.active-player";
const CARDS_SESSION_KEY = "kingdoom.cards.session.v1";
const CHEST_STREAK_KEY = "kingdoom.chests.streak.v1";
const CRASH_STATE_KEY = "kingdoom.crash.state.v1";
const CRASH_HISTORY_KEY = "kingdoom.crash.history.v1";

export type CardsSessionState = {
  bet: number;
  pool: number;
  streak: number;
  currentCard: number;
  nextCard: number;
  phase: "betting" | "playing" | "choice" | "gameOver";
  dailyWins: number;
  remainingNet: number;
};

export type CardsActionResult =
  | {
      status: "success";
      session: CardsSessionState;
      remainingGold: number;
      cashoutAmount?: number;
    }
  | {
      status: "error";
      message: string;
    };

export type RouletteSpinResult =
  | {
      status: "success";
      multiplier: number;
      winnings: number;
      remainingGold: number;
    }
  | {
      status: "error";
      message: string;
    };

export type ChestRoundResult =
  | {
      status: "success";
      selectedChest: number;
      chestResults: Array<"x2" | "x1" | "x0">;
      payout: number;
      remainingGold: number;
      nextStreak: number;
    }
  | {
      status: "error";
      message: string;
    };

export type CrashSessionStateResult =
  | {
      status: "success";
      session: {
        phase: "betting" | "starting" | "rising" | "crashed" | "cashed_out";
        bet: number;
        multiplier: number;
        lastWin: number;
        autoCashOut: number;
        startedAt?: number;
      };
      remainingGold: number;
      history: number[];
    }
  | {
      status: "error";
      message: string;
    };

type StoredCardsSession = Omit<CardsSessionState, "dailyWins" | "remainingNet">;
type CardsStore = Record<string, StoredCardsSession>;
type NumberStore = Record<string, number>;
type CrashState = {
  phase: "betting" | "starting" | "rising" | "crashed" | "cashed_out";
  bet: number;
  multiplier: number;
  lastWin: number;
  autoCashOut: number;
  startedAt?: number;
  crashAt?: number;
};
type CrashStore = Record<string, CrashState>;
type CrashHistoryStore = Record<string, number[]>;

function readJsonStore<T>(key: string): T {
  if (typeof window === "undefined") {
    return {} as T;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeJsonStore<T>(key: string, store: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(store));
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

function getRandomCard() {
  return Math.floor(Math.random() * 15) + 1;
}

function getCardsSession(playerId: string): StoredCardsSession {
  const store = readJsonStore<CardsStore>(CARDS_SESSION_KEY);
  return (
    store[playerId] ?? {
      bet: 0,
      pool: 0,
      streak: 0,
      currentCard: 0,
      nextCard: 0,
      phase: "betting",
    }
  );
}

function saveCardsSession(playerId: string, session: StoredCardsSession) {
  const store = readJsonStore<CardsStore>(CARDS_SESSION_KEY);
  store[playerId] = session;
  writeJsonStore(CARDS_SESSION_KEY, store);
}

function buildCardsResponse(playerId: string, remainingGold: number, session: StoredCardsSession): CardsActionResult {
  const dateKey = buildScratchDateKey();
  const dailyWins = getPlayerDailyCardsGrossWins(playerId, dateKey);
  return {
    status: "success",
    remainingGold,
    session: {
      ...session,
      dailyWins,
      remainingNet: Math.max(0, MAX_DAILY_CARDS_WIN_LIMIT - dailyWins),
    },
  };
}

function chooseRouletteMultiplier() {
  const roll = Math.random();
  if (roll < 0.34) return 0;
  if (roll < 0.54) return 0.5;
  if (roll < 0.77) return 2;
  if (roll < 0.91) return 3;
  if (roll < 0.985) return 5;
  return 10;
}

function getChestStreak(playerId: string) {
  const store = readJsonStore<NumberStore>(CHEST_STREAK_KEY);
  return Number(store[playerId] ?? 0);
}

function setChestStreak(playerId: string, value: number) {
  const store = readJsonStore<NumberStore>(CHEST_STREAK_KEY);
  store[playerId] = value;
  writeJsonStore(CHEST_STREAK_KEY, store);
}

function weightedChestResult(streak: number): "x2" | "x1" | "x0" {
  const difficultyLevel = Math.floor(streak / 2);
  const x2Chance = Math.max(0.12, 0.34 - difficultyLevel * 0.06);
  const x1Chance = Math.max(0.22, 0.41 - difficultyLevel * 0.03);
  const roll = Math.random();

  if (roll < x2Chance) {
    return "x2";
  }

  if (roll < x2Chance + x1Chance) {
    return "x1";
  }

  return "x0";
}

function getCrashState(playerId: string): CrashState {
  const store = readJsonStore<CrashStore>(CRASH_STATE_KEY);
  return (
    store[playerId] ?? {
      phase: "betting",
      bet: 0,
      multiplier: 1,
      lastWin: 0,
      autoCashOut: 0,
    }
  );
}

function saveCrashState(playerId: string, state: CrashState) {
  const store = readJsonStore<CrashStore>(CRASH_STATE_KEY);
  store[playerId] = state;
  writeJsonStore(CRASH_STATE_KEY, store);
}

function getCrashHistory(playerId: string) {
  const store = readJsonStore<CrashHistoryStore>(CRASH_HISTORY_KEY);
  return store[playerId] ?? [];
}

function pushCrashHistory(playerId: string, value: number) {
  const store = readJsonStore<CrashHistoryStore>(CRASH_HISTORY_KEY);
  const next = [value, ...(store[playerId] ?? [])].slice(0, 12);
  store[playerId] = next;
  writeJsonStore(CRASH_HISTORY_KEY, store);
  return next;
}

export function getCrashGrowthMultiplier(elapsedSeconds: number) {
  return Number((1 + elapsedSeconds * 0.72 + elapsedSeconds * elapsedSeconds * 0.09).toFixed(2));
}

function randomCrashAt() {
  const roll = Math.random();
  if (roll < 0.45) return 1.35 + Math.random() * 0.9;
  if (roll < 0.75) return 2.25 + Math.random() * 1.8;
  if (roll < 0.93) return 4.2 + Math.random() * 3.6;
  return 8 + Math.random() * 10;
}

async function resolveCrashState(playerId: string, playerGold: number) {
  const state = getCrashState(playerId);
  if (state.phase !== "rising" || !state.startedAt || !state.crashAt) {
    return {
      state,
      history: getCrashHistory(playerId),
      remainingGold: playerGold,
    };
  }

  const elapsedSeconds = Math.max(0, (Date.now() - state.startedAt) / 1000);
  const growth = getCrashGrowthMultiplier(elapsedSeconds);
  const autoTarget = state.autoCashOut >= 1.01 ? state.autoCashOut : null;

  if (autoTarget && growth >= autoTarget) {
    const payout = Math.floor(state.bet * autoTarget);
    const remainingGold = playerGold + payout;
    await updatePlayerGold(playerId, remainingGold);
    const nextState: CrashState = {
      ...state,
      phase: "cashed_out",
      multiplier: Number(autoTarget.toFixed(2)),
      lastWin: payout,
    };
    const history = pushCrashHistory(playerId, Number(autoTarget.toFixed(2)));
    saveCrashState(playerId, nextState);
    return { state: nextState, history, remainingGold };
  }

  if (growth >= state.crashAt) {
    const crashPoint = Number(state.crashAt.toFixed(2));
    const nextState: CrashState = {
      ...state,
      phase: "crashed",
      multiplier: crashPoint,
      lastWin: 0,
    };
    const history = pushCrashHistory(playerId, crashPoint);
    saveCrashState(playerId, nextState);
    return { state: nextState, history, remainingGold: playerGold };
  }

  const nextState: CrashState = {
    ...state,
    multiplier: growth,
  };
  saveCrashState(playerId, nextState);
  return {
    state: nextState,
    history: getCrashHistory(playerId),
    remainingGold: playerGold,
  };
}

export async function fetchCardsSession(): Promise<CardsActionResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar Cartas." };
  }

  return buildCardsResponse(player.id, player.gold, getCardsSession(player.id));
}

export async function startCardsGameSecure(
  bet: number
): Promise<CardsActionResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar Cartas." };
  }

  const safeBet = Math.max(1, Math.floor(bet));
  if (player.gold < safeBet) {
    return { status: "error", message: "No tienes oro suficiente para esa apuesta." };
  }

  const updated = await updatePlayerGold(player.id, player.gold - safeBet);
  if (!updated) {
    return { status: "error", message: "No se pudo descontar el oro para iniciar Cartas." };
  }

  const session: StoredCardsSession = {
    bet: safeBet,
    pool: safeBet,
    streak: 0,
    currentCard: getRandomCard(),
    nextCard: 0,
    phase: "playing",
  };
  saveCardsSession(player.id, session);
  return buildCardsResponse(player.id, player.gold - safeBet, session);
}

export async function guessCardsSecure(
  guess: "higher" | "lower"
): Promise<CardsActionResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar Cartas." };
  }

  const session = getCardsSession(player.id);
  if (session.phase !== "playing" || session.bet <= 0 || session.currentCard <= 0) {
    return { status: "error", message: "No hay una partida activa de Cartas para resolver." };
  }

  const nextCard = getRandomCard();
  const success =
    nextCard === session.currentCard ||
    (guess === "higher" ? nextCard > session.currentCard : nextCard < session.currentCard);

  if (!success) {
    const nextSession: StoredCardsSession = {
      ...session,
      nextCard,
      phase: "gameOver",
    };
    saveCardsSession(player.id, nextSession);
    return buildCardsResponse(player.id, player.gold, nextSession);
  }

  const streak = session.streak + 1;
  const bonus = Math.max(10, Math.floor(session.bet * (0.7 + streak * 0.45)));
  const equalBonus = nextCard === session.currentCard ? Math.floor(session.bet * 0.4) : 0;
  const nextSession: StoredCardsSession = {
    ...session,
    streak,
    nextCard,
    pool: session.pool + bonus + equalBonus,
    phase: "choice",
  };
  saveCardsSession(player.id, nextSession);
  return buildCardsResponse(player.id, player.gold, nextSession);
}

export async function continueCardsSecure(): Promise<CardsActionResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar Cartas." };
  }

  const session = getCardsSession(player.id);
  if (session.phase !== "choice") {
    return { status: "error", message: "La partida de Cartas no esta esperando tu decision." };
  }

  const nextSession: StoredCardsSession = {
    ...session,
    currentCard: session.nextCard,
    nextCard: 0,
    phase: "playing",
  };
  saveCardsSession(player.id, nextSession);
  return buildCardsResponse(player.id, player.gold, nextSession);
}

export async function cashOutCardsSecure(): Promise<CardsActionResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar Cartas." };
  }

  const session = getCardsSession(player.id);
  if (session.phase !== "choice") {
    return { status: "error", message: "Todavia no puedes cobrar esta partida." };
  }

  const dateKey = buildScratchDateKey();
  const dailyWins = getPlayerDailyCardsGrossWins(player.id, dateKey);
  const remainingNet = Math.max(0, MAX_DAILY_CARDS_WIN_LIMIT - dailyWins);
  const rawNetWin = Math.max(0, session.pool - session.bet);
  const cappedNetWin = Math.min(rawNetWin, remainingNet);
  const cashoutAmount = session.bet + cappedNetWin;
  const nextGold = player.gold + cashoutAmount;

  const updated = await updatePlayerGold(player.id, nextGold);
  if (!updated) {
    return { status: "error", message: "No se pudo pagar el cobro de Cartas." };
  }

  if (cappedNetWin > 0 && typeof window !== "undefined") {
    const current = getPlayerDailyCardsGrossWins(player.id, dateKey);
    window.localStorage.setItem(
      `kingdoom.daily-cards.${player.id}.${dateKey}`,
      String(current + cappedNetWin)
    );
  }

  const resetSession: StoredCardsSession = {
    bet: 0,
    pool: 0,
    streak: 0,
    currentCard: 0,
    nextCard: 0,
    phase: "betting",
  };
  saveCardsSession(player.id, resetSession);
  const response = buildCardsResponse(player.id, nextGold, resetSession);
  if (response.status === "error") {
    return response;
  }

  return {
    ...response,
    cashoutAmount,
  };
}

export async function spinRouletteSecure(
  bet: number
): Promise<RouletteSpinResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar la Ruleta." };
  }

  const safeBet = Math.max(1, Math.floor(bet));
  if (player.gold < safeBet) {
    return { status: "error", message: "No tienes oro suficiente para esa apuesta." };
  }

  const multiplier = chooseRouletteMultiplier();
  const winnings = Math.floor(safeBet * multiplier);
  const remainingGold = Math.max(0, player.gold - safeBet + winnings);
  const updated = await updatePlayerGold(player.id, remainingGold);

  if (!updated) {
    return { status: "error", message: "No se pudo actualizar el oro tras girar la ruleta." };
  }

  return {
    status: "success",
    multiplier,
    winnings,
    remainingGold,
  };
}

export async function playChestRoundSecure(input: {
  bet: number;
  selectedChest: number;
}): Promise<ChestRoundResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de abrir cofres." };
  }

  const safeBet = Math.max(1, Math.floor(input.bet));
  if (player.gold < safeBet) {
    return { status: "error", message: "No tienes oro suficiente para abrir esa ronda." };
  }

  const currentStreak = getChestStreak(player.id);
  const selectedResult = weightedChestResult(currentStreak);
  const otherResults: Array<"x2" | "x1" | "x0"> = [weightedChestResult(currentStreak), weightedChestResult(currentStreak)];
  const chestResults: Array<"x2" | "x1" | "x0"> = [otherResults[0], otherResults[1], otherResults[1]];
  chestResults[input.selectedChest] = selectedResult;
  chestResults[(input.selectedChest + 1) % 3] = otherResults[0];
  chestResults[(input.selectedChest + 2) % 3] = otherResults[1];

  const payout = selectedResult === "x2" ? safeBet * 2 : selectedResult === "x1" ? safeBet : 0;
  const remainingGold = Math.max(0, player.gold - safeBet + payout);
  const updated = await updatePlayerGold(player.id, remainingGold);

  if (!updated) {
    return { status: "error", message: "No se pudo actualizar el oro tras abrir el cofre." };
  }

  const nextStreak = payout > 0 ? currentStreak + 1 : 0;
  setChestStreak(player.id, nextStreak);

  return {
    status: "success",
    selectedChest: input.selectedChest,
    chestResults,
    payout,
    remainingGold,
    nextStreak,
  };
}

export async function fetchCrashSessionState(): Promise<CrashSessionStateResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar Crash." };
  }

  const resolved = await resolveCrashState(player.id, player.gold);
  return {
    status: "success",
    session: {
      phase: resolved.state.phase,
      bet: resolved.state.bet,
      multiplier: resolved.state.multiplier,
      lastWin: resolved.state.lastWin,
      autoCashOut: resolved.state.autoCashOut,
      startedAt: resolved.state.startedAt,
    },
    remainingGold: resolved.remainingGold,
    history: resolved.history,
  };
}

export async function startCrashGameSecure(input: {
  bet: number;
  autoCashOut: number;
}): Promise<CrashSessionStateResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar Crash." };
  }

  const safeBet = Math.max(1, Math.floor(input.bet));
  if (player.gold < safeBet) {
    return { status: "error", message: "No tienes oro suficiente para esa ronda de Crash." };
  }

  const remainingGold = player.gold - safeBet;
  const updated = await updatePlayerGold(player.id, remainingGold);
  if (!updated) {
    return { status: "error", message: "No se pudo descontar el oro para iniciar Crash." };
  }

  const state: CrashState = {
    phase: "rising",
    bet: safeBet,
    multiplier: 1,
    lastWin: 0,
    autoCashOut: input.autoCashOut >= 1.01 ? Number(input.autoCashOut.toFixed(2)) : 0,
    startedAt: Date.now(),
    crashAt: Number(randomCrashAt().toFixed(2)),
  };
  saveCrashState(player.id, state);

  return {
    status: "success",
    session: {
      phase: state.phase,
      bet: state.bet,
      multiplier: state.multiplier,
      lastWin: state.lastWin,
      autoCashOut: state.autoCashOut,
      startedAt: state.startedAt,
    },
    remainingGold,
    history: getCrashHistory(player.id),
  };
}

export async function cashOutCrashSecure(): Promise<CrashSessionStateResult> {
  const player = await getActivePlayer();
  if (!player) {
    return { status: "error", message: "Conecta tu perfil del reino antes de usar Crash." };
  }

  const resolved = await resolveCrashState(player.id, player.gold);
  if (resolved.state.phase !== "rising") {
    return {
      status: "success",
      session: {
        phase: resolved.state.phase,
        bet: resolved.state.bet,
        multiplier: resolved.state.multiplier,
        lastWin: resolved.state.lastWin,
        autoCashOut: resolved.state.autoCashOut,
        startedAt: resolved.state.startedAt,
      },
      remainingGold: resolved.remainingGold,
      history: resolved.history,
    };
  }

  const payout = Math.floor(resolved.state.bet * resolved.state.multiplier);
  const remainingGold = player.gold + payout;
  const updated = await updatePlayerGold(player.id, remainingGold);
  if (!updated) {
    return { status: "error", message: "No se pudo asegurar el retiro en Crash." };
  }

  const nextState: CrashState = {
    ...resolved.state,
    phase: "cashed_out",
    lastWin: payout,
  };
  const history = pushCrashHistory(player.id, Number(nextState.multiplier.toFixed(2)));
  saveCrashState(player.id, nextState);

  return {
    status: "success",
    session: {
      phase: nextState.phase,
      bet: nextState.bet,
      multiplier: nextState.multiplier,
      lastWin: nextState.lastWin,
      autoCashOut: nextState.autoCashOut,
      startedAt: nextState.startedAt,
    },
    remainingGold,
    history,
  };
}
