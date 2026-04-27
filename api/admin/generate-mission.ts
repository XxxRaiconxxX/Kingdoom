import {
  readGeminiConfig,
  readGroqConfig,
  readNvidiaConfig,
  requestAiJsonWithFallback,
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
  hasTextGenerationProvider,
} from "./_serverAiProviders.js";

type CombatStyle = "yes" | "no" | "optional";
type MissionType = "story" | "hunt" | "escort" | "investigation" | "event";
type MissionDifficulty = "easy" | "medium" | "hard" | "elite";

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

  const gemini = readGeminiConfig();
  const groq = readGroqConfig();
  const nvidia = readNvidiaConfig();

  if (!hasTextGenerationProvider(gemini, groq, nvidia)) {
    return res.status(500).json({
      message:
        "Falta GEMINI_API_KEYS/GEMINI_API_KEY, GROQ_API_KEYS/GROQ_API_KEY o NVIDIA_API_KEYS/NVIDIA_API_KEY en el backend. Configuralas en Vercel antes de usar el generador.",
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
    const result = await requestAiJsonWithFallback<MissionAiPayload>({
      prompt: getPrompt(normalizedInput),
      gemini,
      groq,
      nvidia,
      temperature: 0.95,
      topP: 0.9,
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
