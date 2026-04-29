import {
  readGeminiConfig,
  readGroqConfig,
  readNvidiaConfig,
  requestAiTextWithFallback,
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
  hasTextGenerationProvider,
} from "./_serverAiProviders.js";

type ArchivistDocument = {
  title: string;
  type: string;
  category: string;
  tags?: string[];
  source?: string;
  summary?: string;
  content: string;
};

type ArchivistMode = "canon" | "deep" | "mechanics";

function normalizeMode(mode?: string): ArchivistMode {
  if (mode === "deep" || mode === "mechanics") return mode;
  return "canon";
}

function buildPrompt(
  question: string,
  documents: ArchivistDocument[],
  mode: ArchivistMode
) {
  const context = documents
    .map((document, index) => {
      const content = document.content.slice(0, mode === "deep" ? 9000 : 6500);
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
  const modeInstruction =
    mode === "deep"
      ? "Modo profundo: cruza fuentes, separa hechos confirmados de inferencias y da una respuesta mas completa."
      : mode === "mechanics"
        ? "Modo mecanicas: prioriza balance, reglas, limites, cooldowns, riesgos de abuso y coherencia de sistema."
        : "Modo canon: responde directo, con prudencia y sin extenderte mas de lo necesario.";

  return `
Eres el Archivista de Argentis, asistente de consulta para Kingdoom.

Responde usando SOLO la base documental entregada. Si la respuesta no aparece en los documentos, dilo con claridad y sugiere que el staff cargue mas lore.

${modeInstruction}

Reglas:
- No inventes canon.
- No des por oficial algo que no este en los documentos.
- Responde en espanol, con tono claro y elegante.
- Si hay contradicciones, mencionalas como posible conflicto de fuentes.
- Cita nombres de fuentes cuando ayuden a ubicar la respuesta.
- No uses markdown complejo.
- Si haces una inferencia, marcala como inferencia.

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

  const gemini = readGeminiConfig();
  const groq = readGroqConfig();
  const nvidia = readNvidiaConfig();

  if (!hasTextGenerationProvider(gemini, groq, nvidia)) {
    return res.status(500).json({
      message:
        "Falta GEMINI_API_KEYS/GEMINI_API_KEY, GROQ_API_KEYS/GROQ_API_KEY o NVIDIA_API_KEYS/NVIDIA_API_KEY en el backend.",
    });
  }

  const body = (req.body ?? {}) as {
    question?: string;
    mode?: ArchivistMode;
    documents?: ArchivistDocument[];
    includeDebug?: boolean;
  };
  const question = body.question?.trim() ?? "";
  const documents = Array.isArray(body.documents) ? body.documents : [];
  const mode = normalizeMode(body.mode);
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
    const result = await requestAiTextWithFallback({
      prompt: buildPrompt(question, documents, mode),
      gemini,
      groq,
      nvidia,
      temperature: mode === "mechanics" ? 0.28 : 0.35,
      topP: mode === "mechanics" ? 0.78 : 0.85,
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
