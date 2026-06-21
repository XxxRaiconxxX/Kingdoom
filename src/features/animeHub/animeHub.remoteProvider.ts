import type {
  AnimeEpisodeLinks,
  AnimeEpisodeSummary,
  AnimeHubProvider,
  AnimeSeriesDetail,
  AnimeSeriesSummary,
} from "./animeHub.types";

type ProviderSource = "anime-website" | "anime-platform" | "animeflv" | "tioanime" | "veranimeonline" | "animeav1" | "jkanime";

type SeriesReference = {
  source: ProviderSource;
  id?: string;
  url?: string;
  title?: string;
  image?: string;
  backdrop?: string;
};

type EpisodeReference = {
  source: ProviderSource;
  id?: string;
  url?: string;
  number?: number;
  seriesId?: string; // El slug de la serie para AnimeFLV
};

const ANIME_WEBSITE_BASE_URL = import.meta.env.VITE_ANIME_WEBSITE_API_URL;
const ANIME_WEBSITE_API_KEY = import.meta.env.VITE_ANIME_WEBSITE_API_KEY;
const ANIME_PLATFORM_BASE_URL = import.meta.env.VITE_ANIME_PLATFORM_API_URL;
const ANIME_PLATFORM_API_KEY = import.meta.env.VITE_ANIME_PLATFORM_API_KEY;
const ANIMEFLV_BASE_URL = import.meta.env.VITE_ANIMEFLV_API_URL;
const ANIME_HUB_API_KEY = import.meta.env.VITE_ANIME_HUB_API_KEY || "kingdoom-secret-key-2026";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80";
const PLACEHOLDER_PALETTES = [
  ["#3b0712", "#f43f5e", "#fed7aa"],
  ["#082f49", "#22d3ee", "#dbeafe"],
  ["#2e1065", "#a855f7", "#f5d0fe"],
  ["#052e16", "#34d399", "#dcfce7"],
  ["#451a03", "#f59e0b", "#fef3c7"],
  ["#111827", "#94a3b8", "#f8fafc"],
] as const;

function hasRemoteAnimeProvider() {
  return true;
}

function endpoint(path: string, baseUrl?: string) {
  if (!baseUrl) {
    throw new Error(`Missing base URL for endpoint ${path}`);
  }

  return new URL(path, baseUrl).toString();
}

function requestHeaders(apiKey?: string) {
  if (!apiKey) {
    return undefined;
  }

  return {
    "x-api-key": apiKey,
    Authorization: `Bearer ${apiKey}`,
  };
}

async function fetchJson<T = any>(url: string, headers?: HeadersInit, timeout = 8000) {
  // Mejora 2: Caché de Sesión
  const cacheKey = `anime_cache_${url}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) {
      console.warn(`Fetch error: ${response.status} for ${url}`);
      return null;
    }
    const result = await response.json();
    
    // Guardar en caché si es exitoso
    if (result) {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    }
    
    return result as T;
  } catch (error) {
    clearTimeout(id);
    console.error(`Fetch exception for ${url}:`, error);
    return null;
  }
}

function asList<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function unwrapPayload(data: any) {
  return data?.data ?? data;
}

function normalizeGenres(value: unknown): string[] {
  return asList<any>(value)
    .map((genre) =>
      typeof genre === "string"
        ? genre
        : genre?.name ?? genre?.title ?? genre?.genre
    )
    .filter(Boolean);
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function normalizeAssetUrl(baseUrl: string | undefined, ...values: unknown[]) {
  const raw = firstText(...values);
  if (!raw) {
    return undefined;
  }

  try {
    return new URL(raw, baseUrl || window.location.origin).toString();
  } catch {
    return raw;
  }
}

function hashText(value: string) {
  return value.split("").reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeGeneratedCover(title: string, variant = 0) {
  const seed = hashText(`${title}-${variant}`);
  const [base, accent, ink] = PLACEHOLDER_PALETTES[seed % PLACEHOLDER_PALETTES.length];
  const initials =
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AN";
  const safeTitle = escapeSvgText(title.slice(0, 34));
  const runeA = 24 + (seed % 42);
  const runeB = 118 + (seed % 30);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460">
      <defs>
        <radialGradient id="glow" cx="50%" cy="34%" r="70%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.85"/>
          <stop offset="48%" stop-color="${base}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#030303"/>
        </radialGradient>
        <linearGradient id="veil" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="320" height="460" rx="28" fill="url(#glow)"/>
      <path d="M0 ${runeA} C80 ${runeB}, 172 6, 320 ${runeA + 58} L320 0 L0 0Z" fill="url(#veil)"/>
      <g opacity="0.16" fill="none" stroke="${ink}" stroke-width="2">
        <circle cx="74" cy="90" r="46"/>
        <circle cx="252" cy="286" r="58"/>
        <path d="M40 360 C104 310, 186 418, 284 350"/>
      </g>
      <rect x="28" y="28" width="264" height="404" rx="22" fill="none" stroke="${ink}" stroke-opacity="0.32" stroke-width="3"/>
      <text x="160" y="214" text-anchor="middle" font-family="Georgia, serif" font-size="76" font-weight="800" fill="${ink}">${escapeSvgText(initials)}</text>
      <text x="160" y="284" text-anchor="middle" font-family="Verdana, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="${ink}" fill-opacity="0.88">ANIME HUB</text>
      <text x="160" y="332" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${ink}" fill-opacity="0.92">${safeTitle}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function encodeReference<T extends SeriesReference | EpisodeReference>(payload: T) {
  return `${payload.source}::${encodeURIComponent(JSON.stringify(payload))}`;
}

function decodeReference<T extends SeriesReference | EpisodeReference>(
  value: string,
  fallbackSource: ProviderSource
) {
  const [source, encoded] = value.split("::", 2);

  if (!encoded) {
    return { source: fallbackSource, url: value, id: value } as T;
  }

  try {
    return JSON.parse(decodeURIComponent(encoded)) as T;
  } catch {
    return { source: fallbackSource, url: value, id: value } as T;
  }
}

function pickImage(baseUrl: string | undefined, item: any) {
  return (
    normalizeAssetUrl(
      baseUrl,
      item?.image,
      item?.imageUrl,
      item?.poster,
      item?.posterUrl,
      item?.cover,
      item?.coverUrl,
      item?.coverImage,
      item?.thumbnail,
      item?.thumbnailUrl,
      item?.img
    ) ?? FALLBACK_IMAGE
  );
}

function pickBanner(baseUrl: string | undefined, item: any, coverImage: string) {
  return (
    normalizeAssetUrl(
      baseUrl,
      item?.backdrop,
      item?.backdropUrl,
      item?.banner,
      item?.bannerUrl,
      item?.bannerImage,
      item?.image,
      item?.imageUrl
    ) ?? coverImage
  );
}

function providerLabel(source: ProviderSource) {
  switch (source) {
    case "anime-website":
      return "anime website";
    case "anime-platform":
      return "anime api";
    case "animeflv":
      return "animeflv";
    case "tioanime":
      return "tioanime";
    case "veranimeonline":
      return "veranimeonline";
    case "animeav1":
      return "animeav1";
    case "jkanime":
      return "jkanime";
    default:
      return "anime remoto";
  }
}

function normalizeSummary(
  source: ProviderSource,
  item: any,
  fallbackRef?: Partial<SeriesReference>
): AnimeSeriesSummary {
  const baseUrl =
    source === "anime-website"
      ? ANIME_WEBSITE_BASE_URL
      : source === "anime-platform"
        ? ANIME_PLATFORM_BASE_URL
        : source === "tioanime"
          ? ANIMEFLV_BASE_URL 
          : ANIMEFLV_BASE_URL;
  const coverImage = pickImage(baseUrl, item);
  const title = item?.title ?? item?.name ?? fallbackRef?.title ?? "Titulo no disponible";
  const rawUrl = item?.url ?? item?.link ?? item?.href ?? fallbackRef?.url;
  const rawId =
    item?.id ??
    item?._id ??
    item?.anilistId ??
    item?.slug ??
    fallbackRef?.id ??
    rawUrl ??
    title;

  const reference: SeriesReference = {
    source,
    id: rawId ? String(rawId) : undefined,
    url: rawUrl ? String(rawUrl) : undefined,
    title,
    image: coverImage,
    backdrop: pickBanner(baseUrl, item, coverImage),
  };

  return {
    id: encodeReference(reference),
    title,
    altTitle:
      item?.alt_title ??
      item?.titleJapanese ??
      item?.alternativeTitle ??
      item?.englishTitle,
    coverImage,
    bannerImage: reference.backdrop,
    synopsis: item?.description ?? item?.synopsis ?? "Sin sinopsis disponible.",
    genres: normalizeGenres(item?.genres ?? item?.genre),
    year: String(
      item?.year ??
        item?.releaseYear ??
        item?.seasonYear ??
        item?.releaseDate?.slice?.(0, 4) ??
        "N/A"
    ),
    statusLabel: item?.status ?? item?.statusLabel ?? item?.state ?? "Catalogo",
    providerLabel: providerLabel(source),
    score: item?.score ? String(item.score) : item?.rating ? String(item.rating) : undefined,
  };
}

function withDistinctCovers(items: AnimeSeriesSummary[]) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    counts.set(item.coverImage, (counts.get(item.coverImage) ?? 0) + 1);
  });

  return items.map((item, index) => {
    const isSharedCover = (counts.get(item.coverImage) ?? 0) > 1;
    if (!isSharedCover && item.coverImage !== FALLBACK_IMAGE) {
      return item;
    }

    const generatedCover = makeGeneratedCover(item.title, index);
    return {
      ...item,
      coverImage: generatedCover,
      bannerImage:
        !item.bannerImage || item.bannerImage === item.coverImage
          ? generatedCover
          : item.bannerImage,
    };
  });
}

function uniqueById(items: AnimeSeriesSummary[]) {
  const seenKeys = new Set<string>();
  return items.filter((item) => {
    const key = `${item.title.toLowerCase().replace(/\s+/g, " ").trim()}::${item.providerLabel}`;
    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getSearchVariants(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return [""];
  }

  const compact = normalized.replace(/\s+/g, "");
  const hyphenated = normalized.replace(/\s+/g, "-");
  const spacedFromCamel = normalized.replace(/([a-z])([A-Z])/g, "$1 $2");
  const lower = normalized.toLowerCase();
  const variants = [normalized, spacedFromCamel, hyphenated, compact, lower];

  return [...new Set(variants.map((item) => item.trim()).filter(Boolean))];
}

function normalizeEpisodes(
  source: ProviderSource,
  value: unknown,
  fallbackUrl?: string,
  seriesId?: string
): AnimeEpisodeSummary[] {
  return asList<any>(value).map((episode, index) => {
    const number = Number(episode?.number ?? episode?.episode ?? index + 1);
    const episodeUrl = episode?.url ?? episode?.link ?? episode?.href;
    const episodeId =
      episode?.id ?? episode?._id ?? episode?.episodeId ?? episodeUrl ?? `episode-${number}`;

    return {
      id: encodeReference<EpisodeReference>({
        source,
        id: episodeId ? String(episodeId) : undefined,
        url: episodeUrl ? String(episodeUrl) : fallbackUrl,
        number,
        seriesId,
      }),
      number,
      title: episode?.title ?? `Episodio ${number}`,
      duration: episode?.duration,
      status: "ready",
    };
  });
}

function normalizeDetail(
  source: ProviderSource,
  raw: any,
  fallbackRef: SeriesReference
): AnimeSeriesDetail {
  const item = unwrapPayload(raw);
  const summary = normalizeSummary(source, item, fallbackRef);
  const episodes = normalizeEpisodes(source, item?.episodes, fallbackRef.url, fallbackRef.id);
  const synopsis = summary.synopsis;

  return {
    ...summary,
    episodeCount: Number(
      item?.totalEpisodes ?? item?.episodeCount ?? item?.episodesCount ?? episodes.length
    ),
    releaseWindow: String(
      item?.season ?? item?.year ?? item?.releaseWindow ?? item?.seasonYear ?? "N/A"
    ),
    featuredQuote:
      synopsis.length > 150 ? `${synopsis.slice(0, 150).trim()}...` : synopsis,
    episodes,
    downloads: [],
  };
}

function normalizeLinks(raw: any): AnimeEpisodeLinks {
  const info = unwrapPayload(raw);
  const flattenVariant = (value: unknown, variant: string) =>
    asList<any>(value).map((link) => ({
      server: `${link?.server ?? link?.name ?? "Servidor"} ${variant}`.trim(),
      url: link?.url ?? link?.link ?? "#",
      quality: link?.quality,
    }));

  // Detectar si servers o downloads son arrays directos (común en scrapers simples como AnimeFLV/TioAnime)
  const directServers = Array.isArray(info?.servers) ? info.servers : undefined;
  const directDownloads = Array.isArray(info?.downloads ?? info?.download) ? (info.downloads ?? info.download) : undefined;

  return {
    stream: [
      ...flattenVariant(info?.servers?.sub ?? info?.servers?.SUB, "SUB"),
      ...flattenVariant(info?.servers?.dub ?? info?.servers?.DUB, "DUB"),
      ...flattenVariant(info?.stream ?? directServers ?? info?.sources, ""),
    ],
    download: [
      ...flattenVariant(info?.downloadLinks?.SUB, "SUB"),
      ...flattenVariant(info?.downloadLinks?.DUB, "DUB"),
      ...flattenVariant(info?.download ?? info?.downloads ?? directDownloads, ""),
    ],
  };
}


async function searchAnimeWebsiteCatalog(query: string) {
  const proxyUrl = new URL("/api/anime/proxy", window.location.origin);
  proxyUrl.searchParams.set("provider", "anime-website");
  proxyUrl.searchParams.set("action", "search");
  proxyUrl.searchParams.set("query", query);

  const data = await fetchJson(proxyUrl.toString());
  const finalData = data || (ANIME_WEBSITE_BASE_URL ? await fetchJson(endpoint(`/search/media/anime-database?title=${encodeURIComponent(query)}&limit=12`, ANIME_WEBSITE_BASE_URL), requestHeaders(ANIME_WEBSITE_API_KEY)) : null);

  return asList<any>(finalData?.results ?? finalData?.data?.results ?? finalData?.data ?? finalData).map((item) =>
    normalizeSummary("anime-website", item)
  );
}

async function resolveAnimeWebsiteSeed(reference: SeriesReference) {
  const candidates = [reference.id, reference.title].filter(Boolean) as string[];
  for (const query of candidates) {
    const proxyUrl = new URL("/api/anime/proxy", window.location.origin);
    proxyUrl.searchParams.set("provider", "anime-website");
    proxyUrl.searchParams.set("action", "search");
    proxyUrl.searchParams.set("query", query);

    const data = await fetchJson(proxyUrl.toString());
    const finalData = data || (ANIME_WEBSITE_BASE_URL ? await fetchJson(endpoint(`/search/anime/consumet/gogoanime?query=${encodeURIComponent(query)}`, ANIME_WEBSITE_BASE_URL), requestHeaders(ANIME_WEBSITE_API_KEY)) : null);

    const results = asList<any>(finalData?.results ?? finalData?.data?.results ?? finalData?.data ?? finalData);
    const bestMatch =
      results.find((item) => {
        const itemTitle = String(item?.title ?? item?.name ?? "").toLowerCase().trim();
        const refTitle = String(reference.title ?? "").toLowerCase().trim();
        const refId = String(reference.id ?? "").toLowerCase().trim();
        return itemTitle === refTitle || String(item?.id ?? "").toLowerCase().trim() === refId;
      }) ?? results[0];

    if (bestMatch) {
      return bestMatch;
    }
  }

  return null;
}

async function fetchAnimeWebsiteEpisodes(seriesId: string) {
  const proxyUrl = new URL("/api/anime/proxy", window.location.origin);
  proxyUrl.searchParams.set("provider", "anime-website");
  proxyUrl.searchParams.set("action", "episodes");
  proxyUrl.searchParams.set("id", seriesId);

  const data = await fetchJson(proxyUrl.toString());
  const finalData = data || (ANIME_WEBSITE_BASE_URL ? await fetchJson(endpoint(`/episodes/consumet/gogoanime/all?id=${encodeURIComponent(seriesId)}`, ANIME_WEBSITE_BASE_URL), requestHeaders(ANIME_WEBSITE_API_KEY)) : null);

  return normalizeEpisodes(
    "anime-website",
    finalData?.episodes ?? finalData?.data?.episodes ?? finalData?.data ?? finalData
  );
}

async function fetchAnimeWebsiteDetail(reference: SeriesReference) {
  const seed = await resolveAnimeWebsiteSeed(reference);
  if (!seed) {
    return normalizeDetail("anime-website", {}, reference);
  }

  const proxyUrl = new URL("/api/anime/proxy", window.location.origin);
  proxyUrl.searchParams.set("provider", "anime-website");
  proxyUrl.searchParams.set("action", "detail");
  proxyUrl.searchParams.set("id", String(seed?.id ?? seed?.title ?? reference.title ?? ""));

  const detailData = await fetchJson(proxyUrl.toString());
  const finalDetailData = detailData || (ANIME_WEBSITE_BASE_URL ? await fetchJson(endpoint(`/media-info/anime/consumet/gogoanime?query=${encodeURIComponent(String(seed?.id ?? seed?.title ?? reference.title ?? ""))}`, ANIME_WEBSITE_BASE_URL), requestHeaders(ANIME_WEBSITE_API_KEY)) : null);

  if (!finalDetailData) {
    return normalizeDetail("anime-website", seed, {
      ...reference,
      id: String(seed?.id ?? reference.id ?? ""),
      title: String(seed?.title ?? reference.title ?? ""),
      url: String(seed?.url ?? reference.url ?? ""),
    });
  }

  const detail = normalizeDetail("anime-website", finalDetailData, {
    ...reference,
    id: String(seed?.id ?? reference.id ?? ""),
    title: String(seed?.title ?? reference.title ?? ""),
    url: String(seed?.url ?? reference.url ?? ""),
  });

  if (detail.episodes.length > 0) {
    return detail;
  }

  const fallbackEpisodes = await fetchAnimeWebsiteEpisodes(String(seed?.id ?? reference.id ?? ""));
  return {
    ...detail,
    episodes: fallbackEpisodes,
    episodeCount: fallbackEpisodes.length || detail.episodeCount,
  };
}

async function fetchAnimeWebsiteLinks(reference: EpisodeReference) {
  if (!reference.id) {
    return null;
  }

  const proxyUrl = new URL("/api/anime/proxy", window.location.origin);
  proxyUrl.searchParams.set("provider", "anime-website");
  proxyUrl.searchParams.set("action", "links");
  proxyUrl.searchParams.set("id", reference.id);

  const data = await fetchJson(proxyUrl.toString());
  const finalData = data || (ANIME_WEBSITE_BASE_URL ? await fetchJson(endpoint(`/episodes/consumet/gogoanime/episode?id=${encodeURIComponent(reference.id)}`, ANIME_WEBSITE_BASE_URL), requestHeaders(ANIME_WEBSITE_API_KEY)) : null);

  if (!finalData) {
    return null;
  }

  const info = unwrapPayload(finalData);
  const stream = asList<any>(info?.sources ?? info?.streams ?? info?.stream).map((entry) => ({
    server: entry?.server ?? entry?.quality ?? "Servidor",
    url: entry?.url ?? entry?.link ?? "#",
    quality: entry?.quality,
  }));
  const download = asList<any>(info?.downloads ?? info?.download).map((entry) => ({
    server: entry?.server ?? entry?.quality ?? "Descarga",
    url: entry?.url ?? entry?.link ?? "#",
    quality: entry?.quality,
  }));

  return { stream, download };
}

async function fetchAnimeFlvLinks(reference: EpisodeReference) {
  const seriesSlug = reference.seriesId;
  const episodeNumber = reference.number || 1;

  if (!seriesSlug) {
    return null;
  }

  try {
    const baseUrl = "https://scraping-web-anime-api.vercel.app";
    const targetUrl = `${baseUrl}/api/episode/${seriesSlug}-${episodeNumber}?source=animeflv`;
    
    const data = await fetchJson(targetUrl, {
      "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
    });

    if (!data) return null;

    // Normalización estándar que ahora maneja la estructura de la API correctamente
    return normalizeLinks(data);
  } catch (error) {
    console.error("Error fetching AnimeFLV links via proxy:", error);
    return null;
  }
}

async function searchTioAnime(query: string) {
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const params = new URLSearchParams({
    q: query,
    source: "tioanime"
  });
  
  const data = await fetchJson(`${baseUrl}/api/search?${params.toString()}`, {
    "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
  });
  const payload = unwrapPayload(data);
  return asList<any>(payload?.results ?? payload).map((item) =>
    normalizeSummary("tioanime", item)
  );
}

async function fetchTioAnimeDetail(reference: SeriesReference) {
  if (!reference.id) return null;
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const data = await fetchJson(`${baseUrl}/api/anime/${encodeURIComponent(reference.id)}?source=tioanime`, {
    "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
  });
  return normalizeDetail("tioanime", unwrapPayload(data), reference);
}

async function fetchTioAnimeLinks(reference: EpisodeReference) {
  if (!reference.id) return null;
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const data = await fetchJson(`${baseUrl}/api/episode/${encodeURIComponent(reference.id)}?source=tioanime`, {
    "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
  });
  // normalizeLinks ya maneja el unwrap interno
  return normalizeLinks(data);
}

async function searchVerAnimeOnline(query: string) {
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const params = new URLSearchParams({
    q: query,
    source: "veranimeonline"
  });
  
  const data = await fetchJson(`${baseUrl}/api/search?${params.toString()}`, {
    "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
  });
  const payload = unwrapPayload(data);
  return asList<any>(payload?.results ?? payload).map((item) =>
    normalizeSummary("veranimeonline", item)
  );
}

async function fetchVerAnimeOnlineDetail(reference: SeriesReference) {
  if (!reference.id) return null;
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const data = await fetchJson(`${baseUrl}/api/anime/${encodeURIComponent(reference.id)}?source=veranimeonline`, {
    "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
  });
  return normalizeDetail("veranimeonline", unwrapPayload(data), reference);
}

async function fetchVerAnimeOnlineLinks(reference: EpisodeReference) {
  if (!reference.id) return null;
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const data = await fetchJson(`${baseUrl}/api/episode/${encodeURIComponent(reference.id)}?source=veranimeonline`, {
    "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
  });
  return normalizeLinks(data);
}

async function searchAnimeAV1(query: string) {
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const params = new URLSearchParams({ q: query, source: "animeav1" });
  const data = await fetchJson(`${baseUrl}/api/search?${params.toString()}`, { "Authorization": `Bearer ${ANIME_HUB_API_KEY}` });
  const payload = unwrapPayload(data);
  return asList<any>(payload?.results ?? payload).map((item) => normalizeSummary("animeav1", item));
}

async function fetchAnimeAV1Detail(reference: SeriesReference) {
  if (!reference.id) return null;
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const data = await fetchJson(`${baseUrl}/api/anime/${encodeURIComponent(reference.id)}?source=animeav1`, { "Authorization": `Bearer ${ANIME_HUB_API_KEY}` });
  return normalizeDetail("animeav1", unwrapPayload(data), reference);
}

async function fetchAnimeAV1Links(reference: EpisodeReference) {
  if (!reference.id) return null;
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  // En animeav1 el id de episodio trae la estructura para llamar al endpoint
  const data = await fetchJson(`${baseUrl}/api/episode/${encodeURIComponent(reference.id)}?source=animeav1`, { "Authorization": `Bearer ${ANIME_HUB_API_KEY}` });
  return normalizeLinks(data);
}

async function searchJKAnime(query: string) {
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const params = new URLSearchParams({ q: query, source: "jkanime" });
  const data = await fetchJson(`${baseUrl}/api/search?${params.toString()}`, { "Authorization": `Bearer ${ANIME_HUB_API_KEY}` });
  const payload = unwrapPayload(data);
  return asList<any>(payload?.results ?? payload).map((item) => normalizeSummary("jkanime", item));
}

async function fetchJKAnimeDetail(reference: SeriesReference) {
  if (!reference.id) return null;
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const data = await fetchJson(`${baseUrl}/api/anime/${encodeURIComponent(reference.id)}?source=jkanime`, { "Authorization": `Bearer ${ANIME_HUB_API_KEY}` });
  return normalizeDetail("jkanime", unwrapPayload(data), reference);
}

async function fetchJKAnimeLinks(reference: EpisodeReference) {
  if (!reference.id) return null;
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const data = await fetchJson(`${baseUrl}/api/episode/${encodeURIComponent(reference.id)}?source=jkanime`, { "Authorization": `Bearer ${ANIME_HUB_API_KEY}` });
  return normalizeLinks(data);
}

async function searchAnimePlatform(query: string, genre?: string) {
  if (!ANIME_PLATFORM_BASE_URL) {
    return [];
  }

  const url = new URL(endpoint("/api/v1/anime", ANIME_PLATFORM_BASE_URL));
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "12");
  if (genre) {
    url.searchParams.set("genre", genre);
  }

  const data = await fetchJson(url.toString(), requestHeaders(ANIME_PLATFORM_API_KEY));
  return asList<any>(data?.data ?? data?.results ?? data).map((item) =>
    normalizeSummary("anime-platform", item)
  );
}

async function searchAnimeFlv(query: string) {
  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const params = new URLSearchParams({
    q: query,
    source: "animeflv"
  });
  
  const data = await fetchJson(`${baseUrl}/api/search?${params.toString()}`, {
    "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
  });
  const payload = unwrapPayload(data);
  const finalData = payload || (ANIMEFLV_BASE_URL ? await fetchJson(endpoint(`/search?query=${encodeURIComponent(query)}&page=1`, ANIMEFLV_BASE_URL)) : null);

  return asList<any>(finalData?.results ?? finalData?.media ?? finalData?.data ?? finalData).map((item) =>
    normalizeSummary("animeflv", item)
  );
}

async function fetchAnimeFlvDetail(reference: SeriesReference) {
  if (!reference.id) {
    return null;
  }

  const baseUrl = "https://scraping-web-anime-api.vercel.app";
  const data = await fetchJson(`${baseUrl}/api/anime/${encodeURIComponent(reference.id)}?source=animeflv`, {
    "Authorization": `Bearer ${ANIME_HUB_API_KEY}`
  });
  const payload = unwrapPayload(data);
  const finalData = payload || (ANIMEFLV_BASE_URL ? await fetchJson(endpoint(`/anime/${encodeURIComponent(reference.id)}`, ANIMEFLV_BASE_URL)) : null);

  if (!finalData) {
    return normalizeDetail("animeflv", {}, reference);
  }

  return normalizeDetail("animeflv", finalData, reference);
}

async function fetchAnimePlatformDetail(reference: SeriesReference) {
  if (!ANIME_PLATFORM_BASE_URL) {
    return null;
  }

  const candidates = [reference.title, reference.id].filter(Boolean) as string[];
  for (const query of candidates) {
    const results = await searchAnimePlatform(query);
    const match =
      results.find(
        (item) =>
          item.title.toLowerCase().trim() ===
          String(reference.title ?? "").toLowerCase().trim()
      ) ?? results[0];

    if (match) {
      return {
        ...match,
        releaseWindow: match.year,
        episodeCount: 0,
        featuredQuote:
          match.synopsis.length > 150
            ? `${match.synopsis.slice(0, 150).trim()}...`
            : match.synopsis,
        episodes: [],
        downloads: [],
      } satisfies AnimeSeriesDetail;
    }
  }

  return null;
}

function sortByCoverage(items: AnimeSeriesSummary[]) {
  return [...items].sort((left, right) => {
    const leftScore =
      (left.providerLabel === "anime website" ? 4 : 0) +
      (left.providerLabel === "animeflv" ? 3 : 0) +
      (left.bannerImage ? 2 : 0) +
      (left.coverImage.startsWith("data:image/svg+xml") ? 0 : 1);
    const rightScore =
      (right.providerLabel === "anime website" ? 4 : 0) +
      (right.providerLabel === "animeflv" ? 3 : 0) +
      (right.bannerImage ? 2 : 0) +
      (right.coverImage.startsWith("data:image/svg+xml") ? 0 : 1);
    return rightScore - leftScore;
  });
}

// Mejora 4: Enriquecimiento con Jikan (MAL)
async function enrichWithJikan(title: string) {
  try {
    const query = title.split("(")[0].trim();
    const data = await fetchJson(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, undefined, 5000);
    const mal = data?.data?.[0];
    if (!mal) return null;

    return {
      score: mal.score,
      synopsis: mal.synopsis,
      trailer: mal.trailer?.embed_url,
      image: mal.images?.webp?.large_image_url || mal.images?.jpg?.large_image_url,
      genres: mal.genres?.map((g: any) => g.name) || [],
      status: mal.status,
      year: mal.year
    };
  } catch (e) {
    return null;
  }
}

export const remoteAnimeHubProvider: AnimeHubProvider = {
  id: "anime-multi-remote",
  label: "anime remoto",
  status: hasRemoteAnimeProvider() ? "ready" : "placeholder",
  endpointMap: {
    search: "/search/media/anime-database | /search | /api/v1/anime",
    info: "/media-info/anime/consumet/gogoanime | /anime/{slug}",
    episode: "/episodes/consumet/gogoanime/episode | /episodes/consumet/gogoanime/all | /anime/{slug}/episode/{number}",
    download: "Integrado por proveedor remoto",
    batch: "No configurado",
  },
  async searchSeries(filters) {
    if (!hasRemoteAnimeProvider()) {
      return [];
    }

    try {
      const { query, genre, provider } = filters;
      const variants = getSearchVariants(query);
      const collected: AnimeSeriesSummary[] = [];

      for (const variant of variants) {
        if (ANIME_WEBSITE_BASE_URL && (!provider || provider === "all" || provider === "anime-website")) {
          collected.push(...(await searchAnimeWebsiteCatalog(variant)));
        }

        if (collected.length < 12 && ANIME_PLATFORM_BASE_URL && (!provider || provider === "all" || provider === "anime-platform")) {
          collected.push(...(await searchAnimePlatform(variant, genre)));
        }

        if (collected.length < 12 && ANIMEFLV_BASE_URL && (!provider || provider === "all" || provider === "animeflv")) {
          collected.push(...(await searchAnimeFlv(variant)));
        }

        if (collected.length < 12 && ANIMEFLV_BASE_URL && (!provider || provider === "all" || provider === "tioanime")) {
          collected.push(...(await searchTioAnime(variant)));
        }

        if (collected.length < 12 && ANIMEFLV_BASE_URL && (!provider || provider === "all" || provider === "veranimeonline")) {
          collected.push(...(await searchVerAnimeOnline(variant)));
        }

        if (collected.length < 12 && ANIMEFLV_BASE_URL && (!provider || provider === "all" || provider === "animeav1")) {
          collected.push(...(await searchAnimeAV1(variant)));
        }

        if (collected.length < 12 && ANIMEFLV_BASE_URL && (!provider || provider === "all" || provider === "jkanime")) {
          collected.push(...(await searchJKAnime(variant)));
        }

        // Mejora 3: Smart Fallback si el proveedor específico falló
        if (collected.length === 0 && provider && provider !== "all") {
          console.log(`Smart Fallback: No results in ${provider}, trying other sources...`);
          if (provider === "tioanime") collected.push(...(await searchAnimeFlv(variant)));
          else if (provider === "animeflv") collected.push(...(await searchTioAnime(variant)));
        }

        if (collected.length >= 12) {
          break;
        }
      }

      return withDistinctCovers(sortByCoverage(uniqueById(collected)));
    } catch (error) {
      console.error("AnimeHub Remote Search Error:", error);
      return [];
    }
  },
  async getSeriesDetail(seriesId) {
    if (!hasRemoteAnimeProvider()) {
      return null;
    }

    try {
      const reference = decodeReference<SeriesReference>(seriesId, "anime-website");

      let detail: AnimeSeriesDetail | null = null;
      switch (reference.source) {
        case "anime-website":
          detail = await fetchAnimeWebsiteDetail(reference);
          break;
        case "anime-platform":
          detail = await fetchAnimePlatformDetail(reference);
          break;
        case "animeflv":
          detail = await fetchAnimeFlvDetail(reference);
          break;
        case "tioanime":
          detail = await fetchTioAnimeDetail(reference);
          break;
        case "veranimeonline":
          detail = await fetchVerAnimeOnlineDetail(reference);
          break;
        case "animeav1":
          detail = await fetchAnimeAV1Detail(reference);
          break;
        case "jkanime":
          detail = await fetchJKAnimeDetail(reference);
          break;
      }

      // Mejora 4: Enriquecimiento
      if (detail && detail.title) {
        const extra = await enrichWithJikan(detail.title);
        if (extra) {
          detail.synopsis = extra.synopsis || detail.synopsis;
          detail.genres = [...new Set([...(detail.genres || []), ...extra.genres])];
          // Mejora de imagen HD
          if (extra.image) {
            detail.bannerImage = extra.image;
            detail.coverImage = extra.image;
          }
          // Añadimos metadatos extra que la UI puede usar si existen
          (detail as any).malScore = extra.score;
          (detail as any).trailer = extra.trailer;
        }
      }

      return detail;
    } catch (error) {
      console.error("AnimeHub Remote Detail Error:", error);
      return null;
    }
  },
  async getEpisodeLinks(episodeId) {
    if (!hasRemoteAnimeProvider()) {
      return null;
    }

    try {
      const reference = decodeReference<EpisodeReference>(episodeId, "anime-website");

      switch (reference.source) {
        case "anime-website":
          return await fetchAnimeWebsiteLinks(reference);
        case "anime-platform":
          return null;
        case "animeflv":
          return await fetchAnimeFlvLinks(reference);
        case "tioanime":
          return await fetchTioAnimeLinks(reference);
        case "veranimeonline":
          return await fetchVerAnimeOnlineLinks(reference);
        case "animeav1":
          return await fetchAnimeAV1Links(reference);
        case "jkanime":
          return await fetchJKAnimeLinks(reference);
        default:
          return null;
      }
    } catch (error) {
      console.error("AnimeHub Remote Links Error:", error);
      return null;
    }
  },
};
