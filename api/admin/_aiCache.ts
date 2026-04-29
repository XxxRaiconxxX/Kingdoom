type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const globalCache = globalThis as typeof globalThis & {
  __kingdoomAiCache?: Map<string, CacheEntry<unknown>>;
};

function getStore() {
  if (!globalCache.__kingdoomAiCache) {
    globalCache.__kingdoomAiCache = new Map();
  }

  return globalCache.__kingdoomAiCache;
}

export function stableCacheKey(parts: unknown[]) {
  const raw = JSON.stringify(parts);
  let hash = 5381;

  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 33) ^ raw.charCodeAt(index);
  }

  return `ai:${(hash >>> 0).toString(36)}`;
}

export function getCachedAiResponse<T>(key: string): T | null {
  const store = getStore();
  const entry = store.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCachedAiResponse<T>(key: string, value: T, ttlMs: number) {
  getStore().set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}
