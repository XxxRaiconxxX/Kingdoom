import { useEffect, useMemo, useState } from "react";
import { BookMarked, FileSearch, Loader2, Send, Sparkles } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { askArchivistAi } from "../utils/archivistAi";
import {
  fetchKnowledgeDocuments,
  pickKnowledgeContext,
} from "../utils/knowledge";
import type { KnowledgeDocument } from "../types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Array<{ title: string; type: string; category: string }>;
};

export function ArchivistSection() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Soy el Archivista de Argentis. Puedo responder usando los documentos cargados por el staff.",
    },
  ]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isAsking, setIsAsking] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      const result = await fetchKnowledgeDocuments();

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

  const suggestedSources = useMemo(
    () => pickKnowledgeContext(documents, question || "kingdoom lore", 4),
    [documents, question]
  );

  async function handleAsk() {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isAsking) return;

    const contextDocuments = pickKnowledgeContext(documents, cleanQuestion, 6);

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
            description="Consulta el lore cargado por el staff. Si el documento no existe en la biblioteca, el Archivista lo dira."
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
                Carga documentos desde el panel admin para activar el archivo.
              </div>
            )}
          </div>
          <div className="mt-4 rounded-[1.2rem] border border-amber-500/15 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
              <Sparkles className="h-4 w-4" />
              Modo canon
            </div>
            <p className="mt-2 text-xs leading-5 text-amber-100/75">
              Las respuestas se apoyan en la base documental visible.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
