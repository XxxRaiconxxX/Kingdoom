import { FALLBACK_MISSIONS } from "../data/missions";
import type {
  MissionDifficulty,
  MissionStatus,
  MissionType,
  RealmMission,
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
