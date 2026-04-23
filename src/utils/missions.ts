import { FALLBACK_MISSIONS } from "../data/missions";
import type {
  MissionDifficulty,
  RealmMissionClaimStatus,
  MissionStatus,
  MissionType,
  RealmMission,
  RealmMissionClaim,
} from "../types";
import { formatAdminPermissionMessage } from "./supabaseErrors";
import { supabase } from "./supabaseClient";

type RealmMissionRow = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  reward_gold: number;
  difficulty: MissionDifficulty;
  type: MissionType;
  status: MissionStatus;
  visible: boolean;
  created_at?: string;
  updated_at?: string;
};

type MissionClaimPlayerRow = {
  username?: string | null;
  gold?: number | null;
};

type RealmMissionClaimRow = {
  id: string;
  mission_id: string;
  player_id: string;
  status: RealmMissionClaimStatus;
  reward_delivered: boolean;
  reward_delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
  players?: MissionClaimPlayerRow | MissionClaimPlayerRow[] | null;
};

export type RealmMissionsState = {
  status: "ready" | "fallback";
  message: string;
  missions: RealmMission[];
};

export type AdminRealmMissionInput = {
  id?: string;
  title: string;
  description: string;
  instructions: string;
  rewardGold: number;
  difficulty: MissionDifficulty;
  type: MissionType;
  status: MissionStatus;
  visible: boolean;
};

function mapRealmMissionRow(row: RealmMissionRow): RealmMission {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    rewardGold: row.reward_gold,
    difficulty: row.difficulty,
    type: row.type,
    status: row.status,
    visible: row.visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildRealmMissionPayload(input: AdminRealmMissionInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    instructions: input.instructions.trim(),
    reward_gold: Math.max(0, Math.floor(input.rewardGold)),
    difficulty: input.difficulty,
    type: input.type,
    status: input.status,
    visible: input.visible,
  };
}

function getClaimPlayer(row: RealmMissionClaimRow): MissionClaimPlayerRow | null {
  if (Array.isArray(row.players)) {
    return row.players[0] ?? null;
  }

  return row.players ?? null;
}

function mapRealmMissionClaimRow(row: RealmMissionClaimRow): RealmMissionClaim {
  const player = getClaimPlayer(row);

  return {
    id: row.id,
    missionId: row.mission_id,
    playerId: row.player_id,
    playerName: player?.username ?? "Jugador desconocido",
    playerGold: player?.gold ?? 0,
    status: row.status,
    rewardDelivered: row.reward_delivered,
    rewardDeliveredAt: row.reward_delivered_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchPublicRealmMissions(): Promise<RealmMissionsState> {
  const { data, error } = await supabase
    .from("realm_missions")
    .select(
      "id, title, description, instructions, reward_gold, difficulty, type, status, visible, created_at, updated_at"
    )
    .eq("visible", true)
    .neq("status", "closed")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return {
      status: "fallback",
      message: "",
      missions: FALLBACK_MISSIONS,
    };
  }

  return {
    status: "ready",
    message: "",
    missions: (data as RealmMissionRow[]).map(mapRealmMissionRow),
  };
}

export async function fetchAdminRealmMissions(): Promise<RealmMissionsState> {
  const { data, error } = await supabase
    .from("realm_missions")
    .select(
      "id, title, description, instructions, reward_gold, difficulty, type, status, visible, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      status: "fallback",
      message:
        "La tabla de misiones aun no esta disponible en Supabase. Ejecuta el SQL de misiones para activar el gestor.",
      missions: FALLBACK_MISSIONS,
    };
  }

  return {
    status: "ready",
    message: "",
    missions: (data as RealmMissionRow[]).map(mapRealmMissionRow),
  };
}

export async function upsertRealmMission(input: AdminRealmMissionInput) {
  const payload = buildRealmMissionPayload(input);

  if (!payload.title) {
    return {
      status: "error" as const,
      message: "El titulo de la mision es obligatorio.",
    };
  }

  if (input.id) {
    const { error } = await supabase
      .from("realm_missions")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      return {
        status: "error" as const,
        message: formatAdminPermissionMessage(
          "No se pudo actualizar la mision en Supabase.",
          error.message
        ),
      };
    }

    return {
      status: "saved" as const,
      message: "Mision actualizada correctamente.",
    };
  }

  const { error } = await supabase.from("realm_missions").insert(payload);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo crear la mision en Supabase.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Mision creada correctamente.",
  };
}

export async function deleteRealmMission(id: string) {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return {
      status: "error" as const,
      message: "Selecciona una mision valida para borrar.",
    };
  }

  const { error } = await supabase
    .from("realm_missions")
    .delete()
    .eq("id", normalizedId);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo borrar la mision en Supabase.",
        error.message
      ),
    };
  }

  return {
    status: "deleted" as const,
    message: "Mision borrada correctamente.",
  };
}

export async function fetchMissionClaims(missionId: string) {
  const normalizedMissionId = missionId.trim();

  if (!normalizedMissionId) {
    return {
      status: "ready" as const,
      message: "",
      claims: [] as RealmMissionClaim[],
    };
  }

  const { data, error } = await supabase
    .from("realm_mission_claims")
    .select(
      "id, mission_id, player_id, status, reward_delivered, reward_delivered_at, created_at, updated_at, players(username, gold)"
    )
    .eq("mission_id", normalizedMissionId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      status: "error" as const,
      message:
        "No se pudieron cargar los jugadores que tomaron esta mision. Verifica el SQL de participantes.",
      claims: [] as RealmMissionClaim[],
    };
  }

  return {
    status: "ready" as const,
    message: "",
    claims: (data as RealmMissionClaimRow[]).map(mapRealmMissionClaimRow),
  };
}

export async function claimRealmMission(missionId: string, playerId: string) {
  const normalizedMissionId = missionId.trim();
  const normalizedPlayerId = playerId.trim();

  if (!normalizedMissionId || !normalizedPlayerId) {
    return {
      status: "error" as const,
      message: "Faltan datos para tomar la mision.",
    };
  }

  const { error } = await supabase.from("realm_mission_claims").insert({
    mission_id: normalizedMissionId,
    player_id: normalizedPlayerId,
    status: "claimed",
  });

  if (!error) {
    return {
      status: "claimed" as const,
      message: "Mision tomada. Coordina el rol por WhatsApp.",
    };
  }

  if (error.code === "23505") {
    return {
      status: "exists" as const,
      message: "Ese jugador ya tomo esta mision.",
    };
  }

  return {
    status: "error" as const,
    message: formatAdminPermissionMessage(
      "No se pudo tomar la mision en Supabase.",
      error.message
    ),
  };
}

export async function updateMissionClaimStatus(
  claimId: string,
  status: RealmMissionClaimStatus
) {
  const normalizedClaimId = claimId.trim();

  if (!normalizedClaimId) {
    return {
      status: "error" as const,
      message: "Selecciona una toma de mision valida.",
    };
  }

  const { error } = await supabase
    .from("realm_mission_claims")
    .update({ status })
    .eq("id", normalizedClaimId);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo actualizar el estado del participante.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Participante actualizado.",
  };
}

export async function markMissionRewardDelivered(claimId: string) {
  const normalizedClaimId = claimId.trim();

  if (!normalizedClaimId) {
    return {
      status: "error" as const,
      message: "Selecciona una toma de mision valida.",
    };
  }

  const { error } = await supabase
    .from("realm_mission_claims")
    .update({
      status: "rewarded",
      reward_delivered: true,
      reward_delivered_at: new Date().toISOString(),
    })
    .eq("id", normalizedClaimId);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "El oro se actualizo, pero no se pudo marcar la recompensa como entregada.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Recompensa marcada como entregada.",
  };
}

export function getMissionDifficultyLabel(difficulty: MissionDifficulty) {
  const labels: Record<MissionDifficulty, string> = {
    easy: "Facil",
    medium: "Media",
    hard: "Dificil",
    elite: "Elite",
  };

  return labels[difficulty];
}

export function getMissionStatusLabel(status: MissionStatus) {
  const labels: Record<MissionStatus, string> = {
    available: "Disponible",
    "in-progress": "En curso",
    closed: "Cerrada",
  };

  return labels[status];
}

export function getMissionTypeLabel(type: MissionType) {
  const labels: Record<MissionType, string> = {
    story: "Historia",
    hunt: "Caceria",
    escort: "Escolta",
    investigation: "Investigacion",
    event: "Evento",
  };

  return labels[type];
}

export function getMissionClaimStatusLabel(status: RealmMissionClaimStatus) {
  const labels: Record<RealmMissionClaimStatus, string> = {
    claimed: "Tomada",
    completed: "Completada",
    rewarded: "Pagada",
  };

  return labels[status];
}
