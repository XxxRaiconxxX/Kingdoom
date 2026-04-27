type CombatStyle = "yes" | "no" | "optional";
type MissionType = "story" | "hunt" | "escort" | "investigation" | "event";
type MissionDifficulty = "easy" | "medium" | "hard" | "elite";

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (payload: unknown) => void;
    end: () => void;
  };
};

type MissionAiRequest = {
  type?: MissionType;
  difficulty?: MissionDifficulty;
  recommendedPlayers?: number;
  maxParticipants?: number;
  rewardGold?: number;
  zone?: string;
  faction?: string;
  tone?: string;
  restriction?: string;
  combatStyle?: CombatStyle;
  theme?: string;
  includeDebug?: boolean;
};

type MissionAiPayload = {
  mission: {
    title: string;
    description: string;
    instructions: string;
    rewardGold: number;
    maxParticipants: number;
    difficulty: MissionDifficulty;
    type: MissionType;
    status: "available";
    visible: true;
  };
  publicBrief?: {
    subtitle?: string;
    narrativeHook?: string;
    mainObjective?: string;
    dangers?: string;
    closingLine?: string;
  };
  promptSummary?: string;
};

type GeminiAttemptDebug = {
  keyIndex: number;
  status: "success" | "quota-fallback" | "error";
  reason: string;
};

type GeminiDebugInfo = {
  model: string;
  totalKeysConfigured: number;
  keyIndexUsed: number | null;
  fallbackUsed: boolean;
  quotaFailures: number;
  remainingKeysAfterSuccess: number;
  exhaustedByQuota: boolean;
  attempts: GeminiAttemptDebug[];
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://xxxraiconxxx.github.io",
  "https://kingdoom.vercel.app",
];

function getAllowedOrigin(requestOrigin?: string) {
  const configuredOrigins = process.env.MISSION_AI_ALLOWED_ORIGINS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const origins = configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;

  if (!requestOrigin) {
    return origins[0] ?? "*";
  }

  if (origins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return origins[0] ?? "*";
}

function setCorsHeaders(req: ApiRequest, res: ApiResponse) {
  const allowedOrigin = getAllowedOrigin(req.headers.origin);
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readGeminiConfig() {
  const geminiApiKeys = [
    ...(process.env.GEMINI_API_KEYS ?? "")
      .split(/[\n,]/g)
      .map((value) => value.trim())
      .filter(Boolean),
    ...(process.env.GEMINI_API_KEY?.trim()
      ? [process.env.GEMINI_API_KEY.trim()]
      : []),
  ];
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  return { geminiApiKeys, geminiModel };
}

function isQuotaLikeError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("too many requests") ||
    normalized.includes("retry in")
  );
}

async function parseGeminiError(response: any) {
  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return (
    payload?.error?.message ||
    payload?.message ||
    `Gemini respondio con estado ${response.status}.`
  );
}

function extractTextFromGeminiResponse(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

async function requestGeminiJson<T>(input: {
  prompt: string;
  apiKeys: string[];
  model: string;
}) {
  if (!input.apiKeys.length) {
    throw new Error(
      "Falta GEMINI_API_KEY o GEMINI_API_KEYS en el backend."
    );
  }

  let lastError = "Gemini no respondio correctamente a la peticion JSON.";
  const attempts: GeminiAttemptDebug[] = [];

  const buildDebug = (
    keyIndexUsed: number | null,
    exhaustedByQuota: boolean
  ): GeminiDebugInfo => {
    const quotaFailures = attempts.filter(
      (attempt) => attempt.status === "quota-fallback"
    ).length;

    return {
      model: input.model,
      totalKeysConfigured: input.apiKeys.length,
      keyIndexUsed,
      fallbackUsed:
        quotaFailures > 0 || (keyIndexUsed !== null && keyIndexUsed > 1),
      quotaFailures,
      remainingKeysAfterSuccess:
        keyIndexUsed === null
          ? 0
          : Math.max(0, input.apiKeys.length - keyIndexUsed),
      exhaustedByQuota,
      attempts,
    };
  };

  for (let index = 0; index < input.apiKeys.length; index += 1) {
    const apiKey = input.apiKeys[index];
    const keyIndex = index + 1;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.95,
            topP: 0.9,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (response.ok) {
      const payload = await response.json();
      const rawText = extractTextFromGeminiResponse(payload);

      if (!rawText) {
        attempts.push({
          keyIndex,
          status: "error",
          reason: "Gemini respondio sin texto util.",
        });
        throw {
          message: "Gemini respondio sin texto util.",
          debug: buildDebug(null, false),
        };
      }

      const sanitized = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {
        const data = JSON.parse(sanitized) as T;

        attempts.push({
          keyIndex,
          status: "success",
          reason: "Respuesta valida.",
        });

        return {
          data,
          debug: buildDebug(keyIndex, false),
        };
      } catch {
        attempts.push({
          keyIndex,
          status: "error",
          reason: "Gemini devolvio JSON invalido.",
        });
        throw {
          message: "Gemini devolvio JSON invalido.",
          debug: buildDebug(null, false),
        };
      }
    }

    const errorMessage = await parseGeminiError(response);
    lastError = errorMessage;

    if (index < input.apiKeys.length - 1 && isQuotaLikeError(errorMessage)) {
      attempts.push({
        keyIndex,
        status: "quota-fallback",
        reason: errorMessage,
      });
      continue;
    }

    attempts.push({
      keyIndex,
      status: "error",
      reason: errorMessage,
    });

    throw {
      message: errorMessage,
      debug: buildDebug(null, isQuotaLikeError(errorMessage)),
    };
  }

  throw {
    message: lastError,
    debug: buildDebug(null, true),
  };
}

function clampParticipants(value: unknown, fallback: number, min = 1, max = 8) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(numericValue)));
}

function clampReward(value: unknown, fallback: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.max(100, Math.min(25000, Math.floor(numericValue)));
}

function normalizeType(value?: string): MissionType {
  if (
    value === "story" ||
    value === "hunt" ||
    value === "escort" ||
    value === "investigation" ||
    value === "event"
  ) {
    return value;
  }

  return "story";
}

function normalizeDifficulty(value?: string): MissionDifficulty {
  if (
    value === "easy" ||
    value === "medium" ||
    value === "hard" ||
    value === "elite"
  ) {
    return value;
  }

  return "medium";
}

function getFallbackReward(difficulty: MissionDifficulty) {
  switch (difficulty) {
    case "easy":
      return 900;
    case "medium":
      return 1800;
    case "hard":
      return 3200;
    case "elite":
      return 5000;
    default:
      return 1800;
  }
}

function getPrompt(input: Required<MissionAiRequest>) {
  return `
Actua como diseñador senior de misiones para Kingdoom.

Debes crear UNA mision premium, jugable por rol de WhatsApp y lista para cargarse en un panel admin.

CONTEXTO DEL SISTEMA
- Mundo: fantasia oscura medieval, intriga politica, facciones, mercado negro, peligro narrativo.
- La mision debe poder validarse manualmente por staff.
- La recompensa principal es oro.
- El resultado debe servir para copiarse a un panel web.
- No escribas explicaciones, solo JSON valido.

PARAMETROS DE ESTA MISION
- type: ${input.type}
- difficulty: ${input.difficulty}
- recommendedPlayers: ${input.recommendedPlayers}
- maxParticipants: ${input.maxParticipants}
- rewardGold objetivo: ${input.rewardGold}
- zone: ${input.zone}
- faction: ${input.faction}
- tone: ${input.tone}
- restriction: ${input.restriction}
- combatStyle: ${input.combatStyle}
- theme: ${input.theme}

REGLAS
- El titulo debe ser memorable, oscuro y util.
- description debe ser inmersiva, clara y visible al jugador.
- instructions debe servir al staff para entender como se valida en WhatsApp.
- No uses texto vacio ni relleno.
- No metas mecanicas inexistentes.
- Ajusta recompensa, cupo y tono a la dificultad.
- Si la dificultad es elite, debe sentirse seria, peligrosa y de alto impacto.
- El contenido debe sonar como mision oficial de Kingdoom.

FORMATO DE RESPUESTA
Responde SOLO con un objeto JSON valido, sin markdown, sin comentarios y sin comillas triples.

Usa exactamente esta estructura:
{
  "mission": {
    "title": "string",
    "description": "string",
    "instructions": "string",
    "rewardGold": 0,
    "maxParticipants": 1,
    "difficulty": "easy|medium|hard|elite",
    "type": "story|hunt|escort|investigation|event",
    "status": "available",
    "visible": true
  },
  "publicBrief": {
    "subtitle": "string",
    "narrativeHook": "string",
    "mainObjective": "string",
    "dangers": "string",
    "closingLine": "string"
  },
  "promptSummary": "string"
}
`.trim();
}

function normalizeMissionPayload(
  payload: MissionAiPayload,
  defaults: Required<MissionAiRequest>
): MissionAiPayload {
  const mission = payload.mission;

  return {
    mission: {
      title: mission?.title?.trim() || "Mision sin titulo",
      description:
        mission?.description?.trim() ||
        "Una operacion del reino espera validacion del staff.",
      instructions:
        mission?.instructions?.trim() ||
        "Resolver por rol en WhatsApp. Un admin valida el cierre.",
      rewardGold: clampReward(mission?.rewardGold, defaults.rewardGold),
      maxParticipants: clampParticipants(
        mission?.maxParticipants,
        defaults.maxParticipants
      ),
      difficulty: normalizeDifficulty(mission?.difficulty),
      type: normalizeType(mission?.type),
      status: "available",
      visible: true,
    },
    publicBrief: payload.publicBrief ?? {},
    promptSummary: payload.promptSummary?.trim() || "",
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

  const { geminiApiKeys, geminiModel } = readGeminiConfig();

  if (!geminiApiKeys.length) {
    return res.status(500).json({
      message:
        "Falta GEMINI_API_KEY o GEMINI_API_KEYS en el backend. Configuralas en Vercel antes de usar el generador.",
    });
  }

  const body = (req.body ?? {}) as MissionAiRequest;
  const includeDebug = body.includeDebug === true;
  const difficulty = normalizeDifficulty(body.difficulty);
  const normalizedInput: Required<MissionAiRequest> = {
    type: normalizeType(body.type),
    difficulty,
    recommendedPlayers: clampParticipants(body.recommendedPlayers, 1),
    maxParticipants: clampParticipants(
      body.maxParticipants,
      Math.max(1, clampParticipants(body.recommendedPlayers, 1))
    ),
    rewardGold: clampReward(body.rewardGold, getFallbackReward(difficulty)),
    zone: body.zone?.trim() || "frontera bajo tension",
    faction: body.faction?.trim() || "una faccion menor del reino",
    tone: body.tone?.trim() || "fantasia oscura politica",
    restriction:
      body.restriction?.trim() || "Debe poder resolverse por rol en WhatsApp.",
    combatStyle: body.combatStyle ?? "optional",
    theme: body.theme?.trim() || "intriga, riesgo y recompensa",
  };

  try {
    const result = await requestGeminiJson<MissionAiPayload>({
      prompt: getPrompt(normalizedInput),
      apiKeys: geminiApiKeys,
      model: geminiModel,
    });
    const normalizedPayload = normalizeMissionPayload(
      result.data,
      normalizedInput
    );

    return res.status(200).json({
      ...normalizedPayload,
      ...(includeDebug ? { debug: result.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo generar la mision con IA. ${
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
