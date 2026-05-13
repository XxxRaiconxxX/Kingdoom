import type { KnowledgeDocument } from "../types";
import type { AiDebugInfo } from "./aiDebug";
import type { ArchivistActionDraft, ArchivistStructuredAnswer } from "../features/archivist/archivist.types";

export type ArchivistMode = "canon" | "deep" | "mechanics" | "narrator" | "staff";

type ArchivistAskResult =
  | {
      status: "ready";
      answer: string;
      sources: Array<{ title: string; type: string; category: string }>;
      intent: ArchivistStructuredAnswer["intent"];
      followUpQuestion?: string;
      notes?: string[];
      actionDraft?: ArchivistActionDraft | null;
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
  mode?: ArchivistMode;
  topicMemory?: string[];
  includeDebug?: boolean;
  runtimeSummary?: string;
  allowActions?: boolean;
}): Promise<ArchivistAskResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);
  let response: Response;

  try {
    response = await fetch(getArchivistEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question: input.question,
        mode: input.mode ?? "canon",
        topicMemory: input.topicMemory ?? [],
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
        runtimeSummary: input.runtimeSummary ?? "",
        allowActions: input.allowActions ?? false,
      }),
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof DOMException && error.name === "AbortError"
          ? "El Archivista tardo demasiado en responder. El borrador pendiente sigue intacto."
          : "No se pudo consultar al Archivista. Revisa la conexion o el endpoint.",
      debug: null,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }

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
    intent:
      payload?.intent === "admin_action" ||
      payload?.intent === "clarify" ||
      payload?.intent === "recommendation"
        ? payload.intent
        : "answer",
    followUpQuestion:
      typeof payload?.followUpQuestion === "string"
        ? payload.followUpQuestion
        : undefined,
    notes: Array.isArray(payload?.notes)
      ? payload.notes.map((entry: unknown) => String(entry)).slice(0, 4)
      : [],
    actionDraft:
      payload?.actionDraft && typeof payload.actionDraft === "object"
        ? (payload.actionDraft as ArchivistActionDraft)
        : null,
    debug: payload?.debug ?? null,
  };
}
