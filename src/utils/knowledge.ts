import type { KnowledgeDocument, KnowledgeDocumentType } from "../types";
import { formatAdminPermissionMessage } from "./supabaseErrors";
import { supabase } from "./supabaseClient";

type KnowledgeDocumentRow = {
  id: string;
  title: string;
  type: KnowledgeDocumentType;
  category: string;
  tags: string[] | null;
  source: string;
  content: string;
  summary: string;
  visible: boolean;
  created_at?: string;
  updated_at?: string;
};

export type KnowledgeDocumentInput = Omit<
  KnowledgeDocument,
  "createdAt" | "updatedAt"
>;

export const KNOWLEDGE_DOCUMENT_TYPES: Array<{
  id: KnowledgeDocumentType;
  label: string;
}> = [
  { id: "lore", label: "Lore" },
  { id: "rules", label: "Reglas" },
  { id: "magic", label: "Magia" },
  { id: "bestiary", label: "Bestiario" },
  { id: "flora", label: "Flora" },
  { id: "event", label: "Evento" },
  { id: "mission", label: "Mision" },
  { id: "faction", label: "Faccion" },
  { id: "other", label: "Otro" },
];

export function slugifyKnowledgeId(value: string, fallback = "documento") {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return slug || fallback;
}

function mapKnowledgeRow(row: KnowledgeDocumentRow): KnowledgeDocument {
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

function buildKnowledgePayload(input: KnowledgeDocumentInput) {
  return {
    id: input.id.trim(),
    title: input.title.trim(),
    type: input.type,
    category: input.category.trim(),
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    source: input.source.trim(),
    content: input.content.trim(),
    summary: input.summary.trim(),
    visible: input.visible,
  };
}

export function parseKnowledgeTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function fetchKnowledgeDocuments(options?: {
  includeHidden?: boolean;
  search?: string;
}) {
  let query = supabase
    .from("knowledge_documents")
    .select(
      "id, title, type, category, tags, source, content, summary, visible, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (!options?.includeHidden) {
    query = query.eq("visible", true);
  }

  const { data, error } = await query;

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo cargar la biblioteca IA.",
        error.message
      ),
      documents: [] as KnowledgeDocument[],
    };
  }

  const documents = ((data ?? []) as KnowledgeDocumentRow[]).map(mapKnowledgeRow);
  const search = options?.search?.trim().toLowerCase();

  if (!search) {
    return {
      status: "ready" as const,
      message: "",
      documents,
    };
  }

  return {
    status: "ready" as const,
    message: "",
    documents: documents.filter((document) =>
      `${document.title} ${document.type} ${document.category} ${document.tags.join(" ")} ${document.source} ${document.summary} ${document.content}`
        .toLowerCase()
        .includes(search)
    ),
  };
}

export async function upsertKnowledgeDocument(input: KnowledgeDocumentInput) {
  const { error } = await supabase
    .from("knowledge_documents")
    .upsert(buildKnowledgePayload(input), { onConflict: "id" });

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo guardar el documento.",
        error.message
      ),
    };
  }

  return {
    status: "saved" as const,
    message: "Documento guardado correctamente.",
  };
}

export async function deleteKnowledgeDocument(id: string) {
  const { error } = await supabase.from("knowledge_documents").delete().eq("id", id);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage(
        "No se pudo borrar el documento.",
        error.message
      ),
    };
  }

  return {
    status: "deleted" as const,
    message: "Documento borrado correctamente.",
  };
}

export function pickKnowledgeContext(
  documents: KnowledgeDocument[],
  question: string,
  maxDocuments = 6
) {
  const tokens = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2);

  const scored = documents.map((document) => {
    const haystack = `${document.title} ${document.category} ${document.tags.join(" ")} ${document.summary} ${document.content}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const score = tokens.reduce(
      (total, token) => total + (haystack.includes(token) ? 1 : 0),
      0
    );

    return { document, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((entry, index) => entry.score > 0 || index < 3)
    .slice(0, maxDocuments)
    .map((entry) => entry.document);
}
