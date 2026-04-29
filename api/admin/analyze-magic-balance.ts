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
  buildMagicBalancePrompt,
  normalizeMagicBalanceMode,
  type MagicBalanceMode,
} from "./_aiPrompts.js";

type AbilityLevel = {
  level: number;
  name: string;
  effect: string;
  cd: string;
  limit: string;
  antiManoNegra: string;
};

type MagicBalanceRequest = {
  mode?: MagicBalanceMode;
  focus?: string;
  categoryTitle?: string;
  title?: string;
  description?: string;
  levels?: Record<number, AbilityLevel[]>;
  includeDebug?: boolean;
};

type MagicBalanceResponse = {
  summary: string;
  recommendation: "maintain" | "buff" | "nerf" | "improve";
  scores: {
    abuseRisk: number;
    narrativeUtility: number;
    clarity: number;
    powerCurve: number;
  };
  risks: string[];
  levelAdjustments: Array<{ level: string; suggestion: string }>;
  suggestedDraftText: string;
  verdict: string;
};

function clampScore(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 5;
  return Math.max(1, Math.min(10, Math.round(numericValue)));
}

function normalizeBalancePayload(payload: Partial<MagicBalanceResponse>) {
  return {
    summary: payload.summary?.trim() || "Analisis sin resumen.",
    recommendation:
      payload.recommendation === "buff" ||
      payload.recommendation === "nerf" ||
      payload.recommendation === "improve"
        ? payload.recommendation
        : "maintain",
    scores: {
      abuseRisk: clampScore(payload.scores?.abuseRisk),
      narrativeUtility: clampScore(payload.scores?.narrativeUtility),
      clarity: clampScore(payload.scores?.clarity),
      powerCurve: clampScore(payload.scores?.powerCurve),
    },
    risks: Array.isArray(payload.risks)
      ? payload.risks.map((risk) => String(risk).trim()).filter(Boolean).slice(0, 5)
      : [],
    levelAdjustments: Array.isArray(payload.levelAdjustments)
      ? payload.levelAdjustments
          .map((entry) => ({
            level: String(entry.level ?? "").trim() || "Lv?",
            suggestion: String(entry.suggestion ?? "").trim(),
          }))
          .filter((entry) => entry.suggestion)
          .slice(0, 5)
      : [],
    suggestedDraftText: payload.suggestedDraftText?.trim() || "",
    verdict: payload.verdict?.trim() || "Revisar manualmente antes de guardar.",
  };
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

  const body = (req.body ?? {}) as MagicBalanceRequest;
  const includeDebug = body.includeDebug === true;
  const title = body.title?.trim() || "Magia sin nombre";

  if (!body.description?.trim() && !body.levels) {
    return res.status(400).json({
      message: "Selecciona una magia o carga sus niveles antes de analizar.",
    });
  }

  try {
    const result = await runAiJson<MagicBalanceResponse>({
      prompt: buildMagicBalancePrompt({
        mode: normalizeMagicBalanceMode(body.mode),
        focus: body.focus?.trim() || "",
        categoryTitle: body.categoryTitle?.trim() || "General",
        title,
        description: body.description?.trim() || "Sin fundamento cargado.",
        levels: body.levels ?? {},
      }),
      temperature: 0.45,
      topP: 0.82,
      config: aiConfig,
    });

    return res.status(200).json({
      ...normalizeBalancePayload(result.data),
      ...(includeDebug ? { debug: result.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo analizar la magia con IA. ${
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
