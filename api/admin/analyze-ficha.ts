import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../../server/admin/_serverAiProviders.js";
import {
  ensureAiProvider,
  missingAiProviderMessage,
  readAiServerConfig,
  runAiText,
} from "../../server/admin/_aiOrchestrator.js";

// Análisis "asistente" de una ficha de rol de Kingdoom (app kingdoom-fichas).
// La validación dura (stats=12, poderes=5, catálogos) ya la hace el cliente.
// Aquí Gemini juzga lo que las reglas NO pueden: coherencia y calidad narrativa.

type FichaPayload = Record<string, unknown> & {
  nombre?: string;
  edad?: string;
  raza?: string;
  reino?: string;
  poderesOficiales?: string;
  personalidad?: string;
  historia?: string;
  debilidades?: string;
};

type AnalyzeRequest = {
  ficha?: FichaPayload;
  avisosLocales?: string[]; // mensajes warn del validador local, como contexto
  includeDebug?: boolean;
};

function getPrompt(ficha: FichaPayload, avisos: string[]) {
  const fichaJson = JSON.stringify(ficha, null, 2);
  const avisosTxt = avisos.length
    ? avisos.map((a) => `- ${a}`).join("\n")
    : "(ninguno)";
  return `
Actua como Game Master senior de Kingdoom (mundo: Aethelgardia; la magia es el Aether; alineamiento Auxilium/Malum).
Estas revisando la FICHA de un jugador nuevo para ayudarle a dejarla lista antes de enviarla al grupo.

La validacion mecanica YA esta hecha por el cliente (estadisticas suman 12, niveles de poderes suman 5, raza/reino del catalogo, arma sin magia, etc). NO repitas esas comprobaciones.

Tu trabajo es juzgar lo que las reglas NO pueden medir:
- Coherencia entre EDAD e HISTORIA: una edad muy alta exige un trasfondo proporcionalmente rico; una historia pobre para 800 años es incoherente.
- Coherencia entre RAZA, REINO e HISTORIA segun el lore (un personaje de una raza acuatica criado en un imperio de montana debe justificarse).
- Calidad de la PERSONALIDAD: que no sea plana, generica ni una lista de adjetivos sin matices.
- DEBILIDADES reales: que sean limitaciones autenticas y jugables, no debilidades "de mentira" o irrelevantes.
- Coherencia general: que poderes, profesion, clase social e historia encajen entre si.
- Tono: fantasia oscura medieval, sin elementos anacronicos ni rompedores.

FICHA (JSON):
${fichaJson}

AVISOS DEL VALIDADOR LOCAL (contexto, ya conocidos por el jugador):
${avisosTxt}

Responde UNICAMENTE con un JSON valido (sin markdown, sin texto extra) con esta forma EXACTA:
{
  "veredicto": "aprobada" | "mejorable",
  "resumen": "1-2 frases en espanol, tono amable y directo",
  "sugerencias": [
    {
      "apartado": "nombre del apartado (ej: Historia, Personalidad, Debilidades, Edad)",
      "severidad": "alta" | "media" | "baja",
      "problema": "que esta flojo o es incoherente, en una frase",
      "sugerencia": "como mejorarlo, concreto y accionable"
    }
  ]
}
Reglas del JSON:
- "veredicto" = "mejorable" si hay al menos una sugerencia de severidad alta o media.
- Maximo 6 sugerencias, ordenadas de mayor a menor severidad.
- Si la ficha esta solida, devuelve "aprobada" y "sugerencias": [] (o solo de severidad baja).
- Todo en espanol.
`.trim();
}

function extractJson(text: string): unknown {
  const limpio = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio === -1 || fin === -1) throw new Error("La IA no devolvio JSON.");
  return JSON.parse(limpio.slice(inicio, fin + 1));
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return res.status(405).json({ message: "Metodo no permitido." });

  const aiConfig = readAiServerConfig();
  if (!ensureAiProvider(aiConfig)) {
    return res.status(500).json({
      message: `${missingAiProviderMessage()} Configuralas en Vercel antes de usar el analizador.`,
    });
  }

  const body = (req.body ?? {}) as AnalyzeRequest;
  const ficha = body.ficha ?? {};
  const avisos = Array.isArray(body.avisosLocales) ? body.avisosLocales : [];
  const includeDebug = body.includeDebug === true;

  if (!ficha || typeof ficha !== "object" || Object.keys(ficha).length === 0) {
    return res.status(400).json({ message: "Falta la ficha a analizar." });
  }

  try {
    const providerResult = await runAiText({
      prompt: getPrompt(ficha, avisos),
      temperature: 0.5,
      topP: 0.9,
      config: aiConfig,
    });

    const parsed = extractJson(providerResult.text);

    return res.status(200).json({
      ...(parsed as object),
      ...(includeDebug ? { debug: providerResult.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo analizar la ficha con IA. ${
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
