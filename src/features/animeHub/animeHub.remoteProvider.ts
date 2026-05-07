import type { AnimeHubProvider } from "./animeHub.types";

export const remoteAnimeHubProvider: AnimeHubProvider = {
  id: "anime1v-remote-placeholder",
  label: "anime1v remoto",
  status: "placeholder",
  endpointMap: {
    search: "/api/v1/anime/search",
    info: "/api/v1/anime/info",
    episode: "/api/v1/anime/episode",
    download: "/api/v1/anime/download",
    batch: "/api/v1/anime/batch",
  },
  async searchSeries() {
    // Aqui faltaria:
    // 1. Si no se anade ANIME_HUB_API_URL, no se activa y sigue modo cascaron.
    // 2. Hacer fetch al endpoint search del backend compatible con anime1v.
    // 3. Adaptar la respuesta del backend a AnimeSeriesSummary[].
    throw new Error("Proveedor remoto no conectado. Falta ANIME_HUB_API_URL y el adaptador de busqueda.");
  },
  async getSeriesDetail() {
    // Aqui faltaria:
    // 0. Si no se anade ANIME_HUB_API_URL ni el fetch real, no se activa y sigue modo cascaron.
    // 1. Resolver /api/v1/anime/info con la URL o id del anime.
    // 2. Resolver /api/v1/anime/episode para poblar episodios y mirrors.
    // 3. Traducir /download y /batch a AnimeDownloadRequest[].
    throw new Error("Proveedor remoto no conectado. Falta resolver info, episodios y descargas.");
  },
};
