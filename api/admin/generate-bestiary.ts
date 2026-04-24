type BestiaryRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "legendary"
  | "calamity";

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

type BestiaryAiRequest = {
  name?: string;
  category?: string;
  type?: string;
  threatLevel?: string;
  domestication?: string;
  usage?: string;
  originPlace?: string;
  foundAt?: string;
  rarity?: BestiaryRarity;
  tone?: string;
};

type BestiaryAiResponse = {
  name: string;
  category: string;
  type: string;
  generalData: string;
  threatLevel: string;
  domestication: string;
  usage: string;
  originPlace: string;
  foundAt: string;
  description: string;
  ability: string;
  rarity: BestiaryRarity;
  imageUrl: string;
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

  for (let index = 0; index < input.apiKeys.length; index += 1) {
    const apiKey = input.apiKeys[index];
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
        throw new Error("Gemini respondio sin texto util.");
      }

      const sanitized = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      return JSON.parse(sanitized) as T;
    }

    const errorMessage = await parseGeminiError(response);
    lastError = errorMessage;

    if (index < input.apiKeys.length - 1 && isQuotaLikeError(errorMessage)) {
      continue;
    }

    throw new Error(errorMessage);
  }

  throw new Error(lastError);
}

function normalizeRarity(value?: string): BestiaryRarity {
  if (
    value === "common" ||
    value === "uncommon" ||
    value === "rare" ||
    value === "legendary" ||
    value === "calamity"
  ) {
    return value;
  }

  return "common";
}

function getPrompt(input: Required<BestiaryAiRequest>) {
  return `
Actua como worldbuilder senior y bestiary designer de Kingdoom.

Debes crear UNA ficha de bestiario completa, coherente, elegante y lista para cargarse en el panel admin.

CONTEXTO
- Fantasia oscura medieval.
- Tono serio, util y publicable.
- Debe sentirse parte de un reino vivo.
- Nada infantil ni generico.
- No expliques nada fuera del JSON.
- No inventes mecanicas raras ni textos redundantes.

PARAMETROS
- name: ${input.name}
- category: ${input.category}
- type: ${input.type}
- threatLevel: ${input.threatLevel}
- domestication: ${input.domestication}
- usage: ${input.usage}
- originPlace: ${input.originPlace}
- foundAt: ${input.foundAt}
- rarity: ${input.rarity}
- tone: ${input.tone}

REGLAS
- generalData debe venir bien estructurado en varias lineas claras.
- Usa campos como Tamano, Peso, Esperanza de vida, Habitat, Alimentacion y Comportamiento si aplican.
- description debe describir presencia, comportamiento, fisico y peligro sin exceso.
- ability debe resumir la capacidad mas distintiva o temida de la criatura.
- domestication debe ser coherente con su naturaleza.
- usage debe explicar utilidad en el mundo: guerra, montura, recursos, alquimia, forja, rituales o ninguna.
- imageUrl debe devolverse vacia.
- rarity debe ser una de estas: common, uncommon, rare, legendary, calamity.

RESPONDE SOLO CON JSON VALIDO usando exactamente esta forma:
{
  "name": "string",
  "category": "string",
  "type": "string",
  "generalData": "string",
  "threatLevel": "string",
  "domestication": "string",
  "usage": "string",
  "originPlace": "string",
  "foundAt": "string",
  "description": "string",
  "ability": "string",
  "rarity": "common|uncommon|rare|legendary|calamity",
  "imageUrl": ""
}
`.trim();
}

function normalizeEntry(
  entry: Partial<BestiaryAiResponse>,
  defaults: Required<BestiaryAiRequest>
): BestiaryAiResponse {
  return {
    name: entry.name?.trim() || defaults.name,
    category: entry.category?.trim() || defaults.category,
    type: entry.type?.trim() || defaults.type,
    generalData:
      entry.generalData?.trim() ||
      "Tamano: No definido.\nPeso: No definido.\nEsperanza de vida: No definida.\nHabitat: No definido.\nAlimentacion: No definida.\nComportamiento: No definido.",
    threatLevel: entry.threatLevel?.trim() || defaults.threatLevel,
    domestication: entry.domestication?.trim() || defaults.domestication,
    usage: entry.usage?.trim() || defaults.usage,
    originPlace: entry.originPlace?.trim() || defaults.originPlace,
    foundAt: entry.foundAt?.trim() || defaults.foundAt,
    description:
      entry.description?.trim() ||
      "Criatura del reino aun pendiente de una descripcion completa.",
    ability:
      entry.ability?.trim() ||
      "Su rasgo mas notable todavia no fue definido por el bestiario.",
    rarity: normalizeRarity(entry.rarity) || defaults.rarity,
    imageUrl: "",
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

  const body = (req.body ?? {}) as BestiaryAiRequest;
  const defaults: Required<BestiaryAiRequest> = {
    name: body.name?.trim() || "Criatura sin nombre",
    category: body.category?.trim() || "Bestia salvaje",
    type: body.type?.trim() || "Depredador desconocido",
    threatLevel: body.threatLevel?.trim() || "Media",
    domestication: body.domestication?.trim() || "No domesticable.",
    usage: body.usage?.trim() || "Sin uso definido en el mundo.",
    originPlace: body.originPlace?.trim() || "Fronteras del reino",
    foundAt: body.foundAt?.trim() || "Bosques, ruinas o territorios sin mapa",
    rarity: normalizeRarity(body.rarity),
    tone: body.tone?.trim() || "fantasia oscura medieval",
  };

  try {
    const parsedPayload = await requestGeminiJson<BestiaryAiResponse>({
      prompt: getPrompt(defaults),
      apiKeys: geminiApiKeys,
      model: geminiModel,
    });
    return res.status(200).json(normalizeEntry(parsedPayload, defaults));
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? `No se pudo generar la bestia con IA. ${error.message}`
          : "No se pudo generar la bestia con IA.",
    });
  }
}
