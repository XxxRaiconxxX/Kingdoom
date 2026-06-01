type VisualReference = {
  imageUrl: string;
  title: string;
  description: string;
  sourceUrl: string;
};

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

function sanitizeTitle(value: string) {
  return value
    .trim()
    .replace(/\s*\|\s*pinterest.*$/i, "")
    .replace(/\s*-\s*pinterest.*$/i, "")
    .trim();
}

function sanitizeDescription(value: string) {
  return value
    .trim()
    .replace(/\s+Pinterest\s*$/i, "")
    .trim();
}

function isImageLikeUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return /\.(png|jpe?g|webp|gif|avif)(?:$|\?)/i.test(parsed.pathname + parsed.search);
  } catch {
    return false;
  }
}

export async function resolveRemoteVisualReference(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    throw new Error("Falta una URL de referencia visual.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new Error("La referencia visual no es una URL valida.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("La referencia visual debe usar http o https.");
  }

  if (isImageLikeUrl(trimmedUrl)) {
    return {
      imageUrl: trimmedUrl,
      title: "",
      description: "",
      sourceUrl: trimmedUrl,
    } satisfies VisualReference;
  }

  const response = await fetch(trimmedUrl, {
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
    throw new Error(`La referencia visual respondio con estado ${response.status}.`);
  }

  const finalUrl = response.url || trimmedUrl;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.startsWith("image/")) {
    return {
      imageUrl: finalUrl,
      title: "",
      description: "",
      sourceUrl: finalUrl,
    } satisfies VisualReference;
  }

  const html = await response.text();
  const imageUrl =
    extractMetaContent(html, "og:image") ||
    extractMetaContent(html, "twitter:image");

  if (!imageUrl) {
    throw new Error(
      "No pude extraer una imagen util de esa referencia. Prueba con un pin o una imagen directa."
    );
  }

  return {
    imageUrl,
    title: sanitizeTitle(
      extractMetaContent(html, "og:title") ||
        extractMetaContent(html, "twitter:title") ||
        extractTitle(html)
    ),
    description: sanitizeDescription(
      extractMetaContent(html, "og:description") ||
        extractMetaContent(html, "description") ||
        extractMetaContent(html, "twitter:description")
    ),
    sourceUrl: finalUrl,
  } satisfies VisualReference;
}

export type { VisualReference };
