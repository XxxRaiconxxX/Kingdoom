export const PLAYBACK_PROVIDERS = ["animeflv", "tioanime", "gogoanime"] as const;

export type PlaybackProvider = (typeof PLAYBACK_PROVIDERS)[number];
export type PlaybackAction = "search" | "detail" | "links";

type PrimaryRequestInput = {
  baseUrl: string;
  action: PlaybackAction;
  provider: PlaybackProvider;
  id?: string;
  query?: string;
};

type AnimeFlvFallbackInput = {
  baseUrl: string;
  action: PlaybackAction;
  id?: string;
  query?: string;
  episode?: string;
  series?: string;
};

export function normalizePlaybackProvider(value: string): PlaybackProvider | null {
  if (value === "anime-website") return "gogoanime";
  return PLAYBACK_PROVIDERS.includes(value as PlaybackProvider)
    ? (value as PlaybackProvider)
    : null;
}

export function buildPrimaryProviderUrl(input: PrimaryRequestInput) {
  const url = new URL(input.baseUrl);

  if (input.action === "search") {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/api/search`;
    url.searchParams.set("q", input.query ?? "");
  } else if (input.action === "detail") {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/api/anime/${encodeURIComponent(input.id ?? "")}`;
  } else {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/api/episode/${encodeURIComponent(input.id ?? "")}`;
  }

  url.searchParams.set("source", input.provider);
  return url;
}

export function buildAnimeFlvFallbackUrl(input: AnimeFlvFallbackInput) {
  const url = new URL(input.baseUrl);
  const basePath = url.pathname.replace(/\/$/, "");

  if (input.action === "search") {
    url.pathname = `${basePath}/search`;
    url.searchParams.set("query", input.query ?? "");
    url.searchParams.set("page", "1");
    return url;
  }

  if (input.action === "detail" && input.id) {
    url.pathname = `${basePath}/anime/${encodeURIComponent(input.id)}`;
    return url;
  }

  if (input.action === "links" && input.series && input.episode) {
    url.pathname = `${basePath}/anime/${encodeURIComponent(input.series)}/episode/${encodeURIComponent(input.episode)}`;
    return url;
  }

  return null;
}
