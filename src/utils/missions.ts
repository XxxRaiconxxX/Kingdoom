import { FALLBACK_MISSIONS } from "../data/missions";
import type {
  MissionDifficulty,
  RealmMissionClaimStatus,
  MissionStatus,
  MissionType,
  MissionReviewNotification,
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
  max_participants: number;
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
  proof_text?: string | null;
  proof_link?: string | null;
  proof_image_url?: string | null;
  proof_image_path?: string | null;
  submitted_at?: string | null;
  reward_delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
  players?: MissionClaimPlayerRow | MissionClaimPlayerRow[] | null;
};

type MissionMetaRow = {
  id: string;
  status: MissionStatus;
  max_participants: number | null;
};

type MissionNotificationRow = {
  id: string;
  mission_id: string;
  player_id: string;
  status: RealmMissionClaimStatus;
  reward_delivered: boolean;
  proof_text?: string | null;
  proof_link?: string | null;
  proof_image_url?: string | null;
  proof_image_path?: string | null;
  submitted_at?: string | null;
  players?: MissionClaimPlayerRow | MissionClaimPlayerRow[] | null;
  realm_missions?:
    | {
        title?: string | null;
      }
    | Array<{
        title?: string | null;
      }>
    | null;
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
  maxParticipants: number;
  difficulty: MissionDifficulty;
  type: MissionType;
  status: MissionStatus;
  visible: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MISSION_EVIDENCE_BUCKET = "mission-evidence";

export function isSupabaseMissionId(value?: string) {
  return Boolean(value && UUID_PATTERN.test(value.trim()));
}

function mapRealmMissionRow(row: RealmMissionRow): RealmMission {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    rewardGold: row.reward_gold,
    maxParticipants: Math.max(1, row.max_participants ?? 1),
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
    max_participants: Math.max(1, Math.floor(input.maxParticipants)),
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

function getMissionTitleFromRelation(
  row: MissionNotificationRow
): string | null {
  const relation = row.realm_missions;

  if (Array.isArray(relation)) {
    return relation[0]?.title?.trim() || null;
  }

  if (relation && typeof relation === "object") {
    return relation.title?.trim() || null;
  }

  return null;
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? parts.pop() : "jpg";
  return (extension || "jpg").toLowerCase();
}

async function uploadMissionEvidenceImage(input: {
  playerId: string;
  missionId: string;
  file: File;
}) {
  const fileExtension = getFileExtension(input.file.name);
  const path = `${input.playerId}/${input.missionId}/${crypto.randomUUID()}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(MISSION_EVIDENCE_BUCKET)
    .upload(path, input.file, {
      upsert: true,
      contentType: input.file.type || undefined,
    });

  if (uploadError) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo subir la imagen de evidencia. Verifica el bucket mission-evidence en Supabase Storage.",
        uploadError.message
      ),
      imageUrl: "",
      imagePath: "",
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from(MISSION_EVIDENCE_BUCKET)
    .getPublicUrl(path);

  return {
    status: "saved" as const,
    message: "",
    imageUrl: publicUrlData.publicUrl,
    imagePath: path,
  };
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
    proofText: row.proof_text?.trim() ?? "",
    proofLink: row.proof_link?.trim() ?? "",
    proofImageUrl: row.proof_image_url?.trim() ?? "",
    proofImagePath: row.proof_image_path?.trim() ?? "",
    submittedAt: row.submitted_at ?? null,
    rewardDeliveredAt: row.reward_delivered_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchPublicRealmMissions(): Promise<RealmMissionsState> {
  const { data, error } = await supabase
    .from("realm_missions")
    .select(
      "id, title, description, instructions, reward_gold, max_participants, difficulty, type, status, visible, created_at, updated_at"
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
      "id, title, description, instructions, reward_gold, max_participants, difficulty, type, status, visible, created_at, updated_at"
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

  if (!isSupabaseMissionId(normalizedMissionId)) {
    return {
      status: "ready" as const,
      message: "",
      claims: [] as RealmMissionClaim[],
    };
  }

  const { data, error } = await supabase
    .from("realm_mission_claims")
    .select(
      "id, mission_id, player_id, status, reward_delivered, proof_text, proof_link, proof_image_url, proof_image_path, submitted_at, reward_delivered_at, created_at, updated_at, players(username, gold)"
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

export async function fetchPlayerMissionClaims(
  playerId: string,
  missionIds: string[]
) {
  const normalizedPlayerId = playerId.trim();
  const normalizedMissionIds = missionIds
    .map((id) => id.trim())
    .filter((id) => isSupabaseMissionId(id));

  if (!normalizedPlayerId || normalizedMissionIds.length === 0) {
    return {
      status: "ready" as const,
      message: "",
      claimsByMissionId: {} as Record<string, RealmMissionClaim>,
    };
  }

  const { data, error } = await supabase
    .from("realm_mission_claims")
    .select(
      "id, mission_id, player_id, status, reward_delivered, proof_text, proof_link, proof_image_url, proof_image_path, submitted_at, reward_delivered_at, created_at, updated_at"
    )
    .eq("player_id", normalizedPlayerId)
    .in("mission_id", normalizedMissionIds);

  if (error || !data) {
    return {
      status: "error" as const,
      message:
        "No se pudo leer tu estado de misiones. Reintenta en unos segundos.",
      claimsByMissionId: {} as Record<string, RealmMissionClaim>,
    };
  }

  const claimsByMissionId = (data as RealmMissionClaimRow[]).reduce<
    Record<string, RealmMissionClaim>
  >((acc, row) => {
    const mapped = mapRealmMissionClaimRow(row);
    acc[mapped.missionId] = mapped;
    return acc;
  }, {});

  return {
    status: "ready" as const,
    message: "",
    claimsByMissionId,
  };
}

export async function submitMissionClaimEvidence(
  claimId: string,
  playerId: string,
  input: {
    proofText?: string;
    proofLink?: string;
    proofImageUrl?: string;
    proofImageFile?: File | null;
  }
) {
  const normalizedClaimId = claimId.trim();
  const normalizedPlayerId = playerId.trim();
  const proofText = input.proofText?.trim() ?? "";
  const proofLink = input.proofLink?.trim() ?? "";
  let proofImageUrl = input.proofImageUrl?.trim() ?? "";
  let proofImagePath = "";

  if (!normalizedClaimId || !normalizedPlayerId) {
    return {
      status: "error" as const,
      message: "Faltan datos para entregar la evidencia.",
    };
  }

  if (!proofText && !proofLink && !proofImageUrl && !input.proofImageFile) {
    return {
      status: "error" as const,
      message: "Agrega al menos un detalle de evidencia antes de enviar.",
    };
  }

  const { data: currentClaim, error: currentClaimError } = await supabase
    .from("realm_mission_claims")
    .select("id, mission_id, reward_delivered")
    .eq("id", normalizedClaimId)
    .eq("player_id", normalizedPlayerId)
    .maybeSingle();

  if (currentClaimError || !currentClaim) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se encontro tu postulacion para adjuntar evidencia.",
        currentClaimError?.message ?? "Postulacion no encontrada."
      ),
    };
  }

  if (currentClaim.reward_delivered) {
    return {
      status: "error" as const,
      message: "Esa mision ya fue pagada y no admite nuevos cambios.",
    };
  }

  if (input.proofImageFile) {
    const uploadResult = await uploadMissionEvidenceImage({
      playerId: normalizedPlayerId,
      missionId: currentClaim.mission_id,
      file: input.proofImageFile,
    });

    if (uploadResult.status === "error") {
      return {
        status: "error" as const,
        message: uploadResult.message,
      };
    }

    proofImageUrl = uploadResult.imageUrl;
    proofImagePath = uploadResult.imagePath;
  }

  const { error } = await supabase
    .from("realm_mission_claims")
    .update({
      status: "completed",
      proof_text: proofText,
      proof_link: proofLink,
      proof_image_url: proofImageUrl,
      proof_image_path: proofImagePath,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", normalizedClaimId)
    .eq("player_id", normalizedPlayerId);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo guardar la evidencia de la mision.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Evidencia enviada. Queda pendiente de validacion del staff.",
  };
}

export async function fetchPendingMissionReviews() {
  const { data, error } = await supabase
    .from("realm_mission_claims")
    .select(
      "id, mission_id, player_id, status, reward_delivered, proof_text, proof_link, proof_image_url, proof_image_path, submitted_at, players(username), realm_missions(title)"
    )
    .eq("status", "completed")
    .eq("reward_delivered", false)
    .order("submitted_at", { ascending: false });

  if (error || !data) {
    return {
      status: "error" as const,
      message:
        "No se pudieron cargar las notificaciones de misiones pendientes.",
      notifications: [] as MissionReviewNotification[],
    };
  }

  const notifications = (data as MissionNotificationRow[]).map((row) => {
    const player = getClaimPlayer(row);

    return {
      claimId: row.id,
      missionId: row.mission_id,
      missionTitle: getMissionTitleFromRelation(row) ?? "Mision",
      playerId: row.player_id,
      playerName: player?.username ?? "Jugador",
      submittedAt: row.submitted_at ?? null,
      proofText: row.proof_text?.trim() ?? "",
      proofLink: row.proof_link?.trim() ?? "",
      proofImageUrl: row.proof_image_url?.trim() ?? "",
      proofImagePath: row.proof_image_path?.trim() ?? "",
    };
  });

  return {
    status: "ready" as const,
    message: "",
    notifications,
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

  if (!isSupabaseMissionId(normalizedMissionId)) {
    return {
      status: "error" as const,
      message:
        "Esta mision es una plantilla local. Publicala desde el panel admin para poder tomarla.",
    };
  }

  const { data: missionMeta, error: missionMetaError } = await supabase
    .from("realm_missions")
    .select("id, status, max_participants")
    .eq("id", normalizedMissionId)
    .maybeSingle();

  if (missionMetaError || !missionMeta) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo validar la mision antes de tomarla.",
        missionMetaError?.message ?? "Mision no encontrada."
      ),
    };
  }

  const missionState = missionMeta as MissionMetaRow;

  if (missionState.status === "closed") {
    return {
      status: "error" as const,
      message: "La mision ya esta cerrada y no acepta nuevas postulaciones.",
    };
  }

  const { count, error: countError } = await supabase
    .from("realm_mission_claims")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", normalizedMissionId);

  if (countError) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo validar el cupo de la mision.",
        countError.message
      ),
    };
  }

  const maxParticipants = Math.max(1, missionState.max_participants ?? 1);
  const currentParticipants = count ?? 0;

  if (currentParticipants >= maxParticipants) {
    return {
      status: "full" as const,
      message: "La mision ya alcanzo el cupo maximo de participantes.",
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
      message: "Postulacion enviada. Cuando termines, entrega la evidencia.",
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

  const { data: claimData, error: claimDataError } = await supabase
    .from("realm_mission_claims")
    .select("proof_image_path")
    .eq("id", normalizedClaimId)
    .maybeSingle();

  if (claimDataError) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo leer la evidencia de la mision antes de cerrar.",
        claimDataError.message
      ),
    };
  }

  const proofImagePath = claimData?.proof_image_path?.trim() ?? "";

  if (proofImagePath) {
    const { error: removeError } = await supabase.storage
      .from(MISSION_EVIDENCE_BUCKET)
      .remove([proofImagePath]);

    if (removeError) {
      return {
        status: "error" as const,
        message: formatAdminPermissionMessage(
          "Se pago el oro, pero no se pudo borrar la imagen de evidencia.",
          removeError.message
        ),
      };
    }
  }

  const { error } = await supabase
    .from("realm_mission_claims")
    .update({
      status: "rewarded",
      reward_delivered: true,
      reward_delivered_at: new Date().toISOString(),
      proof_image_url: "",
      proof_image_path: "",
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
    claimed: "Postulado",
    completed: "Pendiente validar",
    rewarded: "Aprobada",
  };

  return labels[status];
}
