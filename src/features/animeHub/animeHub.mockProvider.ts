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
  id: "anime1v-shell-mock",
  label: "anime1v shell",
  status: "mock",
  endpointMap: {
    search: "/api/v1/anime/search",
    info: "/api/v1/anime/info",
    episode: "/api/v1/anime/episode",
    download: "/api/v1/anime/download",
    batch: "/api/v1/anime/batch",
  },
  async searchSeries(filters) {
    return ANIME_HUB_LIBRARY.filter((entry) =>
      matchesFilters(entry.title, entry.synopsis, entry.genres, filters)
    ).map(({ episodes, downloads, featuredQuote, releaseWindow, episodeCount, ...summary }) => summary);
  },
  async getSeriesDetail(seriesId) {
    return ANIME_HUB_LIBRARY.find((entry) => entry.id === seriesId) ?? null;
  },
};
