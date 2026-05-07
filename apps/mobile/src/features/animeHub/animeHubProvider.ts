import { MOBILE_ANIME_LIBRARY } from "./animeHubMock";

const API_BASE_URL = process.env.EXPO_PUBLIC_ANIME_HUB_API_URL;

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

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        return (data || []).map((item: any) => ({
          id: item.id || item.slug,
          title: item.title,
          altTitle: item.alt_title,
          coverImage: item.image || item.poster,
          synopsis: item.description || "Sin sinopsis.",
          genres: item.genres || [],
          year: item.year?.toString() || "N/A",
          statusLabel: item.status || "Finalizado",
          providerLabel: "anime1v-remote",
          score: item.score?.toString(),
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
      const res = await fetch(`${API_BASE_URL}/api/v1/anime/info?id=${seriesId}`);
      if (res.ok) {
        const item = await res.json();
        return {
          id: item.id || seriesId,
          title: item.title,
          altTitle: item.alt_title,
          coverImage: item.image || item.poster,
          bannerImage: item.banner || item.image,
          synopsis: item.description || "Sin sinopsis.",
          genres: item.genres || [],
          year: item.year?.toString() || "N/A",
          statusLabel: item.status || "Emisión",
          providerLabel: "anime1v-remote",
          score: item.score?.toString(),
          releaseWindow: item.season || "N/A",
          episodeCount: item.episodes?.length || 0,
          featuredQuote: item.tagline || "Conexión remota activa.",
          episodes: (item.episodes || []).map((ep: any) => ({
            id: `${seriesId}-ep-${ep.number}`,
            number: ep.number,
            title: ep.title || `Episodio ${ep.number}`,
            duration: ep.duration,
            status: "ready",
          })),
          downloads: (item.downloads || []).map((dl: any) => ({
            qualityLabel: dl.quality,
            providerLabel: dl.provider,
            note: dl.url || "Enlace directo",
          })),
        };
      }
    } catch (e) {
      console.warn("Detail fetch failed, falling back to mock", e);
    }
  }
  return MOBILE_ANIME_LIBRARY.find((entry) => entry.id === seriesId) ?? null;
}

export async function connectRemoteAnimeProviderPlaceholder() {
  if (!API_BASE_URL) {
    return { success: false, message: "Falta EXPO_PUBLIC_ANIME_HUB_API_URL" };
  }
  return { success: true, message: "Conectado a " + API_BASE_URL };
}
