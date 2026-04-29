import type { MarketCategoryId, Rarity, StockStatus } from "../types";
import type { AiDebugInfo } from "./aiDebug";
import type { PinterestReference } from "./pinterestPicker";

export type MarketItemAiRequest = {
  pinterestReference: PinterestReference;
  category?: MarketCategoryId;
  rarity?: Rarity;
  stockStatus?: StockStatus;
  priceTarget?: number;
  theme?: string;
  includeDebug?: boolean;
};

export type MarketItemAiResponse = {
  draft: {
    name: string;
    description: string;
    ability: string;
    price: number;
    rarity: Rarity;
    category: MarketCategoryId;
    stockStatus: StockStatus;
    imageFit: "cover" | "contain";
    imagePosition: string;
  };
  promptSummary?: string;
  debug?: AiDebugInfo;
};

function getMarketAiEndpoint() {
  const configured = import.meta.env.VITE_MARKET_AI_API_URL?.trim();
  if (configured) {
    return configured;
  }

  const missionEndpoint = import.meta.env.VITE_MISSION_AI_API_URL?.trim();
  if (missionEndpoint?.includes("/generate-mission")) {
    return missionEndpoint.replace("/generate-mission", "/generate-market-item");
  }

  if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
    return "https://kingdoom.vercel.app/api/admin/generate-market-item";
  }

  return "/api/admin/generate-market-item";
}

export async function generateMarketItemWithAi(input: MarketItemAiRequest) {
  const response = await fetch(getMarketAiEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | ({ message?: string; debug?: AiDebugInfo } & Partial<MarketItemAiResponse>)
    | null;

  if (!response.ok || !payload?.draft?.name) {
    return {
      status: "error" as const,
      message:
        payload?.message ||
        "No se pudo generar el item con IA. Revisa la configuracion del endpoint.",
      draft: null,
      promptSummary: "",
      debug: payload?.debug ?? null,
    };
  }

  return {
    status: "ready" as const,
    message: "Borrador generado desde el pin. Revisa el item y guardalo si te convence.",
    draft: payload.draft,
    promptSummary: payload.promptSummary ?? "",
    debug: payload.debug ?? null,
  };
}
