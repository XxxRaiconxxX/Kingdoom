import type { MissionDifficulty, MissionType, RealmMission } from "../types";
import type { AiDebugInfo } from "./aiDebug";

export type MissionAiRequest = {
  type?: MissionType;
  difficulty?: MissionDifficulty;
  recommendedPlayers?: number;
  maxParticipants?: number;
  rewardGold?: number;
  zone?: string;
  faction?: string;
  tone?: string;
  restriction?: string;
  combatStyle?: "yes" | "no" | "optional";
  theme?: string;
  includeDebug?: boolean;
};

export type MissionAiResponse = {
  mission: Pick<
    RealmMission,
    | "title"
    | "description"
    | "instructions"
    | "rewardGold"
    | "maxParticipants"
    | "difficulty"
    | "type"
    | "status"
    | "visible"
  >;
  publicBrief?: {
    subtitle?: string;
    narrativeHook?: string;
    mainObjective?: string;
    dangers?: string;
    closingLine?: string;
  };
  promptSummary?: string;
  debug?: AiDebugInfo;
};

function resolveMissionAiEndpoint() {
  const configuredUrl = import.meta.env.VITE_MISSION_AI_API_URL?.trim();
  return configuredUrl || "/api/admin/generate-mission";
}

export async function generateMissionWithAi(input: MissionAiRequest) {
  const endpoint = resolveMissionAiEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        mission?: MissionAiResponse["mission"];
        publicBrief?: MissionAiResponse["publicBrief"];
        promptSummary?: string;
        debug?: AiDebugInfo;
        message?: string;
      }
    | null;

  if (!response.ok || !payload?.mission) {
    return {
      status: "error" as const,
      message:
        payload?.message ||
        "No se pudo generar la mision con IA. Revisa la configuracion del endpoint.",
      mission: null,
      publicBrief: null,
      promptSummary: "",
      debug: payload?.debug ?? null,
    };
  }

  return {
    status: "ready" as const,
    message: "Mision generada por IA. Revisa el texto y guardala si te convence.",
    mission: payload.mission,
    publicBrief: payload.publicBrief ?? null,
    promptSummary: payload.promptSummary ?? "",
    debug: payload.debug ?? null,
  };
}
