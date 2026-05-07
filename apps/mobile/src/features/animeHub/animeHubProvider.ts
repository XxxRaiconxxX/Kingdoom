import { MOBILE_ANIME_LIBRARY } from "./animeHubMock";

export const MOBILE_ANIME_ENDPOINTS = {
  search: "/api/v1/anime/search",
  info: "/api/v1/anime/info",
  episode: "/api/v1/anime/episode",
  download: "/api/v1/anime/download",
  batch: "/api/v1/anime/batch",
} as const;

export async function fetchMobileAnimeShell(query: string, genre?: string) {
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
  return MOBILE_ANIME_LIBRARY.find((entry) => entry.id === seriesId) ?? null;
}

export async function connectRemoteAnimeProviderPlaceholder() {
  // Aqui faltaria:
  // 1. Si no se anade ANIME_HUB_API_URL en la app, no se activa y sigue modo cascaron.
  // 2. Consumir search, info, episode, download y batch.
  // 3. Adaptar la respuesta del backend a los tipos nativos de la app.
  throw new Error("Proveedor remoto no conectado. Solo el shell mock esta activo.");
}
