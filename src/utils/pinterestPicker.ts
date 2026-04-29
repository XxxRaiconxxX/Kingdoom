export type PinterestReference = {
  imageUrl: string;
  title: string;
  description: string;
  sourceUrl: string;
};

type PinterestPickerResult =
  | { status: "ready"; reference: PinterestReference }
  | { status: "error"; message: string };

function getPinterestPickerEndpoint() {
  const configured = import.meta.env.VITE_PINTEREST_PICKER_API_URL as
    | string
    | undefined;

  if (configured?.trim()) {
    return configured.trim();
  }

  if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
    return "https://kingdoom.vercel.app/api/admin/extract-pinterest-reference";
  }

  return "/api/admin/extract-pinterest-reference";
}

export async function fetchPinterestReference(
  url: string
): Promise<PinterestPickerResult> {
  const response = await fetch(getPinterestPickerEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      status: "error",
      message:
        payload?.message ??
        "No se pudo leer la referencia de Pinterest en este momento.",
    };
  }

  if (!payload?.reference || typeof payload.reference !== "object") {
    return {
      status: "error",
      message: "Pinterest no devolvio una referencia valida.",
    };
  }

  return {
    status: "ready",
    reference: {
      imageUrl: String(payload.reference.imageUrl ?? ""),
      title: String(payload.reference.title ?? ""),
      description: String(payload.reference.description ?? ""),
      sourceUrl: String(payload.reference.sourceUrl ?? ""),
    },
  };
}
