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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  if (!geminiApiKey) {
    return res.status(500).json({
      message: "Falta GEMINI_API_KEY en el backend.",
    });
  }

  const body = (req.body ?? {}) as {
    fileName?: string;
    mimeType?: string;
    base64?: string;
  };
  const base64 = body.base64?.trim();
  const mimeType = body.mimeType?.trim() || "application/pdf";

  if (!base64) {
    return res.status(400).json({ message: "No se recibio el PDF." });
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Extrae el texto legible de este PDF para usarlo como base documental de lore. Devuelve solo texto plano, sin comentarios.",
                },
                {
                  inlineData: {
                    mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.7,
          },
        }),
      }
    );

    const geminiPayload = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(502).json({
        message:
          geminiPayload?.error?.message ||
          "Gemini no pudo leer el PDF correctamente.",
      });
    }

    const text = extractTextFromGeminiResponse(geminiPayload);

    return res.status(200).json({
      text,
      fileName: body.fileName ?? "",
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? `No se pudo extraer el PDF. ${error.message}`
          : "No se pudo extraer el PDF.",
    });
  }
}
