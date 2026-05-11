import type {
  AnimeEpisodeLinks,
  AnimeEpisodeSummary,
  AnimeHubProvider,
  AnimeSeriesDetail,
  AnimeSeriesSummary,
} from "./animeHub.types";

type ProviderSource = "anime1v" | "anime-website" | "anime-platform";

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
};

const ANIME1V_PROVIDER_DOMAINS = {
  animeav1: "animeav1.com",
  animeflv: "animeflv.net",
  tioanime: "tioanime.com",
  jkanime: "jkanime.net",
  hentaila: "hentaila.com",
  monoschinos: "monoschinos2.com",
} as const;

const ANIME1V_BASE_URL = import.meta.env.VITE_ANIME_HUB_API_URL;
const ANIME1V_API_KEY = import.meta.env.VITE_ANIME_HUB_API_KEY;
const ANIME_WEBSITE_BASE_URL = import.meta.env.VITE_ANIME_WEBSITE_API_URL;
const ANIME_WEBSITE_API_KEY = import.meta.env.VITE_ANIME_WEBSITE_API_KEY;
const ANIME_PLATFORM_BASE_URL = import.meta.env.VITE_ANIME_PLATFORM_API_URL;
const ANIME_PLATFORM_API_KEY = import.meta.env.VITE_ANIME_PLATFORM_API_KEY;

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
  return Boolean(
    ANIME1V_BASE_URL || ANIME_WEBSITE_BASE_URL || ANIME_PLATFORM_BASE_URL
  );
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

function buildAnime1vUrl(path: string, params?: Record<string, string | undefined>) {
  const url = new URL(endpoint(path, ANIME1V_BASE_URL));

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      url.searchParams.set(key, value);
    }
  });

  if (ANIME1V_API_KEY) {
    url.searchParams.set("apiKey", ANIME1V_API_KEY);
  }

  return url.toString();
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
    case "anime1v":
      return "anime1v remoto";
    case "anime-website":
      return "anime website";
    case "anime-platform":
      return "anime api";
    default:
      return "anime remoto";
  }
}

function anime1vProviderLabel(providerId?: unknown) {
  switch (String(providerId ?? "").toLowerCase()) {
    case "animeav1":
      return "AnimeAV1";
    case "animeflv":
      return "AnimeFLV";
    case "tioanime":
      return "TioAnime";
    case "jkanime":
      return "JKAnime";
    case "hentaila":
      return "HentaiLA";
    case "monoschinos":
      return "MonosChinos";
    default:
      return "anime1v remoto";
  }
}

function anime1vDomainFromFilter(filter?: string) {
  if (!filter) {
    return undefined;
  }

  const normalized = filter.trim().toLowerCase();
  if (!normalized || normalized === "mixed") {
    return undefined;
  }

  return ANIME1V_PROVIDER_DOMAINS[
    normalized as keyof typeof ANIME1V_PROVIDER_DOMAINS
  ];
}

function normalizeSummary(
  source: ProviderSource,
  item: any,
  fallbackRef?: Partial<SeriesReference>
): AnimeSeriesSummary {
  const baseUrl =
    source === "anime1v"
      ? ANIME1V_BASE_URL
      : source === "anime-website"
        ? ANIME_WEBSITE_BASE_URL
        : ANIME_PLATFORM_BASE_URL;
  const coverImage = pickImage(baseUrl, item);
  const title = item?.title ?? item?.name ?? fallbackRef?.title ?? "Titulo no disponible";
  const rawUrl =
    item?.url ??
    item?.link ??
    item?.href ??
    fallbackRef?.url;
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
    providerLabel:
      source === "anime1v"
        ? anime1vProviderLabel(item?.source ?? item?.provider)
        : providerLabel(source),
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
  fallbackUrl?: string
): AnimeEpisodeSummary[] {
  return asList<any>(value).map((episode, index) => {
    const number = Number(episode?.number ?? episode?.episode ?? index + 1);
    const episodeUrl = episode?.url ?? episode?.link ?? episode?.href;
    const episodeId = episode?.id ?? episode?._id ?? episode?.episodeId ?? episodeUrl ?? `episode-${number}`;

    return {
      id: encodeReference<EpisodeReference>({
        source,
        id: episodeId ? String(episodeId) : undefined,
        url: episodeUrl ? String(episodeUrl) : fallbackUrl,
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
  const episodes = normalizeEpisodes(source, item?.episodes, fallbackRef.url);
  const synopsis = summary.synopsis;

  return {
    ...summary,
    episodeCount: Number(
      item?.totalEpisodes ?? item?.episodeCount ?? item?.episodesCount ?? episodes.length
    ),
    releaseWindow: String(
      item?.season ??
        item?.year ??
        item?.releaseWindow ??
        item?.seasonYear ??
        "N/A"
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

  return {
    stream: [
      ...flattenVariant(info?.servers?.sub ?? info?.servers?.SUB, "SUB"),
      ...flattenVariant(info?.servers?.dub ?? info?.servers?.DUB, "DUB"),
      ...flattenVariant(info?.stream, ""),
    ],
    download: [
      ...flattenVariant(info?.downloadLinks?.SUB, "SUB"),
      ...flattenVariant(info?.downloadLinks?.DUB, "DUB"),
      ...flattenVariant(info?.download ?? info?.downloads, ""),
    ],
  };
}

async function fetchJson<T = any>(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function searchAnime1v(query: string, genre?: string, provider?: string) {
  if (!ANIME1V_BASE_URL) {
    return [];
  }

  const data = await fetchJson(
    buildAnime1vUrl("/api/v1/anime/search", {
      q: query,
      genre,
      domain: anime1vDomainFromFilter(provider),
    }),
    requestHeaders(ANIME1V_API_KEY)
  );
  return asList<any>(data?.data?.results ?? data?.results ?? data?.data).map((item) =>
    normalizeSummary("anime1v", item)
  );
}

async function fetchAnime1vDetail(reference: SeriesReference) {
  if (!ANIME1V_BASE_URL) {
    return null;
  }

  const candidates = [
    reference.url ? ["url", reference.url] : null,
    reference.id ? ["id", reference.id] : null,
  ].filter(Boolean) as [string, string][];
  const lastParamName = candidates[candidates.length - 1]?.[0];

  for (const [paramName, value] of candidates) {
    const data = await fetchJson(
      buildAnime1vUrl("/api/v1/anime/info", { [paramName]: value }),
      requestHeaders(ANIME1V_API_KEY)
    );
    if (!data) {
      continue;
    }

    const detail = normalizeDetail("anime1v", data, reference);
    if (detail.episodes.length > 0 || paramName === lastParamName) {
      return detail;
    }
  }

  return null;
}

async function fetchAnime1vLinks(reference: EpisodeReference) {
  if (!ANIME1V_BASE_URL || !reference.url) {
    return null;
  }

  const data = await fetchJson(
    buildAnime1vUrl("/api/v1/anime/episode", {
      url: reference.url,
      includeMega: "true",
    }),
    requestHeaders(ANIME1V_API_KEY)
  );
  return data ? normalizeLinks(data) : null;
}

async function searchAnimeWebsiteCatalog(query: string) {
  if (!ANIME_WEBSITE_BASE_URL) {
    return [];
  }

  const url = new URL(
    endpoint("/search/media/anime-database", ANIME_WEBSITE_BASE_URL)
  );
  url.searchParams.set("title", query);
  url.searchParams.set("limit", "12");

  const data = await fetchJson(url.toString(), requestHeaders(ANIME_WEBSITE_API_KEY));
  return asList<any>(
    data?.results ?? data?.data?.results ?? data?.data ?? data
  ).map((item) => normalizeSummary("anime-website", item));
}

async function searchAnimeWebsiteStreaming(query: string) {
  if (!ANIME_WEBSITE_BASE_URL) {
    return [];
  }

  const url = new URL(
    endpoint("/search/anime/consumet/gogoanime", ANIME_WEBSITE_BASE_URL)
  );
  url.searchParams.set("query", query);

  const data = await fetchJson(url.toString(), requestHeaders(ANIME_WEBSITE_API_KEY));
  return asList<any>(
    data?.results ?? data?.data?.results ?? data?.data ?? data
  ).map((item) => normalizeSummary("anime-website", item));
}

async function resolveAnime1vSeed(reference: SeriesReference) {
  if (!ANIME1V_BASE_URL || !reference.title) {
    return null;
  }

  const results = await searchAnime1v(reference.title);
  const normalizedTitle = reference.title.toLowerCase().trim();

  return (
    results.find(
      (item) => item.title.toLowerCase().trim() === normalizedTitle
    ) ?? results[0] ?? null
  );
}

async function resolveAnimeWebsiteSeed(reference: SeriesReference) {
  if (!ANIME_WEBSITE_BASE_URL) {
    return null;
  }

  const candidates = [reference.id, reference.title].filter(Boolean) as string[];
  for (const query of candidates) {
    const url = new URL(
      endpoint("/search/anime/consumet/gogoanime", ANIME_WEBSITE_BASE_URL)
    );
    url.searchParams.set("query", query);

    const data = await fetchJson(url.toString(), requestHeaders(ANIME_WEBSITE_API_KEY));
    const results = asList<any>(data?.results ?? data?.data?.results ?? data?.data ?? data);
    const bestMatch = results.find((item) => {
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
  if (!ANIME_WEBSITE_BASE_URL) {
    return [];
  }

  const url = new URL(
    endpoint("/episodes/consumet/gogoanime/all", ANIME_WEBSITE_BASE_URL)
  );
  url.searchParams.set("id", seriesId);

  const data = await fetchJson(url.toString(), requestHeaders(ANIME_WEBSITE_API_KEY));
  return normalizeEpisodes(
    "anime-website",
    data?.episodes ?? data?.data?.episodes ?? data?.data ?? data
  );
}

async function fetchAnimeWebsiteDetail(reference: SeriesReference) {
  if (!ANIME_WEBSITE_BASE_URL) {
    return null;
  }

  const seed = await resolveAnimeWebsiteSeed(reference);
  if (!seed) {
    return null;
  }

  const detailUrl = new URL(
    endpoint("/media-info/anime/consumet/gogoanime", ANIME_WEBSITE_BASE_URL)
  );
  detailUrl.searchParams.set("query", String(seed?.id ?? seed?.title ?? reference.title ?? ""));

  const detailData = await fetchJson(
    detailUrl.toString(),
    requestHeaders(ANIME_WEBSITE_API_KEY)
  );
  if (!detailData) {
    return normalizeDetail("anime-website", seed, {
      ...reference,
      id: String(seed?.id ?? reference.id ?? ""),
      title: String(seed?.title ?? reference.title ?? ""),
      url: String(seed?.url ?? reference.url ?? ""),
    });
  }

  const detail = normalizeDetail("anime-website", detailData, {
    ...reference,
    id: String(seed?.id ?? reference.id ?? ""),
    title: String(seed?.title ?? reference.title ?? ""),
    url: String(seed?.url ?? reference.url ?? ""),
  });

  if (detail.episodes.length > 0) {
    return detail;
  }

  const fallbackEpisodes = await fetchAnimeWebsiteEpisodes(
    String(seed?.id ?? reference.id ?? "")
  );
  const websiteDetail = {
    ...detail,
    episodes: fallbackEpisodes,
    episodeCount: fallbackEpisodes.length || detail.episodeCount,
  };

  if (websiteDetail.episodes.length > 0) {
    return websiteDetail;
  }

  const anime1vSeed = await resolveAnime1vSeed({
    ...reference,
    title: String(seed?.title ?? reference.title ?? ""),
  });
  if (!anime1vSeed) {
    return websiteDetail;
  }

  const anime1vReference = decodeReference<SeriesReference>(
    anime1vSeed.id,
    "anime1v"
  );
  const anime1vDetail = await fetchAnime1vDetail(anime1vReference);
  if (!anime1vDetail?.episodes.length) {
    return websiteDetail;
  }

  return {
    ...websiteDetail,
    episodeCount: anime1vDetail.episodeCount || websiteDetail.episodeCount,
    episodes: anime1vDetail.episodes,
    downloads: anime1vDetail.downloads,
  };
}

async function fetchAnimeWebsiteLinks(reference: EpisodeReference) {
  if (!ANIME_WEBSITE_BASE_URL || !reference.id) {
    return null;
  }

  const url = new URL(
    endpoint("/episodes/consumet/gogoanime/episode", ANIME_WEBSITE_BASE_URL)
  );
  url.searchParams.set("id", reference.id);

  const data = await fetchJson(url.toString(), requestHeaders(ANIME_WEBSITE_API_KEY));
  if (!data) {
    return null;
  }

  const info = unwrapPayload(data);
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

async function fetchAnimePlatformDetail(reference: SeriesReference) {
  if (!ANIME_PLATFORM_BASE_URL) {
    return null;
  }

  const candidates = [reference.title, reference.id].filter(Boolean) as string[];
  for (const query of candidates) {
    const results = await searchAnimePlatform(query);
    const match = results.find(
      (item) => item.title.toLowerCase().trim() === String(reference.title ?? "").toLowerCase().trim()
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
      (left.providerLabel === "anime1v remoto" ? 2 : 0) +
      (left.bannerImage ? 2 : 0) +
      (left.coverImage.startsWith("data:image/svg+xml") ? 0 : 1);
    const rightScore =
      (right.providerLabel === "anime website" ? 4 : 0) +
      (right.providerLabel === "anime1v remoto" ? 2 : 0) +
      (right.bannerImage ? 2 : 0) +
      (right.coverImage.startsWith("data:image/svg+xml") ? 0 : 1);
    return rightScore - leftScore;
  });
}

export const remoteAnimeHubProvider: AnimeHubProvider = {
  id: "anime-multi-remote",
  label: "anime remoto",
  status: hasRemoteAnimeProvider() ? "ready" : "placeholder",
  endpointMap: {
    search:
      "/api/v1/anime/search | /search/media/anime-database | /search/anime/consumet/gogoanime | /api/v1/anime",
    info: "/api/v1/anime/info | /media-info/anime/consumet/gogoanime",
    episode:
      "/api/v1/anime/episode | /episodes/consumet/gogoanime/episode | /episodes/consumet/gogoanime/all",
    download: "/api/v1/anime/download",
    batch: "/api/v1/anime/batch-download",
  },
  async searchSeries(filters) {
    if (!hasRemoteAnimeProvider()) {
      return [];
    }

    try {
      const variants = getSearchVariants(filters.query);
      const collected: AnimeSeriesSummary[] = [];

      for (const variant of variants) {
        const anime1vOnly = Boolean(anime1vDomainFromFilter(filters.provider));

        if (!anime1vOnly && ANIME_WEBSITE_BASE_URL) {
          collected.push(...(await searchAnimeWebsiteCatalog(variant)));
        }

        if (collected.length < 8 && ANIME1V_BASE_URL) {
          collected.push(
            ...(await searchAnime1v(variant, filters.genre, filters.provider))
          );
        }

        if (!anime1vOnly && collected.length < 10 && ANIME_WEBSITE_BASE_URL) {
          collected.push(...(await searchAnimeWebsiteStreaming(variant)));
        }

        if (!anime1vOnly && collected.length < 12 && ANIME_PLATFORM_BASE_URL) {
          collected.push(...(await searchAnimePlatform(variant, filters.genre)));
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
      const reference = decodeReference<SeriesReference>(seriesId, "anime1v");

      switch (reference.source) {
        case "anime1v":
          return await fetchAnime1vDetail(reference);
        case "anime-website":
          return await fetchAnimeWebsiteDetail(reference);
        case "anime-platform":
          return await fetchAnimePlatformDetail(reference);
        default:
          return null;
      }
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
      const reference = decodeReference<EpisodeReference>(episodeId, "anime1v");

      switch (reference.source) {
        case "anime1v":
          return await fetchAnime1vLinks(reference);
        case "anime-website":
          return await fetchAnimeWebsiteLinks(reference);
        case "anime-platform":
          return null;
        default:
          return null;
      }
    } catch (error) {
      console.error("AnimeHub Remote Links Error:", error);
      return null;
    }
  },
};
