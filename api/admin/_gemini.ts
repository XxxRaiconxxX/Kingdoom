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

export function setCorsHeaders(req: ApiRequest, res: ApiResponse) {
  const allowedOrigin = getAllowedOrigin(req.headers.origin);
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function readGeminiConfig() {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  return { geminiApiKey, geminiModel };
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

export async function requestGeminiJson<T>(input: {
  prompt: string;
  apiKey: string;
  model: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${encodeURIComponent(input.apiKey)}`,
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
          temperature: 0.95,
          topP: 0.9,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        "Gemini no respondio correctamente a la peticion JSON."
    );
  }

  const rawText = extractTextFromGeminiResponse(payload);

  if (!rawText) {
    throw new Error("Gemini respondio sin texto util.");
  }

  const sanitized = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(sanitized) as T;
}

export async function requestGeminiText(input: {
  prompt: string;
  apiKey: string;
  model: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${encodeURIComponent(input.apiKey)}`,
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
          temperature: 0.92,
          topP: 0.9,
        },
      }),
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        "Gemini no respondio correctamente al generar texto."
    );
  }

  const rawText = extractTextFromGeminiResponse(payload);

  if (!rawText) {
    throw new Error("Gemini respondio sin texto util.");
  }

  return rawText
    .replace(/^```text\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export type { ApiRequest, ApiResponse };
