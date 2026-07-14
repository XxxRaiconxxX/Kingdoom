import { readAiServerConfig, runAiJson } from "./_aiOrchestrator.js";
import type { AiDebugInfo } from "./_serverAiProviders.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VisualReference } from "./_visualReference.js";

type MarketCategoryId = "potions" | "armors" | "swords" | "others";
type Rarity = "mythic" | "legendary" | "epic" | "rare" | "common";
type StockStatus = "available" | "limited" | "sold-out";

export type AssistantMarketDraft = {
  name: string;
  description: string;
  ability: string;
  price: number;
  rarity: Rarity;
  category: MarketCategoryId;
  stockStatus: StockStatus;
  imageUrl: string;
  imageFit: "cover" | "contain";
  imagePosition: string;
  stockLimit: number;
  stockSold: number;
  featured: boolean;
  promptSummary: string;
  referenceSourceUrl: string;
};

type MarketAssistantAiPayload = {
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
    stockLimit?: number;
    featured?: boolean;
  };
  promptSummary?: string;
};

type MarketContextRow = {
  name: string;
  category: MarketCategoryId;
  rarity: Rarity;
  price: number;
  stock_status: StockStatus;
};

function normalizeCategory(value?: string): MarketCategoryId {
  if (value === "potions" || value === "armors" || value === "swords" || value === "others") {
    return value;
  }

  return "others";
}

function normalizeRarity(value?: string): Rarity {
  if (
    value === "mythic" ||
    value === "legendary" ||
    value === "epic" ||
    value === "rare" ||
    value === "common"
  ) {
    return value;
  }

  return "rare";
}

function normalizeStockStatus(value?: string): StockStatus {
  if (value === "available" || value === "limited" || value === "sold-out") {
    return value;
  }

  return "limited";
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

  return Math.max(50, Math.min(5_000_000, Math.floor(numericValue)));
}

function clampStockLimit(value: unknown, stockStatus: StockStatus) {
  const fallback = stockStatus === "limited" ? 1 : 0;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(99, Math.floor(numericValue)));
}

function cleanText(value: unknown, fallback: string) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function buildMarketContextSummary(items: MarketContextRow[]) {
  if (!items.length) {
    return "El mercado actual esta vacio o sin datos. Usa balance prudente.";
  }

  return items
    .slice(0, 12)
    .map(
      (item) =>
        `- ${item.name} | ${item.category} | ${item.rarity} | ${item.price} oro | ${item.stock_status}`
    )
    .join("\n");
}

export async function fetchMarketBalanceContext(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("market_items")
    .select("name, category, rarity, price, stock_status")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error || !Array.isArray(data)) {
    return "No se pudo leer el mercado actual. Usa balance prudente y coherente con el reino.";
  }

  return buildMarketContextSummary(data as MarketContextRow[]);
}

function buildGenerationPrompt(input: {
  reference: VisualReference;
  ideaPrompt: string;
  marketContext: string;
}) {
  return `
Actua como diseñador senior de items para el mercado de Kingdoom.

Debes crear UN item premium de fantasia oscura medieval para revision de staff.

IDEA DEL STAFF
${input.ideaPrompt}

REFERENCIA VISUAL
- imageUrl: ${input.reference.imageUrl}
- title: ${input.reference.title || "sin titulo util"}
- description: ${input.reference.description || "sin descripcion util"}
- sourceUrl: ${input.reference.sourceUrl || "sin enlace"}

MERCADO ACTUAL
${input.marketContext}

REGLAS
- Devuelve un item vendible, inmersivo y util para el reino.
- La categoria debe ser una de: potions, armors, swords, others.
- La rareza debe ser una de: mythic, legendary, epic, rare, common.
- El stockStatus debe ser: available, limited o sold-out.
- Usa la referencia como semilla visual y la idea del staff como intencion creativa.
- El nombre debe sonar oficial, corto y comercializable.
- La descripcion debe quedar lista para la tarjeta del mercado.
- La habilidad debe sonar util sin romper el balance del reino.
- El precio debe ser coherente con rareza, utilidad y mercado actual.
- Usa stockLimit bajo para piezas limitadas.
- No devuelvas markdown ni comentarios.

Responde SOLO con JSON valido:
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
    "imagePosition": "center",
    "stockLimit": 0,
    "featured": false
  },
  "promptSummary": "string"
}
`.trim();
}

function buildRevisionPrompt(input: {
  currentDraft: AssistantMarketDraft;
  revisionInstruction: string;
  marketContext: string;
}) {
  return `
Actua como editor senior de items del mercado de Kingdoom.

Hay un borrador pendiente para ajustar. Conserva su identidad general salvo que la instruccion pida un giro claro.

BORRADOR ACTUAL
${JSON.stringify(input.currentDraft, null, 2)}

MERCADO ACTUAL
${input.marketContext}

INSTRUCCION DEL STAFF
${input.revisionInstruction}

REGLAS
- Reescribe SOLO el borrador pendiente.
- Si el staff pide cambiar precio, rareza, habilidad, descripcion o categoria, actualiza el payload sin reiniciar desde cero.
- Mantén una sola categoria valida: potions, armors, swords, others.
- Mantén una sola rareza valida: mythic, legendary, epic, rare, common.
- Mantén stockStatus dentro de available, limited, sold-out.
- No pierdas coherencia con el mercado actual.
- No devuelvas markdown ni comentarios.

Responde SOLO con JSON valido:
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
    "imagePosition": "center",
    "stockLimit": 0,
    "featured": false
  },
  "promptSummary": "string"
}
`.trim();
}

export function normalizeAssistantDraft(input: {
  payload: MarketAssistantAiPayload;
  reference: VisualReference;
  fallbackDraft?: AssistantMarketDraft | null;
}) {
  const rawDraft = input.payload.draft ?? {};
  const fallbackDraft = input.fallbackDraft ?? null;
  const rarity = normalizeRarity(rawDraft.rarity ?? fallbackDraft?.rarity);
  const stockStatus = normalizeStockStatus(
    rawDraft.stockStatus ?? fallbackDraft?.stockStatus
  );

  return {
    name: cleanText(rawDraft.name, fallbackDraft?.name || "Reliquia sin nombre"),
    description: cleanText(
      rawDraft.description,
      fallbackDraft?.description ||
        "Pieza cargada de historia oscura, lista para circular en el mercado del reino."
    ),
    ability: cleanText(rawDraft.ability, fallbackDraft?.ability || ""),
    price: clampPrice(
      rawDraft.price,
      fallbackDraft?.price || defaultPriceForRarity(rarity)
    ),
    rarity,
    category: normalizeCategory(rawDraft.category ?? fallbackDraft?.category),
    stockStatus,
    imageUrl: cleanText(input.reference.imageUrl, fallbackDraft?.imageUrl || ""),
    imageFit: rawDraft.imageFit === "contain" ? "contain" : "cover",
    imagePosition: cleanText(rawDraft.imagePosition, fallbackDraft?.imagePosition || "center"),
    stockLimit: clampStockLimit(rawDraft.stockLimit, stockStatus),
    stockSold: fallbackDraft?.stockSold ?? 0,
    featured:
      typeof rawDraft.featured === "boolean"
        ? rawDraft.featured
        : fallbackDraft?.featured ?? false,
    promptSummary: cleanText(
      input.payload.promptSummary,
      fallbackDraft?.promptSummary ||
        "Borrador generado para revision administrativa del mercado."
    ),
    referenceSourceUrl: cleanText(
      input.reference.sourceUrl,
      fallbackDraft?.referenceSourceUrl || input.reference.imageUrl
    ),
  } satisfies AssistantMarketDraft;
}

export async function generateAssistantMarketDraft(input: {
  reference: VisualReference;
  ideaPrompt: string;
  marketContext: string;
}) {
  const result = await runAiJson<MarketAssistantAiPayload>({
    prompt: buildGenerationPrompt(input),
    temperature: 0.9,
    topP: 0.95,
    config: readAiServerConfig(),
  });

  return {
    draft: normalizeAssistantDraft({
      payload: result.data,
      reference: input.reference,
      fallbackDraft: null,
    }),
    debug: result.debug,
  };
}

export async function reviseAssistantMarketDraft(input: {
  reference: VisualReference;
  currentDraft: AssistantMarketDraft;
  revisionInstruction: string;
  marketContext: string;
}) {
  const result = await runAiJson<MarketAssistantAiPayload>({
    prompt: buildRevisionPrompt(input),
    temperature: 0.65,
    topP: 0.9,
    config: readAiServerConfig(),
  });

  return {
    draft: normalizeAssistantDraft({
      payload: result.data,
      reference: input.reference,
      fallbackDraft: input.currentDraft,
    }),
    debug: result.debug,
  };
}

export function formatDraftReply(input: {
  draftId: string;
  status: "draft" | "revised";
  draft: AssistantMarketDraft;
}) {
  const label = input.status === "draft" ? "Borrador forjado" : "Borrador ajustado";
  const rarityLabel = input.draft.rarity.toUpperCase();
  const stockLabel =
    input.draft.stockStatus === "limited"
      ? "Limitado"
      : input.draft.stockStatus === "sold-out"
      ? "Agotado"
      : "Disponible";

  return [
    `⚒️ *${label}*`,
    `ID: \`${input.draftId}\``,
    "",
    `*${input.draft.name}*`,
    `Categoria: ${input.draft.category}`,
    `Rareza: ${rarityLabel}`,
    `Precio: ${input.draft.price.toLocaleString("es-PY")} oro`,
    `Stock: ${stockLabel}${input.draft.stockLimit > 0 ? ` (${input.draft.stockLimit})` : ""}`,
    "",
    `Descripcion: ${input.draft.description}`,
    `Habilidad: ${input.draft.ability || "Sin habilidad activa."}`,
    `Balance: ${input.draft.promptSummary}`,
    "",
    "Responde con cambios conversacionales, `confirmar` o `cancelar`.",
  ].join("\n");
}

export function extractModelUsed(debug: AiDebugInfo | null | undefined) {
  if (!debug?.provider || !debug.model) {
    return "";
  }

  return `${debug.provider}:${debug.model}`;
}
