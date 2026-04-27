import {
  readGeminiConfig,
  readGroqConfig,
  readNvidiaConfig,
  requestAiTextWithFallback,
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
  hasTextGenerationProvider,
} from "./_serverAiProviders.js";

type MagicAiRequest = {
  categoryTitle?: string;
  titleSeed?: string;
  tone?: string;
  theme?: string;
  restriction?: string;
  combatStyle?: "yes" | "no" | "optional";
  scientificAngle?: string;
  includeDebug?: boolean;
};

type MagicAiResponse = {
  draftText: string;
  promptSummary: string;
};


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

  const gemini = readGeminiConfig();
  const groq = readGroqConfig();
  const nvidia = readNvidiaConfig();

  if (!hasTextGenerationProvider(gemini, groq, nvidia)) {
    return res.status(500).json({
      message:
        "Falta GEMINI_API_KEYS/GEMINI_API_KEY, GROQ_API_KEYS/GROQ_API_KEY o NVIDIA_API_KEYS/NVIDIA_API_KEY en el backend. Configuralas en Vercel antes de usar el generador.",
    });
  }

  const body = (req.body ?? {}) as MagicAiRequest;
  const includeDebug = body.includeDebug === true;
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
    const providerResult = await requestAiTextWithFallback({
      prompt: getPrompt(input),
      gemini,
      groq,
      nvidia,
      temperature: 0.92,
      topP: 0.9,
    });

    const response: MagicAiResponse = {
      draftText: sanitizeDraft(providerResult.text),
      promptSummary: `${input.categoryTitle} / ${input.theme} / combate ${input.combatStyle}`,
    };

    return res.status(200).json({
      ...response,
      ...(includeDebug ? { debug: providerResult.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo generar la magia con IA. ${
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Error desconocido."
      }`,
      ...(includeDebug &&
      error &&
      typeof error === "object" &&
      "debug" in error
        ? { debug: error.debug }
        : {}),
    });
  }
}
