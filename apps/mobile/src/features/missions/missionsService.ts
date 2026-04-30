import type {
  MissionDifficulty,
  MissionStatus,
  MissionType,
  RealmMission,
  RealmMissionClaim,
  RealmMissionClaimStatus,
} from "@/src/features/shared/types";
import { supabase, supabaseConfigError } from "@/src/services/supabase";

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
};

type RealmMissionClaimRow = {
  id: string;
  mission_id: string;
  player_id: string;
  status: RealmMissionClaimStatus;
  reward_delivered: boolean;
  proof_text?: string | null;
  submitted_at?: string | null;
  reward_delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type MissionMetaRow = {
  id: string;
  status: MissionStatus;
  max_participants: number | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSupabaseMissionId(value?: string) {
  return Boolean(value && UUID_PATTERN.test(value.trim()));
}

function mapMission(row: RealmMissionRow): RealmMission {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    rewardGold: Number(row.reward_gold ?? 0),
    maxParticipants: Number(row.max_participants ?? 1),
    difficulty: row.difficulty,
    type: row.type,
    status: row.status,
    visible: row.visible,
  };
}

function mapMissionClaim(row: RealmMissionClaimRow): RealmMissionClaim {
  return {
    id: row.id,
    missionId: row.mission_id,
    playerId: row.player_id,
    status: row.status,
    rewardDelivered: row.reward_delivered,
    proofText: row.proof_text?.trim() ?? "",
    submittedAt: row.submitted_at ?? null,
    rewardDeliveredAt: row.reward_delivered_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchMissionsNative() {
  if (!supabase) {
    return { missions: [] as RealmMission[], errorMessage: supabaseConfigError };
  }

  const { data, error } = await supabase
    .from("realm_missions")
    .select(
      "id, title, description, instructions, reward_gold, max_participants, difficulty, type, status, visible"
    )
    .eq("visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      missions: [] as RealmMission[],
      errorMessage: "No se pudieron cargar las misiones desde Supabase.",
    };
  }

  return {
    missions: ((data ?? []) as RealmMissionRow[]).map(mapMission),
    errorMessage: "",
  };
}

export async function fetchPlayerMissionClaimsNative(
  playerId: string,
  missionIds: string[]
) {
  if (!supabase) {
    return {
      claimsByMissionId: {} as Record<string, RealmMissionClaim>,
      errorMessage: supabaseConfigError,
    };
  }

  const normalizedPlayerId = playerId.trim();
  const normalizedMissionIds = missionIds
    .map((id) => id.trim())
    .filter(isSupabaseMissionId);

  if (!normalizedPlayerId || normalizedMissionIds.length === 0) {
    return {
      claimsByMissionId: {} as Record<string, RealmMissionClaim>,
      errorMessage: "",
    };
  }

  const { data, error } = await supabase
    .from("realm_mission_claims")
    .select(
      "id, mission_id, player_id, status, reward_delivered, proof_text, submitted_at, reward_delivered_at, created_at, updated_at"
    )
    .eq("player_id", normalizedPlayerId)
    .in("mission_id", normalizedMissionIds);

  if (error || !data) {
    return {
      claimsByMissionId: {} as Record<string, RealmMissionClaim>,
      errorMessage: "No se pudo leer tu estado de misiones.",
    };
  }

  const claimsByMissionId = (data as RealmMissionClaimRow[]).reduce<
    Record<string, RealmMissionClaim>
  >((acc, row) => {
    const claim = mapMissionClaim(row);
    acc[claim.missionId] = claim;
    return acc;
  }, {});

  return { claimsByMissionId, errorMessage: "" };
}

export async function claimRealmMissionNative(missionId: string, playerId: string) {
  if (!supabase) {
    return { status: "error" as const, message: supabaseConfigError };
  }

  const normalizedMissionId = missionId.trim();
  const normalizedPlayerId = playerId.trim();

  if (!isSupabaseMissionId(normalizedMissionId) || !normalizedPlayerId) {
    return { status: "error" as const, message: "Faltan datos para tomar la mision." };
  }

  const { data: missionMeta, error: missionMetaError } = await supabase
    .from("realm_missions")
    .select("id, status, max_participants")
    .eq("id", normalizedMissionId)
    .maybeSingle();

  if (missionMetaError || !missionMeta) {
    return { status: "error" as const, message: "No se pudo validar la mision." };
  }

  const missionState = missionMeta as MissionMetaRow;

  if (missionState.status === "closed") {
    return {
      status: "error" as const,
      message: "La mision ya esta cerrada.",
    };
  }

  const { count, error: countError } = await supabase
    .from("realm_mission_claims")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", normalizedMissionId);

  if (countError) {
    return { status: "error" as const, message: "No se pudo validar el cupo." };
  }

  const maxParticipants = Math.max(1, missionState.max_participants ?? 1);

  if ((count ?? 0) >= maxParticipants) {
    return {
      status: "full" as const,
      message: "La mision ya alcanzo el cupo maximo.",
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
      message: "Postulacion enviada.",
    };
  }

  if (error.code === "23505") {
    return {
      status: "exists" as const,
      message: "Ya tomaste esta mision.",
    };
  }

  return {
    status: "error" as const,
    message: "No se pudo tomar la mision.",
  };
}

export async function submitMissionEvidenceNative(
  claimId: string,
  playerId: string,
  proofText: string
) {
  if (!supabase) {
    return { status: "error" as const, message: supabaseConfigError };
  }

  const normalizedClaimId = claimId.trim();
  const normalizedPlayerId = playerId.trim();
  const normalizedProof = proofText.trim();

  if (!normalizedClaimId || !normalizedPlayerId) {
    return { status: "error" as const, message: "Faltan datos para enviar evidencia." };
  }

  if (!normalizedProof) {
    return { status: "error" as const, message: "Escribe un resumen de evidencia." };
  }

  const { error } = await supabase
    .from("realm_mission_claims")
    .update({
      status: "completed",
      proof_text: normalizedProof,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", normalizedClaimId)
    .eq("player_id", normalizedPlayerId);

  if (error) {
    return { status: "error" as const, message: "No se pudo guardar la evidencia." };
  }

  return {
    status: "saved" as const,
    message: "Evidencia enviada para revision.",
  };
}

export function getMissionClaimStatusLabel(status: RealmMissionClaimStatus) {
  const labels: Record<RealmMissionClaimStatus, string> = {
    claimed: "Postulado",
    completed: "Pendiente",
    rewarded: "Aprobada",
  };

  return labels[status];
}
