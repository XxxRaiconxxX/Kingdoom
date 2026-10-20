import { supabase } from "./supabaseClient";
import type { HorseProfile, HorseRaceResult } from "./horseRaceUtils";

export type HorseRaceSessionStatus = "betting" | "closed" | "running" | "finished" | "cancelled";

export type PublicHorseRaceSession = {
  id: string;
  title: string;
  status: HorseRaceSessionStatus;
  horses: HorseProfile[];
  result: HorseRaceResult | null;
  winnerId: string | null;
  bettingClosesAt: string;
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
  status: "placed" | "won" | "lost" | "paid" | "refunded";
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
  placements?: string[] | string | null;
  server_odds?: Record<string, number> | string | null;
  betting_closes_at?: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

type BetRow = {
  id: string;
  session_id: string;
  player_id?: string | null;
  horse_id: string;
  horse_name?: string | null;
  bet_amount: number;
  server_odds?: number | string | null;
  odds?: number | string | null;
  payout: number;
  status: "placed" | "won" | "lost" | "paid" | "refunded";
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

function mapServerResult(
  row: SessionRow,
  horses: HorseProfile[]
): HorseRaceResult | null {
  const payload = parseJsonValue<{ winnerId?: string; placements?: string[] }>(row.result, {});
  const placements = parseJsonValue<string[]>(row.placements ?? payload.placements ?? null, []);
  const winnerId = row.winner_id ?? payload.winnerId ?? placements[0] ?? null;
  if (!winnerId || placements.length === 0) return null;

  const durationMs = 4000;
  const initialPositions = Object.fromEntries(horses.map((horse) => [horse.id, 0]));
  const finalPositions = Object.fromEntries(
    horses.map((horse) => {
      const place = Math.max(0, placements.indexOf(horse.id));
      return [horse.id, Math.max(0.12, 1 - place * 0.14)];
    })
  );
  const stamina = Object.fromEntries(horses.map((horse) => [horse.id, 0]));

  return {
    raceId: row.id,
    horses,
    frames: [
      { time: 0, positions: initialPositions, stamina },
      { time: durationMs, positions: finalPositions, stamina },
    ],
    placements,
    winnerId,
    finishTimeMs: durationMs,
    durationMs,
  };
}

function mapSession(row: SessionRow): PublicHorseRaceSession {
  const horses = parseJsonValue<HorseProfile[]>(row.horses, []);
  const serverOdds = parseJsonValue<Record<string, number>>(row.server_odds ?? null, {});
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    horses: horses.map((horse) => ({ ...horse, odds: Number(serverOdds[horse.id] ?? horse.odds) })),
    result: mapServerResult(row, horses),
    winnerId: row.winner_id,
    bettingClosesAt: row.betting_closes_at ?? row.created_at,
    createdBy: null,
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
    playerId: row.player_id ?? "",
    horseId: row.horse_id,
    horseName: row.horse_name ?? row.horse_id,
    betAmount: row.bet_amount,
    odds: Number(row.server_odds ?? row.odds ?? 0),
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

function firstRpcRow<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function detectHorseRaceOnlineSupport() {
  if (onlineSupport !== null) {
    return onlineSupport;
  }

  const { error } = await supabase.from("horse_race_server_sessions_public").select("id").limit(1);
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
      message: "Las carreras server-side aun no estan activas.",
    };
  }

  const { data, error } = await supabase
    .from("horse_race_server_sessions_public")
    .select("*")
    .neq("status", "finished")
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
    .from("horse_race_server_bets_public")
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

async function readServerSession(sessionId: string): Promise<PublicHorseRaceSession | null> {
  const { data, error } = await supabase
    .from("horse_race_server_sessions_public")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  return error || !data ? null : mapSession(data as SessionRow);
}

export async function createPublicHorseRaceSession(input: {
  playerId: string;
  title: string;
  horses: HorseProfile[];
  targetBets?: number;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  void input.playerId;
  void input.targetBets;
  const { data, error } = await supabase.rpc("create_server_horse_race", {
    p_title: input.title,
    p_horses: input.horses,
    p_betting_seconds: 300,
  });
  const row = firstRpcRow<{ session_id: string }>(data);
  if (error || !row?.session_id) {
    return { status: "error", data: null, message: getErrorMessage(error, "No se pudo crear la sala online.") };
  }
  const session = await readServerSession(row.session_id);
  return { status: session ? "success" : "error", data: session, message: session ? "Sala online creada." : "La sala fue creada pero no se pudo leer." };
}

export async function closePublicHorseRaceBets(input: {
  adminPlayerId: string;
  sessionId: string;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  void input.adminPlayerId;
  return startPublicHorseRace({ adminPlayerId: "", sessionId: input.sessionId, result: null });
}

export async function placePublicHorseRaceBet(input: {
  sessionId: string;
  playerId: string;
  horseId: string;
  horseName: string;
  betAmount: number;
  odds: number;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceBet | null>> {
  void input.playerId;
  void input.horseName;
  void input.odds;
  const { error } = await supabase.rpc("place_server_horse_race_bet", {
    p_session_id: input.sessionId,
    p_horse_id: input.horseId,
    p_bet_amount: input.betAmount,
    p_idempotency_key: `web-horse:${input.sessionId}:${input.horseId}:${input.betAmount}`,
  });
  return error
    ? { status: "error", data: null, message: getErrorMessage(error, "No se pudo registrar la apuesta.") }
    : { status: "success", data: null, message: "Apuesta registrada." };
}

export async function startPublicHorseRace(input: {
  adminPlayerId: string;
  sessionId: string;
  result: HorseRaceResult | null;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  void input.adminPlayerId;
  void input.result;
  const { error } = await supabase.rpc("start_server_horse_race", { p_session_id: input.sessionId });
  const session = error ? null : await readServerSession(input.sessionId);
  return error || !session
    ? { status: "error", data: session, message: getErrorMessage(error, "La carrera aun no esta lista para iniciar.") }
    : { status: "success", data: session, message: "Carrera online iniciada." };
}

export async function maybeStartPublicHorseRace(input: {
  playerId: string;
  sessionId: string;
  result: HorseRaceResult;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  return startPublicHorseRace({ adminPlayerId: input.playerId, sessionId: input.sessionId, result: input.result });
}

export async function settlePublicHorseRace(input: {
  playerId: string;
  sessionId: string;
}): Promise<HorseRaceOnlineResult<PublicHorseRaceSession | null>> {
  void input.playerId;
  const { error } = await supabase.rpc("settle_server_horse_race", { p_session_id: input.sessionId });
  const session = error ? null : await readServerSession(input.sessionId);
  return error || !session
    ? { status: "error", data: session, message: getErrorMessage(error, "No se pudo liquidar la carrera online.") }
    : { status: "success", data: session, message: "Pagos liquidados." };
}

export function subscribeToPublicHorseRace(
  sessionId: string,
  onChange: () => void
) {
  let channel = supabase
    .channel(`horse-race-${sessionId || "lobby"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "horse_race_server_sessions" },
      onChange
    );

  channel = sessionId
    ? channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "horse_race_server_bets",
        filter: `session_id=eq.${sessionId}`,
      },
      onChange
    )
    : channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "horse_race_server_bets" },
      onChange
    );

  channel = channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
