import { readGeminiConfig, requestGeminiJson } from "./_gemini";

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

function parseJsonPayload(rawText: string): MissionAiPayload {
  const sanitized = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(sanitized) as MissionAiPayload;
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
    const parsedPayload = await requestGeminiJson<MissionAiPayload>({
      prompt: getPrompt(normalizedInput),
      apiKeys: geminiApiKeys,
      model: geminiModel,
    });
    const normalizedPayload = normalizeMissionPayload(
      parsedPayload,
      normalizedInput
    );

    return res.status(200).json(normalizedPayload);
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? `No se pudo generar la mision con IA. ${error.message}`
          : "No se pudo generar la mision con IA.",
    });
  }
}
