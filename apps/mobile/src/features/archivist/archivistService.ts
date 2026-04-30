import { fetchRealmEventsNative } from "@/src/features/events/eventsService";
import { fetchGrimoireNative } from "@/src/features/grimoire/grimoireService";
import { fetchMissionsNative } from "@/src/features/missions/missionsService";
import type {
  KnowledgeDocument,
  KnowledgeDocumentType,
} from "@/src/features/shared/types";
import { supabase, supabaseConfigError } from "@/src/services/supabase";

export type ArchivistMode = "canon" | "deep" | "mechanics" | "narrator" | "staff";

export type ArchivistResponse =
  | {
      status: "ready";
      answer: string;
      sources: Array<{ title: string; type: string; category: string }>;
      providerLabel?: string;
    }
  | { status: "error"; message: string; providerLabel?: string };

type KnowledgeDocumentRow = {
  id: string;
  title: string;
  type: KnowledgeDocumentType;
  category: string | null;
  tags: string[] | null;
  source: string | null;
  content: string | null;
  summary: string | null;
  visible: boolean;
  created_at?: string;
  updated_at?: string;
};

function getArchivistEndpoint() {
  return (
    process.env.EXPO_PUBLIC_ARCHIVIST_AI_API_URL?.trim() ||
    "https://kingdoom.vercel.app/api/admin/ask-archivist"
  );
}

function joinLines(lines: Array<string | undefined | null>) {
  return lines.map((line) => line?.trim()).filter(Boolean).join("\n");
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function mapKnowledgeDocument(row: KnowledgeDocumentRow): KnowledgeDocument {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    category: row.category ?? "",
    tags: row.tags ?? [],
    source: row.source ?? "",
    content: row.content ?? "",
    summary: row.summary ?? "",
    visible: row.visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchKnowledgeDocumentsNative() {
  if (!supabase) {
    return { documents: [] as KnowledgeDocument[], errorMessage: supabaseConfigError };
  }

  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("id, title, type, category, tags, source, content, summary, visible, created_at, updated_at")
    .eq("visible", true)
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      documents: [] as KnowledgeDocument[],
      errorMessage: "No se pudo cargar el Archivo IA.",
    };
  }

  return {
    documents: ((data ?? []) as KnowledgeDocumentRow[]).map(mapKnowledgeDocument),
    errorMessage: "",
  };
}

function buildMagicDocuments(documents: KnowledgeDocument[], grimoire: Awaited<ReturnType<typeof fetchGrimoireNative>>) {
  for (const style of grimoire.magic) {
    const levelText = Object.entries(style.levels ?? {})
      .map(([level, abilities]) =>
        joinLines([
          `Lv${level}`,
          ...abilities.map((ability) =>
            joinLines([
              ability.name,
              `Efecto: ${ability.effect}`,
              `CD: ${ability.cd}`,
              `Limitante: ${ability.limit}`,
              `Anti-Mano Negra: ${ability.antiManoNegra}`,
            ])
          ),
        ])
      )
      .join("\n\n");

    documents.push({
      id: `native-magic-${style.id}`,
      title: style.title,
      type: "magic",
      category: style.categoryTitle,
      tags: [style.title, style.categoryTitle, "magia", "grimorio"],
      source: "Grimorio nativo",
      summary: cleanText(style.description).slice(0, 240),
      content: joinLines([style.description, levelText]),
      visible: true,
    });
  }
}

function buildWorldDocuments(documents: KnowledgeDocument[]) {
  documents.push({
    id: "native-world-brief",
    title: "Kingdoom y Argentis",
    type: "lore",
    category: "Mundo",
    tags: ["kingdoom", "argentis", "reino", "lore"],
    source: "App nativa",
    summary: "Base operativa del mundo de Kingdoom para orientar consultas generales.",
    content:
      "Kingdoom es el panel de comunidad y centro operativo del rol de Argentis. El staff administra jugadores, misiones, eventos, mercado, grimorio, bestiario, flora y Archivo IA. Las misiones y eventos se resuelven principalmente por rol en WhatsApp y se validan desde el panel administrativo.",
    visible: true,
  });
}

function buildBestiaryDocuments(documents: KnowledgeDocument[], grimoire: Awaited<ReturnType<typeof fetchGrimoireNative>>) {
  for (const entry of grimoire.bestiary) {
    documents.push({
      id: `native-bestiary-${entry.id}`,
      title: entry.name,
      type: "bestiary",
      category: entry.category || entry.rarity,
      tags: [entry.name, entry.category, entry.type, entry.rarity, entry.threatLevel, "bestiario"].filter(Boolean),
      source: "Bestiario nativo",
      summary: cleanText(entry.description).slice(0, 240),
      content: joinLines([
        `Nombre: ${entry.name}`,
        `Categoria: ${entry.category}`,
        `Tipo: ${entry.type}`,
        `Datos generales: ${entry.generalData}`,
        `Nivel de amenaza: ${entry.threatLevel}`,
        `Domesticacion: ${entry.domestication}`,
        `Uso: ${entry.usage}`,
        `Origen: ${entry.originPlace}`,
        `Ubicacion: ${entry.foundAt}`,
        `Rareza: ${entry.rarity}`,
        `Descripcion: ${entry.description}`,
        `Habilidad: ${entry.ability}`,
      ]),
      visible: true,
    });
  }
}

function buildFloraDocuments(documents: KnowledgeDocument[], grimoire: Awaited<ReturnType<typeof fetchGrimoireNative>>) {
  for (const entry of grimoire.flora) {
    documents.push({
      id: `native-flora-${entry.id}`,
      title: entry.name,
      type: "flora",
      category: entry.category || entry.rarity,
      tags: [entry.name, entry.category, entry.type, entry.rarity, "flora"].filter(Boolean),
      source: "Flora nativa",
      summary: cleanText(entry.description).slice(0, 240),
      content: joinLines([
        `Nombre: ${entry.name}`,
        `Categoria: ${entry.category}`,
        `Tipo: ${entry.type}`,
        `Datos generales: ${entry.generalData}`,
        `Propiedades: ${entry.properties}`,
        `Uso: ${entry.usage}`,
        `Origen: ${entry.originPlace}`,
        `Ubicacion: ${entry.foundAt}`,
        `Rareza: ${entry.rarity}`,
        `Descripcion: ${entry.description}`,
      ]),
      visible: true,
    });
  }
}

function buildMissionDocuments(documents: KnowledgeDocument[], missions: Awaited<ReturnType<typeof fetchMissionsNative>>) {
  for (const mission of missions.missions) {
    documents.push({
      id: `native-mission-${mission.id}`,
      title: mission.title,
      type: "mission",
      category: mission.type,
      tags: [mission.title, mission.type, mission.difficulty, mission.status, "mision"],
      source: "Misiones publicadas",
      summary: cleanText(mission.description).slice(0, 240),
      content: joinLines([
        `Titulo: ${mission.title}`,
        `Tipo: ${mission.type}`,
        `Dificultad: ${mission.difficulty}`,
        `Estado: ${mission.status}`,
        `Recompensa: ${mission.rewardGold} oro`,
        `Cupos: ${mission.maxParticipants}`,
        `Descripcion: ${mission.description}`,
        `Instrucciones: ${mission.instructions}`,
      ]),
      visible: true,
    });
  }
}

function buildEventDocuments(documents: KnowledgeDocument[], events: Awaited<ReturnType<typeof fetchRealmEventsNative>>) {
  for (const event of events.events) {
    documents.push({
      id: `native-event-${event.id}`,
      title: event.title,
      type: "event",
      category: event.status,
      tags: [event.title, event.status, ...event.factions, "evento"],
      source: "Eventos publicados",
      summary: cleanText(event.description).slice(0, 240),
      content: joinLines([
        `Titulo: ${event.title}`,
        `Estado: ${event.status}`,
        `Inicio: ${event.startDate}`,
        `Cierre: ${event.endDate}`,
        `Facciones: ${event.factions.join(", ")}`,
        `Recompensa: ${event.rewards}`,
        `Oro por participacion: ${event.participationRewardGold}`,
        `Requisitos: ${event.requirements}`,
        `Descripcion: ${event.description}`,
        `Detalle: ${event.longDescription}`,
      ]),
      visible: true,
    });
  }
}

export async function fetchArchivistContextNative() {
  const [knowledge, grimoire, missions, events] = await Promise.all([
    fetchKnowledgeDocumentsNative(),
    fetchGrimoireNative(),
    fetchMissionsNative(),
    fetchRealmEventsNative(),
  ]);
  const documents = [...knowledge.documents];

  buildWorldDocuments(documents);
  buildMagicDocuments(documents, grimoire);
  buildBestiaryDocuments(documents, grimoire);
  buildFloraDocuments(documents, grimoire);
  buildMissionDocuments(documents, missions);
  buildEventDocuments(documents, events);

  const errorMessage =
    knowledge.errorMessage || grimoire.errorMessage || missions.errorMessage || events.errorMessage || "";

  return { documents, errorMessage };
}

export function pickArchivistContextNative(
  documents: KnowledgeDocument[],
  question: string,
  maxDocuments = 8
) {
  const tokens = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2);

  const scored = documents.map((document) => {
    const haystack = `${document.title} ${document.type} ${document.category} ${document.tags.join(" ")} ${document.source} ${document.summary} ${document.content}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
    return { document, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((entry, index) => entry.score > 0 || index < 4)
    .slice(0, maxDocuments)
    .map((entry) => entry.document);
}

export async function askArchivistNative(input: {
  question: string;
  documents: KnowledgeDocument[];
  mode: ArchivistMode;
  topicMemory: string[];
}) {
  const response = await fetch(getArchivistEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: input.question,
      mode: input.mode,
      topicMemory: input.topicMemory,
      documents: input.documents.map((document) => ({
        title: document.title,
        type: document.type,
        category: document.category,
        tags: document.tags,
        source: document.source,
        summary: document.summary,
        content: document.content,
      })),
      includeDebug: true,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      status: "error" as const,
      message: payload?.message ?? "No se pudo consultar al Archivista.",
      providerLabel: payload?.debug?.provider
        ? `${payload.debug.provider} / ${payload.debug.model ?? "modelo"}`
        : undefined,
    };
  }

  return {
    status: "ready" as const,
    answer: String(payload?.answer ?? "").trim(),
    sources: Array.isArray(payload?.sources) ? payload.sources : [],
    providerLabel: payload?.debug?.provider
      ? `${payload.debug.provider} / ${payload.debug.model ?? "modelo"}`
      : undefined,
  };
}
