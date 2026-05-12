import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { askArchivistAi, type ArchivistMode } from "../utils/archivistAi";
import { fetchArchivistKnowledgeDocuments } from "../utils/archivistSources";
import { pickKnowledgeFragments } from "../utils/knowledge";
import type { KnowledgeDocument } from "../types";
import {
  buildArchivistRuntimeSummary,
  fetchArchivistLiveContext,
  pickArchivistCards,
} from "../features/archivist/archivistLive";
import { executeArchivistAction } from "../features/archivist/archivistActions";
import type {
  ArchivistActionDraft,
  ArchivistCard,
  ArchivistCardKind,
  ArchivistLiveState,
} from "../features/archivist/archivist.types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  cards?: ArchivistCard[];
  notes?: string[];
  sources?: Array<{ title: string; type: string; category: string }>;
  actionDraft?: ArchivistActionDraft | null;
  tone?: "default" | "success" | "warning";
};

const QUICK_PROMPTS = [
  "Que eventos estan activos?",
  "Que misiones abiertas hay ahora?",
  "Que arma me recomiendas comprar?",
  "Cual es el item mas caro del mercado?",
];

function buildWelcomeMessage(isAdmin: boolean): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text: isAdmin
      ? "Soy el Archivista vivo del reino. Puedo consultar el lore, el mercado, las misiones, los eventos y, si usted lo ordena, preparar acciones reales del panel para confirmarlas por chat."
      : "Soy el Archivista vivo del reino. Puedo consultar lore, mercado, misiones, eventos, bestiario, flora y documentos publicados, con contexto real del estado actual.",
    tone: "default",
  };
}

function normalizeDecision(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isPositiveDecision(value: string) {
  const normalized = normalizeDecision(value);
  return normalized === "si" || normalized === "yes" || normalized === "confirmar";
}

function isNegativeDecision(value: string) {
  const normalized = normalizeDecision(value);
  return normalized === "no" || normalized === "cancelar";
}

function getActionCardKinds(action?: ArchivistActionDraft | null): ArchivistCardKind[] | undefined {
  if (!action) return undefined;

  if (action.kind.includes("player")) return ["player"];
  if (action.kind.includes("mission")) return ["mission"];
  if (action.kind.includes("event")) return ["event"];
  if (action.kind.includes("market")) return ["market"];
  if (action.kind.includes("magic")) return ["magic"];
  if (action.kind.includes("bestiary")) return ["bestiary"];
  if (action.kind.includes("flora")) return ["flora"];
  if (action.kind.includes("document")) return ["document"];

  return undefined;
}

function getActionCardQuery(action: ArchivistActionDraft) {
  const payload = action.payload ?? {};
  return [
    action.label,
    payload.title,
    payload.name,
    payload.username,
    payload.playerName,
    payload.usuario,
    payload.jugador,
  ]
    .map((entry) => (typeof entry === "string" ? entry : ""))
    .filter(Boolean)
    .join(" ");
}

function extractTopicMemory(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.text.trim())
    .filter(
      (entry) => entry && !isPositiveDecision(entry) && !isNegativeDecision(entry)
    )
    .slice(-4);
}

function messageToneClasses(tone: ChatMessage["tone"]) {
  if (tone === "success") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-50";
  }

  if (tone === "warning") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-50";
  }

  return "border-stone-800 bg-stone-950/60 text-stone-200";
}

function cardAccentClasses(card: ArchivistCard) {
  switch (card.accent) {
    case "amber":
      return "border-amber-400/20 bg-amber-500/10";
    case "emerald":
      return "border-emerald-400/20 bg-emerald-500/10";
    case "cyan":
      return "border-cyan-400/20 bg-cyan-500/10";
    case "rose":
      return "border-rose-400/20 bg-rose-500/10";
    case "violet":
      return "border-violet-400/20 bg-violet-500/10";
    default:
      return "border-stone-700 bg-stone-900/80";
  }
}

function messageRoleLabel(message: ChatMessage, isAdmin: boolean) {
  if (message.role === "user") {
    return isAdmin ? "Admin" : "Jugador";
  }

  if (message.role === "system") {
    return "Sistema";
  }

  return "Archivista";
}

export function ArchivistSection() {
  const { isAdmin, player } = usePlayerSession();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [liveState, setLiveState] = useState<ArchivistLiveState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    buildWelcomeMessage(false),
  ]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [feedback, setFeedback] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState<ArchivistActionDraft | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length <= 1 && current[0]?.id === "welcome") {
        return [buildWelcomeMessage(isAdmin)];
      }

      return current;
    });
  }, [isAdmin]);

  async function loadArchivistBootstrap(options?: { silent?: boolean }) {
    if (options?.silent) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
    }

    const [knowledgeResult, liveResult] = await Promise.all([
      fetchArchivistKnowledgeDocuments(),
      fetchArchivistLiveContext({ includeAdminData: isAdmin }),
    ]);

    setDocuments(knowledgeResult.documents);
    setLiveState(liveResult);
    setFeedback(
      [knowledgeResult.message, liveResult.message].map((entry) => entry.trim()).find(Boolean) ??
        ""
    );
    setStatus(
      knowledgeResult.documents.length > 0 && liveResult.context.documents.length >= 0
        ? "ready"
        : "error"
    );
    setIsRefreshing(false);

    return {
      documents: knowledgeResult.documents,
      liveState: liveResult,
    };
  }

  useEffect(() => {
    void loadArchivistBootstrap();
  }, [isAdmin]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, pendingAction, isAsking]);

  const runtimeSummary = useMemo(() => {
    if (!liveState) {
      return "";
    }

    return buildArchivistRuntimeSummary(liveState.context, { includeAdminData: isAdmin });
  }, [isAdmin, liveState]);

  const quickPrompts = useMemo(() => {
    if (!isAdmin) {
      return QUICK_PROMPTS;
    }

    return [
      ...QUICK_PROMPTS,
      "Dame un resumen del mercado actual.",
      "Que jugadores tienen mas oro ahora?",
    ];
  }, [isAdmin]);

  async function handleConfirmAction(userInput: string) {
    if (!pendingAction || !liveState) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userInput,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");

    if (isNegativeDecision(userInput)) {
      setPendingAction(null);
      setMessages((current) => [
        ...current,
        {
          id: `system-${Date.now()}`,
          role: "system",
          text: "Accion cancelada. El Archivista no ejecuto ningun cambio.",
          tone: "warning",
        },
      ]);
      return;
    }

    if (!isPositiveDecision(userInput)) {
      setMessages((current) => [
        ...current,
        {
          id: `system-${Date.now()}`,
          role: "system",
          text: "Hay una accion pendiente. Responda si para ejecutar o no para cancelar.",
          tone: "warning",
        },
      ]);
      return;
    }

    setIsAsking(true);
    const execution = await executeArchivistAction(pendingAction, liveState.context);
    const refreshed =
      execution.status === "success"
        ? await loadArchivistBootstrap({ silent: true })
        : null;
    const actionCards =
      execution.status === "success" && refreshed
        ? pickArchivistCards(refreshed.liveState.context, getActionCardQuery(pendingAction), {
            includeAdminData: isAdmin,
            kinds: getActionCardKinds(pendingAction),
            limit: 2,
            strict: true,
          })
        : [];

    setPendingAction(null);
    setIsAsking(false);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: execution.message,
        cards: actionCards,
        tone: execution.status === "success" ? "success" : "warning",
      },
    ]);
  }

  async function handleAsk(prefilledQuestion?: string) {
    const cleanQuestion = (prefilledQuestion ?? question).trim();

    if (!cleanQuestion || isAsking) {
      return;
    }

    if (pendingAction && isAdmin) {
      await handleConfirmAction(cleanQuestion);
      return;
    }

    if (!liveState) {
      setFeedback("El Archivista aun esta cargando el estado del reino.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: cleanQuestion,
    };

    const nextMessages = [...messages, userMessage];
    const topicMemory = extractTopicMemory(nextMessages);
    const contextDocuments = pickKnowledgeFragments(
      documents,
      [cleanQuestion, ...topicMemory, runtimeSummary].join(" "),
      isAdmin ? 12 : 9
    );

    if (contextDocuments.length === 0) {
      setFeedback("Todavia no hay fuentes suficientes para responder esa consulta.");
      return;
    }

    setMessages(nextMessages);
    setQuestion("");
    setIsAsking(true);
    setFeedback("");

    const mode: ArchivistMode = isAdmin ? "staff" : "canon";
    const result = await askArchivistAi({
      question: cleanQuestion,
      contextDocuments,
      mode,
      topicMemory,
      runtimeSummary,
      allowActions: isAdmin,
    });

    setIsAsking(false);

    if (result.status === "error") {
      setFeedback(result.message);
      return;
    }

    if (isAdmin && result.intent === "admin_action" && result.actionDraft) {
      setPendingAction(result.actionDraft);
    } else {
      setPendingAction(null);
    }

    const cards =
      result.intent === "admin_action"
        ? result.actionDraft
          ? pickArchivistCards(liveState.context, getActionCardQuery(result.actionDraft), {
              includeAdminData: isAdmin,
              kinds: getActionCardKinds(result.actionDraft),
              limit: 2,
              strict: true,
            })
          : []
        : pickArchivistCards(liveState.context, cleanQuestion, {
            includeAdminData: isAdmin,
            limit: 4,
          });

    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: result.answer,
        cards,
        notes: result.notes,
        sources: result.sources,
        actionDraft: isAdmin ? result.actionDraft ?? null : null,
        tone:
          result.intent === "clarify"
            ? "warning"
            : result.intent === "admin_action"
              ? "success"
              : "default",
      },
    ]);
  }

  return (
    <section className="space-y-4">
      <div className="kd-glass overflow-hidden rounded-[2rem] border border-cyan-500/12 bg-stone-900/80 shadow-2xl shadow-black/35">
        <div className="border-b border-stone-800/80 px-5 py-5 md:px-7 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="Archivo vivo"
              title="Archivista de Argentis"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                <Bot className="h-3.5 w-3.5" />
                {documents.length} fuentes
              </span>
              {isAdmin ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin operativo
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void handleAsk(prompt)}
                className="kd-touch shrink-0 rounded-full border border-stone-700 bg-stone-950/70 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-300 transition hover:border-cyan-300/30 hover:text-cyan-100"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 md:p-4">
          <div className="rounded-[1.8rem] border border-stone-800 bg-stone-950/55">
            <div
              ref={scrollRef}
              className="flex max-h-[60vh] min-h-[28rem] flex-col gap-3 overflow-y-auto px-3 py-4 md:max-h-[64vh] md:px-4"
            >
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <article
                    key={message.id}
                    className={`max-w-full ${isUser ? "ml-auto md:max-w-[76%]" : "mr-auto md:max-w-[84%]"}`}
                  >
                    <div
                      className={`rounded-[1.4rem] border px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.15)] ${
                        isUser
                          ? "border-amber-400/20 bg-amber-500/12 text-amber-50"
                          : messageToneClasses(message.tone)
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                        {message.role === "assistant" ? (
                          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                        ) : message.role === "system" ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-amber-300" />
                        )}
                        {messageRoleLabel(message, isAdmin)}
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.text}
                      </p>

                      {message.notes?.length ? (
                        <div className="mt-3 space-y-2 rounded-2xl border border-stone-800/90 bg-stone-950/45 p-3">
                          {message.notes.map((note) => (
                            <p
                              key={`${message.id}-${note}`}
                              className="text-xs leading-5 text-stone-300"
                            >
                              {note}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      {message.cards?.length ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {message.cards.map((card) => (
                            <div
                              key={card.id}
                              className={`overflow-hidden rounded-[1.15rem] border p-3 ${cardAccentClasses(card)}`}
                            >
                              <div className="flex items-start gap-3">
                                {card.imageUrl ? (
                                  <img
                                    src={card.imageUrl}
                                    alt={card.title}
                                    className="h-14 w-14 rounded-2xl border border-black/20 object-cover"
                                    loading="lazy"
                                  />
                                ) : null}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-300/85">
                                    {card.eyebrow}
                                  </p>
                                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-stone-50">
                                    {card.title}
                                  </h3>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-300/85">
                                    {card.description}
                                  </p>
                                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-100/80">
                                    {card.detail}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {message.actionDraft ? (
                        <div className="mt-3 rounded-[1.2rem] border border-amber-400/20 bg-amber-500/10 p-3">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Accion preparada
                          </div>
                          <p className="mt-2 text-sm font-semibold text-amber-50">
                            {message.actionDraft.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-amber-100/80">
                            {message.actionDraft.confirmationPrompt}
                          </p>
                        </div>
                      ) : null}

                      {message.sources?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.sources.slice(0, 4).map((source) => (
                            <span
                              key={`${message.id}-${source.title}`}
                              className="rounded-full border border-stone-700 bg-stone-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400"
                            >
                              {source.title}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}

              {isAsking ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Consultando archivo
                </div>
              ) : null}
            </div>

            <div className="border-t border-stone-800 bg-stone-950/45 px-3 py-3 md:px-4">
              {pendingAction ? (
                <div className="mb-3 rounded-[1.25rem] border border-amber-400/20 bg-amber-500/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                        Confirmacion pendiente
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-50">
                        {pendingAction.label}
                      </p>
                    </div>
                    <span className="rounded-full border border-amber-300/20 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-100">
                      Responde si / no
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-amber-100/80">
                    {pendingAction.confirmationPrompt}
                  </p>
                </div>
              ) : null}

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
                  placeholder={
                    pendingAction
                      ? "Escribe si para ejecutar o no para cancelar..."
                      : isAdmin
                        ? "Consulta el reino o pide una accion de staff..."
                        : "Pregunta por lore, mercado, eventos, misiones o magia..."
                  }
                  className="min-w-0 flex-1 rounded-[1.25rem] border border-stone-700 bg-stone-950/85 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-cyan-300/45"
                />
                <button
                  type="button"
                  onClick={() => void handleAsk()}
                  disabled={isAsking || !question.trim() || status === "loading"}
                  className="kd-touch inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-cyan-400 text-stone-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void loadArchivistBootstrap({ silent: true })}
                  disabled={isRefreshing || isAsking}
                  className="kd-touch inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] border border-stone-700 bg-stone-950/80 text-stone-300 transition hover:border-cyan-300/30 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <RefreshCw
                    className={`h-4.5 w-4.5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {feedback ? (
                <p className="mt-3 rounded-[1rem] border border-stone-800 bg-stone-950/45 px-3 py-2 text-xs leading-5 text-stone-400">
                  {feedback}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                <span className="rounded-full border border-stone-800 bg-stone-950/50 px-2.5 py-1">
                  {status === "loading" ? "Cargando" : status === "ready" ? "En linea" : "Con incidencia"}
                </span>
                <span className="rounded-full border border-stone-800 bg-stone-950/50 px-2.5 py-1">
                  {player?.username ? `Sesion ${player.username}` : "Sin perfil conectado"}
                </span>
                <span className="rounded-full border border-stone-800 bg-stone-950/50 px-2.5 py-1">
                  {liveState?.status === "partial" ? "Contexto parcial" : "Contexto vivo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
