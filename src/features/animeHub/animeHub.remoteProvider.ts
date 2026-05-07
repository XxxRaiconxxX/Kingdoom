import type {
  AnimeEpisodeLinks,
  AnimeEpisodeSummary,
  AnimeHubProvider,
  AnimeSeriesDetail,
  AnimeSeriesSummary,
} from "./animeHub.types";

const API_BASE_URL = import.meta.env.VITE_ANIME_HUB_API_URL;
const API_KEY = import.meta.env.VITE_ANIME_HUB_API_KEY;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80";

function endpoint(path: string) {
  return new URL(path, API_BASE_URL).toString();
}

function requestHeaders() {
  return API_KEY ? { "x-api-key": API_KEY } : undefined;
}

function asList<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function unwrapPayload(data: any) {
  return data?.data ?? data;
}

function normalizeGenres(value: unknown): string[] {
  return asList<any>(value)
    .map((genre) => (typeof genre === "string" ? genre : genre?.name))
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

function normalizeAssetUrl(...values: unknown[]): string | undefined {
  const raw = firstText(...values);
  if (!raw) {
    return undefined;
  }

  try {
    return new URL(raw, API_BASE_URL || window.location.origin).toString();
  } catch {
    return raw;
  }
}

function pickImage(item: any) {
  return (
    normalizeAssetUrl(
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

function pickBanner(item: any, coverImage: string) {
  return (
    normalizeAssetUrl(
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

function normalizeSummary(item: any): AnimeSeriesSummary {
  const fallbackId = String(item?.title ?? item?.name ?? "anime-remoto");
  const coverImage = pickImage(item);

  return {
    id: String(item?.url ?? item?.id ?? item?.slug ?? fallbackId),
    title: item?.title ?? item?.name ?? "Titulo no disponible",
    altTitle: item?.alt_title ?? item?.titleJapanese ?? item?.alternativeTitle,
    coverImage,
    bannerImage: pickBanner(item, coverImage),
    synopsis: item?.description ?? item?.synopsis ?? "Sin sinopsis disponible.",
    genres: normalizeGenres(item?.genres),
    year: String(item?.year ?? item?.releaseYear ?? "N/A"),
    statusLabel: item?.status ?? item?.statusLabel ?? "Catalogo",
    providerLabel: "anime1v-remote",
    score: item?.score ? String(item.score) : undefined,
  };
}

async function fetchSeriesDetail(seriesId: string, paramName: "id" | "url") {
  const url = new URL(endpoint("/api/v1/anime/info"));
  url.searchParams.set(paramName, seriesId);

  const response = await fetch(url.toString(), { headers: requestHeaders() });
  if (!response.ok) {
    return null;
  }

  return normalizeDetail(await response.json(), seriesId);
}

function normalizeEpisodes(value: unknown): AnimeEpisodeSummary[] {
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

function normalizeDetail(raw: any, seriesId: string): AnimeSeriesDetail {
  const item = unwrapPayload(raw);
  const summary = normalizeSummary({ ...item, id: item?.id ?? item?.url ?? seriesId });
  const episodes = normalizeEpisodes(item?.episodes);
  const synopsis = summary.synopsis;

  return {
    ...summary,
    episodeCount: Number(item?.totalEpisodes ?? item?.episodeCount ?? episodes.length),
    releaseWindow: String(item?.season ?? item?.year ?? item?.releaseWindow ?? "N/A"),
    featuredQuote:
      synopsis.length > 150 ? `${synopsis.slice(0, 150).trim()}...` : synopsis,
    episodes,
    downloads: [],
  };
}

function normalizeLinks(raw: any): AnimeEpisodeLinks {
  const info = unwrapPayload(raw);
  return {
    stream: asList<any>(info?.servers?.sub ?? info?.servers?.SUB ?? info?.stream).map((link) => ({
      server: link?.server ?? link?.name ?? "Servidor",
      url: link?.url ?? link?.link ?? "#",
      quality: link?.quality,
    })),
    download: asList<any>(info?.downloadLinks?.SUB ?? info?.download ?? info?.downloads).map((link) => ({
      server: link?.server ?? link?.name ?? "Descarga",
      url: link?.url ?? link?.link ?? "#",
      quality: link?.quality,
    })),
  };
}

export const remoteAnimeHubProvider: AnimeHubProvider = {
  id: "anime1v-remote",
  label: "anime1v remoto",
  status: API_BASE_URL ? "ready" : "placeholder",
  endpointMap: {
    search: "/api/v1/anime/search",
    info: "/api/v1/anime/info",
    episode: "/api/v1/anime/episode",
    download: "/api/v1/anime/download",
    batch: "/api/v1/anime/batch",
  },
  async searchSeries(filters) {
    if (!API_BASE_URL) {
      return [];
    }

    try {
      const url = new URL(endpoint("/api/v1/anime/search"));
      url.searchParams.set("q", filters.query);
      if (filters.genre) {
        url.searchParams.set("genre", filters.genre);
      }

      const response = await fetch(url.toString(), { headers: requestHeaders() });
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return asList<any>(data?.data?.results ?? data?.results ?? data?.data).map(normalizeSummary);
    } catch (error) {
      console.error("AnimeHub Remote Search Error:", error);
      return [];
    }
  },
  async getSeriesDetail(seriesId) {
    if (!API_BASE_URL) {
      return null;
    }

    try {
      return (
        (await fetchSeriesDetail(seriesId, "id")) ??
        (await fetchSeriesDetail(seriesId, "url"))
      );
    } catch (error) {
      console.error("AnimeHub Remote Detail Error:", error);
      return null;
    }
  },
  async getEpisodeLinks(episodeUrl) {
    if (!API_BASE_URL) {
      return null;
    }

    try {
      const url = new URL(endpoint("/api/v1/anime/episode"));
      url.searchParams.set("url", episodeUrl);

      const response = await fetch(url.toString(), { headers: requestHeaders() });
      if (!response.ok) {
        return null;
      }

      return normalizeLinks(await response.json());
    } catch (error) {
      console.error("AnimeHub Remote Links Error:", error);
      return null;
    }
  },
};
