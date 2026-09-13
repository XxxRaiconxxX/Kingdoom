import { supabase } from "./supabaseClient";
import { requestGameRpc } from "./minigamesSecure";

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

export async function fetchScratchDailyState(dateKey: string): Promise<ScratchDailyStateResult> {
  try {
    const { data, error } = await supabase.from("player_scratch_daily_totals")
      .select("gross_wins").eq("date_key", dateKey).maybeSingle();
    if (error) throw error;
    return { status: "ready", grossWins: Number(data?.gross_wins ?? 0) };
  } catch {
    return { status: "unavailable", grossWins: 0, message: "No se pudo consultar el l?mite diario de esta sesi?n." };
  }
}

export async function playScratchBatchSecure(quantity: number): Promise<ScratchBatchPlayResult> {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 250) {
    return { status: "error", message: "Elige entre 1 y 250 tickets." };
  }
  const result = await requestGameRpc("play_scratch_batch", { p_quantity: quantity });
  if (result.status === "error") return result;
  const r = result.row;
  const fields = ["total_cost", "cost_per_ticket", "quantity", "used_tickets", "winning_tickets", "jackpot_wins", "losing_tickets", "total_prize", "refunded_tickets", "refunded_gold", "remaining_gold", "daily_gross_wins", "max_daily_limit"];
  if (!fields.every(key => Number.isSafeInteger(r[key]) && Number(r[key]) >= 0) || typeof r.date_key !== "string") {
    return { status: "error", message: "Respuesta de Rasca inv?lida. Actualiza tu saldo antes de reintentar." };
  }
  return { status: "success",
    totalCost: Number(r.total_cost),
    costPerTicket: Number(r.cost_per_ticket),
    quantity: Number(r.quantity),
    usedTickets: Number(r.used_tickets),
    winningTickets: Number(r.winning_tickets),
    jackpotWins: Number(r.jackpot_wins),
    losingTickets: Number(r.losing_tickets),
    totalPrize: Number(r.total_prize),
    refundedTickets: Number(r.refunded_tickets),
    refundedGold: Number(r.refunded_gold),
    remainingGold: Number(r.remaining_gold),
    dailyGrossWins: Number(r.daily_gross_wins),
    maxDailyLimit: Number(r.max_daily_limit),
    dateKey: r.date_key,
  };
}
