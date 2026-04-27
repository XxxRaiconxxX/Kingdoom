import type { BestiaryEntry, BestiaryRarity } from "../types";
import type { AiDebugInfo } from "./aiDebug";

export type BestiaryAiRequest = {
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

export type BestiaryAiResponse = Pick<
  BestiaryEntry,
  | "name"
  | "category"
  | "type"
  | "generalData"
  | "threatLevel"
  | "domestication"
  | "usage"
  | "originPlace"
  | "foundAt"
  | "description"
  | "ability"
  | "rarity"
  | "imageUrl"
>;

export type MagicAiRequest = {
  categoryTitle?: string;
  titleSeed?: string;
  tone?: string;
  theme?: string;
  restriction?: string;
  combatStyle?: "yes" | "no" | "optional";
  scientificAngle?: string;
  includeDebug?: boolean;
};

export type MagicAiResponse = {
  draftText: string;
  promptSummary?: string;
  debug?: AiDebugInfo;
};

function deriveEndpoint(pathname: string) {
  const missionUrl = import.meta.env.VITE_MISSION_AI_API_URL?.trim();
  if (missionUrl?.includes("/generate-mission")) {
    return missionUrl.replace("/generate-mission", pathname);
  }

  if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
    return `https://kingdoom.vercel.app/api/admin${pathname}`;
  }

  return "";
}

function resolveBestiaryAiEndpoint() {
  const configuredUrl = import.meta.env.VITE_BESTIARY_AI_API_URL?.trim();
  return configuredUrl || deriveEndpoint("/generate-bestiary") || "/api/admin/generate-bestiary";
}

function resolveMagicAiEndpoint() {
  const configuredUrl = import.meta.env.VITE_MAGIC_AI_API_URL?.trim();
  return configuredUrl || deriveEndpoint("/generate-magic") || "/api/admin/generate-magic";
}

export async function generateBestiaryWithAi(input: BestiaryAiRequest) {
  const response = await fetch(resolveBestiaryAiEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | (BestiaryAiResponse & { debug?: AiDebugInfo; message?: string })
    | null;

  if (!response.ok || !payload?.name) {
    return {
      status: "error" as const,
      message:
        payload?.message ||
        "No se pudo generar la bestia con IA. Revisa la configuracion del endpoint.",
      entry: null,
      debug: payload?.debug ?? null,
    };
  }

  return {
    status: "ready" as const,
    message: "Bestia generada por IA. Revisa el texto y guardala si te convence.",
    entry: payload,
    debug: payload.debug ?? null,
  };
}

export async function generateMagicDraftWithAi(input: MagicAiRequest) {
  const response = await fetch(resolveMagicAiEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | ({ message?: string; debug?: AiDebugInfo } & Partial<MagicAiResponse>)
    | null;

  if (!response.ok || !payload?.draftText) {
    return {
      status: "error" as const,
      message:
        payload?.message ||
        "No se pudo generar la magia con IA. Revisa la configuracion del endpoint.",
      draftText: "",
      promptSummary: "",
      debug: payload?.debug ?? null,
    };
  }

  return {
    status: "ready" as const,
    message: "Magia generada por IA. Se interpreto el formato y ya puedes revisarla.",
    draftText: payload.draftText,
    promptSummary: payload.promptSummary ?? "",
    debug: payload.debug ?? null,
  };
}
