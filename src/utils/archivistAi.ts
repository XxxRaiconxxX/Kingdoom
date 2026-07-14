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
  signal?: AbortSignal;
}): Promise<ArchivistAskResult> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 45000);
  let response: Response;

  if (input.signal?.aborted) {
    controller.abort();
  } else {
    input.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    response = await fetch(getArchivistEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question: input.question.trim().slice(0, 2000),
        mode: input.mode ?? "canon",
        topicMemory: (input.topicMemory ?? []).slice(-8).map((entry) => entry.slice(0, 1200)),
        documents: input.contextDocuments.slice(0, 12).map((document) => ({
          title: document.title.slice(0, 180),
          type: document.type.slice(0, 80),
          category: document.category.slice(0, 120),
          tags: document.tags.slice(0, 16).map((tag) => tag.slice(0, 80)),
          source: document.source.slice(0, 180),
          summary: document.summary.slice(0, 500),
          content: document.content.slice(0, 2600),
        })),
        includeDebug: input.includeDebug ?? false,
        runtimeSummary: (input.runtimeSummary ?? "").slice(0, 16000),
        allowActions: input.allowActions ?? false,
      }),
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof DOMException && error.name === "AbortError"
          ? timedOut
            ? "El Archivista tardo demasiado en responder. El borrador pendiente sigue intacto."
            : "La consulta fue detenida. El borrador pendiente sigue intacto."
          : "No se pudo consultar al Archivista. Revisa la conexion o el endpoint.",
      debug: null,
    };
  } finally {
    window.clearTimeout(timeoutId);
    input.signal?.removeEventListener("abort", abortFromCaller);
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

  const answer = typeof payload?.answer === "string" ? payload.answer.trim() : "";
  if (!answer) {
    return {
      status: "error",
      message: "El Archivista respondio sin contenido util. Intenta reformular la consulta.",
      debug: payload?.debug ?? null,
    };
  }

  const sources = Array.isArray(payload?.sources)
    ? payload.sources.flatMap((source: unknown) => {
        if (!source || typeof source !== "object") return [];
        const entry = source as Record<string, unknown>;
        if (typeof entry.title !== "string" || !entry.title.trim()) return [];
        return [
          {
            title: entry.title.trim(),
            type: typeof entry.type === "string" ? entry.type : "other",
            category: typeof entry.category === "string" ? entry.category : "",
          },
        ];
      })
    : [];

  return {
    status: "ready",
    answer,
    sources,
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
