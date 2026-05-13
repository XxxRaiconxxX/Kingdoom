#!/usr/bin/env node
import { createInterface } from "node:readline";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const MEMORY_PATH = resolveMemoryPath();
const MAX_TEXT = 12000;

const toolSchemas = {
  remember_decision: {
    description:
      "Registra una decision, cambio importante o aprendizaje operativo de Kingdoom para que Jarvis y Antigravity lo compartan.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["actor", "area", "summary"],
      properties: {
        actor: {
          type: "string",
          description: "Quien registra la memoria. Ejemplos: Jarvis, Antigravity, e_grado.",
        },
        area: {
          type: "string",
          description: "Area del proyecto. Ejemplos: archivist, market, supabase, anime, mobile, admin.",
        },
        summary: {
          type: "string",
          description: "Resumen breve de una linea.",
        },
        details: {
          type: "string",
          description: "Contexto adicional, decisiones, trade-offs o instrucciones operativas.",
        },
        status: {
          type: "string",
          enum: ["active", "done", "blocked", "deprecated", "watch"],
          description: "Estado de esta memoria.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Etiquetas cortas para busqueda. Ejemplos: mobile, rls, ai, ui.",
        },
        files: {
          type: "array",
          items: { type: "string" },
          description: "Rutas relevantes dentro del repo.",
        },
      },
    },
  },
  record_handoff: {
    description:
      "Deja un relevo de trabajo para otro agente: que se hizo, que falta, riesgos y archivos tocados.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["from", "summary"],
      properties: {
        from: { type: "string", description: "Agente o persona que deja el relevo." },
        to: { type: "string", description: "Destino sugerido. Ejemplo: Jarvis, Antigravity, staff." },
        summary: { type: "string", description: "Resumen del relevo." },
        nextSteps: {
          type: "array",
          items: { type: "string" },
          description: "Siguientes pasos concretos.",
        },
        blockers: {
          type: "array",
          items: { type: "string" },
          description: "Bloqueos, riesgos o pendientes conocidos.",
        },
        files: {
          type: "array",
          items: { type: "string" },
          description: "Archivos relevantes.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Etiquetas cortas para busqueda.",
        },
      },
    },
  },
  search_memory: {
    description:
      "Busca memorias compartidas por texto, area o etiquetas. Devuelve resultados compactos para ahorrar contexto.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string", description: "Texto a buscar. Puede quedar vacio si se filtra por area o tag." },
        area: { type: "string", description: "Area exacta o parcial." },
        tags: { type: "array", items: { type: "string" }, description: "Tags requeridos." },
        limit: { type: "number", minimum: 1, maximum: 25, description: "Cantidad maxima de resultados." },
        format: { type: "string", enum: ["markdown", "json"], description: "Formato de salida." },
      },
    },
  },
  latest_memory: {
    description: "Muestra las entradas mas recientes de la memoria compartida.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "number", minimum: 1, maximum: 25, description: "Cantidad maxima de entradas." },
        area: { type: "string", description: "Area exacta o parcial." },
        type: { type: "string", description: "Tipo de entrada. Ejemplos: decision, handoff." },
        format: { type: "string", enum: ["markdown", "json"], description: "Formato de salida." },
      },
    },
  },
  project_brief: {
    description:
      "Genera un brief compacto del estado operativo reciente de Kingdoom para arrancar una sesion sin leer todo el changelog.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "number", minimum: 3, maximum: 30, description: "Entradas recientes a considerar." },
      },
    },
  },
};

const handlers = {
  remember_decision: async (args) => {
    const entry = normalizeEntry({
      type: "decision",
      actor: stringArg(args.actor, "actor"),
      area: stringArg(args.area, "area"),
      summary: stringArg(args.summary, "summary"),
      details: optionalString(args.details),
      status: optionalString(args.status) || "active",
      tags: stringArray(args.tags),
      files: stringArray(args.files),
    });
    await appendEntry(entry);
    return {
      message: `Memoria registrada: ${entry.summary}`,
      entry,
    };
  },
  record_handoff: async (args) => {
    const entry = normalizeEntry({
      type: "handoff",
      actor: stringArg(args.from, "from"),
      to: optionalString(args.to),
      area: "handoff",
      summary: stringArg(args.summary, "summary"),
      nextSteps: stringArray(args.nextSteps),
      blockers: stringArray(args.blockers),
      tags: unique(["handoff", ...stringArray(args.tags)]),
      files: stringArray(args.files),
      status: stringArray(args.blockers).length ? "blocked" : "active",
    });
    await appendEntry(entry);
    return {
      message: `Handoff registrado: ${entry.summary}`,
      entry,
    };
  },
  search_memory: async (args) => {
    const limit = clampInt(args.limit, 8, 1, 25);
    const entries = await readEntries();
    const matches = filterEntries(entries, args).slice(0, limit);
    return formatResult(matches, optionalString(args.format) || "markdown", "Resultados de memoria");
  },
  latest_memory: async (args) => {
    const limit = clampInt(args.limit, 10, 1, 25);
    const entries = await readEntries();
    const matches = entries
      .filter((entry) => matchesArea(entry, args.area))
      .filter((entry) => !args.type || entry.type === args.type)
      .slice(0, limit);
    return formatResult(matches, optionalString(args.format) || "markdown", "Memoria reciente");
  },
  project_brief: async (args) => {
    const limit = clampInt(args.limit, 12, 3, 30);
    const entries = (await readEntries()).slice(0, limit);
    const lines = [
      "# Kingdoom shared memory brief",
      "",
      `Memory file: ${MEMORY_PATH}`,
      "",
      "## Operational rules",
      "- Work in Kingdoom-sync only.",
      "- Keep changes small, mobile-first and validated.",
      "- Do not use package-lock.json.",
      "- Sensitive areas: Supabase, gold, purchases, minigames, admin, security.",
      "",
      "## Recent shared entries",
      entries.length ? entries.map(formatEntryLine).join("\n") : "- No shared entries yet.",
    ];
    return {
      message: "Brief generado.",
      text: truncate(lines.join("\n")),
      entries,
    };
  },
};

function resolveMemoryPath() {
  const configured = process.env.KINGDOOM_MEMORY_PATH?.trim();
  if (configured) {
    return isAbsolute(configured) ? configured : resolve(PROJECT_ROOT, configured);
  }
  return join(PROJECT_ROOT, "ai-memory", "kingdoom-memory.jsonl");
}

async function appendEntry(entry) {
  await mkdir(dirname(MEMORY_PATH), { recursive: true });
  await appendFile(MEMORY_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

async function readEntries() {
  try {
    const raw = await readFile(MEMORY_PATH, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function normalizeEntry(input) {
  const createdAt = new Date().toISOString();
  const id = `${createdAt.replace(/[-:.TZ]/g, "")}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    createdAt,
    project: "Kingdoom",
    ...input,
    tags: unique(stringArray(input.tags).map(normalizeToken)),
    files: unique(stringArray(input.files)),
  };
}

function filterEntries(entries, args) {
  const query = normalizeSearch(optionalString(args.query));
  const requestedTags = stringArray(args.tags).map(normalizeToken);

  return entries
    .filter((entry) => matchesArea(entry, args.area))
    .filter((entry) => {
      if (!requestedTags.length) return true;
      const tags = new Set(stringArray(entry.tags).map(normalizeToken));
      return requestedTags.every((tag) => tags.has(tag));
    })
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter(({ score }) => !query || score > 0)
    .sort((a, b) => b.score - a.score || String(b.entry.createdAt).localeCompare(String(a.entry.createdAt)))
    .map(({ entry }) => entry);
}

function scoreEntry(entry, query) {
  if (!query) return 1;
  const haystack = normalizeSearch(JSON.stringify(entry));
  return query
    .split(" ")
    .filter(Boolean)
    .reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function matchesArea(entry, area) {
  const requested = normalizeSearch(optionalString(area));
  if (!requested) return true;
  return normalizeSearch(entry.area || "").includes(requested);
}

function formatResult(entries, format, title) {
  if (format === "json") {
    return { message: `${entries.length} entrada(s).`, entries };
  }
  const text = [
    `# ${title}`,
    "",
    entries.length ? entries.map(formatEntryLine).join("\n") : "- Sin resultados.",
  ].join("\n");
  return { message: `${entries.length} entrada(s).`, text: truncate(text), entries };
}

function formatEntryLine(entry) {
  const bits = [
    `- ${entry.createdAt || "sin-fecha"} [${entry.type || "entry"}:${entry.area || "general"}] ${entry.summary || "Sin resumen."}`,
  ];
  if (entry.status) bits.push(`  Estado: ${entry.status}`);
  if (entry.details) bits.push(`  Detalle: ${entry.details}`);
  if (entry.nextSteps?.length) bits.push(`  Siguiente: ${entry.nextSteps.join(" | ")}`);
  if (entry.blockers?.length) bits.push(`  Bloqueos: ${entry.blockers.join(" | ")}`);
  if (entry.files?.length) bits.push(`  Archivos: ${entry.files.join(", ")}`);
  if (entry.tags?.length) bits.push(`  Tags: ${entry.tags.join(", ")}`);
  return bits.join("\n");
}

function stringArg(value, name) {
  const text = optionalString(value);
  if (!text) throw new Error(`El parametro '${name}' es obligatorio.`);
  return text;
}

function optionalString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function stringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
}

function normalizeToken(value) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_ -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clampInt(value, fallback, min, max) {
  const number = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function truncate(text) {
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}\n\n[recortado]` : text;
}

function resultContent(result) {
  const text = result.text || result.message || JSON.stringify(result, null, 2);
  return {
    content: [{ type: "text", text }],
    structuredContent: result,
  };
}

function errorContent(error) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Error de memoria Kingdoom: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
  };
}

async function handleRequest(message) {
  if (message.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "kingdoom-memory", version: "1.0.0" },
      },
    };
  }

  if (message.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        tools: Object.entries(toolSchemas).map(([name, schema]) => ({ name, ...schema })),
      },
    };
  }

  if (message.method === "tools/call") {
    const name = message.params?.name;
    const args = message.params?.arguments || {};
    const handler = handlers[name];
    if (!handler) {
      return { jsonrpc: "2.0", id: message.id, result: errorContent(`Herramienta desconocida: ${name}`) };
    }
    try {
      const result = await handler(args);
      return { jsonrpc: "2.0", id: message.id, result: resultContent(result) };
    } catch (error) {
      return { jsonrpc: "2.0", id: message.id, result: errorContent(error) };
    }
  }

  if (message.method?.startsWith("notifications/")) return null;

  return {
    jsonrpc: "2.0",
    id: message.id,
    error: { code: -32601, message: `Metodo no soportado: ${message.method}` },
  };
}

function writeResponse(response) {
  if (!response) return;
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", async (line) => {
  const text = line.trim();
  if (!text) return;
  try {
    const message = JSON.parse(text);
    writeResponse(await handleRequest(message));
  } catch (error) {
    writeResponse({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: `JSON invalido: ${error instanceof Error ? error.message : String(error)}`,
      },
    });
  }
});
