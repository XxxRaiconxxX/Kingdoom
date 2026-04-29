export type AiAttemptDebug = {
  provider: "gemini" | "groq" | "nvidia" | "openrouter";
  model: string;
  keyIndex: number | null;
  status: "success" | "fallback" | "error";
  reason: string;
};

export type AiDebugInfo = {
  provider: "gemini" | "groq" | "nvidia" | "openrouter";
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
