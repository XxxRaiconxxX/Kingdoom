function getPdfExtractEndpoint() {
  const configured = import.meta.env.VITE_PDF_EXTRACT_API_URL as
    | string
    | undefined;

  if (configured?.trim()) {
    return configured.trim();
  }

  const missionEndpoint = import.meta.env.VITE_MISSION_AI_API_URL as
    | string
    | undefined;

  if (missionEndpoint?.trim()) {
    return missionEndpoint
      .trim()
      .replace(/\/generate-mission$/, "/extract-pdf-text");
  }

  return "/api/admin/extract-pdf-text";
}

function readAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function extractKnowledgeTextFromFile(file: File) {
  const lowerName = file.name.toLowerCase();

  if (
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    file.type.startsWith("text/")
  ) {
    return {
      status: "ready" as const,
      text: await readAsText(file),
      message: `Texto cargado desde ${file.name}.`,
    };
  }

  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    const base64 = await readAsBase64(file);
    const response = await fetch(getPdfExtractEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        base64,
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        status: "error" as const,
        text: "",
        message:
          payload?.message ??
          "No se pudo extraer el texto del PDF desde el backend.",
      };
    }

    return {
      status: "ready" as const,
      text: String(payload?.text ?? ""),
      message: `PDF interpretado desde ${file.name}.`,
    };
  }

  return {
    status: "error" as const,
    text: "",
    message: "Formato no soportado. Usa PDF, TXT o MD.",
  };
}
