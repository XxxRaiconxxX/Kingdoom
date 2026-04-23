import { ACTIVE_EVENTS } from "../data/events";
import type {
  EventRewardNotification,
  EventStatus,
  RealmEvent,
  RealmEventParticipant,
  RealmEventParticipationStatus,
} from "../types";
import { formatAdminPermissionMessage } from "./supabaseErrors";
import { supabase } from "./supabaseClient";

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

type RealmEventNotificationRow = RealmEventParticipantRow & {
  realm_events?:
    | {
        title?: string | null;
        status?: EventStatus | null;
      }
    | Array<{
        title?: string | null;
        status?: EventStatus | null;
      }>
    | null;
};

type RealmEventMetaRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: EventStatus;
};

export type RealmEventsState = {
  status: "ready" | "fallback";
  message: string;
  events: RealmEvent[];
};

export type AdminRealmEventInput = {
  id?: string;
  title: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  factions: string[];
  rewards: string;
  requirements: string;
  participationRewardGold?: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupabaseEventId(value?: string) {
  return Boolean(value && UUID_PATTERN.test(value.trim()));
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
  };
}

function buildRealmEventPayload(input: AdminRealmEventInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    long_description: input.longDescription.trim(),
    image_url: input.imageUrl.trim(),
    start_date: input.startDate.trim(),
    end_date: input.endDate.trim(),
    status: input.status,
    factions: input.factions.map((entry) => entry.trim()).filter(Boolean),
    rewards: input.rewards.trim(),
    requirements: input.requirements.trim(),
    participation_reward_gold: Math.max(0, Math.floor(input.participationRewardGold ?? 0)),
  };
}

function parseEventDateValue(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const timestamp = Date.parse(normalized);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return timestamp;
}

function hasEventStarted(eventMeta: RealmEventMetaRow) {
  if (eventMeta.status === "active" || eventMeta.status === "finished") {
    return true;
  }

  const now = Date.now();
  const startTimestamp = parseEventDateValue(eventMeta.start_date);

  if (startTimestamp === null) {
    return false;
  }

  return now >= startTimestamp;
}

function isEventFinished(eventMeta: RealmEventMetaRow) {
  if (eventMeta.status === "finished") {
    return true;
  }

  const endTimestamp = parseEventDateValue(eventMeta.end_date);

  if (endTimestamp === null) {
    return false;
  }

  return Date.now() >= endTimestamp;
}

function getParticipantPlayer(
  row: RealmEventParticipantRow
): { username?: string | null } | null {
  if (Array.isArray(row.players)) {
    return row.players[0] ?? null;
  }

  return row.players ?? null;
}

function getEventTitleFromRelation(row: RealmEventNotificationRow): string | null {
  const relation = row.realm_events;

  if (Array.isArray(relation)) {
    return relation[0]?.title?.trim() || null;
  }

  if (relation && typeof relation === "object") {
    return relation.title?.trim() || null;
  }

  return null;
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

export async function fetchRealmEvents(): Promise<RealmEventsState> {
  const { data, error } = await supabase
    .from("realm_events")
    .select(
      "id, title, description, long_description, image_url, start_date, end_date, status, factions, rewards, requirements, participation_reward_gold"
    )
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return {
      status: "fallback",
      message:
        "Todavia no hay eventos administrados desde Supabase. Se muestran los eventos locales del proyecto.",
      events: ACTIVE_EVENTS,
    };
  }

  return {
    status: "ready",
    message: "",
    events: (data as RealmEventRow[]).map(mapRealmEventRow),
  };
}

export async function upsertRealmEvent(input: AdminRealmEventInput) {
  const payload = buildRealmEventPayload(input);

  if (input.id) {
    const { error } = await supabase
      .from("realm_events")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      return {
        status: "error" as const,
        message: formatAdminPermissionMessage(
          "No se pudo actualizar el evento en Supabase.",
          error.message
        ),
      };
    }

    return {
      status: "saved" as const,
      message: "Evento actualizado correctamente.",
    };
  }

  const { error } = await supabase.from("realm_events").insert(payload);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo crear el evento en Supabase.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Evento creado correctamente.",
  };
}

export async function deleteRealmEvent(id: string) {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return {
      status: "error" as const,
      message: "Selecciona un evento valido para borrarlo.",
    };
  }

  const { error } = await supabase.from("realm_events").delete().eq("id", normalizedId);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo borrar el evento en Supabase.",
        error.message
      ),
    };
  }

  return {
    status: "deleted" as const,
    message: "Evento borrado correctamente.",
  };
}

export async function fetchRealmEventParticipants(eventId: string) {
  const normalizedEventId = eventId.trim();

  if (!isSupabaseEventId(normalizedEventId)) {
    return {
      status: "ready" as const,
      message: "",
      participants: [] as RealmEventParticipant[],
    };
  }

  const { data, error } = await supabase
    .from("realm_event_participants")
    .select(
      "id, event_id, player_id, status, reward_delivered, reward_delivered_at, created_at, updated_at, players(username)"
    )
    .eq("event_id", normalizedEventId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return {
      status: "error" as const,
      message:
        "No se pudo cargar la lista de participantes del evento.",
      participants: [] as RealmEventParticipant[],
    };
  }

  return {
    status: "ready" as const,
    message: "",
    participants: (data as RealmEventParticipantRow[]).map(mapRealmEventParticipantRow),
  };
}

export async function fetchPublicEventParticipants(eventIds: string[]) {
  const normalizedEventIds = eventIds
    .map((id) => id.trim())
    .filter((id) => isSupabaseEventId(id));

  if (normalizedEventIds.length === 0) {
    return {
      status: "ready" as const,
      message: "",
      participantsByEventId: {} as Record<string, RealmEventParticipant[]>,
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
      status: "error" as const,
      message: "No se pudo cargar participantes de eventos.",
      participantsByEventId: {} as Record<string, RealmEventParticipant[]>,
    };
  }

  const participantsByEventId = (data as RealmEventParticipantRow[]).reduce<
    Record<string, RealmEventParticipant[]>
  >((acc, row) => {
    const mapped = mapRealmEventParticipantRow(row);
    const current = acc[mapped.eventId] ?? [];
    current.push(mapped);
    acc[mapped.eventId] = current;
    return acc;
  }, {});

  return {
    status: "ready" as const,
    message: "",
    participantsByEventId,
  };
}

export async function fetchPlayerEventParticipations(
  playerId: string,
  eventIds: string[]
) {
  const normalizedPlayerId = playerId.trim();
  const normalizedEventIds = eventIds
    .map((id) => id.trim())
    .filter((id) => isSupabaseEventId(id));

  if (!normalizedPlayerId || normalizedEventIds.length === 0) {
    return {
      status: "ready" as const,
      message: "",
      participationsByEventId: {} as Record<string, RealmEventParticipant>,
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
      status: "error" as const,
      message: "No se pudo leer tu estado en eventos.",
      participationsByEventId: {} as Record<string, RealmEventParticipant>,
    };
  }

  const participationsByEventId = (data as RealmEventParticipantRow[]).reduce<
    Record<string, RealmEventParticipant>
  >((acc, row) => {
    const mapped = mapRealmEventParticipantRow(row);
    acc[mapped.eventId] = mapped;
    return acc;
  }, {});

  return {
    status: "ready" as const,
    message: "",
    participationsByEventId,
  };
}

export async function joinRealmEvent(eventId: string, playerId: string) {
  const normalizedEventId = eventId.trim();
  const normalizedPlayerId = playerId.trim();

  if (!isSupabaseEventId(normalizedEventId) || !normalizedPlayerId) {
    return {
      status: "error" as const,
      message: "Faltan datos para unirte al evento.",
    };
  }

  const { data: eventMeta, error: eventMetaError } = await supabase
    .from("realm_events")
    .select("id, title, start_date, end_date, status")
    .eq("id", normalizedEventId)
    .maybeSingle();

  if (eventMetaError || !eventMeta) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo validar el evento antes de unirte.",
        eventMetaError?.message ?? "Evento no encontrado."
      ),
    };
  }

  const currentEvent = eventMeta as RealmEventMetaRow;

  if (currentEvent.status === "finished") {
    return {
      status: "closed" as const,
      message: "Ese evento ya termino y no acepta nuevos participantes.",
    };
  }

  if (hasEventStarted(currentEvent)) {
    return {
      status: "locked" as const,
      message: "El evento ya comenzo. Solo se permite unirse antes de la fecha de inicio.",
    };
  }

  const { error } = await supabase.from("realm_event_participants").insert({
    event_id: normalizedEventId,
    player_id: normalizedPlayerId,
    status: "joined",
  });

  if (!error) {
    return {
      status: "joined" as const,
      message: "Te uniste al evento correctamente.",
    };
  }

  if (error.code === "23505") {
    return {
      status: "exists" as const,
      message: "Ya estabas apuntado en ese evento.",
    };
  }

  return {
    status: "error" as const,
    message: formatAdminPermissionMessage(
      "No se pudo unir al evento en Supabase.",
      error.message
    ),
  };
}

export async function leaveRealmEvent(eventId: string, playerId: string) {
  const normalizedEventId = eventId.trim();
  const normalizedPlayerId = playerId.trim();

  if (!isSupabaseEventId(normalizedEventId) || !normalizedPlayerId) {
    return {
      status: "error" as const,
      message: "Faltan datos para salir del evento.",
    };
  }

  const { data: eventMeta, error: eventMetaError } = await supabase
    .from("realm_events")
    .select("id, title, start_date, end_date, status")
    .eq("id", normalizedEventId)
    .maybeSingle();

  if (eventMetaError || !eventMeta) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo validar el evento antes de salir.",
        eventMetaError?.message ?? "Evento no encontrado."
      ),
    };
  }

  const currentEvent = eventMeta as RealmEventMetaRow;

  if (hasEventStarted(currentEvent)) {
    return {
      status: "locked" as const,
      message: "El evento ya comenzo y no permite salidas hasta su cierre.",
    };
  }

  const { error } = await supabase
    .from("realm_event_participants")
    .delete()
    .eq("event_id", normalizedEventId)
    .eq("player_id", normalizedPlayerId);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo salir del evento en Supabase.",
        error.message
      ),
    };
  }

  return {
    status: "left" as const,
    message: "Saliste del evento correctamente.",
  };
}

export async function fetchPendingEventRewards() {
  const { data, error } = await supabase
    .from("realm_event_participants")
    .select(
      "id, event_id, player_id, status, reward_delivered, reward_delivered_at, created_at, players(username), realm_events(title, status)"
    )
    .eq("status", "joined")
    .eq("reward_delivered", false)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      status: "error" as const,
      message: "No se pudieron leer pendientes de recompensa de eventos.",
      notifications: [] as EventRewardNotification[],
    };
  }

  const notifications = (data as RealmEventNotificationRow[])
    .filter((row) => {
      const relation = row.realm_events;
      const status = Array.isArray(relation)
        ? relation[0]?.status
        : relation?.status;
      return status === "finished";
    })
    .map((row) => {
      const player = getParticipantPlayer(row);
      return {
        participationId: row.id,
        eventId: row.event_id,
        eventTitle: getEventTitleFromRelation(row) ?? "Evento",
        playerId: row.player_id,
        playerName: player?.username?.trim() || "Jugador",
        joinedAt: row.created_at,
      };
    });

  return {
    status: "ready" as const,
    message: "",
    notifications,
  };
}

export async function markEventRewardDelivered(participationId: string) {
  const normalizedParticipationId = participationId.trim();

  if (!normalizedParticipationId) {
    return {
      status: "error" as const,
      message: "Selecciona un participante valido para pagar.",
    };
  }

  const { data: participant, error: participantError } = await supabase
    .from("realm_event_participants")
    .select("id, event_id, reward_delivered")
    .eq("id", normalizedParticipationId)
    .maybeSingle();

  if (participantError || !participant) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se encontro el participante del evento.",
        participantError?.message ?? "Participante no encontrado."
      ),
    };
  }

  if (participant.reward_delivered) {
    return {
      status: "exists" as const,
      message: "La recompensa ya estaba marcada como entregada.",
    };
  }

  const { data: eventMeta, error: eventMetaError } = await supabase
    .from("realm_events")
    .select("id, title, start_date, end_date, status")
    .eq("id", participant.event_id)
    .maybeSingle();

  if (eventMetaError || !eventMeta) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo validar el estado del evento antes de pagar.",
        eventMetaError?.message ?? "Evento no encontrado."
      ),
    };
  }

  const currentEvent = eventMeta as RealmEventMetaRow;

  if (!isEventFinished(currentEvent)) {
    return {
      status: "error" as const,
      message: "Solo puedes pagar la recompensa cuando el evento este finalizado.",
    };
  }

  const { error } = await supabase
    .from("realm_event_participants")
    .update({
      status: "rewarded",
      reward_delivered: true,
      reward_delivered_at: new Date().toISOString(),
    })
    .eq("id", normalizedParticipationId);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo marcar la recompensa del evento como entregada.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Recompensa de evento marcada como entregada.",
  };
}

export function getEventParticipationStatusLabel(status: RealmEventParticipationStatus) {
  const labels: Record<RealmEventParticipationStatus, string> = {
    joined: "Postulado",
    rewarded: "Recompensado",
  };

  return labels[status];
}
