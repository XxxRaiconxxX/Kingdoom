import type { KnowledgeDocument } from "../types";
import type { AiDebugInfo } from "./aiDebug";

type ArchivistAskResult =
  | {
      status: "ready";
      answer: string;
      sources: Array<{ title: string; type: string; category: string }>;
      debug?: AiDebugInfo | null;
    }
  | { status: "error"; message: string; debug?: AiDebugInfo | null };

function getArchivistEndpoint() {
  const configured = import.meta.env.VITE_ARCHIVIST_AI_API_URL as
    | string
    | undefined;

  if (configured?.trim()) {
    return configured.trim();
  }

  const missionEndpoint = import.meta.env.VITE_MISSION_AI_API_URL as
    | string
    | undefined;

  if (missionEndpoint?.trim()) {
    return missionEndpoint
      .trim()
      .replace(/\/generate-mission$/, "/ask-archivist");
  }

  if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
    return "https://kingdoom.vercel.app/api/admin/ask-archivist";
  }

  return "/api/admin/ask-archivist";
}

export async function askArchivistAi(input: {
  question: string;
  contextDocuments: KnowledgeDocument[];
  includeDebug?: boolean;
}): Promise<ArchivistAskResult> {
  const response = await fetch(getArchivistEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: input.question,
      documents: input.contextDocuments.map((document) => ({
        title: document.title,
        type: document.type,
        category: document.category,
        tags: document.tags,
        source: document.source,
        summary: document.summary,
        content: document.content,
      })),
      includeDebug: input.includeDebug ?? false,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      status: "error",
      message:
        payload?.message ??
        "No se pudo consultar al Archivista. Revisa la configuracion del endpoint.",
      debug: payload?.debug ?? null,
    };
  }

  return {
    status: "ready",
    answer: payload?.answer ?? "",
    sources: Array.isArray(payload?.sources) ? payload.sources : [],
    debug: payload?.debug ?? null,
  };
}
