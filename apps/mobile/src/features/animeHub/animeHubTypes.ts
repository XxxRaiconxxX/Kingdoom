export type MobileAnimeSeriesSummary = {
  id: string;
  title: string;
  altTitle?: string;
  coverImage: string;
  synopsis: string;
  genres: string[];
  year: string;
  statusLabel: string;
  providerLabel: string;
  score?: string;
};

export type MobileAnimeEpisode = {
  id: string;
  number: number;
  title: string;
  duration?: string;
  status: "ready" | "provider-required";
};

export type MobileAnimeDownload = {
  qualityLabel: string;
  providerLabel: string;
  note: string;
};

export type MobileAnimeSeriesDetail = MobileAnimeSeriesSummary & {
  bannerImage?: string;
  releaseWindow: string;
  episodeCount: number;
  featuredQuote: string;
  episodes: MobileAnimeEpisode[];
  downloads: MobileAnimeDownload[];
};
