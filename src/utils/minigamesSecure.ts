import { supabase } from "./supabaseClient";
import { fetchPlayerByUsername } from "./players";

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

// RPCs resolve RNG, balance and session together; never write a browser-computed balance.
export async function requestGameRpc(name: string, args: Record<string, unknown> = {}) {
  try {
    const username = window.localStorage.getItem("kingdoom.active-player")?.trim();
    const { data: { session } } = await supabase.auth.getSession();
    if (!username || !session) throw new Error("Conecta tu perfil y su sesi?n aprobada antes de jugar.");
    const player = await fetchPlayerByUsername(username);
    if (player?.authUserId !== session.user.id) {
      throw new Error("El staff debe aprobar este navegador como sesi?n principal del perfil antes de jugar.");
    }
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw new Error(error.message);
    const raw = Array.isArray(data) ? data[0] : data;
    if (typeof raw !== "string" && (!raw || typeof raw !== "object" || Array.isArray(raw))) {
      throw new Error("El servidor no devolvió un resultado válido. Refresca tu saldo antes de reintentar.");
    }
    return { status: "success" as const, row: raw as Record<string, unknown> | string };
  } catch (error) {
    return { status: "error" as const, message: error instanceof Error ? error.message : "No se pudo confirmar la partida. Refresca tu saldo antes de reintentar." };
  }
}

function asServerInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`Respuesta server-side invalida: ${label}.`);
  return Number(value);
}

function asServerObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Respuesta server-side invalida: ${label}.`);
  }
  return value as Record<string, unknown>;
}

function asServerNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Respuesta server-side invalida: ${label}.`);
  return value;
}

export type CrashSessionState = {
  phase: "betting" | "starting" | "rising" | "crashed" | "cashed_out";
  betAmount: number;
  currentMultiplier: number;
  lastWin: number;
  autoCashOut: number | null;
  remainingGold: number;
  historyValues: number[];
};

async function crashSessionAction(name: string, args: Record<string, unknown> = {}): Promise<CrashSessionState> {
  const result = await requestGameRpc(name, args);
  if (result.status === "error") throw new Error(result.message);
  const row = asServerObject(result.row, "la sesión de Crash");
  const history = row.history_values;
  if (!Array.isArray(history) || !history.every(value => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Respuesta server-side invalida: historial de Crash.");
  }
  const phase = String(row.phase_state);
  if (!["betting", "starting", "rising", "crashed", "cashed_out"].includes(phase)) {
    throw new Error("Respuesta server-side invalida: fase de Crash.");
  }
  return {
    phase: phase as CrashSessionState["phase"],
    betAmount: asServerInteger(row.bet_amount, "la apuesta de Crash"),
    currentMultiplier: asServerNumber(row.current_multiplier, "el multiplicador de Crash"),
    lastWin: asServerInteger(row.last_win, "el último premio de Crash"),
    autoCashOut: row.auto_cash_out == null ? null : asServerNumber(row.auto_cash_out, "el auto cashout de Crash"),
    remainingGold: asServerInteger(row.remaining_gold, "el saldo de Crash"),
    historyValues: history as number[],
  };
}

export const fetchCrashSessionSecure = () => crashSessionAction("get_crash_session_state");

export function startCrashGameSecure(bet: number, autoCashOut: number | null) {
  if (!Number.isSafeInteger(bet) || bet < 1 || bet > 2147483647) {
    return Promise.reject(new Error("La apuesta de Crash debe ser un entero positivo."));
  }
  if (autoCashOut !== null && (!Number.isFinite(autoCashOut) || autoCashOut < 1.01 || autoCashOut > 1000)) {
    return Promise.reject(new Error("El auto cashout debe estar entre 1.01x y 1000x."));
  }
  return crashSessionAction("start_crash_game", { p_bet: bet, p_auto_cash_out: autoCashOut });
}

export const cashOutCrashGameSecure = () => crashSessionAction("cash_out_crash_game");

export type ServerRoundResult = {
  roundId: string;
  game: string;
  bet: number;
  payout: number;
  outcome: unknown;
  newGold: number;
};

async function playServerRound(
  rpcName: string,
  args: Record<string, unknown>,
  expectedGame: string,
): Promise<ServerRoundResult> {
  const result = await requestGameRpc(rpcName, args);
  if (result.status === "error") throw new Error(result.message);
  const row = result.row;
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("El servidor no devolvió una fila de partida válida.");
  if (String(row.game) !== expectedGame) throw new Error("El servidor devolvio un juego inesperado.");
  return {
    roundId: String(row.round_id),
    game: String(row.game),
    bet: asServerInteger(row.bet, "la apuesta"),
    payout: asServerInteger(row.payout, "el pago"),
    outcome: row.outcome,
    newGold: asServerInteger(row.new_gold, "el saldo"),
  };
}

export function createTavernIdempotencyKey(game: string, action = "round") {
  const safe = game.trim().replace(/[^a-z0-9_-]/gi, "-");
  return `web-tavern:${safe}:${action}:${crypto.randomUUID()}`;
}

export function playSlotsSecure(bet: number, idempotencyKey: string) {
  return playServerRound("play_slots_round", { p_bet: bet, p_idempotency_key: idempotencyKey }, "slots");
}

export function playRouletteSecure(bets: Record<string, number>, idempotencyKey: string) {
  return playServerRound("play_roulette_round", { p_bets: bets, p_idempotency_key: idempotencyKey }, "roulette");
}

export function playPlinkoSecure(bet: number, quantity: number, idempotencyKey: string) {
  return playServerRound("play_plinko_round", { p_bet: bet, p_quantity: quantity, p_idempotency_key: idempotencyKey }, "plinko");
}

export async function startPenaltySecure(bet: number, idempotencyKey: string) {
  const result = await requestGameRpc("start_penalty_session", { p_bet: bet, p_idempotency_key: idempotencyKey });
  if (result.status === "error") throw new Error(result.message);
  if (typeof result.row !== "string") throw new Error("El servidor no devolvio la sesion de Penalties.");
  return result.row;
}

export async function stepPenaltySecure(sessionId: string, action: "left" | "center" | "right", idempotencyKey: string) {
  const result = await requestGameRpc("step_penalty_session", { p_session_id: sessionId, p_action: action, p_idempotency_key: idempotencyKey });
  if (result.status === "error") throw new Error(result.message);
  return asServerObject(result.row, "el paso de Penalties");
}

export async function startConfiguredTavernRun(game: "expedition" | "expedition_arcade", encounterId: string, idempotencyKey: string) {
  const rpcName = game === "expedition" ? "start_expedition_run" : "start_expedition_arcade_run";
  const result = await requestGameRpc(rpcName, { p_encounter_id: encounterId, p_idempotency_key: idempotencyKey });
  if (result.status === "error") throw new Error(result.message);
  if (typeof result.row !== "string") throw new Error("El servidor no devolvio la sesion de expedicion.");
  return result.row;
}

export async function stepConfiguredTavernRun(game: "expedition" | "expedition_arcade", sessionId: string, action: "advance" | "retreat", idempotencyKey: string) {
  const rpcName = game === "expedition" ? "step_expedition_run" : "step_expedition_arcade_run";
  const result = await requestGameRpc(rpcName, { p_session_id: sessionId, p_action: action, p_idempotency_key: idempotencyKey });
  if (result.status === "error") throw new Error(result.message);
  return asServerObject(result.row, "el paso de expedicion");
}

export async function submitTowerDefenseSecure(mode: "frontier" | "siege" | "abyss", wave: number, score: number, idempotencyKey: string) {
  const result = await requestGameRpc("submit_tower_defense_result", { p_mode: mode, p_wave: wave, p_score: score, p_idempotency_key: idempotencyKey });
  if (result.status === "error") throw new Error(result.message);
  const row = asServerObject(result.row, "el resultado de Tower Defense");
  return {
    mode: String(row.mode),
    status: String(row.status),
    payout: asServerInteger(row.payout, "el pago de Tower Defense"),
  };
}

function validAmounts(values: unknown[]) {
  return values.every(value => Number.isSafeInteger(value) && Number(value) >= 0);
}

async function cardsAction(name: string, args?: Record<string, string | number>): Promise<CardsActionResult> {
  const result = await requestGameRpc(name, args);
  if (result.status === "error") return result;
  const r = result.row;
  if (!r || typeof r !== "object" || Array.isArray(r)) return { status: "error", message: "Respuesta de Cartas inválida." };
  if (!validAmounts([r.bet_amount, r.pool_amount, r.streak_count, r.current_card, r.next_card,
    r.daily_wins, r.remaining_net_limit, r.remaining_gold]) ||
    !["betting", "playing", "choice", "gameOver"].includes(String(r.phase_state))) {
    return { status: "error", message: "Respuesta de Cartas inválida. Actualiza la partida." };
  }
  return {
    status: "success", remainingGold: Number(r.remaining_gold),
    ...(r.cashout_amount !== undefined ? { cashoutAmount: Number(r.cashout_amount) } : {}),
    session: {
      bet: Number(r.bet_amount), pool: Number(r.pool_amount), streak: Number(r.streak_count),
      currentCard: Number(r.current_card), nextCard: Number(r.next_card),
      phase: r.phase_state as CardsSessionState["phase"], dailyWins: Number(r.daily_wins),
      remainingNet: Number(r.remaining_net_limit),
    },
  };
}

export const fetchCardsSession = () => cardsAction("get_cards_session_state");
export const continueCardsSecure = () => cardsAction("continue_cards_game");
export const cashOutCardsSecure = () => cardsAction("cash_out_cards_game");
export const guessCardsSecure = (guess: "higher" | "lower") => cardsAction("guess_cards_round", { p_guess: guess });
export function startCardsGameSecure(bet: number): Promise<CardsActionResult> {
  if (!Number.isSafeInteger(bet) || bet < 1 || bet > 2147483647) {
    return Promise.resolve({ status: "error", message: "La apuesta debe ser un entero positivo." });
  }
  return cardsAction("start_cards_game", { p_bet: bet });
}

export async function playChestRoundSecure(input: { bet: number; selectedChest: number }): Promise<ChestRoundResult> {
  if (!Number.isSafeInteger(input.bet) || input.bet < 1 || input.bet > 1073741823 ||
    !Number.isInteger(input.selectedChest) || input.selectedChest < 0 || input.selectedChest > 2) {
    return { status: "error", message: "Apuesta o cofre inv?lido." };
  }
  const result = await requestGameRpc("play_chest_round", { p_bet: input.bet, p_selected_chest: input.selectedChest });
  if (result.status === "error") return result;
  const r = result.row;
  if (!r || typeof r !== "object" || Array.isArray(r)) return { status: "error", message: "Respuesta de Cofres inválida." };
  if (!validAmounts([r.selected_chest, r.payout, r.remaining_gold, r.next_streak]) ||
    r.selected_chest !== input.selectedChest || !Array.isArray(r.chest_results) || r.chest_results.length !== 3 ||
    !r.chest_results.every(value => ["x0", "x1", "x2"].includes(value))) {
    return { status: "error", message: "Respuesta de Cofres inv?lida. Actualiza tu saldo." };
  }
  return { status: "success", selectedChest: Number(r.selected_chest),
    chestResults: r.chest_results, payout: Number(r.payout), remainingGold: Number(r.remaining_gold), nextStreak: Number(r.next_streak) };
}
