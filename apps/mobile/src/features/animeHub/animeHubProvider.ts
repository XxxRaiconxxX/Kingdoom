import { MOBILE_ANIME_LIBRARY } from "./animeHubMock";
import type {
  MobileAnimeEpisode,
  MobileAnimeSeriesDetail,
} from "./animeHubTypes";

type ProviderSource = "anime-website" | "anime-platform" | "animeflv";

type SeriesReference = {
  source: ProviderSource;
  id?: string;
  url?: string;
  title?: string;
};

type EpisodeReference = {
  source: ProviderSource;
  id?: string;
  url?: string;
};

const ANIME_WEBSITE_BASE_URL = process.env.EXPO_PUBLIC_ANIME_WEBSITE_API_URL;
const ANIME_WEBSITE_API_KEY = process.env.EXPO_PUBLIC_ANIME_WEBSITE_API_KEY;
const ANIME_PLATFORM_BASE_URL = process.env.EXPO_PUBLIC_ANIME_PLATFORM_API_URL;
const ANIME_PLATFORM_API_KEY = process.env.EXPO_PUBLIC_ANIME_PLATFORM_API_KEY;
const ANIMEFLV_BASE_URL = process.env.EXPO_PUBLIC_ANIMEFLV_API_URL;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80";

export const MOBILE_ANIME_ENDPOINTS = {
  search: "/search/media/anime-database | /search | /api/v1/anime",
  info: "/media-info/anime/consumet/gogoanime | /anime/{slug}",
  episode: "/episodes/consumet/gogoanime/episode | /episodes/consumet/gogoanime/all | /anime/{slug}/episode/{number}",
  download: "Integrado por proveedor remoto",
  batch: "No configurado",
} as const;

function hasRemoteProvider() {
  return Boolean(ANIME_WEBSITE_BASE_URL || ANIME_PLATFORM_BASE_URL || ANIMEFLV_BASE_URL);
}

function headers(apiKey?: string) {
  if (!apiKey) {
    return undefined;
  }

  return {
    "x-api-key": apiKey,
    Authorization: `Bearer ${apiKey}`,
  };
}

function endpoint(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function asList<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function unwrap(data: any) {
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

function encodeReference<T extends SeriesReference | EpisodeReference>(payload: T) {
  return `${payload.source}::${encodeURIComponent(JSON.stringify(payload))}`;
}

function decodeReference<T extends SeriesReference | EpisodeReference>(
  value: string,
  fallbackSource: ProviderSource
) {
  const [source, encoded] = value.split("::", 2);

  if (!encoded) {
    return { source: fallbackSource, id: value, url: value } as T;
  }

  try {
    return JSON.parse(decodeURIComponent(encoded)) as T;
  } catch {
    return { source: fallbackSource, id: value, url: value } as T;
  }
}

function normalizeEpisodes(
  source: ProviderSource,
  value: unknown,
  fallbackUrl?: string
): MobileAnimeEpisode[] {
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
      }),
      number,
      title: episode?.title ?? `Episodio ${number}`,
      duration: episode?.duration,
      status: "ready",
    };
  });
}

function providerLabel(source: ProviderSource) {
  switch (source) {
    case "anime-website":
      return "anime website";
    case "anime-platform":
      return "anime api";
    case "animeflv":
      return "animeflv";
    default:
      return "anime remoto";
  }
}

function normalizeDetail(
  source: ProviderSource,
  item: any,
  fallbackId: string,
  fallbackTitle?: string
): MobileAnimeSeriesDetail {
  const genres = normalizeGenres(item?.genres ?? item?.genre);
  const episodes = normalizeEpisodes(source, item?.episodes, item?.url);
  const synopsis = item?.description ?? item?.synopsis ?? "Sin sinopsis disponible.";
  const title = item?.title ?? item?.name ?? fallbackTitle ?? "Titulo no disponible";
  const rawUrl = item?.url ?? item?.link ?? item?.href;
  const rawId =
    item?.id ?? item?._id ?? item?.anilistId ?? item?.slug ?? fallbackId ?? rawUrl ?? title;

  return {
    id: encodeReference<SeriesReference>({
      source,
      id: rawId ? String(rawId) : undefined,
      url: rawUrl ? String(rawUrl) : undefined,
      title,
    }),
    title,
    altTitle: item?.titleJapanese ?? item?.alt_title ?? item?.englishTitle,
    coverImage: item?.image ?? item?.poster ?? item?.cover ?? FALLBACK_IMAGE,
    bannerImage: item?.backdrop ?? item?.banner ?? item?.image ?? item?.poster,
    synopsis,
    genres,
    year: String(
      item?.year ??
        item?.releaseYear ??
        item?.seasonYear ??
        item?.releaseDate?.slice?.(0, 4) ??
        "N/A"
    ),
    statusLabel: item?.status ?? item?.state ?? "Catalogo",
    providerLabel: providerLabel(source),
    score: item?.score ? String(item.score) : item?.rating ? String(item.rating) : undefined,
    releaseWindow: String(item?.season ?? item?.year ?? item?.seasonYear ?? "N/A"),
    episodeCount: Number(item?.totalEpisodes ?? item?.episodeCount ?? episodes.length),
    featuredQuote: synopsis.length > 110 ? `${synopsis.slice(0, 110).trim()}...` : synopsis,
    episodes,
    downloads: [],
  };
}

async function fetchJson<T = any>(url: string, extraHeaders?: Record<string, string>) {
  const response = await fetch(url, { headers: extraHeaders });
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

function getSearchVariants(query: string) {
  const normalized = query.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return [""];
  }

  const compact = normalized.replace(/\s+/g, "");
  const hyphenated = normalized.replace(/\s+/g, "-");
  const spacedFromCamel = normalized.replace(/([a-z])([A-Z])/g, "$1 $2");
  const lower = normalized.toLowerCase();

  return [...new Set([normalized, spacedFromCamel, hyphenated, compact, lower])];
}

async function searchAnimeWebsiteCatalog(query: string) {
  if (!ANIME_WEBSITE_BASE_URL) {
    return [];
  }

  const url = new URL(`${ANIME_WEBSITE_BASE_URL}/search/media/anime-database`);
  url.searchParams.set("title", query);
  url.searchParams.set("limit", "12");

  const data = await fetchJson(url.toString(), headers(ANIME_WEBSITE_API_KEY));
  const results = asList<any>(data?.results ?? data?.data?.results ?? data?.data ?? data);
  return results.map((item) =>
    normalizeDetail("anime-website", item, item?.id ?? item?.anilistId ?? query, item?.title)
  );
}

async function searchAnimePlatform(query: string) {
  if (!ANIME_PLATFORM_BASE_URL) {
    return [];
  }

  const url = new URL(`${ANIME_PLATFORM_BASE_URL}/api/v1/anime`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "12");

  const data = await fetchJson(url.toString(), headers(ANIME_PLATFORM_API_KEY));
  const results = asList<any>(data?.data ?? data?.results ?? data);
  return results.map((item) =>
    normalizeDetail("anime-platform", item, item?.id ?? item?.title ?? query, item?.title)
  );
}

async function searchAnimeFlv(query: string) {
  if (!ANIMEFLV_BASE_URL) {
    return [];
  }

  const url = new URL(endpoint(ANIMEFLV_BASE_URL, "/search"));
  url.searchParams.set("query", query);
  url.searchParams.set("page", "1");

  const data = await fetchJson(url.toString());
  const results = asList<any>(data?.data?.media ?? data?.media ?? data?.data ?? data);
  return results.map((item) =>
    normalizeDetail("animeflv", item, item?.slug ?? item?.id ?? item?.title ?? query, item?.title)
  );
}

function dedupeEntries(entries: MobileAnimeSeriesDetail[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.title.toLowerCase().trim()}::${entry.providerLabel}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function resolveAnimeWebsiteSeed(reference: SeriesReference) {
  if (!ANIME_WEBSITE_BASE_URL) {
    return null;
  }

  const candidates = [reference.id, reference.title].filter(Boolean) as string[];
  for (const query of candidates) {
    const url = new URL(`${ANIME_WEBSITE_BASE_URL}/search/anime/consumet/gogoanime`);
    url.searchParams.set("query", query);
    const data = await fetchJson(url.toString(), headers(ANIME_WEBSITE_API_KEY));
    const results = asList<any>(data?.results ?? data?.data?.results ?? data?.data ?? data);
    const best =
      results.find((item) => {
        const itemTitle = String(item?.title ?? "").toLowerCase().trim();
        const refTitle = String(reference.title ?? "").toLowerCase().trim();
        const refId = String(reference.id ?? "").toLowerCase().trim();
        return itemTitle === refTitle || String(item?.id ?? "").toLowerCase().trim() === refId;
      }) ?? results[0];

    if (best) {
      return best;
    }
  }

  return null;
}

async function fetchAnimeWebsiteEpisodes(seriesId: string) {
  if (!ANIME_WEBSITE_BASE_URL) {
    return [];
  }

  const url = new URL(`${ANIME_WEBSITE_BASE_URL}/episodes/consumet/gogoanime/all`);
  url.searchParams.set("id", seriesId);
  const data = await fetchJson(url.toString(), headers(ANIME_WEBSITE_API_KEY));
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
    return normalizeDetail(
      "anime-website",
      {},
      String(reference.id ?? reference.title ?? "anime-website-fallback"),
      reference.title
    );
  }

  const url = new URL(`${ANIME_WEBSITE_BASE_URL}/media-info/anime/consumet/gogoanime`);
  url.searchParams.set("query", String(seed?.id ?? seed?.title ?? reference.title ?? ""));

  const data = await fetchJson(url.toString(), headers(ANIME_WEBSITE_API_KEY));
  const detail = normalizeDetail(
    "anime-website",
    unwrap(data ?? seed),
    String(seed?.id ?? reference.id ?? reference.title ?? ""),
    seed?.title ?? reference.title
  );

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

async function fetchAnimePlatformDetail(reference: SeriesReference) {
  if (!ANIME_PLATFORM_BASE_URL) {
    return null;
  }

  const candidates = [reference.title, reference.id].filter(Boolean) as string[];
  for (const query of candidates) {
    const results = await searchAnimePlatform(query);
    const match =
      results.find(
        (item) => item.title.toLowerCase().trim() === String(reference.title ?? "").toLowerCase().trim()
      ) ?? results[0];
    if (match) {
      return match;
    }
  }

  return null;
}

async function fetchAnimeFlvDetail(reference: SeriesReference) {
  if (!ANIMEFLV_BASE_URL || !reference.id) {
    return null;
  }

  const data = await fetchJson(
    endpoint(ANIMEFLV_BASE_URL, `/anime/${encodeURIComponent(reference.id)}`)
  );
  if (!data) {
    return normalizeDetail("animeflv", {}, reference.id, reference.title);
  }

  return normalizeDetail("animeflv", data?.data ?? data, reference.id, reference.title);
}

export async function fetchMobileAnimeShell(query: string, genre?: string) {
  if (hasRemoteProvider()) {
    try {
      const variants = getSearchVariants(query);
      const remoteResults: MobileAnimeSeriesDetail[] = [];

      for (const variant of variants) {
        remoteResults.push(...(await searchAnimeWebsiteCatalog(variant)));

        if (remoteResults.length < 12) {
          remoteResults.push(...(await searchAnimePlatform(variant)));
        }

        if (remoteResults.length < 12) {
          remoteResults.push(...(await searchAnimeFlv(variant)));
        }

        if (remoteResults.length >= 12) {
          break;
        }
      }

      const uniqueRemote = dedupeEntries(remoteResults);
      if (uniqueRemote.length > 0) {
        return uniqueRemote;
      }
    } catch (error) {
      console.warn("Anime search fallback:", error);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedGenre = genre?.trim().toLowerCase();

  return MOBILE_ANIME_LIBRARY.filter((entry) => {
    const queryOk =
      normalizedQuery.length === 0 ||
      entry.title.toLowerCase().includes(normalizedQuery) ||
      entry.synopsis.toLowerCase().includes(normalizedQuery);
    const genreOk =
      !normalizedGenre || normalizedGenre.length === 0
        ? true
        : entry.genres.some((item) => item.toLowerCase() === normalizedGenre);
    return queryOk && genreOk;
  });
}

export async function fetchMobileAnimeShellDetail(seriesId: string) {
  if (hasRemoteProvider()) {
    try {
      const reference = decodeReference<SeriesReference>(seriesId, "anime-website");

      switch (reference.source) {
        case "anime-website":
          return await fetchAnimeWebsiteDetail(reference);
        case "anime-platform":
          return await fetchAnimePlatformDetail(reference);
        case "animeflv":
          return await fetchAnimeFlvDetail(reference);
        default:
          return null;
      }
    } catch (error) {
      console.warn("Anime detail fallback:", error);
    }
  }

  return MOBILE_ANIME_LIBRARY.find((entry) => entry.id === seriesId) ?? null;
}

export async function fetchMobileEpisodeLinks(episodeId: string) {
  if (!hasRemoteProvider()) {
    return null;
  }

  try {
    const reference = decodeReference<EpisodeReference>(episodeId, "anime-website");

    switch (reference.source) {
      case "anime-website": {
        if (!ANIME_WEBSITE_BASE_URL || !reference.id) {
          return null;
        }
        const url = new URL(`${ANIME_WEBSITE_BASE_URL}/episodes/consumet/gogoanime/episode`);
        url.searchParams.set("id", reference.id);
        const data = await fetchJson(url.toString(), headers(ANIME_WEBSITE_API_KEY));
        const info = unwrap(data);
        return {
          stream: asList<any>(info?.sources ?? info?.streams ?? info?.stream),
          download: asList<any>(info?.downloads ?? info?.download),
        };
      }
        case "anime-platform":
          return null;
        case "animeflv":
          return null;
        default:
          return null;
    }
  } catch (error) {
    console.warn("Anime links unavailable:", error);
    return null;
  }
}

export async function connectRemoteAnimeProviderPlaceholder() {
  if (!hasRemoteProvider()) {
    return {
      success: false,
      message:
        "Falta EXPO_PUBLIC_ANIME_WEBSITE_API_URL, EXPO_PUBLIC_ANIMEFLV_API_URL o EXPO_PUBLIC_ANIME_PLATFORM_API_URL",
    };
  }

  const connected = [
    ANIME_WEBSITE_BASE_URL ? "anime-website" : null,
    ANIMEFLV_BASE_URL ? "animeflv" : null,
    ANIME_PLATFORM_BASE_URL ? "anime-platform" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return { success: true, message: `Conectado a ${connected}` };
}
