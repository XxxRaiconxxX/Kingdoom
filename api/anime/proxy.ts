import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../../server/admin/_serverAiProviders.js";
import {
  buildAnimeFlvFallbackUrl,
  buildPrimaryProviderUrl,
  isEmptySearchStatus,
  normalizePlaybackProvider,
  type PlaybackAction,
  type PlaybackProvider,
} from "../../server/anime/providerContract.js";

declare const process: {
  env: Record<string, string | undefined>;
};

type JsonRecord = Record<string, unknown>;

type UpstreamResult = {
  latencyMs: number;
  ok: boolean;
  payload: unknown;
  status: number;
};

const PRIMARY_API_URL =
  process.env.ANIME_HUB_API_URL ||
  process.env.VITE_ANIME_HUB_API_URL ||
  "https://scraping-web-anime-api.vercel.app";
const PRIMARY_API_KEY =
  process.env.ANIME_HUB_API_KEY || process.env.VITE_ANIME_HUB_API_KEY || "";
const ANIMEFLV_FALLBACK_API_URL =
  process.env.ANIMEFLV_FALLBACK_API_URL || "https://animeflv.ahmedrangel.com/api";

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(record: JsonRecord | null, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function unwrapPayload(value: unknown) {
  const record = asRecord(value);
  return record?.success === true && record.data !== undefined ? record.data : value;
}

function upstreamMessage(result: UpstreamResult) {
  const record = asRecord(result.payload);
  return (
    readString(record, "message", "error") ||
    `El proveedor respondio con estado ${result.status}.`
  );
}

function cacheControl(action: PlaybackAction | "metadata") {
  if (action === "metadata") return "public, s-maxage=3600, stale-while-revalidate=86400";
  if (action === "detail") return "public, s-maxage=600, stale-while-revalidate=3600";
  if (action === "links") return "public, s-maxage=120, stale-while-revalidate=300";
  return "public, s-maxage=300, stale-while-revalidate=900";
}

async function fetchUpstream(url: URL, headers?: HeadersInit): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Kingdoom-Anime-Proxy/2.0",
        ...headers,
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);

    return {
      latencyMs: Date.now() - startedAt,
      ok: response.ok,
      payload,
      status: response.status,
    };
  } catch (error) {
    return {
      latencyMs: Date.now() - startedAt,
      ok: false,
      payload: {
        message:
          error instanceof Error && error.name === "AbortError"
            ? "El proveedor excedio el tiempo de espera."
            : "No se pudo conectar con el proveedor.",
      },
      status: 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeLinks(value: unknown) {
  const payload = asRecord(unwrapPayload(value));
  const directStream = asArray(payload?.stream);
  const directDownload = asArray(payload?.download ?? payload?.downloads);
  const servers = asArray(payload?.servers);

  const streamSource = directStream.length ? directStream : servers;
  const downloadSource = directDownload.length ? directDownload : servers;

  const stream = streamSource
    .map((entry) => {
      const record = asRecord(entry);
      const url = readString(record, "url", "link", "embed");
      if (!url) return null;
      return {
        server: readString(record, "server", "name") || "Servidor",
        url,
        quality: readString(record, "quality"),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const download = downloadSource
    .map((entry) => {
      const record = asRecord(entry);
      const url = readString(record, "download", "downloadUrl");
      if (!url) return null;
      return {
        server: readString(record, "server", "name") || "Descarga",
        url,
        quality: readString(record, "quality"),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return { stream, download };
}

function primaryHeaders() {
  return PRIMARY_API_KEY
    ? { Authorization: `Bearer ${PRIMARY_API_KEY}` }
    : undefined;
}

async function requestPlayback(input: {
  action: PlaybackAction;
  episode?: string;
  id?: string;
  provider: PlaybackProvider;
  query?: string;
  series?: string;
}) {
  const primaryUrl = buildPrimaryProviderUrl({
    baseUrl: PRIMARY_API_URL,
    action: input.action,
    provider: input.provider,
    id: input.id,
    query: input.query,
  });
  const primary = await fetchUpstream(primaryUrl, primaryHeaders());

  if (isEmptySearchStatus(input.action, primary.status)) {
    return {
      data: [],
      latencyMs: primary.latencyMs,
      upstream: "primary",
    };
  }

  if (primary.ok) {
    return {
      data:
        input.action === "links"
          ? normalizeLinks(primary.payload)
          : unwrapPayload(primary.payload),
      latencyMs: primary.latencyMs,
      upstream: "primary",
    };
  }

  const fallbackUrl =
    input.provider === "animeflv"
      ? buildAnimeFlvFallbackUrl({
          baseUrl: ANIMEFLV_FALLBACK_API_URL,
          action: input.action,
          id: input.id,
          query: input.query,
          episode: input.episode,
          series: input.series,
        })
      : null;

  if (!fallbackUrl) {
    throw new Error(upstreamMessage(primary));
  }

  const fallback = await fetchUpstream(fallbackUrl);
  if (!fallback.ok) {
    throw new Error(
      `${upstreamMessage(primary)} Respaldo AnimeFLV: ${upstreamMessage(fallback)}`
    );
  }

  return {
    data:
      input.action === "links"
        ? normalizeLinks(fallback.payload)
        : unwrapPayload(fallback.payload),
    latencyMs: primary.latencyMs + fallback.latencyMs,
    upstream: "animeflv-backup",
  };
}

function normalizeJikanMetadata(value: unknown) {
  const root = asRecord(value);
  const first = asRecord(asArray(root?.data)[0]);
  if (!first) return null;

  const images = asRecord(first.images);
  const webp = asRecord(images?.webp);
  const jpg = asRecord(images?.jpg);

  return {
    source: "jikan",
    title: readString(first, "title", "title_english"),
    synopsis: readString(first, "synopsis"),
    genres: asArray(first.genres)
      .map((genre) => readString(asRecord(genre), "name"))
      .filter((genre): genre is string => Boolean(genre)),
    year: typeof first.year === "number" ? String(first.year) : undefined,
    score: typeof first.score === "number" ? String(first.score) : undefined,
    image: readString(webp, "large_image_url", "image_url") || readString(jpg, "large_image_url", "image_url"),
    status: readString(first, "status"),
  };
}

function normalizeKitsuMetadata(value: unknown) {
  const root = asRecord(value);
  const first = asRecord(asArray(root?.data)[0]);
  const attributes = asRecord(first?.attributes);
  if (!attributes) return null;

  const poster = asRecord(attributes.posterImage);
  const startDate = readString(attributes, "startDate");
  const genres = asArray(root?.included)
    .map((entry) => {
      const record = asRecord(entry);
      return record?.type === "categories"
        ? readString(asRecord(record.attributes), "title")
        : undefined;
    })
    .filter((genre): genre is string => Boolean(genre));

  const rawScore = Number(attributes.averageRating);

  return {
    source: "kitsu",
    title: readString(attributes, "canonicalTitle"),
    synopsis: readString(attributes, "synopsis", "description"),
    genres,
    year: startDate?.slice(0, 4),
    score: Number.isFinite(rawScore) ? (rawScore / 10).toFixed(1) : undefined,
    image: readString(poster, "original", "large", "medium"),
    status: readString(attributes, "status"),
  };
}

async function requestMetadata(query: string) {
  const jikanUrl = new URL("https://api.jikan.moe/v4/anime");
  jikanUrl.searchParams.set("q", query);
  jikanUrl.searchParams.set("limit", "1");
  const jikan = await fetchUpstream(jikanUrl);
  const jikanData = jikan.ok ? normalizeJikanMetadata(jikan.payload) : null;

  if (jikanData) {
    return { data: jikanData, latencyMs: jikan.latencyMs, upstream: "jikan" };
  }

  const kitsuUrl = new URL("https://kitsu.io/api/edge/anime");
  kitsuUrl.searchParams.set("filter[text]", query);
  kitsuUrl.searchParams.set("page[limit]", "1");
  kitsuUrl.searchParams.set("include", "categories");
  const kitsu = await fetchUpstream(kitsuUrl);
  const kitsuData = kitsu.ok ? normalizeKitsuMetadata(kitsu.payload) : null;

  if (!kitsuData) {
    throw new Error("Jikan y Kitsu no entregaron metadatos para esta serie.");
  }

  return {
    data: kitsuData,
    latencyMs: jikan.latencyMs + kitsu.latencyMs,
    upstream: "kitsu",
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  const actionValue = queryValue(req.query?.action);
  const query = queryValue(req.query?.query)?.trim();

  if (actionValue === "metadata") {
    if (!query) return res.status(400).json({ message: "Falta parametro: query." });

    try {
      const result = await requestMetadata(query);
      res.setHeader("Cache-Control", cacheControl("metadata"));
      return res.status(200).json({
        data: result.data,
        meta: {
          provider: "metadata",
          upstream: result.upstream,
          latencyMs: result.latencyMs,
        },
      });
    } catch (error) {
      return res.status(502).json({
        message: error instanceof Error ? error.message : "Fallo de metadatos anime.",
      });
    }
  }

  const action: PlaybackAction | null =
    actionValue === "search" || actionValue === "detail" || actionValue === "links"
      ? actionValue
      : null;
  const provider = normalizePlaybackProvider(queryValue(req.query?.provider) || "");
  const id = queryValue(req.query?.id)?.trim();

  if (!action || !provider) {
    return res.status(400).json({ message: "Action o proveedor no soportado." });
  }
  if (action === "search" && !query) {
    return res.status(400).json({ message: "Falta parametro: query." });
  }
  if (action !== "search" && !id) {
    return res.status(400).json({ message: "Falta parametro: id." });
  }

  try {
    const result = await requestPlayback({
      action,
      provider,
      id,
      query,
      series: queryValue(req.query?.series)?.trim(),
      episode: queryValue(req.query?.episode)?.trim(),
    });
    res.setHeader("Cache-Control", cacheControl(action));
    return res.status(200).json({
      data: result.data,
      meta: {
        provider,
        upstream: result.upstream,
        latencyMs: result.latencyMs,
      },
    });
  } catch (error) {
    return res.status(502).json({
      message: error instanceof Error ? error.message : "Fallo del proveedor anime.",
      provider,
    });
  }
}
