import { supabase } from "./supabaseClient";

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
      };
      remainingGold: number;
      history: number[];
    }
  | {
      status: "error";
      message: string;
    };

type CardsRpcRow = {
  bet_amount: number;
  pool_amount: number;
  streak_count: number;
  current_card: number;
  next_card: number | null;
  phase_state: string;
  daily_wins: number;
  remaining_net_limit: number;
  remaining_gold: number;
  cashout_amount?: number | null;
};

type RouletteRpcRow = {
  multiplier: number;
  winnings: number;
  remaining_gold: number;
};

type ChestRpcRow = {
  selected_chest: number;
  chest_results: Array<"x2" | "x1" | "x0">;
  payout: number;
  remaining_gold: number;
  next_streak: number;
};

type CrashSessionRpcRow = {
  phase_state: string;
  bet_amount: number;
  current_multiplier: number;
  last_win: number;
  auto_cash_out: number;
  remaining_gold: number;
  history_values: Array<number | string> | null;
};

function mapCardsRow(row: CardsRpcRow): CardsSessionState {
  return {
    bet: row.bet_amount,
    pool: row.pool_amount,
    streak: row.streak_count,
    currentCard: row.current_card,
    nextCard: row.next_card ?? 0,
    phase: row.phase_state as CardsSessionState["phase"],
    dailyWins: row.daily_wins,
    remainingNet: row.remaining_net_limit,
  };
}

function rpcErrorMessage(error: { code?: string; message: string }, rpcName: string) {
  const missingRpc =
    error.code === "42883" || error.message.toLowerCase().includes(rpcName);

  return missingRpc
    ? `La RPC segura ${rpcName} aun no esta activada en Supabase. Ejecuta el SQL de minijuegos antes de usar este modo con oro real.`
    : error.message;
}

export async function fetchCardsSession(): Promise<CardsActionResult> {
  const { data, error } = await supabase.rpc("get_cards_session_state");

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "get_cards_session_state"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as CardsRpcRow | undefined)
    : (data as CardsRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La sesion segura de Cartas no devolvio datos.",
    };
  }

  return {
    status: "success",
    session: mapCardsRow(row),
    remainingGold: row.remaining_gold,
  };
}

export async function startCardsGameSecure(
  bet: number
): Promise<CardsActionResult> {
  const { data, error } = await supabase.rpc("start_cards_game", {
    p_bet: bet,
  });

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "start_cards_game"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as CardsRpcRow | undefined)
    : (data as CardsRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La partida segura de Cartas no devolvio datos al iniciar.",
    };
  }

  return {
    status: "success",
    session: mapCardsRow(row),
    remainingGold: row.remaining_gold,
  };
}

export async function guessCardsSecure(
  guess: "higher" | "lower"
): Promise<CardsActionResult> {
  const { data, error } = await supabase.rpc("guess_cards_round", {
    p_guess: guess,
  });

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "guess_cards_round"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as CardsRpcRow | undefined)
    : (data as CardsRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La jugada segura de Cartas no devolvio datos.",
    };
  }

  return {
    status: "success",
    session: mapCardsRow(row),
    remainingGold: row.remaining_gold,
  };
}

export async function continueCardsSecure(): Promise<CardsActionResult> {
  const { data, error } = await supabase.rpc("continue_cards_game");

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "continue_cards_game"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as CardsRpcRow | undefined)
    : (data as CardsRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La continuacion segura de Cartas no devolvio datos.",
    };
  }

  return {
    status: "success",
    session: mapCardsRow(row),
    remainingGold: row.remaining_gold,
  };
}

export async function cashOutCardsSecure(): Promise<CardsActionResult> {
  const { data, error } = await supabase.rpc("cash_out_cards_game");

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "cash_out_cards_game"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as CardsRpcRow | undefined)
    : (data as CardsRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "El cobro seguro de Cartas no devolvio datos.",
    };
  }

  return {
    status: "success",
    session: mapCardsRow(row),
    remainingGold: row.remaining_gold,
    cashoutAmount: Number(row.cashout_amount ?? 0),
  };
}

export async function spinRouletteSecure(
  bet: number
): Promise<RouletteSpinResult> {
  const { data, error } = await supabase.rpc("spin_roulette_game", {
    p_bet: bet,
  });

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "spin_roulette_game"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as RouletteRpcRow | undefined)
    : (data as RouletteRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La ruleta segura no devolvio datos.",
    };
  }

  return {
    status: "success",
    multiplier: row.multiplier,
    winnings: row.winnings,
    remainingGold: row.remaining_gold,
  };
}

export async function playChestRoundSecure(input: {
  bet: number;
  selectedChest: number;
}): Promise<ChestRoundResult> {
  const { data, error } = await supabase.rpc("play_chest_round", {
    p_bet: input.bet,
    p_selected_chest: input.selectedChest,
  });

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "play_chest_round"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as ChestRpcRow | undefined)
    : (data as ChestRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La ronda segura de Cofres no devolvio datos.",
    };
  }

  return {
    status: "success",
    selectedChest: row.selected_chest,
    chestResults: row.chest_results,
    payout: row.payout,
    remainingGold: row.remaining_gold,
    nextStreak: row.next_streak,
  };
}

export async function fetchCrashSessionState(): Promise<CrashSessionStateResult> {
  const { data, error } = await supabase.rpc("get_crash_session_state");

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "get_crash_session_state"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as CrashSessionRpcRow | undefined)
    : (data as CrashSessionRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "El estado seguro de Crash no devolvio datos.",
    };
  }

  return {
    status: "success",
    session: {
      phase: row.phase_state as "betting" | "starting" | "rising" | "crashed" | "cashed_out",
      bet: row.bet_amount,
      multiplier: row.current_multiplier,
      lastWin: row.last_win,
      autoCashOut: row.auto_cash_out,
    },
    remainingGold: row.remaining_gold,
    history: Array.isArray(row.history_values) ? row.history_values.map(Number) : [],
  };
}

export async function startCrashGameSecure(input: {
  bet: number;
  autoCashOut: number;
}): Promise<CrashSessionStateResult> {
  const { data, error } = await supabase.rpc("start_crash_game", {
    p_bet: input.bet,
    p_auto_cash_out: input.autoCashOut,
  });

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "start_crash_game"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as CrashSessionRpcRow | undefined)
    : (data as CrashSessionRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La sesion segura de Crash no devolvio datos al iniciar.",
    };
  }

  return {
    status: "success",
    session: {
      phase: row.phase_state as "betting" | "starting" | "rising" | "crashed" | "cashed_out",
      bet: row.bet_amount,
      multiplier: row.current_multiplier,
      lastWin: row.last_win,
      autoCashOut: row.auto_cash_out,
    },
    remainingGold: row.remaining_gold,
    history: Array.isArray(row.history_values) ? row.history_values.map(Number) : [],
  };
}

export async function cashOutCrashSecure(): Promise<CrashSessionStateResult> {
  const { data, error } = await supabase.rpc("cash_out_crash_game");

  if (error) {
    return {
      status: "error",
      message: rpcErrorMessage(error, "cash_out_crash_game"),
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as CrashSessionRpcRow | undefined)
    : (data as CrashSessionRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "El cobro seguro de Crash no devolvio datos.",
    };
  }

  return {
    status: "success",
    session: {
      phase: row.phase_state as "betting" | "starting" | "rising" | "crashed" | "cashed_out",
      bet: row.bet_amount,
      multiplier: row.current_multiplier,
      lastWin: row.last_win,
      autoCashOut: row.auto_cash_out,
    },
    remainingGold: row.remaining_gold,
    history: Array.isArray(row.history_values) ? row.history_values.map(Number) : [],
  };
}
