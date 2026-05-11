import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../admin/_serverAiProviders.js";

declare const process: {
  env: Record<string, string | undefined>;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);
  
  const allowedMethods = ["GET", "OPTIONS"];
  if (!allowedMethods.includes(req.method || "")) {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { action, provider, id, query, episode } = req.query as any;

  if (!action || !provider) {
    return res.status(400).json({ message: "Faltan parametros: action y provider son obligatorios." });
  }

  // Mapear provider interno a source de la nueva API
  const source = provider === "animeflv" ? "animeflv" : 
                 provider === "tioanime" ? "tioanime" : 
                 "gogoanime";
  const baseUrl = process.env.VITE_ANIME_HUB_API_URL || "https://scraping-web-anime-api.vercel.app";

  try {
    let targetUrl = "";

    switch (action) {
      case "search":
        if (!query) return res.status(400).json({ message: "Falta parametro: query." });
        targetUrl = `${baseUrl}/api/search?q=${encodeURIComponent(query)}&source=${source}`;
        break;
      case "detail":
        if (!id) return res.status(400).json({ message: "Falta parametro: id." });
        targetUrl = `${baseUrl}/api/anime/${encodeURIComponent(id)}?source=${source}`;
        break;
      case "episodes":
      case "links":
      case "stream":
      case "download":
        if (!id) return res.status(400).json({ message: "Falta parametro: id." });
        targetUrl = `${baseUrl}/api/episode/${encodeURIComponent(id)}?source=${source}`;
        break;
      default:
        return res.status(400).json({ message: "Accion no soportada." });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(targetUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Kingdoom-Proxy/1.0",
        "Authorization": `Bearer ${process.env.VITE_ANIME_HUB_API_KEY || ""}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return res.status(response.status).json({ message: `Error en la API de Scraping (${action}).` });
    }
    
    const json = await response.json();
    
    // Si la API devolvió éxito, devolvemos el contenido de 'data' para mantener compatibilidad
    if (json.success) {
      let result = json.data;

      // Adaptación específica para enlaces (links/stream)
      if (action === "links" || action === "stream" || action === "download") {
        const servers = result.servers || [];
        result = {
          stream: servers.map((s: any) => ({
            server: s.name || "Servidor",
            url: s.link || "#",
            quality: "HD"
          })),
          download: [] // La nueva API por ahora no separa descargas de stream
        };
      }

      return res.status(200).json(result);
    }
    
    return res.status(500).json({ message: json.message || "Error desconocido en la API." });

  } catch (error) {
    return res.status(500).json({ 
      message: "Error interno al procesar peticion de anime.",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
