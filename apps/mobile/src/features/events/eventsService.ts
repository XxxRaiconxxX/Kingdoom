import type {
  EventStatus,
  RealmEvent,
  RealmEventParticipant,
  RealmEventParticipationStatus,
} from "@/src/features/shared/types";
import { formatSupabaseReadError, supabase, supabaseConfigError } from "@/src/services/supabase";

type RealmEventRow = {
  id: string;
  title: string;
  description: string;
  long_description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  status: EventStatus;
  factions: string[] | null;
  rewards: string;
  requirements: string;
  participation_reward_gold?: number | null;
  max_participants?: number | null;
};

type RealmEventParticipantRow = {
  id: string;
  event_id: string;
  player_id: string;
  status: RealmEventParticipationStatus;
  reward_delivered: boolean;
  reward_delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
  players?: { username?: string | null } | Array<{ username?: string | null }> | null;
};

type RealmEventMetaRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: EventStatus;
  max_participants?: number | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSupabaseEventId(value?: string) {
  return Boolean(value && UUID_PATTERN.test(value.trim()));
}

function parseEventDateValue(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;

  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function hasEventStarted(eventMeta: RealmEventMetaRow) {
  if (eventMeta.status === "active" || eventMeta.status === "finished") {
    return true;
  }

  const startTimestamp = parseEventDateValue(eventMeta.start_date);
  return startTimestamp === null ? false : Date.now() >= startTimestamp;
}

function getParticipantPlayer(
  row: RealmEventParticipantRow
): { username?: string | null } | null {
  if (Array.isArray(row.players)) {
    return row.players[0] ?? null;
  }

  return row.players ?? null;
}

function mapRealmEventRow(row: RealmEventRow): RealmEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    longDescription: row.long_description,
    imageUrl: row.image_url,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    factions: row.factions ?? [],
    rewards: row.rewards,
    requirements: row.requirements,
    participationRewardGold: Math.max(0, row.participation_reward_gold ?? 0),
    maxParticipants: Math.max(0, row.max_participants ?? 0),
  };
}

function mapRealmEventParticipantRow(row: RealmEventParticipantRow): RealmEventParticipant {
  const player = getParticipantPlayer(row);

  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    playerName: player?.username?.trim() || "Jugador",
    status: row.status,
    rewardDelivered: row.reward_delivered,
    rewardDeliveredAt: row.reward_delivered_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchRealmEventsNative() {
  if (!supabase) {
    return { events: [] as RealmEvent[], errorMessage: supabaseConfigError };
  }

  const { data, error } = await supabase
    .from("realm_events")
    .select(
      "id, title, description, long_description, image_url, start_date, end_date, status, factions, rewards, requirements, participation_reward_gold, max_participants"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      events: [] as RealmEvent[],
      errorMessage: formatSupabaseReadError("los eventos", error),
    };
  }

  return {
    events: (data as RealmEventRow[]).map(mapRealmEventRow),
    errorMessage: "",
  };
}

export async function fetchPublicEventParticipantsNative(eventIds: string[]) {
  if (!supabase) {
    return {
      participantsByEventId: {} as Record<string, RealmEventParticipant[]>,
      errorMessage: supabaseConfigError,
    };
  }

  const normalizedEventIds = eventIds
    .map((id) => id.trim())
    .filter(isSupabaseEventId);

  if (normalizedEventIds.length === 0) {
    return {
      participantsByEventId: {} as Record<string, RealmEventParticipant[]>,
      errorMessage: "",
    };
  }

  const { data, error } = await supabase
    .from("realm_event_participants")
    .select(
      "id, event_id, player_id, status, reward_delivered, reward_delivered_at, created_at, updated_at, players(username)"
    )
    .in("event_id", normalizedEventIds)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return {
      participantsByEventId: {} as Record<string, RealmEventParticipant[]>,
      errorMessage: formatSupabaseReadError("los participantes", error),
    };
  }

  const participantsByEventId = (data as RealmEventParticipantRow[]).reduce<
    Record<string, RealmEventParticipant[]>
  >((acc, row) => {
    const participant = mapRealmEventParticipantRow(row);
    acc[participant.eventId] = [...(acc[participant.eventId] ?? []), participant];
    return acc;
  }, {});

  return { participantsByEventId, errorMessage: "" };
}

export async function fetchPlayerEventParticipationsNative(
  playerId: string,
  eventIds: string[]
) {
  if (!supabase) {
    return {
      participationsByEventId: {} as Record<string, RealmEventParticipant>,
      errorMessage: supabaseConfigError,
    };
  }

  const normalizedPlayerId = playerId.trim();
  const normalizedEventIds = eventIds.map((id) => id.trim()).filter(isSupabaseEventId);

  if (!normalizedPlayerId || normalizedEventIds.length === 0) {
    return {
      participationsByEventId: {} as Record<string, RealmEventParticipant>,
      errorMessage: "",
    };
  }

  const { data, error } = await supabase
    .from("realm_event_participants")
    .select(
      "id, event_id, player_id, status, reward_delivered, reward_delivered_at, created_at, updated_at"
    )
    .eq("player_id", normalizedPlayerId)
    .in("event_id", normalizedEventIds);

  if (error || !data) {
    return {
      participationsByEventId: {} as Record<string, RealmEventParticipant>,
      errorMessage: formatSupabaseReadError("tu estado en eventos", error),
    };
  }

  const participationsByEventId = (data as RealmEventParticipantRow[]).reduce<
    Record<string, RealmEventParticipant>
  >((acc, row) => {
    const participant = mapRealmEventParticipantRow(row);
    acc[participant.eventId] = participant;
    return acc;
  }, {});

  return { participationsByEventId, errorMessage: "" };
}

export async function joinRealmEventNative(eventId: string, playerId: string) {
  if (!supabase) {
    return { status: "error" as const, message: supabaseConfigError };
  }

  const normalizedEventId = eventId.trim();
  const normalizedPlayerId = playerId.trim();

  if (!isSupabaseEventId(normalizedEventId) || !normalizedPlayerId) {
    return { status: "error" as const, message: "Faltan datos para unirte al evento." };
  }

  const { data: eventMeta, error: eventMetaError } = await supabase
    .from("realm_events")
    .select("id, title, start_date, end_date, status, max_participants")
    .eq("id", normalizedEventId)
    .maybeSingle();

  if (eventMetaError || !eventMeta) {
    return { status: "error" as const, message: "No se pudo validar el evento." };
  }

  const currentEvent = eventMeta as RealmEventMetaRow;

  if (currentEvent.status === "finished") {
    return { status: "closed" as const, message: "Ese evento ya termino." };
  }

  if (hasEventStarted(currentEvent)) {
    return {
      status: "locked" as const,
      message: "El evento ya comenzo.",
    };
  }

  const maxParticipants = Math.max(0, currentEvent.max_participants ?? 0);

  if (maxParticipants > 0) {
    const { count, error: countError } = await supabase
      .from("realm_event_participants")
      .select("id", { head: true, count: "exact" })
      .eq("event_id", normalizedEventId);

    if (countError) {
      return { status: "error" as const, message: "No se pudo validar el cupo." };
    }

    if ((count ?? 0) >= maxParticipants) {
      return { status: "full" as const, message: "El evento ya completo su cupo." };
    }
  }

  const { error } = await supabase.from("realm_event_participants").insert({
    event_id: normalizedEventId,
    player_id: normalizedPlayerId,
    status: "joined",
  });

  if (!error) {
    return { status: "joined" as const, message: "Te uniste al evento." };
  }

  if (error.code === "23505") {
    return { status: "exists" as const, message: "Ya estabas apuntado." };
  }

  if (error.code === "P0001" && error.message.toLowerCase().includes("cupo")) {
    return { status: "full" as const, message: "El evento ya completo su cupo." };
  }

  return { status: "error" as const, message: "No se pudo unir al evento." };
}

export async function leaveRealmEventNative(eventId: string, playerId: string) {
  if (!supabase) {
    return { status: "error" as const, message: supabaseConfigError };
  }

  const normalizedEventId = eventId.trim();
  const normalizedPlayerId = playerId.trim();

  if (!isSupabaseEventId(normalizedEventId) || !normalizedPlayerId) {
    return { status: "error" as const, message: "Faltan datos para salir del evento." };
  }

  const { data: eventMeta, error: eventMetaError } = await supabase
    .from("realm_events")
    .select("id, title, start_date, end_date, status")
    .eq("id", normalizedEventId)
    .maybeSingle();

  if (eventMetaError || !eventMeta) {
    return { status: "error" as const, message: "No se pudo validar el evento." };
  }

  if (hasEventStarted(eventMeta as RealmEventMetaRow)) {
    return {
      status: "locked" as const,
      message: "El evento ya comenzo y no permite salidas.",
    };
  }

  const { error } = await supabase
    .from("realm_event_participants")
    .delete()
    .eq("event_id", normalizedEventId)
    .eq("player_id", normalizedPlayerId);

  if (error) {
    return { status: "error" as const, message: "No se pudo salir del evento." };
  }

  return { status: "left" as const, message: "Saliste del evento." };
}

export function getEventParticipationStatusLabel(status: RealmEventParticipationStatus) {
  const labels: Record<RealmEventParticipationStatus, string> = {
    joined: "Participando",
    rewarded: "Recompensado",
  };

  return labels[status];
}
