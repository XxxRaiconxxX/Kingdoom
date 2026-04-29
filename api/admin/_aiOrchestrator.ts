import {
  hasTextGenerationProvider,
  readGeminiConfig,
  readGroqConfig,
  readNvidiaConfig,
  requestAiJsonWithFallback,
  requestAiTextWithFallback,
  type GeminiConfig,
  type GroqConfig,
  type NvidiaConfig,
} from "./_serverAiProviders.js";

type AiServerConfig = {
  gemini: GeminiConfig;
  groq: GroqConfig;
  nvidia: NvidiaConfig;
};

export function readAiServerConfig(): AiServerConfig {
  return {
    gemini: readGeminiConfig(),
    groq: readGroqConfig(),
    nvidia: readNvidiaConfig(),
  };
}

export function ensureAiProvider(config: AiServerConfig) {
  return hasTextGenerationProvider(config.gemini, config.groq, config.nvidia);
}

export function missingAiProviderMessage() {
  return "Falta GEMINI_API_KEYS/GEMINI_API_KEY, GROQ_API_KEYS/GROQ_API_KEY o NVIDIA_API_KEYS/NVIDIA_API_KEY en el backend.";
}

export async function runAiText(input: {
  prompt: string;
  temperature: number;
  topP: number;
  config?: AiServerConfig;
}) {
  const config = input.config ?? readAiServerConfig();

  return requestAiTextWithFallback({
    prompt: input.prompt,
    gemini: config.gemini,
    groq: config.groq,
    nvidia: config.nvidia,
    temperature: input.temperature,
    topP: input.topP,
  });
}

export async function runAiJson<T>(input: {
  prompt: string;
  temperature: number;
  topP: number;
  config?: AiServerConfig;
}) {
  const config = input.config ?? readAiServerConfig();

  return requestAiJsonWithFallback<T>({
    prompt: input.prompt,
    gemini: config.gemini,
    groq: config.groq,
    nvidia: config.nvidia,
    temperature: input.temperature,
    topP: input.topP,
  });
}
