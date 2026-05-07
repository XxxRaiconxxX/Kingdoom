import type {
  AnimeEpisodeLinks,
  AnimeEpisodeSummary,
  AnimeHubProvider,
  AnimeSeriesDetail,
  AnimeSeriesSummary,
} from "./animeHub.types";

const API_BASE_URL = import.meta.env.VITE_ANIME_HUB_API_URL;
const API_KEY = import.meta.env.VITE_ANIME_HUB_API_KEY;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80";
const PLACEHOLDER_PALETTES = [
  ["#3b0712", "#f43f5e", "#fed7aa"],
  ["#082f49", "#22d3ee", "#dbeafe"],
  ["#2e1065", "#a855f7", "#f5d0fe"],
  ["#052e16", "#34d399", "#dcfce7"],
  ["#451a03", "#f59e0b", "#fef3c7"],
  ["#111827", "#94a3b8", "#f8fafc"],
] as const;

function endpoint(path: string) {
  return new URL(path, API_BASE_URL).toString();
}

function requestHeaders() {
  return API_KEY ? { "x-api-key": API_KEY } : undefined;
}

function asList<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function unwrapPayload(data: any) {
  return data?.data ?? data;
}

function normalizeGenres(value: unknown): string[] {
  return asList<any>(value)
    .map((genre) => (typeof genre === "string" ? genre : genre?.name))
    .filter(Boolean);
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function normalizeAssetUrl(...values: unknown[]): string | undefined {
  const raw = firstText(...values);
  if (!raw) {
    return undefined;
  }

  try {
    return new URL(raw, API_BASE_URL || window.location.origin).toString();
  } catch {
    return raw;
  }
}

function hashText(value: string) {
  return value.split("").reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeGeneratedCover(title: string, variant = 0) {
  const seed = hashText(`${title}-${variant}`);
  const [base, accent, ink] = PLACEHOLDER_PALETTES[seed % PLACEHOLDER_PALETTES.length];
  const initials =
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AN";
  const safeTitle = escapeSvgText(title.slice(0, 34));
  const runeA = 24 + (seed % 42);
  const runeB = 118 + (seed % 30);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460">
      <defs>
        <radialGradient id="glow" cx="50%" cy="34%" r="70%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.85"/>
          <stop offset="48%" stop-color="${base}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#030303"/>
        </radialGradient>
        <linearGradient id="veil" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="320" height="460" rx="28" fill="url(#glow)"/>
      <path d="M0 ${runeA} C80 ${runeB}, 172 6, 320 ${runeA + 58} L320 0 L0 0Z" fill="url(#veil)"/>
      <g opacity="0.16" fill="none" stroke="${ink}" stroke-width="2">
        <circle cx="74" cy="90" r="46"/>
        <circle cx="252" cy="286" r="58"/>
        <path d="M40 360 C104 310, 186 418, 284 350"/>
      </g>
      <rect x="28" y="28" width="264" height="404" rx="22" fill="none" stroke="${ink}" stroke-opacity="0.32" stroke-width="3"/>
      <text x="160" y="214" text-anchor="middle" font-family="Georgia, serif" font-size="76" font-weight="800" fill="${ink}">${escapeSvgText(initials)}</text>
      <text x="160" y="284" text-anchor="middle" font-family="Verdana, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="${ink}" fill-opacity="0.88">ANIME HUB</text>
      <text x="160" y="332" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${ink}" fill-opacity="0.92">${safeTitle}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function pickImage(item: any) {
  return (
    normalizeAssetUrl(
      item?.image,
      item?.imageUrl,
      item?.poster,
      item?.posterUrl,
      item?.cover,
      item?.coverUrl,
      item?.coverImage,
      item?.thumbnail,
      item?.thumbnailUrl,
      item?.img
    ) ?? FALLBACK_IMAGE
  );
}

function pickBanner(item: any, coverImage: string) {
  return (
    normalizeAssetUrl(
      item?.backdrop,
      item?.backdropUrl,
      item?.banner,
      item?.bannerUrl,
      item?.bannerImage,
      item?.image,
      item?.imageUrl
    ) ?? coverImage
  );
}

function normalizeSummary(item: any): AnimeSeriesSummary {
  const fallbackId = String(item?.title ?? item?.name ?? "anime-remoto");
  const coverImage = pickImage(item);

  return {
    id: String(item?.url ?? item?.id ?? item?.slug ?? fallbackId),
    title: item?.title ?? item?.name ?? "Titulo no disponible",
    altTitle: item?.alt_title ?? item?.titleJapanese ?? item?.alternativeTitle,
    coverImage,
    bannerImage: pickBanner(item, coverImage),
    synopsis: item?.description ?? item?.synopsis ?? "Sin sinopsis disponible.",
    genres: normalizeGenres(item?.genres),
    year: String(item?.year ?? item?.releaseYear ?? "N/A"),
    statusLabel: item?.status ?? item?.statusLabel ?? "Catalogo",
    providerLabel: "anime1v-remote",
    score: item?.score ? String(item.score) : undefined,
  };
}

function withDistinctCovers(items: AnimeSeriesSummary[]) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    counts.set(item.coverImage, (counts.get(item.coverImage) ?? 0) + 1);
  });

  return items.map((item, index) => {
    const isSharedCover = (counts.get(item.coverImage) ?? 0) > 1;
    if (!isSharedCover && item.coverImage !== FALLBACK_IMAGE) {
      return item;
    }

    const generatedCover = makeGeneratedCover(item.title, index);
    return {
      ...item,
      coverImage: generatedCover,
      bannerImage:
        !item.bannerImage || item.bannerImage === item.coverImage
          ? generatedCover
          : item.bannerImage,
    };
  });
}

function uniqueById(items: AnimeSeriesSummary[]) {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  return items.filter((item) => {
    const titleKey = item.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seenIds.has(item.id) || seenTitles.has(titleKey)) {
      return false;
    }

    seenIds.add(item.id);
    seenTitles.add(titleKey);
    return true;
  });
}

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getSearchVariants(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return [""];
  }

  const compact = normalized.replace(/\s+/g, "");
  const hyphenated = normalized.replace(/\s+/g, "-");
  const spacedFromCamel = normalized.replace(/([a-z])([A-Z])/g, "$1 $2");
  const lower = normalized.toLowerCase();
  const variants = [normalized, spacedFromCamel, hyphenated, compact, lower];

  return [...new Set(variants.map((item) => item.trim()).filter(Boolean))];
}

async function fetchSearchResults(query: string, genre?: string) {
  const url = new URL(endpoint("/api/v1/anime/search"));
  url.searchParams.set("q", query);
  if (genre) {
    url.searchParams.set("genre", genre);
  }

  const response = await fetch(url.toString(), { headers: requestHeaders() });
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return asList<any>(data?.data?.results ?? data?.results ?? data?.data).map(normalizeSummary);
}

async function fetchSeriesDetail(seriesId: string, paramName: "id" | "url") {
  const url = new URL(endpoint("/api/v1/anime/info"));
  url.searchParams.set(paramName, seriesId);

  const response = await fetch(url.toString(), { headers: requestHeaders() });
  if (!response.ok) {
    return null;
  }

  return normalizeDetail(await response.json(), seriesId);
}

function normalizeEpisodes(value: unknown): AnimeEpisodeSummary[] {
  return asList<any>(value).map((episode, index) => {
    const number = Number(episode?.number ?? episode?.episode ?? index + 1);
    return {
      id: String(episode?.url ?? episode?.id ?? `episode-${number}`),
      number,
      title: episode?.title ?? `Episodio ${number}`,
      duration: episode?.duration,
      status: "ready",
    };
  });
}

function normalizeDetail(raw: any, seriesId: string): AnimeSeriesDetail {
  const item = unwrapPayload(raw);
  const summary = normalizeSummary({ ...item, id: item?.id ?? item?.url ?? seriesId });
  const episodes = normalizeEpisodes(item?.episodes);
  const synopsis = summary.synopsis;

  return {
    ...summary,
    episodeCount: Number(item?.totalEpisodes ?? item?.episodeCount ?? episodes.length),
    releaseWindow: String(item?.season ?? item?.year ?? item?.releaseWindow ?? "N/A"),
    featuredQuote:
      synopsis.length > 150 ? `${synopsis.slice(0, 150).trim()}...` : synopsis,
    episodes,
    downloads: [],
  };
}

function normalizeLinks(raw: any): AnimeEpisodeLinks {
  const info = unwrapPayload(raw);
  return {
    stream: asList<any>(info?.servers?.sub ?? info?.servers?.SUB ?? info?.stream).map((link) => ({
      server: link?.server ?? link?.name ?? "Servidor",
      url: link?.url ?? link?.link ?? "#",
      quality: link?.quality,
    })),
    download: asList<any>(info?.downloadLinks?.SUB ?? info?.download ?? info?.downloads).map((link) => ({
      server: link?.server ?? link?.name ?? "Descarga",
      url: link?.url ?? link?.link ?? "#",
      quality: link?.quality,
    })),
  };
}

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
    if (!API_BASE_URL) {
      return [];
    }

    try {
      const variants = getSearchVariants(filters.query);
      const collected: AnimeSeriesSummary[] = [];

      for (const variant of variants) {
        const nextResults = await fetchSearchResults(variant, filters.genre);
        collected.push(...nextResults);

        if (nextResults.length > 0 && collected.length >= 8) {
          break;
        }
      }

      return withDistinctCovers(uniqueById(collected));
    } catch (error) {
      console.error("AnimeHub Remote Search Error:", error);
      return [];
    }
  },
  async getSeriesDetail(seriesId) {
    if (!API_BASE_URL) {
      return null;
    }

    try {
      const detail = (
        (await fetchSeriesDetail(seriesId, "id")) ??
        (await fetchSeriesDetail(seriesId, "url"))
      );
      return detail;
    } catch (error) {
      console.error("AnimeHub Remote Detail Error:", error);
      return null;
    }
  },
  async getEpisodeLinks(episodeUrl) {
    if (!API_BASE_URL) {
      return null;
    }

    try {
      const url = new URL(endpoint("/api/v1/anime/episode"));
      url.searchParams.set("url", episodeUrl);

      const response = await fetch(url.toString(), { headers: requestHeaders() });
      if (!response.ok) {
        return null;
      }

      return normalizeLinks(await response.json());
    } catch (error) {
      console.error("AnimeHub Remote Links Error:", error);
      return null;
    }
  },
};
