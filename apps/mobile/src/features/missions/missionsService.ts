import type { MissionDifficulty, MissionStatus, MissionType, RealmMission } from "@/src/features/shared/types";
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
