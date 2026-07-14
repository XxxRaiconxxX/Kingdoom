import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../../server/admin/_serverAiProviders.js";
import {
  ensureAiProvider,
  missingAiProviderMessage,
  readAiServerConfig,
  runAiJson,
} from "../../server/admin/_aiOrchestrator.js";

type MarketCategoryId = "potions" | "armors" | "swords" | "others";
type Rarity = "mythic" | "legendary" | "epic" | "rare" | "common";
type StockStatus = "available" | "limited" | "sold-out";

type MarketItemAiRequest = {
  pinterestReference?: {
    imageUrl?: string;
    title?: string;
    description?: string;
    sourceUrl?: string;
  };
  category?: MarketCategoryId;
  rarity?: Rarity;
  stockStatus?: StockStatus;
  priceTarget?: number;
  theme?: string;
  includeDebug?: boolean;
};

type MarketItemAiPayload = {
  draft?: {
    name?: string;
    description?: string;
    ability?: string | {
      name?: string;
      effect?: string;
      cooldown?: string;
      limit?: string;
      antiBlackHand?: string;
    };
    price?: number;
    rarity?: Rarity;
    category?: MarketCategoryId;
    stockStatus?: StockStatus;
    imageFit?: "cover" | "contain";
    imagePosition?: string;
  };
  promptSummary?: string;
};

type NormalizedMarketItemAiRequest = Required<
  Omit<MarketItemAiRequest, "includeDebug" | "pinterestReference">
> & {
  pinterestReference: {
    imageUrl: string;
    title: string;
    description: string;
    sourceUrl: string;
  };
};

function normalizeCategory(value?: string): MarketCategoryId {
  if (
    value === "potions" ||
    value === "armors" ||
    value === "swords" ||
    value === "others"
  ) {
    return value;
  }

  return "swords";
}

function normalizeRarity(value?: string): Rarity {
  if (
    value === "legendary" ||
    value === "mythic" ||
    value === "epic" ||
    value === "rare" ||
    value === "common"
  ) {
    return value;
  }

  return "common";
}

function normalizeStockStatus(value?: string): StockStatus {
  if (
    value === "available" ||
    value === "limited" ||
    value === "sold-out"
  ) {
    return value;
  }

  return "available";
}

function defaultPriceForRarity(rarity: Rarity) {
  switch (rarity) {
    case "mythic":
      return 2400;
    case "legendary":
      return 1250;
    case "epic":
      return 900;
    case "rare":
      return 500;
    case "common":
    default:
      return 220;
  }
}

function clampPrice(value: unknown, fallback: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(50, Math.min(5000000, Math.floor(numericValue)));
}

function normalizeTheme(value?: string) {
  return value?.trim() || "oscuro, util y propio del mercado del reino";
}

function categoryLabel(category: MarketCategoryId) {
  switch (category) {
    case "potions":
      return "Pocion";
    case "armors":
      return "Armadura";
    case "swords":
      return "Arma o espada";
    case "others":
    default:
      return "Objeto especial";
  }
}

function stockLabel(stockStatus: StockStatus) {
  switch (stockStatus) {
    case "limited":
      return "limitado";
    case "sold-out":
      return "agotado";
    case "available":
    default:
      return "disponible";
  }
}

function getPrompt(input: NormalizedMarketItemAiRequest) {
  return `
Actua como Maestro de Armas de Aethelgardia y diseñador senior de items para el mercado de Kingdoom.

Debes crear UN item premium de fantasia oscura medieval usando una referencia visual de Pinterest como semilla.

CONTEXTO DEL SISTEMA Y REGLAS DE BALANCE
- Mundo: rol escrito por chat, tematica anime/fantasia oscura en el continente de Aethelgardia, mercado negro, reliquias y magia.
- Sistema de Ataque: d20 + stat del usuario (STR para melee, INT para magia, AGI para distancia). Ej: "17 en d20 + 3 de STR = 20 de Ataque al D20".
- Daño: Se calcula con un d6 para mano blanca (daño fisico sin magia) o mano negra (magia o veneno oculto), con multiplicadores y efectos diversos segun el arma.
- Sistema de Defensa: 3 opciones activas según stat: STR = Bloquear (mitiga daño o anula), INT = Defender (magia que detiene ataques mágicos o físicos), AGI = Esquivar (evade daño comparando su stat contra el ataque enemigo).
- El objetivo del diseño es SIEMPRE mantener el conflicto abierto: ninguna habilidad debe cerrar automaticamente un enfrentamiento.

REFERENCIA VISUAL
- imageUrl: ${input.pinterestReference.imageUrl}
- title: ${input.pinterestReference.title || "sin titulo util"}
- description: ${input.pinterestReference.description || "sin descripcion util"}
- sourceUrl: ${input.pinterestReference.sourceUrl || "sin enlace"}

PISTAS DEL STAFF
- category preferida: ${input.category} (${categoryLabel(input.category)})
- rarity preferida: ${input.rarity} (mythic es superior a legendary y debe reservarse para piezas excepcionales)
- stockStatus preferido: ${input.stockStatus} (${stockLabel(input.stockStatus)})
- priceTarget: ${input.priceTarget}
- theme: ${input.theme}

REGLAS GENERALES DEL ITEM
- Usa la imagen como inspiracion visual, no copies texto generico de Pinterest.
- El nombre del item debe sonar oficial, corto y vendible.
- La descripcion debe servir para la tarjeta del mercado: inmersiva, clara y sin relleno.
- Ajusta categoria, rareza y precio con criterio. No inventes categorias fuera del sistema.
- Si el stockStatus es "sold-out", el item debe sonar muy exclusivo o ya reclamado.
- Si la referencia parece decorativa, puedes convertirla en reliquia, artefacto, pieza o curiosidad.

REGLAS DE LA HABILIDAD (campo "ability")
Cuando recibas el nombre y descripcion de un arma, debes generar su habilidad especial con el siguiente esquema JSON para el campo "ability":
{
  "name": "[Nombre evocador de la habilidad] ([tipo de efecto entre paréntesis]):",
  "effect": "Describe el efecto mecanico de forma detallada y precisa. Debes incluir un porcentaje de la stat que afecta (ej: 'añade un 30% extra de tu STR al daño base', 'aumenta el daño del d6 en un 20% de tu INT' o 'reduce el AGI del objetivo al esquivar'). ¿Que ignora, que atraviesa, que inflige? Prohibido usar lenguaje literario vago como 'daño devastador'.",
  "cooldown": "Frecuencia de uso: puede ser un cooldown exacto en turnos o un porcentaje de activarse. Ejemplo: '2 turnos', '30% de probabilidad de activarse al acertar' o 'Solo una vez por combate.'",
  "limit": "Una restriccion mecanica que equilibre el poder. Ej: 'No funciona contra habilidades de Bloquear (STR)' o 'Requiere 2 manos'.",
  "antiBlackHand": "Explica por que NO puede usarse como golpe oculto. Debe haber una señal perceptible (sonido, luz, calor, etc). Añade el balance de nivel como nota de diseño directa."
}

REGLAS OBLIGATORIAS PARA LA HABILIDAD:
1. Nunca escribas habilidades que terminen el combate por si solas (paralisis total, muerte instantanea, etc).
2. Cada habilidad debe tener al menos una forma de ser contrarrestada o esquivada.
3. El Efecto debe poder leerse en voz alta en 10 segundos.
4. No repitas las palabras del nombre del arma dentro del Efecto.
5. Si el arma es magica, el Anti-Mano Negra debe incluir señal visual o auditiva obligatoria.
6. Vocabulario: tecnico-medieval. Permitido mezclar terminologia arcana con fisica real. Prohibido novela romantica o epica generica.

FORMATO DE RESPUESTA
Responde SOLO con un objeto JSON valido con esta estructura exacta (sin markdown, sin comillas triples):
{
  "draft": {
    "name": "string",
    "description": "string",
    "ability": {
      "name": "string",
      "effect": "string",
      "cooldown": "string",
      "limit": "string",
      "antiBlackHand": "string"
    },
    "price": 0,
    "rarity": "mythic|legendary|epic|rare|common",
    "category": "potions|armors|swords|others",
    "stockStatus": "available|limited|sold-out",
    "imageFit": "cover",
    "imagePosition": "center"
  },
  "promptSummary": "string"
}
`.trim();
}

function normalizePayload(
  payload: MarketItemAiPayload,
  defaults: NormalizedMarketItemAiRequest
) {
  const draft = payload.draft ?? {};
  const normalizedRarity = normalizeRarity(draft.rarity ?? defaults.rarity);
  const fallbackPrice = clampPrice(
    defaults.priceTarget,
    defaultPriceForRarity(normalizedRarity)
  );

  let formattedAbility = "";
  if (typeof draft.ability === "string") {
    formattedAbility = draft.ability.trim();
  } else if (typeof draft.ability === "object" && draft.ability !== null) {
    const { name, effect, cooldown, limit, antiBlackHand } = draft.ability;
    const parts = [];
    if (name) parts.push(name.trim());
    if (effect) parts.push(`Efecto: ${effect.trim()}`);
    if (cooldown) parts.push(`CD: ${cooldown.trim()}`);
    if (limit) parts.push(`Límite: ${limit.trim()}`);
    if (antiBlackHand) parts.push(`Anti-Mano Negra: ${antiBlackHand.trim()}`);
    formattedAbility = parts.join("\n");
  }

  return {
    draft: {
      name: draft.name?.trim() || "Reliquia sin nombre",
      description:
        draft.description?.trim() ||
        "Pieza cargada de historia oscura, lista para circular en el mercado del reino.",
      ability: formattedAbility,
      price: clampPrice(draft.price, fallbackPrice),
      rarity: normalizedRarity,
      category: normalizeCategory(draft.category ?? defaults.category),
      stockStatus: normalizeStockStatus(draft.stockStatus ?? defaults.stockStatus),
      imageFit: "cover" as const,
      imagePosition: draft.imagePosition?.trim() || "center",
    },
    promptSummary:
      payload.promptSummary?.trim() ||
      "Borrador generado desde una referencia visual de Pinterest.",
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
      message: `${missingAiProviderMessage()} Configuralas en Vercel antes de usar el generador.`,
    });
  }

  const body = (req.body ?? {}) as MarketItemAiRequest;
  const includeDebug = body.includeDebug === true;
  const normalizedInput: NormalizedMarketItemAiRequest = {
    pinterestReference: {
      imageUrl: body.pinterestReference?.imageUrl?.trim() || "",
      title: body.pinterestReference?.title?.trim() || "",
      description: body.pinterestReference?.description?.trim() || "",
      sourceUrl: body.pinterestReference?.sourceUrl?.trim() || "",
    },
    category: normalizeCategory(body.category),
    rarity: normalizeRarity(body.rarity),
    stockStatus: normalizeStockStatus(body.stockStatus),
    priceTarget: clampPrice(
      body.priceTarget,
      defaultPriceForRarity(normalizeRarity(body.rarity))
    ),
    theme: normalizeTheme(body.theme),
  };

  if (!normalizedInput.pinterestReference.imageUrl) {
    return res.status(400).json({
      message: "Primero carga una referencia visual valida desde Pinterest.",
    });
  }

  try {
    const result = await runAiJson<MarketItemAiPayload>({
      prompt: getPrompt(normalizedInput),
      imageUrl: normalizedInput.pinterestReference.imageUrl,
      temperature: 0.9,
      topP: 0.92,
      config: aiConfig,
    });

    const normalizedPayload = normalizePayload(result.data, normalizedInput);

    return res.status(200).json({
      ...normalizedPayload,
      ...(includeDebug ? { debug: result.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo generar el item con IA. ${
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
