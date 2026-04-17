import { supabase } from "./supabaseClient";

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

type ScratchBatchRpcRow = {
  total_cost: number;
  cost_per_ticket: number;
  quantity: number;
  used_tickets: number;
  winning_tickets: number;
  jackpot_wins: number;
  losing_tickets: number;
  total_prize: number;
  refunded_tickets: number;
  refunded_gold: number;
  remaining_gold: number;
  daily_gross_wins: number;
  max_daily_limit: number;
  date_key: string;
};

export async function fetchScratchDailyState(
  dateKey: string
): Promise<ScratchDailyStateResult> {
  const { data, error } = await supabase
    .from("player_scratch_daily_totals")
    .select("gross_wins")
    .eq("date_key", dateKey)
    .maybeSingle();

  if (error) {
    const missingStateTable =
      error.code === "42P01" ||
      error.message.toLowerCase().includes("player_scratch_daily_totals");

    return {
      status: "unavailable",
      grossWins: 0,
      message: missingStateTable
        ? "El estado seguro del rasca aun no existe en Supabase. Ejecuta el SQL de minijuegos antes de usar este modo con oro real."
        : error.message,
    };
  }

  return {
    status: "ready",
    grossWins: Number(data?.gross_wins ?? 0),
  };
}

export async function playScratchBatchSecure(
  quantity: number
): Promise<ScratchBatchPlayResult> {
  const { data, error } = await supabase.rpc("play_scratch_batch", {
    p_quantity: quantity,
  });

  if (error) {
    const missingRpc =
      error.code === "42883" ||
      error.message.toLowerCase().includes("play_scratch_batch");

    return {
      status: "error",
      message: missingRpc
        ? "La RPC segura del rasca aun no esta activada en Supabase. Ejecuta el SQL de minijuegos antes de usar Rasca y gana."
        : error.message,
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as ScratchBatchRpcRow | undefined)
    : (data as ScratchBatchRpcRow | null);

  if (!row) {
    return {
      status: "error",
      message: "La RPC segura del rasca no devolvio datos. Revisa play_scratch_batch en Supabase.",
    };
  }

  return {
    status: "success",
    totalCost: row.total_cost,
    costPerTicket: row.cost_per_ticket,
    quantity: row.quantity,
    usedTickets: row.used_tickets,
    winningTickets: row.winning_tickets,
    jackpotWins: row.jackpot_wins,
    losingTickets: row.losing_tickets,
    totalPrize: row.total_prize,
    refundedTickets: row.refunded_tickets,
    refundedGold: row.refunded_gold,
    remainingGold: row.remaining_gold,
    dailyGrossWins: row.daily_gross_wins,
    maxDailyLimit: row.max_daily_limit,
    dateKey: row.date_key,
  };
}
