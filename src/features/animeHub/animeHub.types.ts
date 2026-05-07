export type AnimeProviderStatus = "mock" | "placeholder" | "ready";

export type AnimeSearchFilters = {
  query: string;
  genre?: string;
  year?: string;
  provider?: string;
};

export type AnimeSeriesSummary = {
  id: string;
  title: string;
  altTitle?: string;
  coverImage: string;
  bannerImage?: string;
  synopsis: string;
  genres: string[];
  year: string;
  statusLabel: string;
  providerLabel: string;
  score?: string;
};

export type AnimeEpisodeSummary = {
  id: string;
  number: number;
  title: string;
  duration?: string;
  status: "ready" | "provider-required";
};

export type AnimeDownloadRequest = {
  qualityLabel: string;
  providerLabel: string;
  status: "provider-required" | "mock";
  note: string;
};

export type AnimeEpisodeLinks = {
  stream: { server: string; url: string; quality?: string }[];
  download: { server: string; url: string; quality?: string }[];
};

export type AnimeSeriesDetail = AnimeSeriesSummary & {
  episodeCount: number;
  releaseWindow: string;
  featuredQuote: string;
  episodes: AnimeEpisodeSummary[];
  downloads: AnimeDownloadRequest[];
};

export type AnimeHubProvider = {
  id: string;
  label: string;
  status: AnimeProviderStatus;
  endpointMap: {
    search: string;
    info: string;
    episode: string;
    download: string;
    batch: string;
  };
  searchSeries: (filters: AnimeSearchFilters) => Promise<AnimeSeriesSummary[]>;
  getSeriesDetail: (seriesId: string) => Promise<AnimeSeriesDetail | null>;
  getEpisodeLinks: (episodeUrl: string) => Promise<AnimeEpisodeLinks | null>;
};
