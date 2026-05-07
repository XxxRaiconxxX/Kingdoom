import { MOBILE_ANIME_LIBRARY } from "./animeHubMock";

const API_BASE_URL = process.env.EXPO_PUBLIC_ANIME_HUB_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_ANIME_HUB_API_KEY || 'dev-anime1v-key';

export const MOBILE_ANIME_ENDPOINTS = {
  search: "/api/v1/anime/search",
  info: "/api/v1/anime/info",
  episode: "/api/v1/anime/episode",
  download: "/api/v1/anime/download",
  batch: "/api/v1/anime/batch",
} as const;

export async function fetchMobileAnimeShell(query: string, genre?: string) {
  if (API_BASE_URL) {
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/anime/search`);
      url.searchParams.append("q", query);
      if (genre) url.searchParams.append("genre", genre);

      const res = await fetch(url.toString(), {
        headers: {
          'x-api-key': API_KEY
        }
      });
      if (res.ok) {
        const data = await res.json();
        const results = data?.data?.results || [];
        return results.map((item: any) => ({
          id: item.url || item.id,
          title: item.title,
          image: item.image,
          genres: item.genres || []
        }));
      }
    } catch (e) {
      console.warn("Falling back to mock due to remote error:", e);
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
      const res = await fetch(`${API_BASE_URL}/api/v1/anime/info?id=${seriesId}`, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      if (res.ok) {
        const data = await res.json();
        const item = data?.data;
        if (!item) return null;
        return {
          id: item.url || item.id || seriesId,
          title: item.title,
          altTitle: item.titleJapanese,
          coverImage: item.image,
          bannerImage: item.backdrop,
          synopsis: item.description || "Sin sinopsis.",
          genres: item.genres?.map((g: any) => g.name) || [],
          year: item.year?.toString() || "N/A",
          statusLabel: item.status || "Finalizado",
          providerLabel: "anime1v-remote",
          score: item.score?.toString(),
          releaseWindow: item.year || "N/A",
          episodeCount: item.totalEpisodes || 0,
          featuredQuote: item.description?.slice(0, 100) + '...',
          episodes: (item.episodes || []).map((ep: any) => ({
            id: ep.url,
            number: ep.number,
            title: ep.title || `Episodio ${ep.number}`,
            status: "ready",
          })),
          downloads: [],
        };
      }
    } catch (e) {
      console.warn("Detail fetch failed, falling back to mock", e);
    }
  }
  return MOBILE_ANIME_LIBRARY.find((entry) => entry.id === seriesId) ?? null;
}

export async function fetchMobileEpisodeLinks(episodeUrl: string) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/anime/episode?url=${encodeURIComponent(episodeUrl)}`, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      if (res.ok) {
        const data = await res.json();
        const info = data?.data;
        if (!info) return null;
        return {
          stream: info.servers?.sub || [],
          download: info.downloadLinks?.SUB || []
        };
      }
    } catch (e) {
      console.warn("Links fetch failed", e);
    }
  }
  return null;
}

export async function connectRemoteAnimeProviderPlaceholder() {
  if (!API_BASE_URL) {
    return { success: false, message: "Falta EXPO_PUBLIC_ANIME_HUB_API_URL" };
  }
  return { success: true, message: "Conectado a " + API_BASE_URL };
}
