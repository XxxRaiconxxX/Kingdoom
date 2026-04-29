import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "./_serverAiProviders.js";

type PinterestReferencePayload = {
  imageUrl: string;
  title: string;
  description: string;
  sourceUrl: string;
};

function isPinterestUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return (
      parsed.hostname.includes("pinterest.com") ||
      parsed.hostname === "pin.it" ||
      parsed.hostname.endsWith(".pin.it")
    );
  } catch {
    return false;
  }
}

function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return "";
}

function extractTitle(html: string) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function sanitizePinterestTitle(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  const blockedPatterns = [
    /^pin by /i,
    / discover \(and save!\) /i,
    / on pinterest$/i,
    /^watch/i,
    /^explore /i,
  ];

  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return "";
  }

  return normalized
    .replace(/\s*\|\s*pinterest.*$/i, "")
    .replace(/\s*-\s*pinterest.*$/i, "")
    .trim();
}

function sanitizePinterestDescription(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  const blockedPatterns = [
    /discover \(and save!\) your own pins on pinterest/i,
    /^aug \d{1,2}, \d{4}/i,
    /^this pin was discovered by /i,
    /^watch/i,
    /^find and save ideas about /i,
  ];

  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return "";
  }

  return normalized.replace(/\s+Pinterest\s*$/i, "").trim();
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  const body = (req.body ?? {}) as { url?: string };
  const rawUrl = body.url?.trim() ?? "";

  if (!rawUrl) {
    return res.status(400).json({ message: "Pega una URL de Pinterest." });
  }

  if (!isPinterestUrl(rawUrl)) {
    return res.status(400).json({
      message: "La URL no parece ser un pin valido de Pinterest.",
    });
  }

  try {
    const response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return res.status(502).json({
        message: `Pinterest respondio con estado ${response.status}.`,
      });
    }

    const finalUrl = response.url || rawUrl;
    const html = await response.text();
    const imageUrl =
      extractMetaContent(html, "og:image") ||
      extractMetaContent(html, "twitter:image");
    const title = sanitizePinterestTitle(
      extractMetaContent(html, "og:title") ||
        extractMetaContent(html, "twitter:title") ||
        extractTitle(html)
    );
    const description = sanitizePinterestDescription(
      extractMetaContent(html, "og:description") ||
        extractMetaContent(html, "description") ||
        extractMetaContent(html, "twitter:description")
    );

    if (!imageUrl) {
      return res.status(422).json({
        message:
          "No pude extraer una imagen util del pin. Pinterest puede estar bloqueando esa referencia.",
      });
    }

    return res.status(200).json({
      reference: {
        imageUrl,
        title,
        description,
        sourceUrl: finalUrl,
      } satisfies PinterestReferencePayload,
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo leer la referencia de Pinterest. ${
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Error desconocido."
      }`,
    });
  }
}
