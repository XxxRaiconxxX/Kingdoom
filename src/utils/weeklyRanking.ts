import type { RankingPlayer, RankingWindow, WeeklyRankingState } from "../types";
import { RANKING_PLAYERS } from "../data/ranking";
import { supabase } from "./supabaseClient";

// SQL sugerido para Supabase:
//
// create table weekly_activity_rankings (
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
  status?: RankingPlayer["status"] | null;
  activity_points: number;
  missions_completed: number;
  events_joined: number;
  streak_days?: number | null;
  week_starts_at: string;
  week_ends_at: string;
};

function sortPlayers(players: RankingPlayer[]) {
  return [...players].sort((left, right) => {
    if (right.activityPoints !== left.activityPoints) {
      return right.activityPoints - left.activityPoints;
    }

    if (right.missionsCompleted !== left.missionsCompleted) {
      return right.missionsCompleted - left.missionsCompleted;
    }

    return right.eventsJoined - left.eventsJoined;
  });
}

export function getCurrentRankingWindow(now = new Date()): RankingWindow {
  const current = new Date(now);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStartsAt = new Date(current);
  weekStartsAt.setDate(current.getDate() + diffToMonday);
  weekStartsAt.setHours(0, 0, 0, 0);

  const weekEndsAt = new Date(weekStartsAt);
  weekEndsAt.setDate(weekStartsAt.getDate() + 7);
  weekEndsAt.setMilliseconds(weekEndsAt.getMilliseconds() - 1);

  return {
    weekStartsAt: weekStartsAt.toISOString(),
    weekEndsAt: weekEndsAt.toISOString(),
  };
}

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

export async function fetchWeeklyRanking(): Promise<WeeklyRankingState> {
  const nowIso = new Date().toISOString();
  const fallbackWindow = getCurrentRankingWindow();

  const { data, error } = await supabase
    .from("weekly_activity_rankings")
    .select(
      "id, player_id, display_name, faction, status, activity_points, missions_completed, events_joined, streak_days, week_starts_at, week_ends_at"
    )
    .lte("week_starts_at", nowIso)
    .gte("week_ends_at", nowIso)
    .order("activity_points", { ascending: false })
    .order("missions_completed", { ascending: false })
    .order("events_joined", { ascending: false });

  if (error || !data || data.length === 0) {
    return {
      status: "fallback",
      message:
        "Aun no hay una tabla semanal activa en Supabase. Se muestra un ranking de ejemplo hasta que cargues `weekly_activity_rankings`.",
      window: fallbackWindow,
      players: sortPlayers(
        RANKING_PLAYERS.map((player) => ({
          ...player,
          weekStartsAt: fallbackWindow.weekStartsAt,
          weekEndsAt: fallbackWindow.weekEndsAt,
        }))
      ),
    };
  }

  const players = sortPlayers((data as WeeklyRankingRow[]).map(mapWeeklyRow));
  const firstRow = data[0] as WeeklyRankingRow;

  return {
    status: "ready",
    message: "",
    window: {
      weekStartsAt: firstRow.week_starts_at,
      weekEndsAt: firstRow.week_ends_at,
    },
    players,
  };
}

export function formatRankingWindow(window: RankingWindow, locale = "es-PY") {
  const start = new Date(window.weekStartsAt);
  const end = new Date(window.weekEndsAt);

  return `${start.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  })} - ${end.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  })}`;
}

export function formatCountdown(targetIso: string, now = new Date()) {
  const target = new Date(targetIso).getTime();
  const delta = Math.max(0, target - now.getTime());

  const totalMinutes = Math.floor(delta / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
