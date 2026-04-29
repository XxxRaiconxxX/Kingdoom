import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "./_serverAiProviders.js";
import {
  ensureAiProvider,
  missingAiProviderMessage,
  readAiServerConfig,
  runAiText,
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
};

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

    const result = await runAiText({
      prompt: buildArchivistPrompt({ question, documents, mode, topicMemory }),
      temperature: mode === "mechanics" ? 0.28 : 0.35,
      topP: mode === "mechanics" ? 0.78 : 0.85,
      config: aiConfig,
    });

    const payload: ArchivistResponsePayload = {
      answer: result.text,
      sources: documents.map((document) => ({
        title: document.title,
        type: document.type,
        category: document.category,
      })),
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
