export type AiAttemptDebug = {
  keyIndex: number;
  status: "success" | "quota-fallback" | "error";
  reason: string;
};

export type AiDebugInfo = {
  model: string;
  totalKeysConfigured: number;
  keyIndexUsed: number | null;
  fallbackUsed: boolean;
  quotaFailures: number;
  remainingKeysAfterSuccess: number;
  exhaustedByQuota: boolean;
  attempts: AiAttemptDebug[];
};
