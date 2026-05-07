import { MOBILE_ANIME_LIBRARY } from "./animeHubMock";
import type {
  MobileAnimeEpisode,
  MobileAnimeSeriesDetail,
} from "./animeHubTypes";

const API_BASE_URL = process.env.EXPO_PUBLIC_ANIME_HUB_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_ANIME_HUB_API_KEY;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80";

export const MOBILE_ANIME_ENDPOINTS = {
  search: "/api/v1/anime/search",
  info: "/api/v1/anime/info",
  episode: "/api/v1/anime/episode",
  download: "/api/v1/anime/download",
  batch: "/api/v1/anime/batch",
} as const;

function headers() {
  return API_KEY ? { "x-api-key": API_KEY } : undefined;
}

function asList<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function unwrap(data: any) {
  return data?.data ?? data;
}

function normalizeGenres(value: unknown): string[] {
  return asList<any>(value)
    .map((genre) => (typeof genre === "string" ? genre : genre?.name))
    .filter(Boolean);
}

function normalizeEpisodes(value: unknown): MobileAnimeEpisode[] {
  return asList<any>(value).map((episode, index) => {
    const number = Number(episode?.number ?? episode?.episode ?? index + 1);
    return {
      id: String(episode?.url ?? episode?.id ?? `episode-${number}`),
      number,
      title: episode?.title ?? `Episodio ${number}`,
      duration: episode?.duration,
      status: "ready",
    };
  });
}

function normalizeDetail(item: any, fallbackId: string): MobileAnimeSeriesDetail {
  const genres = normalizeGenres(item?.genres);
  const episodes = normalizeEpisodes(item?.episodes);
  const synopsis = item?.description ?? item?.synopsis ?? "Sin sinopsis disponible.";

  return {
    id: String(item?.url ?? item?.id ?? fallbackId),
    title: item?.title ?? item?.name ?? "Titulo no disponible",
    altTitle: item?.titleJapanese ?? item?.alt_title,
    coverImage: item?.image ?? item?.poster ?? FALLBACK_IMAGE,
    bannerImage: item?.backdrop ?? item?.banner ?? item?.image,
    synopsis,
    genres,
    year: String(item?.year ?? "N/A"),
    statusLabel: item?.status ?? "Catalogo",
    providerLabel: "anime1v remoto",
    score: item?.score ? String(item.score) : undefined,
    releaseWindow: String(item?.season ?? item?.year ?? "N/A"),
    episodeCount: Number(item?.totalEpisodes ?? episodes.length),
    featuredQuote: synopsis.length > 110 ? `${synopsis.slice(0, 110).trim()}...` : synopsis,
    episodes,
    downloads: [],
  };
}

export async function fetchMobileAnimeShell(query: string, genre?: string) {
  if (API_BASE_URL) {
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/anime/search`);
      url.searchParams.set("q", query);
      if (genre) {
        url.searchParams.set("genre", genre);
      }

      const response = await fetch(url.toString(), { headers: headers() });
      if (response.ok) {
        const data = await response.json();
        const results = asList<any>(data?.data?.results ?? data?.results ?? data?.data);
        return results.map((item) => normalizeDetail(item, item?.url ?? item?.id ?? item?.title));
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
  if (API_BASE_URL) {
    try {
      for (const paramName of ["id", "url"] as const) {
        const url = new URL(`${API_BASE_URL}/api/v1/anime/info`);
        url.searchParams.set(paramName, seriesId);
        const response = await fetch(url.toString(), { headers: headers() });

        if (response.ok) {
          return normalizeDetail(unwrap(await response.json()), seriesId);
        }
      }
    } catch (error) {
      console.warn("Anime detail fallback:", error);
    }
  }

  return MOBILE_ANIME_LIBRARY.find((entry) => entry.id === seriesId) ?? null;
}

export async function fetchMobileEpisodeLinks(episodeUrl: string) {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const url = new URL(`${API_BASE_URL}/api/v1/anime/episode`);
    url.searchParams.set("url", episodeUrl);
    const response = await fetch(url.toString(), { headers: headers() });

    if (!response.ok) {
      return null;
    }

    const info = unwrap(await response.json());
    return {
      stream: asList<any>(info?.servers?.sub ?? info?.servers?.SUB ?? info?.stream),
      download: asList<any>(info?.downloadLinks?.SUB ?? info?.download ?? info?.downloads),
    };
  } catch (error) {
    console.warn("Anime links unavailable:", error);
    return null;
  }
}

export async function connectRemoteAnimeProviderPlaceholder() {
  if (!API_BASE_URL) {
    return { success: false, message: "Falta EXPO_PUBLIC_ANIME_HUB_API_URL" };
  }

  return { success: true, message: "Conectado a " + API_BASE_URL };
}
