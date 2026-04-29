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

  return {
    status: "ready",
    result: payload?.result,
    debug: payload?.debug ?? null,
  };
}
