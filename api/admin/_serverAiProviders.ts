type AiProvider = "gemini" | "groq" | "nvidia" | "openrouter";

export type AiAttemptDebug = {
  provider: AiProvider;
  model: string;
  keyIndex: number | null;
  status: "success" | "fallback" | "error";
  reason: string;
};

export type AiDebugInfo = {
  provider: AiProvider;
  model: string;
  totalKeysConfigured: number;
  keyIndexUsed: number | null;
  fallbackUsed: boolean;
  providerFallbackUsed: boolean;
  quotaFailures: number;
  remainingKeysAfterSuccess: number;
  exhaustedByQuota: boolean;
  attempts: AiAttemptDebug[];
};

export type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (payload: unknown) => void;
    end: () => void;
  };
};

export type GeminiConfig = {
  apiKeys: string[];
  model: string;
};

export type GroqConfig = {
  apiKeys: string[];
  primaryModel: string;
  fallbackModel: string;
};

export type NvidiaConfig = {
  apiKeys: string[];
  primaryModel: string;
  fallbackModel: string;
};

export type OpenRouterConfig = {
  apiKeys: string[];
  primaryModel: string;
  fallbackModel: string;
  tertiaryModel: string;
};

type ProviderKeyedSuccess = {
  provider: AiProvider;
  model: string;
  totalKeysConfigured: number;
  keyIndexUsed: number;
  remainingKeysAfterSuccess: number;
  attempts: AiAttemptDebug[];
};

type ProviderFailure = {
  provider: AiProvider;
  model: string;
  totalKeysConfigured: number;
  exhaustedByQuota: boolean;
  attempts: AiAttemptDebug[];
  message: string;
};

type TextProviderResult = ProviderKeyedSuccess & {
  text: string;
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://xxxraiconxxx.github.io",
  "https://kingdoom.vercel.app",
];

export function getAllowedOrigin(requestOrigin?: string | string[]) {
  const normalizedRequestOrigin = Array.isArray(requestOrigin)
    ? requestOrigin[0]
    : requestOrigin;
  const configuredOrigins = process.env.MISSION_AI_ALLOWED_ORIGINS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const origins = configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;

  if (!normalizedRequestOrigin) {
    return origins[0] ?? "*";
  }

  if (origins.includes(normalizedRequestOrigin)) {
    return normalizedRequestOrigin;
  }

  return origins[0] ?? "*";
}

export function setCorsHeaders(req: ApiRequest, res: ApiResponse) {
  const allowedOrigin = getAllowedOrigin(req.headers.origin);
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function readGeminiConfig(): GeminiConfig {
  return {
    apiKeys: [
      ...(process.env.GEMINI_API_KEYS ?? "")
        .split(/[\n,]/g)
        .map((value) => value.trim())
        .filter(Boolean),
      ...(process.env.GEMINI_API_KEY?.trim()
        ? [process.env.GEMINI_API_KEY.trim()]
        : []),
    ],
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
  };
}

export function readGroqConfig(): GroqConfig {
  return {
    apiKeys: [
      ...(process.env.GROQ_API_KEYS ?? "")
        .split(/[\n,]/g)
        .map((value) => value.trim())
        .filter(Boolean),
      ...(process.env.GROQ_API_KEY?.trim()
        ? [process.env.GROQ_API_KEY.trim()]
        : []),
    ],
    primaryModel:
      process.env.GROQ_MODEL_PRIMARY?.trim() ||
      "meta-llama/llama-4-scout-17b-16e-instruct",
    fallbackModel:
      process.env.GROQ_MODEL_FALLBACK?.trim() || "llama-3.1-8b-instant",
  };
}

export function readNvidiaConfig(): NvidiaConfig {
  return {
    apiKeys: [
      ...(process.env.NVIDIA_API_KEYS ?? "")
        .split(/[\n,]/g)
        .map((value) => value.trim())
        .filter(Boolean),
      ...(process.env.NVIDIA_API_KEY?.trim()
        ? [process.env.NVIDIA_API_KEY.trim()]
        : []),
    ],
    primaryModel:
      process.env.NVIDIA_MODEL_PRIMARY?.trim() ||
      "deepseek-ai/deepseek-v4-flash",
    fallbackModel:
      process.env.NVIDIA_MODEL_FALLBACK?.trim() ||
      "deepseek-ai/deepseek-v4-flash",
  };
}

export function readOpenRouterConfig(): OpenRouterConfig {
  return {
    apiKeys: [
      ...(process.env.OPENROUTER_API_KEYS ?? "")
        .split(/[\n,]/g)
        .map((value) => value.trim())
        .filter(Boolean),
      ...(process.env.OPENROUTER_API_KEY?.trim()
        ? [process.env.OPENROUTER_API_KEY.trim()]
        : []),
    ],
    primaryModel:
      process.env.OPENROUTER_MODEL_PRIMARY?.trim() ||
      "nvidia/nemotron-3-super-120b-a12b:free",
    fallbackModel:
      process.env.OPENROUTER_MODEL_FALLBACK?.trim() ||
      "google/gemma-4-31b-it:free",
    tertiaryModel:
      process.env.OPENROUTER_MODEL_TERTIARY?.trim() ||
      "google/gemma-4-26b-a4b-it:free",
  };
}

export function hasTextGenerationProvider(
  gemini: GeminiConfig,
  groq: GroqConfig,
  nvidia?: NvidiaConfig,
  openrouter?: OpenRouterConfig
) {
  return (
    gemini.apiKeys.length > 0 ||
    groq.apiKeys.length > 0 ||
    Boolean(nvidia?.apiKeys.length) ||
    Boolean(openrouter?.apiKeys.length)
  );
}

export function isRetryableAiError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("too many requests") ||
    normalized.includes("retry in") ||
    normalized.includes("api key expired") ||
    normalized.includes("key expired") ||
    normalized.includes("api key not valid") ||
    normalized.includes("invalid api key") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("service unavailable") ||
    normalized.includes("overloaded") ||
    normalized.includes("timeout")
  );
}

async function parseProviderError(response: Response) {
  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return (
    payload?.error?.message ||
    payload?.message ||
    `El proveedor IA respondio con estado ${response.status}.`
  );
}

function sanitizeAiText(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```text\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractGeminiText(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function extractGroqText(payload: any) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

function extractOpenAiCompatibleText(payload: any) {
  return extractGroqText(payload);
}

function buildDebugFromSuccess(
  success: ProviderKeyedSuccess,
  previousAttempts: AiAttemptDebug[]
): AiDebugInfo {
  const attempts = [...previousAttempts, ...success.attempts];
  const quotaFailures = attempts.filter(
    (attempt) => attempt.status === "fallback"
  ).length;
  const providerFallbackUsed = previousAttempts.some(
    (attempt) => attempt.provider !== success.provider
  );

  return {
    provider: success.provider,
    model: success.model,
    totalKeysConfigured: success.totalKeysConfigured,
    keyIndexUsed: success.keyIndexUsed,
    fallbackUsed:
      providerFallbackUsed ||
      quotaFailures > 0 ||
      success.keyIndexUsed > 1,
    providerFallbackUsed,
    quotaFailures,
    remainingKeysAfterSuccess: success.remainingKeysAfterSuccess,
    exhaustedByQuota: false,
    attempts,
  };
}

function buildDebugFromFailure(
  failure: ProviderFailure,
  previousAttempts: AiAttemptDebug[]
): AiDebugInfo {
  const attempts = [...previousAttempts, ...failure.attempts];
  const quotaFailures = attempts.filter(
    (attempt) => attempt.status === "fallback"
  ).length;
  const providerFallbackUsed = previousAttempts.some(
    (attempt) => attempt.provider !== failure.provider
  );

  return {
    provider: failure.provider,
    model: failure.model,
    totalKeysConfigured: failure.totalKeysConfigured,
    keyIndexUsed: null,
    fallbackUsed: providerFallbackUsed || quotaFailures > 0,
    providerFallbackUsed,
    quotaFailures,
    remainingKeysAfterSuccess: 0,
    exhaustedByQuota: failure.exhaustedByQuota,
    attempts,
  };
}

async function requestGeminiText(input: {
  prompt: string;
  apiKeys: string[];
  model: string;
  temperature: number;
  topP: number;
  responseMimeType?: "application/json";
}): Promise<TextProviderResult> {
  let lastError = "Gemini no respondio correctamente.";
  const attempts: AiAttemptDebug[] = [];

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
            temperature: input.temperature,
            topP: input.topP,
            ...(input.responseMimeType
              ? { responseMimeType: input.responseMimeType }
              : {}),
          },
        }),
      }
    );

    if (response.ok) {
      const payload = await response.json();
      const text = sanitizeAiText(extractGeminiText(payload));

      if (!text) {
        attempts.push({
          provider: "gemini",
          model: input.model,
          keyIndex,
          status: "error",
          reason: "Gemini respondio sin texto util.",
        });
        break;
      }

      attempts.push({
        provider: "gemini",
        model: input.model,
        keyIndex,
        status: "success",
        reason: "Respuesta valida.",
      });

      return {
        provider: "gemini",
        model: input.model,
        text,
        totalKeysConfigured: input.apiKeys.length,
        keyIndexUsed: keyIndex,
        remainingKeysAfterSuccess: Math.max(0, input.apiKeys.length - keyIndex),
        attempts,
      };
    }

    const errorMessage = await parseProviderError(response);
    lastError = errorMessage;
    const retryable = isRetryableAiError(errorMessage);

    attempts.push({
      provider: "gemini",
      model: input.model,
      keyIndex,
      status: retryable && index < input.apiKeys.length - 1 ? "fallback" : "error",
      reason: errorMessage,
    });

    if (retryable && index < input.apiKeys.length - 1) {
      continue;
    }

    break;
  }

  throw {
    provider: "gemini",
    model: input.model,
    totalKeysConfigured: input.apiKeys.length,
    exhaustedByQuota: isRetryableAiError(lastError),
    attempts,
    message: lastError,
  } satisfies ProviderFailure;
}

async function requestGroqText(input: {
  prompt: string;
  apiKeys: string[];
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  topP: number;
}): Promise<TextProviderResult> {
  let lastError = "Groq no respondio correctamente.";
  const attempts: AiAttemptDebug[] = [];
  const models = Array.from(
    new Set([input.primaryModel, input.fallbackModel].filter(Boolean))
  );

  for (let keyIndex = 0; keyIndex < input.apiKeys.length; keyIndex += 1) {
    const apiKey = input.apiKeys[keyIndex];

    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const model = models[modelIndex];
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: input.prompt }],
          temperature: input.temperature,
          top_p: input.topP,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const text = sanitizeAiText(extractGroqText(payload));

        if (!text) {
          attempts.push({
            provider: "groq",
            model,
            keyIndex: keyIndex + 1,
            status: "error",
            reason: "Groq respondio sin texto util.",
          });
          continue;
        }

        attempts.push({
          provider: "groq",
          model,
          keyIndex: keyIndex + 1,
          status: "success",
          reason: "Respuesta valida.",
        });

        return {
          provider: "groq",
          model,
          text,
          totalKeysConfigured: input.apiKeys.length,
          keyIndexUsed: keyIndex + 1,
          remainingKeysAfterSuccess: Math.max(
            0,
            input.apiKeys.length - (keyIndex + 1)
          ),
          attempts,
        };
      }

      const errorMessage = await parseProviderError(response);
      lastError = errorMessage;
      const retryable = isRetryableAiError(errorMessage);
      const hasMoreAttempts =
        modelIndex < models.length - 1 || keyIndex < input.apiKeys.length - 1;

      attempts.push({
        provider: "groq",
        model,
        keyIndex: keyIndex + 1,
        status: retryable && hasMoreAttempts ? "fallback" : "error",
        reason: errorMessage,
      });

      if (retryable && hasMoreAttempts) {
        continue;
      }

      break;
    }
  }

  throw {
    provider: "groq",
    model: models[models.length - 1] || input.primaryModel,
    totalKeysConfigured: input.apiKeys.length,
    exhaustedByQuota: isRetryableAiError(lastError),
    attempts,
    message: lastError,
  } satisfies ProviderFailure;
}

async function requestNvidiaText(input: {
  prompt: string;
  apiKeys: string[];
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  topP: number;
}): Promise<TextProviderResult> {
  let lastError = "NVIDIA no respondio correctamente.";
  const attempts: AiAttemptDebug[] = [];
  const models = Array.from(
    new Set([input.primaryModel, input.fallbackModel].filter(Boolean))
  );

  for (let keyIndex = 0; keyIndex < input.apiKeys.length; keyIndex += 1) {
    const apiKey = input.apiKeys[keyIndex];

    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const model = models[modelIndex];
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: input.prompt }],
          temperature: input.temperature,
          top_p: input.topP,
          max_tokens: 8192,
          stream: false,
          chat_template_kwargs: {
            thinking: true,
            reasoning_effort: "medium",
          },
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const text = sanitizeAiText(extractOpenAiCompatibleText(payload));

        if (!text) {
          attempts.push({
            provider: "nvidia",
            model,
            keyIndex: keyIndex + 1,
            status: "error",
            reason: "NVIDIA respondio sin texto util.",
          });
          continue;
        }

        attempts.push({
          provider: "nvidia",
          model,
          keyIndex: keyIndex + 1,
          status: "success",
          reason: "Respuesta valida.",
        });

        return {
          provider: "nvidia",
          model,
          text,
          totalKeysConfigured: input.apiKeys.length,
          keyIndexUsed: keyIndex + 1,
          remainingKeysAfterSuccess: Math.max(
            0,
            input.apiKeys.length - (keyIndex + 1)
          ),
          attempts,
        };
      }

      const errorMessage = await parseProviderError(response);
      lastError = errorMessage;
      const retryable = isRetryableAiError(errorMessage);
      const hasMoreAttempts =
        modelIndex < models.length - 1 || keyIndex < input.apiKeys.length - 1;

      attempts.push({
        provider: "nvidia",
        model,
        keyIndex: keyIndex + 1,
        status: retryable && hasMoreAttempts ? "fallback" : "error",
        reason: errorMessage,
      });

      if (retryable && hasMoreAttempts) {
        continue;
      }

      break;
    }
  }

  throw {
    provider: "nvidia",
    model: models[models.length - 1] || input.primaryModel,
    totalKeysConfigured: input.apiKeys.length,
    exhaustedByQuota: isRetryableAiError(lastError),
    attempts,
    message: lastError,
  } satisfies ProviderFailure;
}

async function requestOpenRouterText(input: {
  prompt: string;
  apiKeys: string[];
  primaryModel: string;
  fallbackModel: string;
  tertiaryModel: string;
  temperature: number;
  topP: number;
}): Promise<TextProviderResult> {
  let lastError = "OpenRouter no respondio correctamente.";
  const attempts: AiAttemptDebug[] = [];
  const models = Array.from(
    new Set(
      [input.primaryModel, input.fallbackModel, input.tertiaryModel].filter(Boolean)
    )
  );

  for (let keyIndex = 0; keyIndex < input.apiKeys.length; keyIndex += 1) {
    const apiKey = input.apiKeys[keyIndex];

    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const model = models[modelIndex];
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://kingdoom.vercel.app",
          "X-Title": "Kingdoom",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: input.prompt }],
          temperature: input.temperature,
          top_p: input.topP,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const text = sanitizeAiText(extractOpenAiCompatibleText(payload));

        if (!text) {
          attempts.push({
            provider: "openrouter",
            model,
            keyIndex: keyIndex + 1,
            status: "error",
            reason: "OpenRouter respondio sin texto util.",
          });
          continue;
        }

        attempts.push({
          provider: "openrouter",
          model,
          keyIndex: keyIndex + 1,
          status: "success",
          reason: "Respuesta valida.",
        });

        return {
          provider: "openrouter",
          model,
          text,
          totalKeysConfigured: input.apiKeys.length,
          keyIndexUsed: keyIndex + 1,
          remainingKeysAfterSuccess: Math.max(
            0,
            input.apiKeys.length - (keyIndex + 1)
          ),
          attempts,
        };
      }

      const errorMessage = await parseProviderError(response);
      lastError = errorMessage;
      const retryable = isRetryableAiError(errorMessage);
      const hasMoreAttempts =
        modelIndex < models.length - 1 || keyIndex < input.apiKeys.length - 1;

      attempts.push({
        provider: "openrouter",
        model,
        keyIndex: keyIndex + 1,
        status: retryable && hasMoreAttempts ? "fallback" : "error",
        reason: errorMessage,
      });

      if (retryable && hasMoreAttempts) {
        continue;
      }

      break;
    }
  }

  throw {
    provider: "openrouter",
    model: models[models.length - 1] || input.primaryModel,
    totalKeysConfigured: input.apiKeys.length,
    exhaustedByQuota: isRetryableAiError(lastError),
    attempts,
    message: lastError,
  } satisfies ProviderFailure;
}

export async function requestAiTextWithFallback(input: {
  prompt: string;
  gemini: GeminiConfig;
  groq: GroqConfig;
  nvidia?: NvidiaConfig;
  openrouter?: OpenRouterConfig;
  temperature: number;
  topP: number;
}) {
  const previousAttempts: AiAttemptDebug[] = [];
  let lastFailure: ProviderFailure | null = null;

  if (input.gemini.apiKeys.length) {
    try {
      const success = await requestGeminiText({
        prompt: input.prompt,
        apiKeys: input.gemini.apiKeys,
        model: input.gemini.model,
        temperature: input.temperature,
        topP: input.topP,
      });

      return {
        text: success.text,
        debug: buildDebugFromSuccess(success, previousAttempts),
      };
    } catch (error) {
      lastFailure = error as ProviderFailure;
      previousAttempts.push(...lastFailure.attempts);
    }
  }

  if (input.groq.apiKeys.length) {
    try {
      const success = await requestGroqText({
        prompt: input.prompt,
        apiKeys: input.groq.apiKeys,
        primaryModel: input.groq.primaryModel,
        fallbackModel: input.groq.fallbackModel,
        temperature: input.temperature,
        topP: input.topP,
      });

      return {
        text: success.text,
        debug: buildDebugFromSuccess(success, previousAttempts),
      };
    } catch (error) {
      lastFailure = error as ProviderFailure;
      previousAttempts.push(...lastFailure.attempts);
    }
  }

  if (input.nvidia?.apiKeys.length) {
    try {
      const success = await requestNvidiaText({
        prompt: input.prompt,
        apiKeys: input.nvidia.apiKeys,
        primaryModel: input.nvidia.primaryModel,
        fallbackModel: input.nvidia.fallbackModel,
        temperature: input.temperature,
        topP: input.topP,
      });

      return {
        text: success.text,
        debug: buildDebugFromSuccess(success, previousAttempts),
      };
    } catch (error) {
      lastFailure = error as ProviderFailure;
      previousAttempts.push(...lastFailure.attempts);
    }
  }

  if (input.openrouter?.apiKeys.length) {
    try {
      const success = await requestOpenRouterText({
        prompt: input.prompt,
        apiKeys: input.openrouter.apiKeys,
        primaryModel: input.openrouter.primaryModel,
        fallbackModel: input.openrouter.fallbackModel,
        tertiaryModel: input.openrouter.tertiaryModel,
        temperature: input.temperature,
        topP: input.topP,
      });

      return {
        text: success.text,
        debug: buildDebugFromSuccess(success, previousAttempts),
      };
    } catch (error) {
      lastFailure = error as ProviderFailure;
      previousAttempts.push(...lastFailure.attempts);
    }
  }

  if (lastFailure) {
    throw {
      message: lastFailure.message,
      debug: buildDebugFromFailure(lastFailure, []),
    };
  }

  throw new Error(
    "Falta GEMINI_API_KEYS/GEMINI_API_KEY, GROQ_API_KEYS/GROQ_API_KEY, NVIDIA_API_KEYS/NVIDIA_API_KEY u OPENROUTER_API_KEYS/OPENROUTER_API_KEY en el backend."
  );
}

export async function requestAiJsonWithFallback<T>(input: {
  prompt: string;
  gemini: GeminiConfig;
  groq: GroqConfig;
  nvidia?: NvidiaConfig;
  openrouter?: OpenRouterConfig;
  temperature: number;
  topP: number;
}) {
  const previousAttempts: AiAttemptDebug[] = [];
  let lastFailure: ProviderFailure | null = null;
  const providers = [
    input.gemini.apiKeys.length
      ? {
          provider: "gemini" as const,
          run: () =>
            requestGeminiText({
              prompt: input.prompt,
              apiKeys: input.gemini.apiKeys,
              model: input.gemini.model,
              temperature: input.temperature,
              topP: input.topP,
              responseMimeType: "application/json",
            }),
        }
      : null,
    input.groq.apiKeys.length
      ? {
          provider: "groq" as const,
          run: () =>
            requestGroqText({
              prompt: input.prompt,
              apiKeys: input.groq.apiKeys,
              primaryModel: input.groq.primaryModel,
              fallbackModel: input.groq.fallbackModel,
              temperature: input.temperature,
              topP: input.topP,
            }),
        }
      : null,
    input.nvidia?.apiKeys.length
      ? {
          provider: "nvidia" as const,
          run: () =>
            requestNvidiaText({
              prompt: input.prompt,
              apiKeys: input.nvidia!.apiKeys,
              primaryModel: input.nvidia!.primaryModel,
              fallbackModel: input.nvidia!.fallbackModel,
              temperature: input.temperature,
              topP: input.topP,
            }),
        }
      : null,
    input.openrouter?.apiKeys.length
      ? {
          provider: "openrouter" as const,
          run: () =>
            requestOpenRouterText({
              prompt: input.prompt,
              apiKeys: input.openrouter!.apiKeys,
              primaryModel: input.openrouter!.primaryModel,
              fallbackModel: input.openrouter!.fallbackModel,
              tertiaryModel: input.openrouter!.tertiaryModel,
              temperature: input.temperature,
              topP: input.topP,
            }),
        }
      : null,
  ].filter(Boolean) as Array<{
    provider: AiProvider;
    run: () => Promise<TextProviderResult>;
  }>;

  for (const entry of providers) {
    try {
      const success = await entry.run();

      try {
        const data = JSON.parse(success.text) as T;
        return {
          data,
          debug: buildDebugFromSuccess(success, previousAttempts),
        };
      } catch {
        previousAttempts.push(
          ...success.attempts.map((attempt, index, items) =>
            index === items.length - 1
              ? { ...attempt, status: "error" as const, reason: "JSON invalido." }
              : attempt
          )
        );
        lastFailure = {
          provider: success.provider,
          model: success.model,
          totalKeysConfigured: success.totalKeysConfigured,
          exhaustedByQuota: false,
          attempts: [],
          message: `${success.provider} devolvio JSON invalido.`,
        };
      }
    } catch (error) {
      lastFailure = error as ProviderFailure;
      previousAttempts.push(...lastFailure.attempts);
    }
  }

  if (lastFailure) {
    throw {
      message: lastFailure.message,
      debug: buildDebugFromFailure(lastFailure, []),
    };
  }

  throw new Error(
    "Falta GEMINI_API_KEYS/GEMINI_API_KEY, GROQ_API_KEYS/GROQ_API_KEY, NVIDIA_API_KEYS/NVIDIA_API_KEY u OPENROUTER_API_KEYS/OPENROUTER_API_KEY en el backend."
  );
}
