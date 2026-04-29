export type ArchivistMode = "canon" | "deep" | "mechanics" | "narrator" | "staff";

export type ArchivistPromptDocument = {
  title: string;
  type: string;
  category: string;
  tags?: string[];
  source?: string;
  summary?: string;
  content: string;
};

export type MagicBalanceMode = "review" | "buff" | "nerf" | "improve";

export type MagicBalanceAbility = {
  level: number;
  name: string;
  effect: string;
  cd: string;
  limit: string;
  antiManoNegra: string;
};

export type MagicBalancePromptInput = {
  mode: MagicBalanceMode;
  focus: string;
  categoryTitle: string;
  title: string;
  description: string;
  levels: Record<number, MagicBalanceAbility[]>;
};

export function normalizeArchivistMode(mode?: string): ArchivistMode {
  if (
    mode === "deep" ||
    mode === "mechanics" ||
    mode === "narrator" ||
    mode === "staff"
  ) {
    return mode;
  }

  return "canon";
}

export function normalizeMagicBalanceMode(mode?: string): MagicBalanceMode {
  if (mode === "buff" || mode === "nerf" || mode === "improve") return mode;
  return "review";
}

function archivistModeInstruction(mode: ArchivistMode) {
  if (mode === "deep") {
    return "Modo profundo: cruza fuentes, separa hechos confirmados de inferencias y da una respuesta completa.";
  }

  if (mode === "mechanics") {
    return "Modo mecanicas: prioriza balance, reglas, limites, cooldowns, riesgos de abuso y coherencia de sistema.";
  }

  if (mode === "narrator") {
    return "Modo narrador: responde con tono inmersivo, util para ambientar escenas, pero sin inventar canon.";
  }

  if (mode === "staff") {
    return "Modo staff: responde operativo, marca conflictos de fuentes, huecos de canon y decisiones pendientes.";
  }

  return "Modo canon: responde directo, prudente y sin extenderte mas de lo necesario.";
}

export function buildArchivistPrompt(input: {
  question: string;
  documents: ArchivistPromptDocument[];
  mode: ArchivistMode;
}) {
  const context = input.documents
    .map((document, index) => {
      const contentLimit = input.mode === "deep" || input.mode === "staff" ? 9000 : 6500;
      const content = document.content.slice(0, contentLimit);

      return `
[${index + 1}] ${document.title}
Tipo: ${document.type}
Categoria: ${document.category || "Sin categoria"}
Tags: ${(document.tags ?? []).join(", ") || "Sin tags"}
Fuente: ${document.source || "Base documental de Kingdoom"}
Resumen: ${document.summary || "Sin resumen"}
Contenido:
${content}
`.trim();
    })
    .join("\n\n---\n\n");

  return `
Eres el Archivista de Argentis, asistente de consulta para Kingdoom.

Responde usando SOLO la base documental entregada. Si la respuesta no aparece en los documentos, dilo con claridad y sugiere que el staff cargue mas lore.

${archivistModeInstruction(input.mode)}

Reglas:
- No inventes canon.
- No des por oficial algo que no este en los documentos.
- Responde en espanol, con tono claro y elegante.
- Si hay contradicciones, mencionalas como posible conflicto de fuentes.
- Cita nombres de fuentes cuando ayuden a ubicar la respuesta.
- No uses markdown complejo.
- Si haces una inferencia, marcala como inferencia.

Pregunta del usuario:
${input.question}

Base documental:
${context}
`.trim();
}

function summarizeLevels(levels?: Record<number, MagicBalanceAbility[]>) {
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

export function buildMagicBalancePrompt(input: MagicBalancePromptInput) {
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
- Si subes poder, compensa con costo, alcance, preparacion, riesgo o CD.
- Si bajas poder, conserva identidad y utilidad de la magia.
- No inventes cambios masivos si bastan ajustes pequenos.

MAGIA
Categoria: ${input.categoryTitle}
Nombre: ${input.title}
Fundamento:
${input.description}

Niveles:
${summarizeLevels(input.levels)}

ENFOQUE DEL STAFF
${input.focus || "Revisar equilibrio general, abusos posibles y mejoras narrativas."}

RESPONDE SOLO CON JSON VALIDO, sin markdown ni comentarios:
{
  "summary": "diagnostico corto",
  "recommendation": "maintain|buff|nerf|improve",
  "scores": {
    "abuseRisk": 0,
    "narrativeUtility": 0,
    "clarity": 0,
    "powerCurve": 0
  },
  "risks": ["riesgo concreto"],
  "levelAdjustments": [
    { "level": "Lv1", "suggestion": "ajuste corto" }
  ],
  "suggestedDraftText": "version completa opcional en el formato narrativo del grimorio, o string vacio si conviene mantener",
  "verdict": "decision corta para el staff"
}

Los scores van de 1 a 10. suggestedDraftText debe respetar encabezados y bullets del formato actual si propones cambios.
`.trim();
}
