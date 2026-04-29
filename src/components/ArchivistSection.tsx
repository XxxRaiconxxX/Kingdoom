import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  Brain,
  FileSearch,
  Loader2,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { askArchivistAi } from "../utils/archivistAi";
import type { ArchivistMode } from "../utils/archivistAi";
import { fetchArchivistKnowledgeDocuments } from "../utils/archivistSources";
import { pickKnowledgeContext, pickKnowledgeFragments } from "../utils/knowledge";
import type { KnowledgeDocument } from "../types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Array<{ title: string; type: string; category: string }>;
};

const TOPIC_MEMORY_STORAGE_KEY = "kingdoom-archivist-topic-memory";

export function ArchivistSection() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Soy el Archivista de Argentis. Puedo responder usando el canon publicado y los documentos cargados por el staff.",
    },
  ]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isAsking, setIsAsking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [mode, setMode] = useState<ArchivistMode>("canon");
  const [topicMemory, setTopicMemory] = useState<string[]>([]);
  const [memoryDraft, setMemoryDraft] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      const result = await fetchArchivistKnowledgeDocuments();

      if (cancelled) return;

      setDocuments(result.documents);
      setFeedback(result.message);
      setStatus(result.status === "ready" ? "ready" : "error");
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TOPIC_MEMORY_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setTopicMemory(
          parsed
            .map((topic) => String(topic).trim())
            .filter(Boolean)
            .slice(0, 8)
        );
      }
    } catch {
      setTopicMemory([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        TOPIC_MEMORY_STORAGE_KEY,
        JSON.stringify(topicMemory)
      );
    } catch {
      // Local memory is optional. If storage is blocked, the chat still works.
    }
  }, [topicMemory]);

  const suggestedSources = useMemo(
    () =>
      pickKnowledgeContext(
        documents,
        [question, ...topicMemory].filter(Boolean).join(" ") || "kingdoom lore",
        4
      ),
    [documents, question, topicMemory]
  );

  function addMemoryTopic(value?: string) {
    const topic = (value ?? memoryDraft).trim();
    if (!topic) return;

    setTopicMemory((current) => {
      const normalized = topic.toLowerCase();
      const withoutDuplicate = current.filter(
        (entry) => entry.toLowerCase() !== normalized
      );

      return [topic, ...withoutDuplicate].slice(0, 8);
    });
    setMemoryDraft("");
  }

  function removeMemoryTopic(topic: string) {
    setTopicMemory((current) => current.filter((entry) => entry !== topic));
  }

  async function handleAsk() {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isAsking) return;

    const contextDocuments = pickKnowledgeFragments(
      documents,
      [cleanQuestion, ...topicMemory].join(" "),
      mode === "deep" || mode === "staff" ? 12 : mode === "mechanics" ? 9 : 7
    );

    if (contextDocuments.length === 0) {
      setFeedback("Todavia no hay documentos visibles para consultar.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: cleanQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsAsking(true);
    setFeedback("");

    const result = await askArchivistAi({
      question: cleanQuestion,
      contextDocuments,
      mode,
      topicMemory,
    });

    setIsAsking(false);

    if (result.status === "error") {
      setFeedback(result.message);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: result.answer,
        sources: result.sources,
      },
    ]);
  }

  return (
    <section className="space-y-5">
      <div className="kd-glass overflow-hidden rounded-[2rem] border border-amber-500/15 bg-stone-900/80 p-6 shadow-2xl shadow-black/35 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Archivo vivo"
            title="Archivista de Argentis"
            description="Consulta lore, magias, bestiario, flora, eventos, misiones y documentos cargados."
          />
          <div className="flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
            <BookMarked className="h-4 w-4" />
            {documents.length} fuentes
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.36fr]">
        <div className="kd-glass flex min-h-[32rem] flex-col rounded-[2rem] border border-stone-800 bg-stone-900/70 shadow-xl shadow-black/25">
          <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-5">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[92%] rounded-[1.35rem] border px-4 py-3 ${
                  message.role === "user"
                    ? "ml-auto border-amber-500/20 bg-amber-500/12 text-amber-50"
                    : "border-stone-800 bg-stone-950/55 text-stone-200"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.text}
                </p>
                {message.sources?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.sources.slice(0, 4).map((source) => (
                      <span
                        key={`${message.id}-${source.title}`}
                        className="rounded-full border border-stone-700 bg-stone-950/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400"
                      >
                        {source.title}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {isAsking ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-950/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Consultando archivo
              </div>
            ) : null}
          </div>

          <div className="border-t border-stone-800 p-3 md:p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {[
                ["canon", "Canon"],
                ["deep", "Profundo"],
                ["mechanics", "Mecanicas"],
                ["narrator", "Narrador"],
                ["staff", "Staff"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as ArchivistMode)}
                  className={`kd-touch shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                    mode === value
                      ? "border-amber-400/40 bg-amber-500/14 text-amber-200"
                      : "border-stone-700 bg-stone-950/60 text-stone-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mb-3 rounded-[1.2rem] border border-cyan-500/15 bg-cyan-500/6 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                  <Brain className="h-4 w-4" />
                  Memoria tematica
                </div>
                {topicMemory.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setTopicMemory([])}
                    className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-200"
                  >
                    Limpiar
                  </button>
                ) : null}
              </div>
              {topicMemory.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {topicMemory.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => removeMemoryTopic(topic)}
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-stone-950/55 px-2.5 py-1 text-[11px] font-bold text-cyan-100"
                    >
                      {topic}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memoryDraft}
                  onChange={(event) => setMemoryDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addMemoryTopic();
                    }
                  }}
                  placeholder="Tema activo: faccion, magia, evento..."
                  className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-950/75 px-3 py-2 text-xs text-stone-100 outline-none placeholder:text-stone-500 focus:border-cyan-300/40"
                />
                <button
                  type="button"
                  onClick={() => addMemoryTopic(question)}
                  disabled={!question.trim()}
                  className="kd-touch inline-flex items-center gap-1 rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-300 transition hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Actual
                </button>
                <button
                  type="button"
                  onClick={() => addMemoryTopic()}
                  disabled={!memoryDraft.trim()}
                  className="kd-touch inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-stone-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleAsk();
                  }
                }}
                placeholder="Pregunta por lore, reglas, facciones, magias..."
                className="min-w-0 flex-1 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/45"
              />
              <button
                type="button"
                onClick={() => void handleAsk()}
                disabled={isAsking || !question.trim() || status !== "ready"}
                className="kd-touch inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            {feedback ? (
              <p className="mt-3 rounded-xl border border-stone-800 bg-stone-950/45 px-3 py-2 text-xs leading-5 text-stone-400">
                {feedback}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/70 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400/80">
            <FileSearch className="h-4 w-4" />
            Fuentes cercanas
          </div>
          <div className="mt-4 space-y-3">
            {suggestedSources.length > 0 ? (
              suggestedSources.map((document) => (
                <div
                  key={document.id}
                  className="rounded-[1.2rem] border border-stone-800 bg-stone-950/45 p-3"
                >
                  <p className="text-sm font-bold text-stone-100">
                    {document.title}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-stone-500">
                    {document.type} / {document.category || "general"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/35 p-4 text-sm leading-6 text-stone-400">
                Aun no hay fuentes cercanas para esta busqueda.
              </div>
            )}
          </div>
          <div className="mt-4 rounded-[1.2rem] border border-amber-500/15 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
              <Sparkles className="h-4 w-4" />
              Modo canon
            </div>
            <p className="mt-2 text-xs leading-5 text-amber-100/75">
              Las respuestas se apoyan en la base documental y secciones publicadas.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
