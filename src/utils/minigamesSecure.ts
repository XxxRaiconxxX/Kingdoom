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
export async function requestGameRpc(name: string, args: Record<string, string | number> = {}) {
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
    const row: Record<string, unknown> | null = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") throw new Error("El servidor no devolvi? un resultado. Refresca tu saldo antes de reintentar.");
    return { status: "success" as const, row };
  } catch (error) {
    return { status: "error" as const, message: error instanceof Error ? error.message : "No se pudo confirmar la partida. Refresca tu saldo antes de reintentar." };
  }
}

function validAmounts(values: unknown[]) {
  return values.every(value => Number.isSafeInteger(value) && Number(value) >= 0);
}

async function cardsAction(name: string, args?: Record<string, string | number>): Promise<CardsActionResult> {
  const result = await requestGameRpc(name, args);
  if (result.status === "error") return result;
  const r = result.row;
  if (!validAmounts([r.bet_amount, r.pool_amount, r.streak_count, r.current_card, r.next_card,
    r.daily_wins, r.remaining_net_limit, r.remaining_gold]) ||
    !["betting", "playing", "choice", "gameOver"].includes(String(r.phase_state))) {
    return { status: "error", message: "Respuesta de Cartas inv?lida. Actualiza la partida." };
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
  if (!validAmounts([r.selected_chest, r.payout, r.remaining_gold, r.next_streak]) ||
    r.selected_chest !== input.selectedChest || !Array.isArray(r.chest_results) || r.chest_results.length !== 3 ||
    !r.chest_results.every(value => ["x0", "x1", "x2"].includes(value))) {
    return { status: "error", message: "Respuesta de Cofres inv?lida. Actualiza tu saldo." };
  }
  return { status: "success", selectedChest: Number(r.selected_chest),
    chestResults: r.chest_results, payout: Number(r.payout), remainingGold: Number(r.remaining_gold), nextStreak: Number(r.next_streak) };
}
