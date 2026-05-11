import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../admin/_serverAiProviders.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);
  
  const allowedMethods = ["GET", "POST", "OPTIONS"];
  if (!allowedMethods.includes(req.method || "")) {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { id, number, provider } = (req.method === "POST" ? req.body : req.query) as any;

  if (!id || !provider) {
    return res.status(400).json({ message: "Faltan parametros: id o provider." });
  }

  try {
    if (provider === "animeflv") {
      const baseUrl = process.env.VITE_ANIMEFLV_API_URL || "https://animeflv.ahmedrangel.com/api";
      const episodeNumber = number || "1";
      
      // Intentar obtener de la ruta estandar de la API con un timeout y User-Agent
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(`${baseUrl}/anime/${id}/episode/${episodeNumber}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return res.status(response.status).json({ message: "Error al consultar AnimeFLV (Stream)." });
      }
      
      const rawData = await response.json();
      const data = rawData?.data ?? rawData;
      const servers = data?.servers ?? [];
      
      return res.status(200).json({
        success: true,
        provider: "animeflv",
        servers: servers
          .filter((s: any) => s.embed || s.code || s.url)
          .map((s: any) => ({
            server: s.name || s.title || "Servidor",
            url: s.embed || s.code || s.url || "",
            embed: true
          }))
      });
    }

    return res.status(400).json({ message: "Proveedor no soportado para streaming." });
  } catch (error) {
    return res.status(500).json({ 
      message: "Error interno al procesar streaming de anime.",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
