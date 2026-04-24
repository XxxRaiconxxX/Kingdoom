import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import type { KnowledgeDocument, KnowledgeDocumentType } from "../../types";
import {
  deleteKnowledgeDocument,
  fetchKnowledgeDocuments,
  KNOWLEDGE_DOCUMENT_TYPES,
  parseKnowledgeTags,
  slugifyKnowledgeId,
  upsertKnowledgeDocument,
} from "../../utils/knowledge";
import { extractKnowledgeTextFromFile } from "../../utils/documentExtract";
import {
  ADMIN_LIST_PREVIEW_COUNT,
  AdminInfoCard,
  ExpandableListToggle,
  LabeledInput,
  LabeledTextArea,
} from "./AdminControlPrimitives";

export function AdminKnowledgeManager() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<KnowledgeDocumentType>("lore");
  const [category, setCategory] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [source, setSource] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [visible, setVisible] = useState(true);

  async function loadDocuments() {
    const result = await fetchKnowledgeDocuments({ includeHidden: true });
    setDocuments(result.documents);
    setFeedback(result.message);
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return documents;

    return documents.filter((document) =>
      `${document.title} ${document.type} ${document.category} ${document.tags.join(" ")} ${document.source} ${document.summary} ${document.content}`
        .toLowerCase()
        .includes(query)
    );
  }, [documents, search]);

  const visibleDocuments = useMemo(
    () =>
      showAllDocuments
        ? filteredDocuments
        : filteredDocuments.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredDocuments, showAllDocuments]
  );

  useEffect(() => {
    setShowAllDocuments(false);
  }, [search]);

  function resetForm() {
    setId("");
    setTitle("");
    setType("lore");
    setCategory("");
    setTagsText("");
    setSource("");
    setSummary("");
    setContent("");
    setVisible(true);
    setFeedback("");
  }

  function preloadDocument(document: KnowledgeDocument) {
    setId(document.id);
    setTitle(document.title);
    setType(document.type);
    setCategory(document.category);
    setTagsText(document.tags.join(", "));
    setSource(document.source);
    setSummary(document.summary);
    setContent(document.content);
    setVisible(document.visible);
    setFeedback("");
  }

  async function handleFileUpload(file?: File) {
    if (!file) return;

    setIsExtracting(true);
    const result = await extractKnowledgeTextFromFile(file);
    setIsExtracting(false);
    setFeedback(result.message);

    if (result.status === "ready") {
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ""));
      }
      setSource((current) => current || file.name);
      setContent(result.text);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setFeedback("Titulo y contenido son obligatorios para alimentar al Archivista.");
      return;
    }

    setIsSaving(true);
    const result = await upsertKnowledgeDocument({
      id: id || slugifyKnowledgeId(title, "documento"),
      title,
      type,
      category,
      tags: parseKnowledgeTags(tagsText),
      source,
      content,
      summary,
      visible,
    });
    setIsSaving(false);
    setFeedback(result.message);

    if (result.status === "saved") {
      resetForm();
      await loadDocuments();
    }
  }

  async function handleDelete() {
    if (!id) {
      setFeedback("Selecciona un documento antes de borrar.");
      return;
    }

    if (!window.confirm(`Seguro que quieres borrar "${title}" de la biblioteca IA?`)) {
      return;
    }

    setIsSaving(true);
    const result = await deleteKnowledgeDocument(id);
    setIsSaving(false);
    setFeedback(result.message);

    if (result.status === "deleted") {
      resetForm();
      await loadDocuments();
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section
        data-gsap-admin
        className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Biblioteca IA
            </p>
            <h4 className="mt-1 text-xl font-black text-stone-100">
              {id ? "Editar documento" : "Cargar documento"}
            </h4>
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="kd-touch flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-700 bg-stone-950/45 px-4 py-4 text-sm font-bold text-stone-300 transition hover:border-amber-500/30 hover:text-amber-300">
            {isExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            PDF, TXT o MD
            <input
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              className="hidden"
              onChange={(event) => void handleFileUpload(event.target.files?.[0])}
            />
          </label>

          <LabeledInput
            label="Titulo"
            value={title}
            onChange={setTitle}
            placeholder="Historia de Argentis"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">Tipo</span>
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as KnowledgeDocumentType)
                }
                className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                {KNOWLEDGE_DOCUMENT_TYPES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <LabeledInput
              label="Categoria"
              value={category}
              onChange={setCategory}
              placeholder="Facciones, reglas, mapa..."
            />
          </div>

          <LabeledInput
            label="Tags"
            value={tagsText}
            onChange={setTagsText}
            placeholder="argentis, guerra, nobleza"
          />
          <LabeledInput
            label="Fuente"
            value={source}
            onChange={setSource}
            placeholder="PDF, canal, documento interno..."
          />
          <LabeledTextArea
            label="Resumen"
            value={summary}
            onChange={setSummary}
            placeholder="Resumen corto para orientar busquedas del Archivista"
            rows={3}
          />
          <LabeledTextArea
            label="Contenido"
            value={content}
            onChange={setContent}
            placeholder="Texto base que la IA podra consultar..."
            rows={12}
          />

          <label className="flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3">
            <span className="text-sm font-semibold text-stone-200">
              Visible para consulta
            </span>
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
              className="h-4 w-4 rounded border-stone-600 bg-stone-950 text-amber-400"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              disabled={isSaving || isExtracting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {id ? "Actualizar" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-stone-700 px-5 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500"
            >
              Limpiar
            </button>
            {id ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Borrar
              </button>
            ) : null}
          </div>

          {feedback ? (
            <AdminInfoCard title="Estado" message={feedback} />
          ) : null}
        </form>
      </section>

      <section
        data-gsap-admin
        className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Base documental
            </p>
            <h4 className="mt-1 text-xl font-black text-stone-100">
              Documentos cargados
            </h4>
          </div>
        </div>

        <div className="mt-4">
          <LabeledInput
            label="Buscar documento"
            value={search}
            onChange={setSearch}
            placeholder="Titulo, tag, fuente o contenido"
          />
        </div>

        <div className="mt-4 space-y-3">
          {visibleDocuments.length > 0 ? (
            visibleDocuments.map((document) => (
              <button
                key={document.id}
                type="button"
                onClick={() => preloadDocument(document)}
                className="kd-touch flex w-full items-start justify-between gap-3 rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-stone-100">
                    {document.title}
                  </p>
                  <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-stone-500">
                    {document.type} / {document.category || "general"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    document.visible
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                      : "border-stone-700 bg-stone-900 text-stone-400"
                  }`}
                >
                  {document.visible ? "Activo" : "Oculto"}
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
              No hay documentos cargados para la biblioteca IA.
            </div>
          )}

          <ExpandableListToggle
            shownCount={visibleDocuments.length}
            totalCount={filteredDocuments.length}
            expanded={showAllDocuments}
            onToggle={() => setShowAllDocuments((current) => !current)}
            itemLabel="documentos"
          />
        </div>
      </section>
    </div>
  );
}
