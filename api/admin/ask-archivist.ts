type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (payload: unknown) => void;
    end: () => void;
  };
};

type ArchivistDocument = {
  title: string;
  type: string;
  category: string;
  tags?: string[];
  source?: string;
  summary?: string;
  content: string;
};

type GeminiAttemptDebug = {
  keyIndex: number;
  status: "success" | "quota-fallback" | "error";
  reason: string;
};

type GeminiDebugInfo = {
  model: string;
  totalKeysConfigured: number;
  keyIndexUsed: number | null;
  fallbackUsed: boolean;
  quotaFailures: number;
  remainingKeysAfterSuccess: number;
  exhaustedByQuota: boolean;
  attempts: GeminiAttemptDebug[];
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://xxxraiconxxx.github.io",
  "https://kingdoom.vercel.app",
];

function getAllowedOrigin(requestOrigin?: string) {
  const configuredOrigins = process.env.MISSION_AI_ALLOWED_ORIGINS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const origins = configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;

  if (!requestOrigin) {
    return origins[0] ?? "*";
  }

  if (origins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return origins[0] ?? "*";
}

function setCorsHeaders(req: ApiRequest, res: ApiResponse) {
  const allowedOrigin = getAllowedOrigin(req.headers.origin);
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readGeminiConfig() {
  const geminiApiKeys = [
    ...(process.env.GEMINI_API_KEYS ?? "")
      .split(/[\n,]/g)
      .map((value) => value.trim())
      .filter(Boolean),
    ...(process.env.GEMINI_API_KEY?.trim()
      ? [process.env.GEMINI_API_KEY.trim()]
      : []),
  ];
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  return { geminiApiKeys, geminiModel };
}

function isQuotaLikeError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("too many requests") ||
    normalized.includes("retry in")
  );
}

async function parseGeminiError(response: any) {
  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return (
    payload?.error?.message ||
    payload?.message ||
    `Gemini respondio con estado ${response.status}.`
  );
}

function extractTextFromGeminiResponse(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

async function requestGeminiText(input: {
  prompt: string;
  apiKeys: string[];
  model: string;
}) {
  if (!input.apiKeys.length) {
    throw new Error(
      "Falta GEMINI_API_KEY o GEMINI_API_KEYS en el backend."
    );
  }

  let lastError = "Gemini no respondio correctamente al generar texto.";
  const attempts: GeminiAttemptDebug[] = [];

  const buildDebug = (
    keyIndexUsed: number | null,
    exhaustedByQuota: boolean
  ): GeminiDebugInfo => {
    const quotaFailures = attempts.filter(
      (attempt) => attempt.status === "quota-fallback"
    ).length;

    return {
      model: input.model,
      totalKeysConfigured: input.apiKeys.length,
      keyIndexUsed,
      fallbackUsed:
        quotaFailures > 0 || (keyIndexUsed !== null && keyIndexUsed > 1),
      quotaFailures,
      remainingKeysAfterSuccess:
        keyIndexUsed === null
          ? 0
          : Math.max(0, input.apiKeys.length - keyIndexUsed),
      exhaustedByQuota,
      attempts,
    };
  };

  for (let index = 0; index < input.apiKeys.length; index += 1) {
    const apiKey = input.apiKeys[index];
    const keyIndex = index + 1;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            topP: 0.85,
          },
        }),
      }
    );

    if (response.ok) {
      const payload = await response.json();
      const rawText = extractTextFromGeminiResponse(payload);

      if (!rawText) {
        attempts.push({
          keyIndex,
          status: "error",
          reason: "Gemini respondio sin texto util.",
        });
        throw {
          message: "Gemini respondio sin texto util.",
          debug: buildDebug(null, false),
        };
      }

      attempts.push({
        keyIndex,
        status: "success",
        reason: "Respuesta valida.",
      });

      return {
        text: rawText
          .replace(/^```text\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim(),
        debug: buildDebug(keyIndex, false),
      };
    }

    const errorMessage = await parseGeminiError(response);
    lastError = errorMessage;

    if (index < input.apiKeys.length - 1 && isQuotaLikeError(errorMessage)) {
      attempts.push({
        keyIndex,
        status: "quota-fallback",
        reason: errorMessage,
      });
      continue;
    }

    attempts.push({
      keyIndex,
      status: "error",
      reason: errorMessage,
    });

    throw {
      message: errorMessage,
      debug: buildDebug(null, isQuotaLikeError(errorMessage)),
    };
  }

  throw {
    message: lastError,
    debug: buildDebug(null, true),
  };
}

function buildPrompt(question: string, documents: ArchivistDocument[]) {
  const context = documents
    .map((document, index) => {
      const content = document.content.slice(0, 6500);
      return `
[${index + 1}] ${document.title}
Tipo: ${document.type}
Categoria: ${document.category || "Sin categoria"}
Tags: ${(document.tags ?? []).join(", ") || "Sin tags"}
Fuente: ${document.source || "Base documental de Kingdoom"}
Resumen: ${document.summary || "Sin resumen"}
Contenido:
${content}
`.trim();
    })
    .join("\n\n---\n\n");

  return `
Eres el Archivista de Argentis, asistente de consulta para Kingdoom.

Responde usando SOLO la base documental entregada. Si la respuesta no aparece en los documentos, dilo con claridad y sugiere que el staff cargue mas lore.

Reglas:
- No inventes canon.
- No des por oficial algo que no este en los documentos.
- Responde en espanol, con tono claro y elegante.
- Si hay contradicciones, mencionalas como posible conflicto de fuentes.
- Mantente breve pero util.
- No uses markdown complejo.

Pregunta del usuario:
${question}

Base documental:
${context}
`.trim();
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  const { geminiApiKeys, geminiModel } = readGeminiConfig();

  if (!geminiApiKeys.length) {
    return res.status(500).json({
      message: "Falta GEMINI_API_KEY o GEMINI_API_KEYS en el backend.",
    });
  }

  const body = (req.body ?? {}) as {
    question?: string;
    documents?: ArchivistDocument[];
    includeDebug?: boolean;
  };
  const question = body.question?.trim() ?? "";
  const documents = Array.isArray(body.documents) ? body.documents : [];
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
    const result = await requestGeminiText({
      prompt: buildPrompt(question, documents),
      apiKeys: geminiApiKeys,
      model: geminiModel,
    });

    return res.status(200).json({
      answer: result.text,
      sources: documents.map((document) => ({
        title: document.title,
        type: document.type,
        category: document.category,
      })),
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
