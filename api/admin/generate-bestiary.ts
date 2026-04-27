import {
  readGeminiConfig,
  readGroqConfig,
  requestAiJsonWithFallback,
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
  hasTextGenerationProvider,
} from "../../src/utils/serverAiProviders";

type BestiaryRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "legendary"
  | "calamity";

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
  includeDebug?: boolean;
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

  const gemini = readGeminiConfig();
  const groq = readGroqConfig();

  if (!hasTextGenerationProvider(gemini, groq)) {
    return res.status(500).json({
      message:
        "Falta GEMINI_API_KEYS/GEMINI_API_KEY o GROQ_API_KEYS/GROQ_API_KEY en el backend. Configuralas en Vercel antes de usar el generador.",
    });
  }

  const body = (req.body ?? {}) as BestiaryAiRequest;
  const includeDebug = body.includeDebug === true;
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
    const result = await requestAiJsonWithFallback<BestiaryAiResponse>({
      prompt: getPrompt(defaults),
      gemini,
      groq,
      temperature: 0.95,
      topP: 0.9,
    });
    return res.status(200).json({
      ...normalizeEntry(result.data, defaults),
      ...(includeDebug ? { debug: result.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo generar la bestia con IA. ${
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
