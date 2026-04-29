import type { AiDebugInfo } from "./aiDebug";

export type StaffAdvisorTaskType =
  | "mission"
  | "event"
  | "reward"
  | "lore"
  | "market"
  | "general";

export type StaffAdvisorResult = {
  summary: string;
  riskLevel: "low" | "medium" | "high";
  recommendedRewardGold: number;
  recommendedDifficulty: "easy" | "medium" | "hard" | "elite";
  recommendedParticipants: { min: number; max: number };
  validationChecklist: string[];
  staffNotes: string[];
  playerFacingBrief: string;
};

type StaffAdvisorResponse =
  | {
      status: "ready";
      result: StaffAdvisorResult;
      debug?: AiDebugInfo | null;
    }
  | { status: "error"; message: string; debug?: AiDebugInfo | null };

function getStaffAdvisorEndpoint() {
  const configured = import.meta.env.VITE_STAFF_AI_API_URL as string | undefined;

  if (configured?.trim()) {
    return configured.trim();
  }

  const missionEndpoint = import.meta.env.VITE_MISSION_AI_API_URL as
    | string
    | undefined;

  if (missionEndpoint?.trim()) {
    return missionEndpoint
      .trim()
      .replace(/\/generate-mission$/, "/advise-staff");
  }

  if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
    return "https://kingdoom.vercel.app/api/admin/advise-staff";
  }

  return "/api/admin/advise-staff";
}

export async function requestStaffAdvice(input: {
  taskType: StaffAdvisorTaskType;
  title: string;
  description: string;
  participants: number;
  difficulty: string;
  rewardGold: number;
  constraints: string;
  includeDebug?: boolean;
}): Promise<StaffAdvisorResponse> {
  const response = await fetch(getStaffAdvisorEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      status: "error",
      message:
        payload?.message ??
        "No se pudo consultar al Asistente de staff. Revisa el endpoint.",
      debug: payload?.debug ?? null,
    };
  }

  const result = payload?.result;

  if (!result || typeof result !== "object") {
    return {
      status: "error",
      message:
        "La IA respondio sin estructura valida para el Asistente de staff. Intenta otra vez.",
      debug: payload?.debug ?? null,
    };
  }

  return {
    status: "ready",
    result: {
      summary:
        typeof result.summary === "string" && result.summary.trim()
          ? result.summary
          : "Analisis listo para revision del staff.",
      riskLevel:
        result.riskLevel === "high" || result.riskLevel === "medium"
          ? result.riskLevel
          : "low",
      recommendedRewardGold: Number(result.recommendedRewardGold) || 0,
      recommendedDifficulty:
        result.recommendedDifficulty === "elite" ||
        result.recommendedDifficulty === "hard" ||
        result.recommendedDifficulty === "medium"
          ? result.recommendedDifficulty
          : "easy",
      recommendedParticipants: {
        min: Math.max(1, Number(result.recommendedParticipants?.min) || 1),
        max: Math.max(1, Number(result.recommendedParticipants?.max) || 1),
      },
      validationChecklist: Array.isArray(result.validationChecklist)
        ? result.validationChecklist.slice(0, 5)
        : [],
      staffNotes: Array.isArray(result.staffNotes)
        ? result.staffNotes.slice(0, 5)
        : [],
      playerFacingBrief:
        typeof result.playerFacingBrief === "string"
          ? result.playerFacingBrief
          : "",
    },
    debug: payload?.debug ?? null,
  };
}
