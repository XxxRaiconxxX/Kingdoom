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
    ability?: string;
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
Actua como diseÃ±ador senior de items para el mercado de Kingdoom.

Debes crear UN item premium de fantasia oscura medieval usando una referencia visual de Pinterest como semilla.

CONTEXTO DEL SISTEMA
- Mundo: fantasia oscura, reino medieval, mercado negro, reliquias, facciones, expediciones y magia peligrosa.
- El item debe sentirse util, evocador y coherente con el tono del proyecto.
- El staff lo revisara en un panel admin antes de guardarlo.
- No escribas explicaciones fuera del JSON.

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

REGLAS
- Usa la imagen como inspiracion visual, no copies texto generico de Pinterest.
- El nombre debe sonar oficial, corto y vendible.
- La descripcion debe servir para la tarjeta del mercado: inmersiva, clara y sin relleno.
- ability es opcional, pero si existe debe sonar util en combate o narrativa, sin romper el balance.
- Ajusta categoria, rareza y precio con criterio. No inventes categorias fuera del sistema.
- Evita objetos absurdamente rotos. Deben ser potentes pero razonables para el reino.
- Si el stockStatus es "sold-out", el item debe sonar muy exclusivo o ya reclamado.
- Si la referencia parece decorativa, puedes convertirla en reliquia, artefacto, pieza o curiosidad.
- No uses markdown, comillas triples ni comentarios.

FORMATO DE RESPUESTA
Responde SOLO con un objeto JSON valido con esta estructura exacta:
{
  "draft": {
    "name": "string",
    "description": "string",
    "ability": "string",
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

  return {
    draft: {
      name: draft.name?.trim() || "Reliquia sin nombre",
      description:
        draft.description?.trim() ||
        "Pieza cargada de historia oscura, lista para circular en el mercado del reino.",
      ability: draft.ability?.trim() || "",
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
