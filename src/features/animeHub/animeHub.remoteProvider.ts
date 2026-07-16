import type {
  AnimeEpisodeLinks,
  AnimeEpisodeSummary,
  AnimeHubProvider,
  AnimeSearchFilters,
  AnimeSeriesDetail,
  AnimeSeriesSummary,
} from "./animeHub.types";
import { isEmptySearchStatus } from "../../../server/anime/providerContract";

export const ANIME_PROVIDER_OPTIONS = [
  { id: "all", label: "Automatico" },
  { id: "animeflv", label: "AnimeFLV" },
  { id: "tioanime", label: "TioAnime" },
  { id: "anichi", label: "AniChi (beta)" },
] as const;

export type AnimeProviderId = (typeof ANIME_PROVIDER_OPTIONS)[number]["id"];
export type AnimePlaybackProviderId = Exclude<AnimeProviderId, "all">;
export type AnimeProviderHealth = "idle" | "online" | "degraded" | "offline";

export type AnimeProviderDiagnostic = {
  id: AnimePlaybackProviderId;
  label: string;
  status: AnimeProviderHealth;
  latencyMs?: number;
  upstream?: string;
  checkedAt?: number;
  message?: string;
};

type JsonRecord = Record<string, unknown>;

type SeriesReference = {
  source: AnimePlaybackProviderId;
  id: string;
  title: string;
  url?: string;
  alternates?: SeriesReference[];
};

type EpisodeReference = {
  source: AnimePlaybackProviderId;
  id: string;
  number: number;
  seriesId?: string;
};

type ProxyMeta = {
  latencyMs?: number;
  provider?: string;
  upstream?: string;
};

type ProxyResponse = {
  data?: unknown;
  message?: string;
  meta?: ProxyMeta;
};

type CacheEntry = { expiresAt: number; value: ProxyResponse };
type ProxyParams = Record<string, string>;

const PLAYBACK_PROVIDERS: AnimePlaybackProviderId[] = [
  "animeflv",
  "tioanime",
  "anichi",
];
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const DIRECT_API_URL =
  import.meta.env.VITE_ANIME_HUB_API_URL?.trim() ||
  "https://scraping-web-anime-api.vercel.app";
const DIRECT_API_KEY = import.meta.env.VITE_ANIME_HUB_API_KEY?.trim() ?? "";
const PROXY_API_URL = import.meta.env.VITE_ANIME_PROXY_URL?.trim() ?? "";
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<ProxyResponse>>();

const diagnostics = new Map<AnimePlaybackProviderId, AnimeProviderDiagnostic>(
  PLAYBACK_PROVIDERS.map((id) => [
    id,
    {
      id,
      label: ANIME_PROVIDER_OPTIONS.find((option) => option.id === id)?.label ?? id,
      status: "idle",
    },
  ])
);

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(record: JsonRecord | null, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function readNumber(record: JsonRecord | null, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(record?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function nestedPayload(value: unknown) {
  const record = asRecord(value);
  return record?.results ?? record?.media ?? record?.anime ?? record?.data ?? value;
}

function encodeReference(value: SeriesReference | EpisodeReference) {
  return encodeURIComponent(JSON.stringify(value));
}

function decodeReference<T extends SeriesReference | EpisodeReference>(value: string): T | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return asRecord(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);
}

function generatedCover(title: string) {
  const hue = [...title].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AN";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 840"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue} 72% 24%)"/><stop offset="1" stop-color="#09090b"/></linearGradient></defs><rect width="600" height="840" rx="42" fill="url(#g)"/><circle cx="470" cy="150" r="180" fill="hsl(${(hue + 42) % 360} 82% 56% / .22)"/><path d="M0 620Q300 470 600 650V840H0Z" fill="#000" opacity=".3"/><text x="300" y="390" text-anchor="middle" font-family="Georgia" font-size="150" font-weight="700" fill="#fff">${escapeSvg(initials)}</text><text x="300" y="485" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" letter-spacing="8" fill="#fde68a">KINGDOOM</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeGenres(value: unknown) {
  return asArray(value)
    .map((genre) =>
      typeof genre === "string"
        ? genre
        : readString(asRecord(genre), "name", "title", "genre")
    )
    .filter((genre): genre is string => Boolean(genre));
}

function providerLabel(source: AnimePlaybackProviderId) {
  return ANIME_PROVIDER_OPTIONS.find((option) => option.id === source)?.label ?? source;
}

function normalizeSummary(
  source: AnimePlaybackProviderId,
  value: unknown,
  fallback?: Partial<SeriesReference>
): AnimeSeriesSummary {
  const item = asRecord(value);
  const title = readString(item, "title", "name", "canonicalTitle") || fallback?.title || "Titulo no disponible";
  const id = readString(item, "slug", "id", "animeId", "url", "link") || fallback?.id || title;
  const url = readString(item, "url", "link", "href") || fallback?.url;
  const cover = readString(
    item,
    "cover",
    "image",
    "poster",
    "thumbnail",
    "coverImage"
  );
  const banner = readString(item, "banner", "backdrop", "bannerImage");
  const synopsis = readString(item, "synopsis", "description", "summary") || "Sin sinopsis disponible.";
  const year = readString(item, "year", "releaseYear", "aired") || "N/D";
  const score = readString(item, "score", "rating");

  return {
    id: encodeReference({ source, id, title, url }),
    title,
    altTitle: readString(item, "alternative_titles", "alternativeTitle", "titleEnglish"),
    coverImage: cover || generatedCover(title),
    bannerImage: banner || cover,
    synopsis,
    genres: normalizeGenres(item?.genres ?? item?.categories),
    year,
    statusLabel: readString(item, "status", "type") || "Disponible",
    providerLabel: providerLabel(source),
    score,
  };
}

function normalizeEpisodes(
  source: AnimePlaybackProviderId,
  value: unknown,
  seriesId: string
): AnimeEpisodeSummary[] {
  return asArray(value)
    .map((episode, index) => {
      const item = asRecord(episode);
      const number = readNumber(item, "number", "episode", "episodeNumber") ?? index + 1;
      const id = readString(item, "slug", "id", "episodeId", "url", "link") || `${seriesId}-${number}`;
      return {
        id: encodeReference({ source, id, number, seriesId }),
        number,
        title: readString(item, "title", "name") || `Episodio ${number}`,
        duration: readString(item, "duration"),
        status: "ready" as const,
      };
    })
    .sort((left, right) => left.number - right.number);
}

function normalizeDetail(
  source: AnimePlaybackProviderId,
  value: unknown,
  reference: SeriesReference
): AnimeSeriesDetail {
  const item = asRecord(nestedPayload(value));
  const summary = normalizeSummary(source, item, reference);
  const episodes = normalizeEpisodes(source, item?.episodes, reference.id);
  const episodeCount = readNumber(item, "totalEpisodes", "episodeCount", "episodesCount") ?? episodes.length;

  return {
    ...summary,
    episodeCount,
    releaseWindow: readString(item, "season", "releaseWindow", "year") || summary.year,
    featuredQuote:
      summary.synopsis.length > 150
        ? `${summary.synopsis.slice(0, 150).trim()}...`
        : summary.synopsis,
    episodes,
    downloads: [],
  };
}

function normalizeLinks(value: unknown): AnimeEpisodeLinks {
  const item = asRecord(nestedPayload(value));
  const normalize = (entries: unknown, download = false) =>
    asArray(entries)
      .map((entry) => {
        const record = asRecord(entry);
        const url = readString(record, ...(download
          ? ["download", "downloadUrl", "url", "link"]
          : ["url", "link", "embed"]));
        return url
          ? {
              server: readString(record, "server", "name") || (download ? "Descarga" : "Servidor"),
              url,
              quality: readString(record, "quality"),
            }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return {
    stream: normalize(item?.stream ?? item?.streams ?? item?.servers ?? item?.sources),
    download: normalize(item?.download ?? item?.downloads, true),
  };
}

function directProviderUrl(params: ProxyParams) {
  const usesStaticHosting =
    typeof window !== "undefined" &&
    (window.location.hostname.endsWith("github.io") || window.location.protocol === "file:");

  if (
    !usesStaticHosting ||
    PROXY_API_URL ||
    !DIRECT_API_URL ||
    !DIRECT_API_KEY ||
    params.action === "metadata"
  ) {
    return null;
  }

  const url = new URL(DIRECT_API_URL);
  const basePath = url.pathname.replace(/\/$/, "");

  if (params.action === "search") {
    url.pathname = `${basePath}/api/search`;
    url.searchParams.set("q", params.query ?? "");
  } else if (params.action === "detail") {
    url.pathname = `${basePath}/api/anime/${encodeURIComponent(params.id ?? "")}`;
  } else if (params.action === "links") {
    url.pathname = `${basePath}/api/episode/${encodeURIComponent(params.id ?? "")}`;
  } else {
    return null;
  }

  url.searchParams.set("source", params.provider ?? "animeflv");
  url.searchParams.set("key", DIRECT_API_KEY);
  return url;
}

function proxyProviderUrl(params: ProxyParams) {
  const url = new URL(PROXY_API_URL || "/api/anime/proxy", window.location.origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

async function requestProxy(params: ProxyParams, ttl = CACHE_TTL_MS) {
  const directUrl = directProviderUrl(params);
  const url = directUrl ?? proxyProviderUrl(params);
  const key = `${directUrl ? "direct" : "proxy"}:${url.toString()}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const body = (await response.json().catch(() => null)) as ProxyResponse | null;
      const value = directUrl
        ? {
            data: asRecord(body)?.data ?? body,
            message: readString(asRecord(body), "message", "error"),
            meta: {
              provider: params.provider,
              upstream: "direct",
            },
          }
        : body ?? {};
      if (isEmptySearchStatus(params.action as "search" | "detail" | "links", response.status)) {
        const emptyValue = {
          data: [],
          message: value.message || "Sin coincidencias.",
          meta: value.meta,
        };
        cache.set(key, { expiresAt: Date.now() + ttl, value: emptyValue });
        return emptyValue;
      }
      if (!response.ok) {
        throw new Error(value.message || `El servidor anime respondio ${response.status}.`);
      }
      cache.set(key, { expiresAt: Date.now() + ttl, value });
      return value;
    } finally {
      window.clearTimeout(timeoutId);
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
}

function updateDiagnostic(
  source: AnimePlaybackProviderId,
  status: AnimeProviderHealth,
  meta?: ProxyMeta,
  message?: string
) {
  diagnostics.set(source, {
    id: source,
    label: providerLabel(source),
    status,
    latencyMs: meta?.latencyMs,
    upstream: meta?.upstream,
    checkedAt: Date.now(),
    message,
  });
}

async function searchSource(source: AnimePlaybackProviderId, query: string) {
  try {
    const response = await requestProxy({ action: "search", provider: source, query });
    const entries = asArray(nestedPayload(response.data));
    updateDiagnostic(
      source,
      response.meta?.upstream === "animeflv-backup" ? "degraded" : "online",
      response.meta
    );
    return entries.map((item) => normalizeSummary(source, item));
  } catch (error) {
    updateDiagnostic(
      source,
      "offline",
      undefined,
      error instanceof Error ? error.message : "Proveedor no disponible."
    );
    throw error;
  }
}

function titleKey(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mergeResults(groups: AnimeSeriesSummary[][]) {
  const merged = new Map<string, AnimeSeriesSummary>();
  for (const item of groups.flat()) {
    const key = titleKey(item.title);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, item);
      continue;
    }

    const currentRef = decodeReference<SeriesReference>(current.id);
    const nextRef = decodeReference<SeriesReference>(item.id);
    if (!currentRef || !nextRef || currentRef.source === nextRef.source) continue;
    currentRef.alternates = [...(currentRef.alternates ?? []), nextRef];
    merged.set(key, { ...current, id: encodeReference(currentRef) });
  }
  return [...merged.values()].slice(0, 24);
}

async function getMetadata(title: string) {
  try {
    return (await requestProxy({ action: "metadata", query: title }, 60 * 60 * 1000)).data;
  } catch {
    return null;
  }
}

async function fetchDetail(reference: SeriesReference) {
  const response = await requestProxy({
    action: "detail",
    provider: reference.source,
    id: reference.id,
  });
  return normalizeDetail(reference.source, response.data, reference);
}

function enrichDetail(detail: AnimeSeriesDetail, metadata: unknown) {
  const item = asRecord(metadata);
  if (!item) return detail;
  const genres = normalizeGenres(item.genres);
  return {
    ...detail,
    synopsis:
      detail.synopsis === "Sin sinopsis disponible."
        ? readString(item, "synopsis") || detail.synopsis
        : detail.synopsis,
    coverImage: detail.coverImage.startsWith("data:image/")
      ? readString(item, "image") || detail.coverImage
      : detail.coverImage,
    genres: detail.genres.length ? detail.genres : genres,
    year: detail.year === "N/D" ? readString(item, "year") || detail.year : detail.year,
    score: detail.score || readString(item, "score"),
  };
}

export function getAnimeProviderDiagnostics() {
  return PLAYBACK_PROVIDERS.map((provider) => ({ ...diagnostics.get(provider)! }));
}

export const remoteAnimeHubProvider: AnimeHubProvider = {
  id: "anime-server-proxy",
  label: "Kingdoom Anime",
  status: "ready",
  endpointMap: {
    search: "/api/anime/proxy?action=search",
    info: "/api/anime/proxy?action=detail",
    episode: "/api/anime/proxy?action=links",
    download: "/api/anime/proxy?action=links",
    batch: "Modo automatico paralelo",
  },
  async searchSeries(filters: AnimeSearchFilters) {
    const query = filters.query.trim();
    if (query.length < 2) return [];
    const provider = PLAYBACK_PROVIDERS.includes(filters.provider as AnimePlaybackProviderId)
      ? (filters.provider as AnimePlaybackProviderId)
      : "all";
    if (provider !== "all") return searchSource(provider, query);

    const settled = await Promise.allSettled(
      PLAYBACK_PROVIDERS.map((source) => searchSource(source, query))
    );
    const successful = settled
      .filter((result): result is PromiseFulfilledResult<AnimeSeriesSummary[]> => result.status === "fulfilled")
      .map((result) => result.value);
    if (!successful.length) throw new Error("Ningun proveedor de anime respondio.");
    return mergeResults(successful);
  },
  async getSeriesDetail(seriesId: string) {
    const reference = decodeReference<SeriesReference>(seriesId);
    if (!reference) return null;
    const references = [reference, ...(reference.alternates ?? [])];
    for (const candidate of references) {
      try {
        const [detail, metadata] = await Promise.all([
          fetchDetail(candidate),
          getMetadata(candidate.title),
        ]);
        return enrichDetail(detail, metadata);
      } catch {
        // Try the same title through the next provider gathered by automatic search.
      }
    }
    return null;
  },
  async getEpisodeLinks(episodeId: string) {
    const reference = decodeReference<EpisodeReference>(episodeId);
    if (!reference) return null;
    try {
      const response = await requestProxy(
        {
          action: "links",
          provider: reference.source,
          id: reference.id,
          series: reference.seriesId || "",
          episode: String(reference.number),
        },
        2 * 60 * 1000
      );
      const links = normalizeLinks(response.data);
      return links.stream.length || links.download.length ? links : null;
    } catch {
      return null;
    }
  },
};
