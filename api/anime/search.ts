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

  const { query, provider } = req.query as any;

  if (!query || !provider) {
    return res.status(400).json({ message: "Faltan parametros: query o provider." });
  }

  try {
    if (provider === "animeflv") {
      const baseUrl =
        process.env.ANIMEFLV_API_URL ||
        process.env.VITE_ANIMEFLV_API_URL ||
        "https://animeflv.ahmedrangel.com/api";
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${baseUrl}/search?query=${encodeURIComponent(query)}&page=1`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return res.status(response.status).json({ message: "Error al consultar AnimeFLV (Search)." });
      }
      
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ message: "Proveedor no soportado para busqueda." });
  } catch (error) {
    return res.status(500).json({ 
      message: "Error interno al procesar busqueda de anime.",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
