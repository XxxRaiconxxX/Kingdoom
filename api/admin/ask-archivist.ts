import { readGeminiConfig, requestGeminiText } from "./_gemini";

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
  };
  const question = body.question?.trim() ?? "";
  const documents = Array.isArray(body.documents) ? body.documents : [];

  if (!question) {
    return res.status(400).json({ message: "La pregunta esta vacia." });
  }

  if (documents.length === 0) {
    return res.status(400).json({
      message: "No hay documentos relevantes para consultar.",
    });
  }

  try {
    const answer = await requestGeminiText({
      prompt: buildPrompt(question, documents),
      apiKeys: geminiApiKeys,
      model: geminiModel,
    });

    return res.status(200).json({
      answer,
      sources: documents.map((document) => ({
        title: document.title,
        type: document.type,
        category: document.category,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? `No se pudo consultar al Archivista. ${error.message}`
          : "No se pudo consultar al Archivista.",
    });
  }
}
