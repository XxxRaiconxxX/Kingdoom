import type { PlayerAccount, RankingPlayer } from "../types";
import { formatAdminPermissionMessage } from "./supabaseErrors";
import { supabase } from "./supabaseClient";
import { getCurrentRankingWindow } from "./weeklyRanking";
import { fetchAllPlayers } from "./players";

// SQL sugerido para reforzar acceso admin en players:
//
// alter table players add column if not exists is_admin boolean not null default false;
// update players set is_admin = true where username = 'TuAdminReal';
//
// SQL sugerido para la tabla de ranking semanal administrable:
//
// create table if not exists weekly_activity_rankings (
//   id uuid primary key default gen_random_uuid(),
//   player_id uuid references players(id) on delete set null,
//   display_name text not null,
//   faction text not null,
//   status text not null default 'alive',
//   activity_points integer not null default 0,
//   missions_completed integer not null default 0,
//   events_joined integer not null default 0,
//   streak_days integer not null default 0,
//   week_starts_at timestamptz not null,
//   week_ends_at timestamptz not null,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now()
// );
//
// alter table weekly_activity_rankings enable row level security;
//
// create policy "Allow all weekly ranking access" on weekly_activity_rankings
//   for all using (true) with check (true);

type WeeklyRankingRow = {
  id: string;
  player_id?: string | null;
  display_name: string;
  faction: string;
  status: RankingPlayer["status"];
  activity_points: number;
  missions_completed: number;
  events_joined: number;
  streak_days?: number | null;
  week_starts_at: string;
  week_ends_at: string;
};

export type AdminWeeklyRankingInput = {
  player: PlayerAccount;
  faction: string;
  status: RankingPlayer["status"];
  activityPoints: number;
  missionsCompleted: number;
  eventsJoined: number;
  streakDays: number;
};

function mapWeeklyRow(row: WeeklyRankingRow): RankingPlayer {
  return {
    id: row.player_id ?? row.id,
    name: row.display_name,
    faction: row.faction,
    activityPoints: row.activity_points,
    missionsCompleted: row.missions_completed,
    eventsJoined: row.events_joined,
    streakDays: row.streak_days ?? 0,
    status: row.status ?? "alive",
    weekStartsAt: row.week_starts_at,
    weekEndsAt: row.week_ends_at,
  };
}

export async function fetchAdminWeeklyRankingRows() {
  const window = getCurrentRankingWindow();

  const { data, error } = await supabase
    .from("weekly_activity_rankings")
    .select(
      "id, player_id, display_name, faction, status, activity_points, missions_completed, events_joined, streak_days, week_starts_at, week_ends_at"
    )
    .eq("week_starts_at", window.weekStartsAt)
    .eq("week_ends_at", window.weekEndsAt)
    .order("activity_points", { ascending: false })
    .order("missions_completed", { ascending: false })
    .order("events_joined", { ascending: false });

  if (error) {
    return {
      status: "unavailable" as const,
      message:
        "La tabla weekly_activity_rankings aun no esta lista o no permite lectura desde la app.",
      rows: [] as RankingPlayer[],
      window,
    };
  }

  return {
    status: "ready" as const,
    message: "",
    rows: (data as WeeklyRankingRow[]).map(mapWeeklyRow),
    window,
  };
}

export async function upsertAdminWeeklyRankingEntry(
  input: AdminWeeklyRankingInput
) {
  const window = getCurrentRankingWindow();

  const { data: existingRow, error: readError } = await supabase
    .from("weekly_activity_rankings")
    .select("id")
    .eq("player_id", input.player.id)
    .eq("week_starts_at", window.weekStartsAt)
    .eq("week_ends_at", window.weekEndsAt)
    .maybeSingle();

  if (readError) {
    return {
      status: "unavailable" as const,
      message: formatAdminPermissionMessage(
        "No se pudo leer la tabla weekly_activity_rankings.",
        readError.message
      ),
    };
  }

  const payload = {
    player_id: input.player.id,
    display_name: input.player.username,
    faction: input.faction.trim(),
    status: input.status,
    activity_points: Math.max(0, input.activityPoints),
    missions_completed: Math.max(0, input.missionsCompleted),
    events_joined: Math.max(0, input.eventsJoined),
    streak_days: Math.max(0, input.streakDays),
    week_starts_at: window.weekStartsAt,
    week_ends_at: window.weekEndsAt,
  };

  if (existingRow?.id) {
    const { error } = await supabase
      .from("weekly_activity_rankings")
      .update(payload)
      .eq("id", existingRow.id);

    if (error) {
      return {
        status: "unavailable" as const,
        message: formatAdminPermissionMessage(
          "No se pudo actualizar el registro semanal del jugador en Supabase.",
          error.message
        ),
      };
    }

    return { status: "saved" as const, message: "Ranking semanal actualizado." };
  }

  const { error } = await supabase
    .from("weekly_activity_rankings")
    .insert(payload);

  if (error) {
    return {
      status: "unavailable" as const,
      message: formatAdminPermissionMessage(
        "No se pudo crear el registro semanal del jugador en Supabase.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Jugador agregado a la semana activa.",
  };
}

export async function seedCurrentWeeklyRanking() {
  const window = getCurrentRankingWindow();

  const { data: currentRows, error: currentError } = await supabase
    .from("weekly_activity_rankings")
    .select("id")
    .eq("week_starts_at", window.weekStartsAt)
    .eq("week_ends_at", window.weekEndsAt);

  if (currentError) {
    return {
      status: "unavailable" as const,
      message: formatAdminPermissionMessage(
        "No se pudo comprobar la semana activa en weekly_activity_rankings.",
        currentError.message
      ),
    };
  }

  if (currentRows && currentRows.length > 0) {
    return {
      status: "skipped" as const,
      message: "La semana actual ya tiene jugadores cargados.",
    };
  }

  const { data: previousRows, error: previousError } = await supabase
    .from("weekly_activity_rankings")
    .select(
      "player_id, display_name, faction, status, week_starts_at, week_ends_at"
    )
    .lt("week_ends_at", window.weekStartsAt)
    .order("week_starts_at", { ascending: false });

  if (previousError) {
    return {
      status: "unavailable" as const,
      message: formatAdminPermissionMessage(
        "No se pudo leer la semana anterior para sembrar la nueva temporada.",
        previousError.message
      ),
    };
  }

  let payload:
    | Array<{
        player_id: string | null;
        display_name: string;
        faction: string;
        status: RankingPlayer["status"];
        activity_points: number;
        missions_completed: number;
        events_joined: number;
        streak_days: number;
        week_starts_at: string;
        week_ends_at: string;
      }>
    | [];

  if (previousRows && previousRows.length > 0) {
    const latestWeekStart = previousRows[0].week_starts_at;
    const latestWeekEnd = previousRows[0].week_ends_at;
    const latestSeasonRows = previousRows.filter(
      (row) =>
        row.week_starts_at === latestWeekStart && row.week_ends_at === latestWeekEnd
    );

    payload = latestSeasonRows.map((row) => ({
      player_id: row.player_id ?? null,
      display_name: row.display_name,
      faction: row.faction,
      status: row.status ?? "alive",
      activity_points: 0,
      missions_completed: 0,
      events_joined: 0,
      streak_days: 0,
      week_starts_at: window.weekStartsAt,
      week_ends_at: window.weekEndsAt,
    }));
  } else {
    const players = await fetchAllPlayers();

    if (players.length === 0) {
      return {
        status: "skipped" as const,
        message:
          "No hay jugadores base en la tabla players para sembrar la nueva semana.",
      };
    }

    payload = players.map((player) => ({
      player_id: player.id,
      display_name: player.username,
      faction: "Sin faccion",
      status: "alive" as const,
      activity_points: 0,
      missions_completed: 0,
      events_joined: 0,
      streak_days: 0,
      week_starts_at: window.weekStartsAt,
      week_ends_at: window.weekEndsAt,
    }));
  }

  const { error: insertError } = await supabase
    .from("weekly_activity_rankings")
    .insert(payload);

  if (insertError) {
    return {
      status: "unavailable" as const,
      message: formatAdminPermissionMessage(
        "No se pudo crear la nueva semana en weekly_activity_rankings.",
        insertError.message
      ),
    };
  }

  return {
    status: "seeded" as const,
    message:
      previousRows && previousRows.length > 0
        ? "Semana nueva creada tomando la ultima temporada como base."
        : "Semana nueva creada usando la tabla players como semilla inicial.",
  };
}
