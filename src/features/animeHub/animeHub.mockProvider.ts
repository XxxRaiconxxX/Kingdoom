import { ANIME_HUB_LIBRARY } from "./animeHub.mock";
import type { AnimeHubProvider, AnimeSearchFilters } from "./animeHub.types";

function matchesFilters(entryTitle: string, synopsis: string, genres: string[], filters: AnimeSearchFilters) {
  const query = filters.query.trim().toLowerCase();
  const genre = filters.genre?.trim().toLowerCase();
  const year = filters.year?.trim();

  const queryOk =
    query.length === 0 ||
    entryTitle.toLowerCase().includes(query) ||
    synopsis.toLowerCase().includes(query);
  const genreOk = !genre || genres.some((item) => item.toLowerCase() === genre);
  const yearOk = !year || year === "";

  return queryOk && genreOk && yearOk;
}

export const mockAnimeHubProvider: AnimeHubProvider = {
  id: "anime-shell-mock",
  label: "anime shell",
  status: "mock",
  endpointMap: {
    search: "/search/media/anime-database",
    info: "/media-info/anime/consumet/gogoanime",
    episode: "/episodes/consumet/gogoanime/episode",
    download: "Pendiente de proveedor real",
    batch: "No configurado",
  },
  async searchSeries(filters) {
    return ANIME_HUB_LIBRARY.filter((entry) =>
      matchesFilters(entry.title, entry.synopsis, entry.genres, filters)
    ).map(({ episodes, downloads, featuredQuote, releaseWindow, episodeCount, ...summary }) => summary);
  },
  async getSeriesDetail(seriesId) {
    return ANIME_HUB_LIBRARY.find((entry) => entry.id === seriesId) ?? null;
  },
  async getEpisodeLinks() {
    return {
      stream: [{ server: "Mock Stream", url: "#" }],
      download: [{ server: "Mock Download", url: "#" }],
    };
  },
};
