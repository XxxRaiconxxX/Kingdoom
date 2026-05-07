import type { AnimeHubProvider } from "./animeHub.types";

const API_BASE_URL = import.meta.env.VITE_ANIME_HUB_API_URL;

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
    if (!API_BASE_URL) return [];

    try {
      const url = new URL(`${API_BASE_URL}/api/v1/anime/search`);
      url.searchParams.append("q", filters.query);
      
      const response = await fetch(url.toString());
      if (!response.ok) return [];
      
      const data = await response.json();
      
      return (data || []).map((item: any) => ({
        id: item.id || item.slug,
        title: item.title,
        altTitle: item.alt_title,
        coverImage: item.image || item.poster,
        synopsis: item.description || "Sin sinopsis disponible.",
        genres: item.genres || [],
        year: item.year?.toString() || "N/A",
        statusLabel: item.status || "Finalizado",
        providerLabel: "anime1v-remote",
        score: item.score?.toString(),
      }));
    } catch (error) {
      console.error("AnimeHub Remote Search Error:", error);
      return [];
    }
  },
  async getSeriesDetail(seriesId) {
    if (!API_BASE_URL) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/anime/info?id=${seriesId}`);
      if (!response.ok) return null;

      const item = await response.json();

      const episodes = (item.episodes || []).map((ep: any) => ({
        id: `${seriesId}-ep-${ep.number}`,
        number: ep.number,
        title: ep.title || `Episodio ${ep.number}`,
        duration: ep.duration,
        status: "ready",
      }));

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
        episodeCount: item.episodes?.length || 0,
        releaseWindow: item.season || "N/A",
        featuredQuote: item.tagline || "Conexión remota activa.",
        episodes,
        downloads: (item.downloads || []).map((dl: any) => ({
          qualityLabel: dl.quality,
          providerLabel: dl.provider,
          status: "mock",
          note: dl.url || "Enlace directo",
        })),
      };
    } catch (error) {
      console.error("AnimeHub Remote Detail Error:", error);
      return null;
    }
  },
};
