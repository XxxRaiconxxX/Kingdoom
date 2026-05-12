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
import {
  buildArchivistPrompt,
  normalizeArchivistMode,
  type ArchivistMode,
  type ArchivistPromptDocument,
} from "./_aiPrompts.js";
import {
  getCachedAiResponse,
  setCachedAiResponse,
  stableCacheKey,
} from "./_aiCache.js";

type ArchivistResponsePayload = {
  answer: string;
  sources: Array<{ title: string; type: string; category: string }>;
  intent: "answer" | "admin_action" | "clarify" | "recommendation";
  followUpQuestion?: string;
  notes?: string[];
  actionDraft?: {
    kind: string;
    label: string;
    confirmationPrompt: string;
    payload: Record<string, unknown>;
  } | null;
};

const ARCHIVIST_ACTIONS = [
  "create_player",
  "set_player_gold",
  "add_player_gold",
  "subtract_player_gold",
  "upsert_mission",
  "delete_mission",
  "upsert_event",
  "delete_event",
  "upsert_market_item",
  "delete_market_item",
  "upsert_magic",
  "delete_magic",
  "upsert_bestiary",
  "delete_bestiary",
  "upsert_flora",
  "delete_flora",
  "upsert_document",
  "delete_document",
] as const;

function isArchivistAction(value: string): value is (typeof ARCHIVIST_ACTIONS)[number] {
  return ARCHIVIST_ACTIONS.includes(value as (typeof ARCHIVIST_ACTIONS)[number]);
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
      message: missingAiProviderMessage(),
    });
  }

  const body = (req.body ?? {}) as {
    question?: string;
    mode?: ArchivistMode;
    documents?: ArchivistPromptDocument[];
    topicMemory?: string[];
    includeDebug?: boolean;
    runtimeSummary?: string;
    allowActions?: boolean;
  };
  const question = body.question?.trim() ?? "";
  const documents = Array.isArray(body.documents) ? body.documents : [];
  const mode = normalizeArchivistMode(body.mode);
  const topicMemory = Array.isArray(body.topicMemory)
    ? body.topicMemory
        .map((topic) => topic.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const includeDebug = body.includeDebug === true;
  const runtimeSummary = body.runtimeSummary?.trim() ?? "";
  const allowActions = body.allowActions === true;

  if (!question) {
    return res.status(400).json({ message: "La pregunta esta vacia." });
  }

  if (documents.length === 0) {
    return res.status(400).json({
      message: "No hay documentos relevantes para consultar.",
    });
  }

  try {
    const cacheKey = stableCacheKey([
      "archivist",
      mode,
      question.toLowerCase(),
      runtimeSummary,
      allowActions ? "admin" : "public",
      topicMemory,
      documents.map((document) => [
        document.title,
        document.type,
        document.category,
        document.content.slice(0, 240),
      ]),
    ]);
    const cached = getCachedAiResponse<ArchivistResponsePayload>(cacheKey);

    if (cached && !includeDebug) {
      return res.status(200).json(cached);
    }

    const result = await runAiJson<Partial<ArchivistResponsePayload>>({
      prompt: buildArchivistPrompt({
        question,
        documents,
        mode,
        topicMemory,
        runtimeSummary,
        allowActions,
        availableActions: allowActions ? [...ARCHIVIST_ACTIONS] : [],
      }),
      temperature: mode === "mechanics" ? 0.28 : 0.35,
      topP: mode === "mechanics" ? 0.78 : 0.85,
      config: aiConfig,
    });

    const payload: ArchivistResponsePayload = {
      answer:
        typeof result.data?.answer === "string" && result.data.answer.trim()
          ? result.data.answer.trim()
          : "No tengo datos suficientes para responder con precision.",
      sources: documents.map((document) => ({
        title: document.title,
        type: document.type,
        category: document.category,
      })),
      intent:
        result.data?.intent === "admin_action" ||
        result.data?.intent === "clarify" ||
        result.data?.intent === "recommendation"
          ? result.data.intent
          : "answer",
      followUpQuestion:
        typeof result.data?.followUpQuestion === "string" &&
        result.data.followUpQuestion.trim()
          ? result.data.followUpQuestion.trim()
          : undefined,
      notes: Array.isArray(result.data?.notes)
        ? result.data.notes
            .map((entry) => String(entry).trim())
            .filter(Boolean)
            .slice(0, 4)
        : [],
      actionDraft:
        result.data?.actionDraft &&
        typeof result.data.actionDraft === "object" &&
        typeof result.data.actionDraft.kind === "string" &&
        isArchivistAction(result.data.actionDraft.kind) &&
        typeof result.data.actionDraft.label === "string" &&
        typeof result.data.actionDraft.confirmationPrompt === "string"
          ? {
              kind: result.data.actionDraft.kind,
              label: result.data.actionDraft.label,
              confirmationPrompt: result.data.actionDraft.confirmationPrompt,
              payload:
                result.data.actionDraft.payload &&
                typeof result.data.actionDraft.payload === "object"
                  ? (result.data.actionDraft.payload as Record<string, unknown>)
                  : {},
            }
          : null,
    };

    setCachedAiResponse(cacheKey, payload, 10 * 60 * 1000);

    return res.status(200).json({
      ...payload,
      ...(includeDebug ? { debug: result.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo consultar al Archivista. ${
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
