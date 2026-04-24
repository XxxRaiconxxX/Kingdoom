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

  return {
    geminiApiKey: geminiApiKeys[0],
    geminiApiKeys,
    geminiModel,
  };
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

async function parseGeminiError(response: Response) {
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

async function requestGeminiRaw(input: {
  body: Record<string, unknown>;
  model: string;
  apiKeys: string[];
}) {
  if (!input.apiKeys.length) {
    throw new Error(
      "Falta GEMINI_API_KEY o GEMINI_API_KEYS en el backend."
    );
  }

  let lastError = "No se pudo completar la consulta a Gemini.";

  for (let index = 0; index < input.apiKeys.length; index += 1) {
    const apiKey = input.apiKeys[index];
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input.body),
      }
    );

    if (response.ok) {
      return response.json();
    }

    const errorMessage = await parseGeminiError(response);
    lastError = errorMessage;

    const canRetryWithAnotherKey =
      index < input.apiKeys.length - 1 && isQuotaLikeError(errorMessage);

    if (canRetryWithAnotherKey) {
      continue;
    }

    throw new Error(errorMessage);
  }

  throw new Error(lastError);
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
  apiKeys: string[];
  model: string;
}) {
  const payload = await requestGeminiRaw({
    model: input.model,
    apiKeys: input.apiKeys,
    body: {
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
    },
  });

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
  apiKeys: string[];
  model: string;
}) {
  const payload = await requestGeminiRaw({
    model: input.model,
    apiKeys: input.apiKeys,
    body: {
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
    },
  });

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

export async function requestGeminiTextWithParts(input: {
  parts: Array<Record<string, unknown>>;
  model: string;
  apiKeys: string[];
  temperature?: number;
  topP?: number;
}) {
  const payload = await requestGeminiRaw({
    model: input.model,
    apiKeys: input.apiKeys,
    body: {
      contents: [
        {
          role: "user",
          parts: input.parts,
        },
      ],
      generationConfig: {
        temperature: input.temperature ?? 0.1,
        topP: input.topP ?? 0.7,
      },
    },
  });

  return extractTextFromGeminiResponse(payload);
}

export type { ApiRequest, ApiResponse };
