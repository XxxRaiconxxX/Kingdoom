import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "./_serverAiProviders.js";
import {
  ensureAiProvider,
  missingAiProviderMessage,
  readAiServerConfig,
  runAiJson,
} from "./_aiOrchestrator.js";
import {
  buildStaffAdvisorPrompt,
  normalizeStaffAdvisorTaskType,
  type StaffAdvisorTaskType,
} from "./_aiPrompts.js";
import {
  getCachedAiResponse,
  setCachedAiResponse,
  stableCacheKey,
} from "./_aiCache.js";

type StaffAdvisorResult = {
  summary: string;
  riskLevel: "low" | "medium" | "high";
  recommendedRewardGold: number;
  recommendedDifficulty: "easy" | "medium" | "hard" | "elite";
  recommendedParticipants: { min: number; max: number };
  validationChecklist: string[];
  staffNotes: string[];
  playerFacingBrief: string;
};

function normalizeStaffAdvisorResult(
  value?: Partial<StaffAdvisorResult> | null
) {
  const safeValue =
    value && typeof value === "object"
      ? value
      : ({} as Partial<StaffAdvisorResult>);
  const riskLevel =
    safeValue.riskLevel === "high" || safeValue.riskLevel === "medium"
      ? safeValue.riskLevel
      : "low";
  const recommendedDifficulty =
    safeValue.recommendedDifficulty === "elite" ||
    safeValue.recommendedDifficulty === "hard" ||
    safeValue.recommendedDifficulty === "medium"
      ? safeValue.recommendedDifficulty
      : "easy";

  return {
    summary:
      safeValue.summary ||
      "Analisis listo para revision del staff. La IA no devolvio todos los campos y se completo una respuesta segura.",
    riskLevel,
    recommendedRewardGold: Number(safeValue.recommendedRewardGold) || 0,
    recommendedDifficulty,
    recommendedParticipants: {
      min: Math.max(1, Number(safeValue.recommendedParticipants?.min) || 1),
      max: Math.max(1, Number(safeValue.recommendedParticipants?.max) || 1),
    },
    validationChecklist: Array.isArray(safeValue.validationChecklist)
      ? safeValue.validationChecklist.slice(0, 5)
      : [],
    staffNotes: Array.isArray(safeValue.staffNotes)
      ? safeValue.staffNotes.slice(0, 5)
      : [],
    playerFacingBrief: safeValue.playerFacingBrief || "",
  } satisfies StaffAdvisorResult;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  const aiConfig = readAiServerConfig();

  if (!ensureAiProvider(aiConfig)) {
    return res.status(500).json({
      message: missingAiProviderMessage(),
    });
  }

  const body = (req.body ?? {}) as {
    taskType?: StaffAdvisorTaskType;
    title?: string;
    description?: string;
    participants?: number;
    difficulty?: string;
    rewardGold?: number;
    constraints?: string;
    includeDebug?: boolean;
  };
  const taskType = normalizeStaffAdvisorTaskType(body.taskType);
  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const constraints = body.constraints?.trim() ?? "";
  const participants = Number(body.participants) || 0;
  const rewardGold = Number(body.rewardGold) || 0;
  const difficulty = body.difficulty?.trim() ?? "";
  const includeDebug = body.includeDebug === true;

  if (!title && !description) {
    return res.status(400).json({
      message: "Describe la decision que el staff quiere revisar.",
    });
  }

  try {
    const cacheKey = stableCacheKey([
      "staff-advisor",
      taskType,
      title,
      description,
      participants,
      difficulty,
      rewardGold,
      constraints,
    ]);
    const cached = getCachedAiResponse<StaffAdvisorResult>(cacheKey);

    if (cached && !includeDebug) {
      return res.status(200).json({ result: cached });
    }

    const aiResult = await runAiJson<Partial<StaffAdvisorResult>>({
      prompt: buildStaffAdvisorPrompt({
        taskType,
        title,
        description,
        participants,
        difficulty,
        rewardGold,
        constraints,
      }),
      temperature: 0.32,
      topP: 0.82,
      config: aiConfig,
    });
    const result = normalizeStaffAdvisorResult(aiResult.json);

    setCachedAiResponse(cacheKey, result, 8 * 60 * 1000);

    return res.status(200).json({
      result,
      ...(includeDebug ? { debug: aiResult.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo consultar al Asistente de staff. ${
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Error desconocido."
      }`,
      ...(includeDebug &&
      error &&
      typeof error === "object" &&
      "debug" in error
        ? { debug: error.debug }
        : {}),
    });
  }
}
