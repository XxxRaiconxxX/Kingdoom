type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (payload: unknown) => void;
    end: () => void;
  };
};

type MagicAiRequest = {
  categoryTitle?: string;
  titleSeed?: string;
  tone?: string;
  theme?: string;
  restriction?: string;
  combatStyle?: "yes" | "no" | "optional";
  scientificAngle?: string;
};

type MagicAiResponse = {
  draftText: string;
  promptSummary: string;
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://xxxraiconxxx.github.io",
  "https://kingdoom.vercel.app",
];

function getAllowedOrigin(requestOrigin?: string) {
  const configuredOrigins = process.env.MISSION_AI_ALLOWED_ORIGINS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const origins = configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;

  if (!requestOrigin) {
    return origins[0] ?? "*";
  }

  if (origins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return origins[0] ?? "*";
}

function setCorsHeaders(req: ApiRequest, res: ApiResponse) {
  const allowedOrigin = getAllowedOrigin(req.headers.origin);
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function extractTextFromGeminiResponse(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function getPrompt(input: Required<MagicAiRequest>) {
  return `
Actua como diseñador senior del Grimorio de Kingdoom.

Debes escribir una magia completa en TEXTO NARRATIVO ESTRICTO compatible con un parser existente.

OBJETIVO
- Crear un estilo de magia equilibrado, util, inmersivo y coherente con fantasia oscura medieval.
- El resultado debe estar listo para pegarse en el panel admin y ser interpretado automaticamente.
- No respondas con JSON.
- No uses markdown fuera del formato pedido.
- No metas comentarios, notas, advertencias ni explicaciones extra.

PARAMETROS
- categoria: ${input.categoryTitle}
- semilla de titulo: ${input.titleSeed}
- tono: ${input.tone}
- tema: ${input.theme}
- restriccion: ${input.restriction}
- combate: ${input.combatStyle}
- enfoque cientifico o tecnico: ${input.scientificAngle}

REGLAS DE BALANCE
- Lv1: utilidades basicas, refuerzo menor, defensa corta, apoyo ligero o lectura del entorno.
- Lv2: control leve, proteccion puntual, apoyo tactico, deteccion o movilidad moderada.
- Lv3: herramienta seria de combate o escena, pero con limites reales.
- Lv4: poder fuerte con coste, exposicion, ventana de respuesta o drawback severo.
- Lv5: tecnica maestra excepcional, pero nunca gratuita ni imposible de contrarrestar narrativamente.
- Nada de desintegrar, borrar, invulnerabilidad permanente ni control absoluto sin coste.
- Cada habilidad debe tener utilidad narrativa o tactica.
- Anti-Mano Negra debe cortar el abuso claramente.

FORMATO OBLIGATORIO
Debes responder solo con texto siguiendo EXACTAMENTE esta estructura general:

Entramos en el catalogo de **[Categoria]**. [Descripcion general del estilo].

### --[Titulo del estilo]--

[Descripcion del estilo, fundamento tecnico, cientifico o narrativo.]

### -Escala de niveles-

#### Habilidades de Lv1
1. **Nombre:**
   * **Efecto:** ...
   * **CD:** ...
   * **Limitante:** ...
   * **Anti-Mano Negra:** ...

#### Habilidades de Lv2
[al menos 2 habilidades]

#### Habilidades de Lv3
[al menos 2 habilidades]

#### Habilidades de Lv4
[2 o 3 habilidades]

#### Habilidades de Lv5
[2 o 3 habilidades]

REGLAS DE FORMATO
- Usa exactamente los encabezados \`### --Titulo--\`, \`### -Escala de niveles-\` y \`#### Habilidades de LvX\`.
- Cada habilidad debe ir numerada.
- Cada bullet debe usar exactamente: Efecto, CD, Limitante, Anti-Mano Negra.
- No cierres con preguntas como "Continuamos con..." ni agregues texto despues del Lv5.
- Usa ASCII simple y texto limpio.
`.trim();
}

function sanitizeDraft(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  if (!geminiApiKey) {
    return res.status(500).json({
      message:
        "Falta GEMINI_API_KEY en el backend. Configurala en Vercel antes de usar el generador.",
    });
  }

  const body = (req.body ?? {}) as MagicAiRequest;
  const input: Required<MagicAiRequest> = {
    categoryTitle: body.categoryTitle?.trim() || "Magia Arcana",
    titleSeed: body.titleSeed?.trim() || "Tejido de Resonancia",
    tone: body.tone?.trim() || "fantasia oscura medieval",
    theme: body.theme?.trim() || "control, supervivencia y tension narrativa",
    restriction:
      body.restriction?.trim() ||
      "Debe mantenerse equilibrada y util tanto para rol como para combate.",
    combatStyle: body.combatStyle ?? "optional",
    scientificAngle:
      body.scientificAngle?.trim() ||
      "explica el estilo como si tuviera una base fisica, ritual o metafisica coherente",
  };

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: getPrompt(input) }],
            },
          ],
          generationConfig: {
            temperature: 0.92,
            topP: 0.9,
          },
        }),
      }
    );

    const geminiPayload = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(502).json({
        message:
          geminiPayload?.error?.message ||
          "Gemini no respondio correctamente al generar la magia.",
      });
    }

    const rawText = extractTextFromGeminiResponse(geminiPayload);

    if (!rawText) {
      return res.status(502).json({
        message: "Gemini respondio sin contenido util para la magia.",
      });
    }

    const response: MagicAiResponse = {
      draftText: sanitizeDraft(
        rawText
          .replace(/^```text\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
      ),
      promptSummary: `${input.categoryTitle} / ${input.theme} / combate ${input.combatStyle}`,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? `No se pudo generar la magia con IA. ${error.message}`
          : "No se pudo generar la magia con IA.",
    });
  }
}
