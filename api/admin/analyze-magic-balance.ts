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

type BalanceMode = "review" | "buff" | "nerf" | "improve";

type AbilityLevel = {
  level: number;
  name: string;
  effect: string;
  cd: string;
  limit: string;
  antiManoNegra: string;
};

type MagicBalanceRequest = {
  mode?: BalanceMode;
  focus?: string;
  categoryTitle?: string;
  title?: string;
  description?: string;
  levels?: Record<number, AbilityLevel[]>;
  includeDebug?: boolean;
};

function normalizeMode(mode?: string): BalanceMode {
  if (mode === "buff" || mode === "nerf" || mode === "improve") return mode;
  return "review";
}

function summarizeLevels(levels?: Record<number, AbilityLevel[]>) {
  if (!levels) return "Sin niveles cargados.";

  return [1, 2, 3, 4, 5]
    .map((level) => {
      const entries = levels[level] ?? [];
      if (entries.length === 0) return `Lv${level}: sin habilidades.`;

      return `Lv${level}:\n${entries
        .map(
          (entry, index) =>
            `${index + 1}. ${entry.name}\nEfecto: ${entry.effect}\nCD: ${entry.cd}\nLimitante: ${entry.limit}\nAnti-Mano Negra: ${entry.antiManoNegra}`
        )
        .join("\n")}`;
    })
    .join("\n\n");
}

function buildPrompt(input: Required<Omit<MagicBalanceRequest, "includeDebug">>) {
  const intent =
    input.mode === "buff"
      ? "proponer un buff prudente"
      : input.mode === "nerf"
        ? "proponer un nerf justo"
        : input.mode === "improve"
          ? "mejorar claridad, utilidad narrativa y balance"
          : "auditar balance general";

  return `
Actua como balanceador senior de sistemas de magia para Kingdoom.

OBJETIVO
Debes ${intent} para una magia existente, sin romper el formato actual del grimorio.

CRITERIO DE KINGDOOM
- Fantasia oscura medieval con base tecnica/cientifica.
- Cada habilidad debe tener utilidad narrativa y costo real.
- Evita powergaming, efectos absolutos baratos, cooldowns irreales y contradicciones.
- Si propones subir poder, compensa con costo, alcance, preparacion, riesgo o CD.
- Si propones bajar poder, conserva identidad y utilidad de la magia.
- No inventes cambios masivos si bastan ajustes pequenos.
- No devuelvas JSON. Devuelve texto breve y accionable.

MAGIA
Categoria: ${input.categoryTitle}
Nombre: ${input.title}
Fundamento:
${input.description}

Niveles:
${summarizeLevels(input.levels)}

ENFOQUE DEL STAFF
${input.focus || "Revisar equilibrio general, abusos posibles y mejoras narrativas."}

FORMATO DE RESPUESTA
Diagnostico:
- 2 a 4 puntos.

Riesgos:
- Abusos o contradicciones principales.

Sugerencia:
- Indica si conviene Buff, Nerf, Mejora menor o Mantener.
- Explica por que.

Ajustes por nivel:
- Lv1:
- Lv2:
- Lv3:
- Lv4:
- Lv5:

Veredicto:
- Una decision corta para el staff.
`.trim();
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
        "Falta GEMINI_API_KEYS/GEMINI_API_KEY, GROQ_API_KEYS/GROQ_API_KEY o NVIDIA_API_KEYS/NVIDIA_API_KEY en el backend.",
    });
  }

  const body = (req.body ?? {}) as MagicBalanceRequest;
  const includeDebug = body.includeDebug === true;
  const title = body.title?.trim() || "Magia sin nombre";

  if (!body.description?.trim() && !body.levels) {
    return res.status(400).json({
      message: "Selecciona una magia o carga sus niveles antes de analizar.",
    });
  }

  try {
    const result = await requestAiTextWithFallback({
      prompt: buildPrompt({
        mode: normalizeMode(body.mode),
        focus: body.focus?.trim() || "",
        categoryTitle: body.categoryTitle?.trim() || "General",
        title,
        description: body.description?.trim() || "Sin fundamento cargado.",
        levels: body.levels ?? {},
      }),
      gemini,
      groq,
      nvidia,
      temperature: 0.45,
      topP: 0.82,
    });

    return res.status(200).json({
      analysisText: result.text,
      ...(includeDebug ? { debug: result.debug } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: `No se pudo analizar la magia con IA. ${
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
