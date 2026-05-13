import { supabase } from "./supabaseClient";
import type { HorseProfile, HorseRaceResult } from "./horseRaceUtils";

export type HorseRaceSessionStatus = "betting" | "closed" | "running" | "finished";

export type PublicHorseRaceSession = {
  id: string;
  title: string;
  status: HorseRaceSessionStatus;
  horses: HorseProfile[];
  result: HorseRaceResult | null;
  winnerId: string | null;
  createdBy: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicHorseRaceBet = {
  id: string;
  sessionId: string;
  playerId: string;
  horseId: string;
  horseName: string;
  betAmount: number;
  odds: number;
  payout: number;
  status: "placed" | "won" | "lost" | "paid";
  createdAt: string;
  updatedAt: string;
};

export type HorseRaceOnlineResult<T> =
  | { status: "success"; data: T; message?: string }
  | { status: "unavailable" | "error"; data: T; message: string };

type SessionRow = {
  id: string;
  title: string;
  status: HorseRaceSessionStatus;
  horses: HorseProfile[] | string;
  result: HorseRaceResult | string | null;
  winner_id: string | null;
  created_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

type BetRow = {
  id: string;
  session_id: string;
  player_id: string;
  horse_id: string;
  horse_name: string;
  bet_amount: number;
  odds: number | string;
  payout: number;
  status: "placed" | "won" | "lost" | "paid";
  created_at: string;
  updated_at: string;
};

let onlineSupport: boolean | null = null;

function parseJsonValue<T>(value: T | string | null, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapSession(row: SessionRow): PublicHorseRaceSession {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    horses: parseJsonValue<HorseProfile[]>(row.horses, []),
    result: parseJsonValue<HorseRaceResult | null>(row.result, null),
    winnerId: row.winner_id,
    createdBy: row.created_by,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBet(row: BetRow): PublicHorseRaceBet {
  return {
    id: row.id,
    sessionId: row.session_id,
    playerId: row.player_id,
    horseId: row.horse_id,
    horseName: row.horse_name,
    betAmount: row.bet_amount,
    odds: Number(row.odds),
    payout: row.payout,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: string }).message || fallback);
  }

  return fallback;
}

export async function detectHorseRaceOnlineSupport() {
  if (onlineSupport !== null) {
    return onlineSupport;
  }

  const { error } = await supabase.from("horse_race_sessions").select("id").limit(1);
  onlineSupport = !error;
  return onlineSupport;
}

export async function fetchPublicHorseRaceSessions(): Promise<
  HorseRaceOnlineResult<PublicHorseRaceSession[]>
> {
  const hasSupport = await detectHorseRaceOnlineSupport();

  if (!hasSupport) {
    return {
      status: "unavailable",
      data: [],
      message: "Ejecuta supabase_horse_race_online.sql para activar salas online.",
    };
  }

  const { data, error } = await supabase
    .from("horse_race_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return {
      status: "error",
      data: [],
      message: "No se pudieron leer las carreras online.",
    };
  }

  return { status: "success", data: (data as SessionRow[]).map(mapSession) };
}

export async function fetchPublicHorseRaceBets(sessionId: string): Promise<
  HorseRaceOnlineResult<PublicHorseRaceBet[]>
> {
  if (!sessionId) {
    return { status: "success", data: [] };
  }

  const hasSupport = await detectHorseRaceOnlineSupport();

  if (!hasSupport) {
    return {
      status: "unavailable",
      data: [],
      message: "Las apuestas online aun no estan activas.",
    };
  }

  const { data, error } = await supabase
    .from("horse_race_bets")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      status: "error",
      data: [],
      message: "No se pudieron leer las apuestas de la sala.",
    };
  }

  return { status: "success", data: (data as BetRow[]).map(mapBet) };
}

export async function createPublicHorseRaceSession(input: {
  adminPlayerId: string;
  title: string;
  horses: HorseProfile[];
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  const { data, error } = await supabase.rpc("create_public_horse_race_session", {
    p_admin_player_id: input.adminPlayerId,
    p_title: input.title,
    p_horses: input.horses,
  });

  if (error || !data) {
    return {
      status: "error",
      data: null,
      message: getErrorMessage(error, "No se pudo crear la sala online."),
    };
  }

  return { status: "success", data: mapSession(data as SessionRow), message: "Sala online creada." };
}

export async function closePublicHorseRaceBets(input: {
  adminPlayerId: string;
  sessionId: string;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  const { data, error } = await supabase.rpc("close_public_horse_race_bets", {
    p_admin_player_id: input.adminPlayerId,
    p_session_id: input.sessionId,
  });

  if (error || !data) {
    return {
      status: "error",
      data: null,
      message: getErrorMessage(error, "No se pudieron cerrar las apuestas."),
    };
  }

  return { status: "success", data: mapSession(data as SessionRow), message: "Apuestas cerradas." };
}

export async function placePublicHorseRaceBet(input: {
  sessionId: string;
  playerId: string;
  horseId: string;
  horseName: string;
  betAmount: number;
  odds: number;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceBet | null>> {
  const { data, error } = await supabase.rpc("place_public_horse_race_bet", {
    p_session_id: input.sessionId,
    p_player_id: input.playerId,
    p_horse_id: input.horseId,
    p_horse_name: input.horseName,
    p_bet_amount: Math.max(1, Math.floor(input.betAmount)),
    p_odds: input.odds,
  });

  if (error || !data) {
    return {
      status: "error",
      data: null,
      message: getErrorMessage(error, "No se pudo registrar la apuesta online."),
    };
  }

  return { status: "success", data: mapBet(data as BetRow), message: "Apuesta online registrada." };
}

export async function startPublicHorseRace(input: {
  adminPlayerId: string;
  sessionId: string;
  result: HorseRaceResult;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  const { data, error } = await supabase.rpc("start_public_horse_race", {
    p_admin_player_id: input.adminPlayerId,
    p_session_id: input.sessionId,
    p_result: input.result,
    p_winner_id: input.result.winnerId,
    p_placements: input.result.placements,
  });

  if (error || !data) {
    return {
      status: "error",
      data: null,
      message: getErrorMessage(error, "No se pudo iniciar la carrera online."),
    };
  }

  return { status: "success", data: mapSession(data as SessionRow), message: "Carrera online iniciada." };
}

export async function settlePublicHorseRace(input: {
  adminPlayerId: string;
  sessionId: string;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  const { data, error } = await supabase.rpc("settle_public_horse_race", {
    p_admin_player_id: input.adminPlayerId,
    p_session_id: input.sessionId,
  });

  if (error || !data) {
    return {
      status: "error",
      data: null,
      message: getErrorMessage(error, "No se pudo liquidar la carrera online."),
    };
  }

  return { status: "success", data: mapSession(data as SessionRow), message: "Pagos liquidados." };
}

export function subscribeToPublicHorseRace(
  sessionId: string,
  onChange: () => void
) {
  let channel = supabase
    .channel(`horse-race-${sessionId || "lobby"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "horse_race_sessions" },
      onChange
    );

  channel = sessionId
    ? channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "horse_race_bets",
        filter: `session_id=eq.${sessionId}`,
      },
      onChange
    )
    : channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "horse_race_bets" },
      onChange
    );

  channel = channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
