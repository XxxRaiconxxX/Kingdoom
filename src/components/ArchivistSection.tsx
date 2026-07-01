import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { RoleplayLockNotice } from "./RoleplayLockNotice";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { askArchivistAi, type ArchivistMode } from "../utils/archivistAi";
import { buildArchivistKnowledgeDocumentsFromContext } from "../utils/archivistSources";
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
  hideSources?: boolean;
};

type AttachedImage = {
  name: string;
  dataUrl: string;
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
      ? "Soy el **Archivista vivo** del reino. Puedo consultar el lore, el mercado, las misiones, los eventos y, si usted lo ordena, preparar acciones reales del panel para confirmarlas por chat."
      : "Soy el **Archivista vivo** del reino. Puedo consultar lore, mercado, misiones, eventos, bestiario, flora y documentos publicados, con contexto real del estado actual.",
    tone: "default",
  };
}

function renderMessageText(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-cyan-200">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
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

function shouldShowActionCards(action?: ArchivistActionDraft | null) {
  if (!action) return false;
  if (action.kind.includes("player_gold") || action.kind === "delete_mission" || action.kind === "delete_event") {
    return true;
  }

  const payload = action.payload ?? {};
  const isUpdate =
    typeof payload.id === "string" && payload.id.trim().length > 0;
  const label = normalizeDecision(action.label);

  return isUpdate && !label.includes("crear");
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function actionSupportsImage(action: ArchivistActionDraft) {
  return (
    action.kind.includes("market") ||
    action.kind.includes("bestiary") ||
    action.kind.includes("flora") ||
    action.kind.includes("event")
  );
}

function attachImageToAction(
  action: ArchivistActionDraft | null | undefined,
  image: AttachedImage | null
) {
  if (!action || !image || !actionSupportsImage(action)) {
    return action ?? null;
  }

  return {
    ...action,
    payload: {
      ...action.payload,
      imageUrl:
        typeof action.payload.imageUrl === "string" &&
        action.payload.imageUrl.trim() &&
        action.payload.imageUrl !== "__ARCHIVIST_ATTACHED_IMAGE__"
          ? action.payload.imageUrl
          : image.dataUrl,
    },
  };
}

function payloadText(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function isDraftDetailRequest(value: string) {
  const normalized = normalizeDecision(value);
  return [
    "habilidad",
    "habilidades",
    "efecto",
    "efectos",
    "detalle",
    "detalles",
    "caracteristica",
    "caracteristicas",
  ].some((keyword) => normalized.includes(keyword));
}

function suggestMarketAbility(action: ArchivistActionDraft) {
  const payload = action.payload ?? {};
  const name = payloadText(payload, "name") || payloadText(payload, "title") || "este objeto";
  const category = normalizeDecision(payloadText(payload, "category"));
  const description = payloadText(payload, "description");

  if (category.includes("armor") || category.includes("armadura")) {
    return `Guardia de ${name}: reduce el impacto del primer golpe fuerte recibido en una escena y permite resistir mejor empujes, cortes o presion fisica. No anula ataques ni evita dano directo de forma absoluta.`;
  }

  if (category.includes("potion") || category.includes("pocion")) {
    return `Dosis concentrada: al consumirse, otorga una ventaja narrativa breve acorde a su descripcion. Su efecto dura una escena corta y no se acumula con otra pocion similar.`;
  }

  if (category.includes("sword") || description.toLowerCase().includes("hacha") || description.toLowerCase().includes("arma")) {
    return `Golpe de Ruptura: permite realizar un impacto pesado capaz de quebrar guardias simples o empujar a un enemigo cercano. Requiere preparacion visible y no atraviesa defensas superiores ni provoca derribo automatico.`;
  }

  return `Propiedad singular: concede una utilidad narrativa moderada relacionada con ${name}, suficiente para crear ventaja situacional sin resolver una escena por si sola.`;
}

function buildDraftDetailResponse(action: ArchivistActionDraft) {
  if (action.kind.includes("market")) {
    const currentAbility = payloadText(action.payload, "ability");
    if (currentAbility) {
      return {
        action,
        text: `Habilidad actual del borrador:\n${currentAbility}`,
      };
    }

    const ability = suggestMarketAbility(action);
    return {
      action: {
        ...action,
        payload: {
          ...action.payload,
          ability,
        },
        confirmationPrompt: action.confirmationPrompt.includes("con estas caracteristicas")
          ? action.confirmationPrompt
          : `${action.confirmationPrompt} Se agrego una habilidad sugerida al borrador.`,
      },
      text: `El borrador aun no tenia habilidad concreta. Le agregue esta propuesta:\n${ability}\n\nSi no le convence, escriba el ajuste antes de confirmar.`,
    };
  }

  const payload = action.payload ?? {};
  const details = [
    payloadText(payload, "description"),
    payloadText(payload, "ability"),
    payloadText(payload, "usage"),
    payloadText(payload, "requirements"),
    payloadText(payload, "instructions"),
  ].filter(Boolean);

  return {
    action,
    text:
      details.length > 0
        ? `Detalles actuales del borrador:\n${details.join("\n\n")}`
        : "Ese borrador aun no tiene detalles suficientes. Agregue el dato que quiere conservar y lo incorporo antes de confirmar.",
  };
}

function isPlayerGoldQuestion(value: string) {
  const normalized = normalizeDecision(value);
  const wealthTerms = ["oro", "ricos", "riqueza", "ranking", "caro", "dinero", "saldo"];
  const playerTerms = ["jugador", "usuario", "jugadores", "usuarios", "quien", "quienes"];

  return wealthTerms.some(t => normalized.includes(t)) || (playerTerms.some(t => normalized.includes(t)) && normalized.includes("oro"));
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
  if (player?.roleplayAccess?.isLocked) {
    return (
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Archivista"
          title="Consulta recreativa pausada"
          description="El archivista vivo se reactiva cuando vuelvas a rolear en el grupo principal del reino."
        />
        <RoleplayLockNotice />
      </section>
    );
  }
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
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
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

    const liveResult = await fetchArchivistLiveContext({ includeAdminData: isAdmin });
    const knowledgeResult = buildArchivistKnowledgeDocumentsFromContext(liveResult.context);

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
      "Crea un jugador nuevo llamado Aventurero.",
    ];
  }, [isAdmin]);

  async function handleAttachImage(file?: File) {
    if (!file) return;

    try {
      setAttachedImage({
        name: file.name,
        dataUrl: await readImageAsDataUrl(file),
      });
      setFeedback("Imagen adjunta al siguiente borrador compatible.");
    } catch {
      setFeedback("No pude leer esa imagen. Intenta con otro archivo.");
    }
  }

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
    let execution: Awaited<ReturnType<typeof executeArchivistAction>>;
    let refreshed: Awaited<ReturnType<typeof loadArchivistBootstrap>> | null = null;

    try {
      execution = await executeArchivistAction(pendingAction, liveState.context);
      refreshed =
        execution.status === "success"
          ? await loadArchivistBootstrap({ silent: true })
          : null;
    } catch {
      setIsAsking(false);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: "No pude ejecutar esa accion. El borrador sigue pendiente para que pueda ajustarlo o cancelarlo.",
          tone: "warning",
        },
      ]);
      return;
    }

    const actionCards =
      execution.status === "success" && refreshed && shouldShowActionCards(pendingAction)
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

    if (
      pendingAction &&
      isAdmin &&
      (isPositiveDecision(cleanQuestion) || isNegativeDecision(cleanQuestion))
    ) {
      await handleConfirmAction(cleanQuestion);
      return;
    }

    if (pendingAction && isAdmin && isDraftDetailRequest(cleanQuestion)) {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: cleanQuestion,
      };
      const detail = buildDraftDetailResponse(pendingAction);

      setPendingAction(detail.action);
      setMessages((current) => [
        ...current,
        userMessage,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: detail.text,
          actionDraft: detail.action,
          tone: "success",
        },
      ]);
      setQuestion("");
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
    const pendingActionContext = pendingAction
      ? `Borrador pendiente para ajustar, no ejecutar aun: ${JSON.stringify(pendingAction)}`
      : "";
    const imageContext = attachedImage
      ? `El usuario adjunto una imagen llamada ${attachedImage.name}. Si preparas una accion compatible con imagen, usa imageUrl="__ARCHIVIST_ATTACHED_IMAGE__" en el payload.`
      : "";
    const topicMemory = [
      ...extractTopicMemory(nextMessages),
      pendingActionContext,
      imageContext,
    ].filter(Boolean);
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
    let result: Awaited<ReturnType<typeof askArchivistAi>>;

    try {
      result = await askArchivistAi({
        question: [cleanQuestion, pendingActionContext, imageContext].filter(Boolean).join("\n"),
        contextDocuments,
        mode,
        topicMemory,
        runtimeSummary,
        allowActions: isAdmin,
      });
    } catch {
      setIsAsking(false);
      setFeedback("No se pudo consultar al Archivista. El borrador pendiente sigue intacto.");
      return;
    }

    setIsAsking(false);

    if (result.status === "error") {
      setFeedback(result.message);
      return;
    }

    const actionDraft = attachImageToAction(result.actionDraft, attachedImage);
    const shouldClearAttachedImage = Boolean(actionDraft && attachedImage && actionSupportsImage(actionDraft));

    if (isAdmin && result.intent === "admin_action" && actionDraft) {
      setPendingAction(actionDraft);
      if (shouldClearAttachedImage) {
        setAttachedImage(null);
      }
    } else if (result.intent === "clarify" && pendingAction) {
      setPendingAction(pendingAction);
    } else {
      setPendingAction(null);
    }

    const cards =
      result.intent === "admin_action"
        ? actionDraft && shouldShowActionCards(actionDraft)
        ? pickArchivistCards(liveState.context, getActionCardQuery(actionDraft), {
            includeAdminData: isAdmin,
            kinds: getActionCardKinds(actionDraft),
            limit: 2,
            strict: true,
          })
        : []
        : result.intent === "clarify"
          ? []
          : isAdmin && isPlayerGoldQuestion(cleanQuestion)
            ? pickArchivistCards(liveState.context, cleanQuestion, {
                includeAdminData: true,
                kinds: ["player"],
                limit: 4,
                strict: false,
              })
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
        sources:
          result.intent === "answer" || result.intent === "recommendation"
            ? result.sources
            : [],
        actionDraft: isAdmin ? actionDraft ?? null : null,
        hideSources: isAdmin && isPlayerGoldQuestion(cleanQuestion),
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
                        {renderMessageText(message.text)}
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
                                  <img loading="lazy" decoding="async" 
                                    src={card.imageUrl}
                                    alt={card.title}
                                    className="h-14 w-14 rounded-2xl border border-black/20 object-cover"
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

                      {message.sources?.length && !message.hideSources ? (
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
                <article className="mr-auto md:max-w-[84%]">
                  <div className="flex items-center gap-3 rounded-[1.4rem] border border-stone-800 bg-stone-950/60 px-4 py-3 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-300" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                      Archivista analizando
                    </span>
                    <div className="ml-1 flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400/50" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400/50" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400/50" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </article>
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
                      Si / no o ajusta
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
                      ? "Si, no, o agrega un dato para ajustar el borrador..."
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
                {isAdmin ? (
                  <label className="kd-touch inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[1.25rem] border border-stone-700 bg-stone-950/80 text-stone-300 transition hover:border-amber-300/35 hover:text-amber-100">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        void handleAttachImage(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                    <ImagePlus className="h-4.5 w-4.5" />
                  </label>
                ) : null}
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

              {attachedImage ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-[1rem] border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  <span className="min-w-0 truncate">
                    Imagen lista: {attachedImage.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="shrink-0 font-bold uppercase tracking-[0.14em] text-amber-200"
                  >
                    Quitar
                  </button>
                </div>
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
