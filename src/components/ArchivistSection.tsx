import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BookOpenText,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleStop,
  Database,
  Feather,
  FileText,
  Gavel,
  ImagePlus,
  LibraryBig,
  Loader2,
  MessageSquarePlus,
  PackageSearch,
  RefreshCw,
  ScrollText,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Swords,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { RoleplayLockNotice } from "./RoleplayLockNotice";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { askArchivistAi, type ArchivistMode } from "../utils/archivistAi";
import { buildArchivistKnowledgeDocumentsFromContext } from "../utils/archivistSources";
import { buildKnowledgeFragments, pickKnowledgeContext } from "../utils/knowledge";
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
  followUpQuestion?: string;
  tone?: "default" | "success" | "warning";
  hideSources?: boolean;
};

type AttachedImage = {
  name: string;
  dataUrl: string;
  size: number;
};

const QUICK_PROMPTS = [
  "Que eventos estan activos?",
  "Que misiones abiertas hay ahora?",
  "Que arma me recomiendas comprar?",
  "Cual es el item mas caro del mercado?",
];

const MAX_CHAT_MESSAGES = 64;
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_QUESTION_LENGTH = 2000;

const MODE_OPTIONS = [
  {
    id: "canon" as const,
    label: "Canon",
    description: "Respuesta directa y prudente.",
    icon: BookOpenText,
  },
  {
    id: "deep" as const,
    label: "Profundo",
    description: "Cruza fuentes e inferencias.",
    icon: BrainCircuit,
  },
  {
    id: "mechanics" as const,
    label: "Mecanicas",
    description: "Balance, limites y riesgos.",
    icon: Gavel,
  },
  {
    id: "narrator" as const,
    label: "Narrador",
    description: "Ambientacion sin inventar canon.",
    icon: Feather,
  },
  {
    id: "staff" as const,
    label: "Staff",
    description: "Diagnostico y operacion admin.",
    icon: ShieldCheck,
  },
];

const ADMIN_ACTION_STARTERS = [
  {
    label: "Nueva mision",
    description: "Crear, cerrar o reabrir contratos.",
    prompt: "Quiero preparar una mision. Preguntame solo el dato indispensable para crearla, cerrarla o reabrirla.",
    icon: ScrollText,
  },
  {
    label: "Gestionar evento",
    description: "Programar, activar o finalizar.",
    prompt: "Quiero gestionar un evento. Ayudame a crearlo, activarlo o finalizarlo conservando sus datos actuales.",
    icon: Swords,
  },
  {
    label: "Objeto de mercado",
    description: "Crear, editar, destacar o reponer.",
    prompt: "Quiero gestionar un objeto del mercado: crearlo, editarlo, destacarlo o ajustar su stock.",
    icon: PackageSearch,
  },
  {
    label: "Magia y balance",
    description: "Registrar o ajustar habilidades.",
    prompt: "Quiero gestionar una magia y revisar su balance, limites y Anti-Mano Negra antes de guardarla.",
    icon: WandSparkles,
  },
  {
    label: "Bestiario",
    description: "Registrar o actualizar criaturas.",
    prompt: "Quiero registrar o actualizar una criatura del bestiario con sus datos completos.",
    icon: Archive,
  },
  {
    label: "Flora",
    description: "Catalogar propiedades y usos.",
    prompt: "Quiero registrar o actualizar una entrada de flora con propiedades, usos y procedencia.",
    icon: Sprout,
  },
  {
    label: "Documento",
    description: "Publicar, ocultar o actualizar lore.",
    prompt: "Quiero gestionar un documento del archivo: crearlo, actualizarlo, publicarlo u ocultarlo.",
    icon: FileText,
  },
  {
    label: "Tesoro real",
    description: "Ajustar oro con objetivos exactos.",
    prompt: "Quiero ajustar oro. Pideme los nombres exactos de los jugadores, la cantidad y el tipo de ajuste.",
    icon: Database,
  },
];

const ACTION_FIELD_LABELS: Record<string, string> = {
  username: "Jugador",
  usernames: "Jugadores",
  amount: "Cantidad",
  title: "Titulo",
  name: "Nombre",
  description: "Descripcion",
  status: "Estado",
  rewardGold: "Recompensa",
  participationRewardGold: "Oro por participar",
  maxParticipants: "Cupos",
  price: "Precio",
  rarity: "Rareza",
  category: "Categoria",
  stockStatus: "Stock",
  stockLimit: "Limite",
  visible: "Visible",
  source: "Fuente",
  imageUrl: "Imagen",
};

let messageSequence = 0;

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

function createMessageId(prefix: ChatMessage["role"]) {
  messageSequence += 1;
  return `${prefix}-${Date.now()}-${messageSequence}`;
}

function appendChatMessages(current: ChatMessage[], ...entries: ChatMessage[]) {
  const combined = [...current, ...entries];
  if (combined.length <= MAX_CHAT_MESSAGES) return combined;

  const welcome = combined.find((message) => message.id === "welcome");
  const recent = combined
    .filter((message) => message.id !== "welcome")
    .slice(-(MAX_CHAT_MESSAGES - (welcome ? 1 : 0)));

  return welcome ? [welcome, ...recent] : recent;
}

function formatActionValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "number") return value.toLocaleString("es-PY");
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (value && typeof value === "object") return "Datos estructurados";
  if (typeof value !== "string") return String(value ?? "");
  if (value.startsWith("data:image/")) return "Imagen adjunta";
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

function getActionPayloadPreview(action: ArchivistActionDraft) {
  return Object.entries(action.payload)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .map(([key, value]) => ({
      key,
      label: ACTION_FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, " $1"),
      value: formatActionValue(value),
    }))
    .filter((entry) => entry.value)
    .slice(0, 10);
}

function isDestructiveAction(action: ArchivistActionDraft) {
  return action.kind.startsWith("delete_");
}

function formatRefreshTime(value?: string) {
  if (!value) return "Sin sincronizar";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin sincronizar"
    : date.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" });
}

function sourceStatusLabel(status: ArchivistLiveState["sources"][number]["status"]) {
  if (status === "ready") return "Lista";
  if (status === "fallback") return "Respaldo";
  return "Error";
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

function buildPendingActionContext(action: ArchivistActionDraft | null) {
  if (!action) return "";

  const serialized = JSON.stringify(action, (_key, value) =>
    typeof value === "string" && value.startsWith("data:image/")
      ? "__ARCHIVIST_ATTACHED_IMAGE__"
      : value
  );

  return `Borrador pendiente para ajustar, no ejecutar aun: ${serialized}`;
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
  const {
    isAdmin,
    player,
    isSecureSessionReady,
    isPlayerSecureLinked,
    secureSessionError,
  } = usePlayerSession();
  const isRoleplayLocked = Boolean(player?.roleplayAccess?.isLocked);
  const canExecuteAdminActions =
    isAdmin && isSecureSessionReady && isPlayerSecureLinked;
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [liveState, setLiveState] = useState<ArchivistLiveState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    buildWelcomeMessage(false),
  ]);
  const [mode, setMode] = useState<ArchivistMode>("canon");
  const [status, setStatus] = useState<"loading" | "ready" | "partial" | "error">("loading");
  const [feedback, setFeedback] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState("");
  const [pendingAction, setPendingAction] = useState<ArchivistActionDraft | null>(null);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const askAbortRef = useRef<AbortController | null>(null);
  const askRequestRef = useRef(0);
  const bootstrapRequestRef = useRef(0);
  const isBusy = isAsking || isExecuting;

  useEffect(() => {
    setMessages((current) => {
      if (current.length <= 1 && current[0]?.id === "welcome") {
        return [buildWelcomeMessage(isAdmin)];
      }

      return current;
    });
  }, [isAdmin]);

  useEffect(() => {
    askRequestRef.current += 1;
    askAbortRef.current?.abort();
    askAbortRef.current = null;
    setIsAsking(false);
    setPendingAction(null);
    setAttachedImage(null);
    setMode(isAdmin ? "staff" : "canon");
  }, [isAdmin]);

  async function loadArchivistBootstrap(options?: { silent?: boolean }) {
    const requestId = ++bootstrapRequestRef.current;

    if (options?.silent) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
    }

    try {
      const liveResult = await fetchArchivistLiveContext({ includeAdminData: isAdmin });
      const knowledgeResult = buildArchivistKnowledgeDocumentsFromContext(liveResult.context);

      if (requestId !== bootstrapRequestRef.current) return null;

      setDocuments(knowledgeResult.documents);
      setLiveState(liveResult);
      setFeedback(
        Array.from(
          new Set(
            [knowledgeResult.message, liveResult.message]
              .map((entry) => entry.trim())
              .filter(Boolean)
          )
        ).join(" ")
      );
      setStatus(
        knowledgeResult.documents.length === 0
          ? "error"
          : liveResult.status === "partial"
            ? "partial"
            : "ready"
      );

      return {
        documents: knowledgeResult.documents,
        liveState: liveResult,
      };
    } catch {
      if (requestId !== bootstrapRequestRef.current) return null;
      if (!options?.silent) {
        setStatus("error");
      }
      setFeedback("No se pudo sincronizar el archivo vivo. Conservamos el ultimo contexto disponible.");
      return null;
    } finally {
      if (requestId === bootstrapRequestRef.current) {
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    if (isRoleplayLocked) {
      bootstrapRequestRef.current += 1;
      askRequestRef.current += 1;
      askAbortRef.current?.abort();
      askAbortRef.current = null;
      setIsAsking(false);
      setIsRefreshing(false);
      setPendingAction(null);
      setAttachedImage(null);
      return;
    }

    void loadArchivistBootstrap();

    return () => {
      bootstrapRequestRef.current += 1;
    };
  }, [isAdmin, isRoleplayLocked]);

  useEffect(
    () => () => {
      askRequestRef.current += 1;
      askAbortRef.current?.abort();
      bootstrapRequestRef.current += 1;
    },
    []
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !shouldStickToBottomRef.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages, pendingAction, isAsking, isExecuting]);

  const documentFragments = useMemo(
    () => buildKnowledgeFragments(documents),
    [documents]
  );

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

  const availableModes = useMemo(
    () => MODE_OPTIONS.filter((option) => isAdmin || option.id !== "staff"),
    [isAdmin]
  );

  const liveMetrics = useMemo(() => {
    const context = liveState?.context;
    const activeEvents = context?.events.filter((entry) => entry.status === "active").length ?? 0;
    const openMissions =
      context?.missions.filter(
        (entry) => entry.status !== "closed" && entry.visible !== false
      ).length ?? 0;
    const readySources =
      liveState?.sources.filter((source) => source.status === "ready").length ?? 0;
    const totalSources = liveState?.sources.length ?? 0;

    return {
      activeEvents,
      openMissions,
      readySources,
      totalSources,
    };
  }, [liveState]);
  const pendingActionPreview = pendingAction
    ? getActionPayloadPreview(pendingAction)
    : [];

  function setQuestionValue(value: string) {
    if (inputRef.current) {
      inputRef.current.value = value;
    }
  }

  if (isRoleplayLocked) {
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

  async function handleAttachImage(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback("El archivo seleccionado no es una imagen valida.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setFeedback("La imagen supera 1.5 MB. Comprimela antes de adjuntarla al archivo.");
      return;
    }

    try {
      setAttachedImage({
        name: file.name,
        dataUrl: await readImageAsDataUrl(file),
        size: file.size,
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

    const actionToExecute = pendingAction;

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      text: userInput,
    };

    shouldStickToBottomRef.current = true;
    setMessages((current) => appendChatMessages(current, userMessage));
    setQuestionValue("");

    if (isNegativeDecision(userInput)) {
      setPendingAction(null);
      setMessages((current) =>
        appendChatMessages(current, {
          id: createMessageId("system"),
          role: "system",
          text: "Accion cancelada. El Archivista no ejecuto ningun cambio.",
          tone: "warning",
        })
      );
      return;
    }

    if (!isPositiveDecision(userInput)) {
      setMessages((current) =>
        appendChatMessages(current, {
          id: createMessageId("system"),
          role: "system",
          text: "Hay una accion pendiente. Responda si para ejecutar o no para cancelar.",
          tone: "warning",
        })
      );
      return;
    }

    if (!canExecuteAdminActions) {
      setMessages((current) =>
        appendChatMessages(current, {
          id: createMessageId("system"),
          role: "system",
          text:
            secureSessionError ||
            "La cuenta admin debe estar vinculada a la sesion segura antes de ejecutar acciones.",
          tone: "warning",
        })
      );
      return;
    }

    setIsExecuting(true);
    let execution: Awaited<ReturnType<typeof executeArchivistAction>>;
    let refreshed: Awaited<ReturnType<typeof loadArchivistBootstrap>> | null = null;

    try {
      execution = await executeArchivistAction(actionToExecute, liveState.context);
      refreshed = await loadArchivistBootstrap({ silent: true });
    } catch {
      setPendingAction(null);
      await loadArchivistBootstrap({ silent: true });
      setMessages((current) =>
        appendChatMessages(current, {
          id: createMessageId("assistant"),
          role: "assistant",
          text: "No pude confirmar el resultado de esa accion. Sincronice el archivo antes de preparar una nueva orden para evitar duplicados.",
          tone: "warning",
        })
      );
      setIsExecuting(false);
      return;
    }

    const actionCards =
      execution.status === "success" && refreshed && shouldShowActionCards(actionToExecute)
        ? pickArchivistCards(refreshed.liveState.context, getActionCardQuery(actionToExecute), {
            includeAdminData: isAdmin,
            kinds: getActionCardKinds(actionToExecute),
            limit: 2,
            strict: true,
          })
        : [];

    setPendingAction(null);
    setIsExecuting(false);
    setMessages((current) =>
      appendChatMessages(current, {
        id: createMessageId("assistant"),
        role: "assistant",
        text: execution.message,
        cards: actionCards,
        tone: execution.status === "success" ? "success" : "warning",
      })
    );
  }

  async function handleAsk(prefilledQuestion?: string) {
    const cleanQuestion = (prefilledQuestion ?? inputRef.current?.value ?? "").trim();

    if (!cleanQuestion || isBusy) {
      return;
    }

    if (cleanQuestion.length > MAX_QUESTION_LENGTH) {
      setFeedback(`La consulta supera ${MAX_QUESTION_LENGTH.toLocaleString("es-PY")} caracteres. Resume el pedido antes de enviarlo.`);
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
        id: createMessageId("user"),
        role: "user",
        text: cleanQuestion,
      };
      const detail = buildDraftDetailResponse(pendingAction);

      setPendingAction(detail.action);
      setMessages((current) =>
        appendChatMessages(current, userMessage, {
          id: createMessageId("assistant"),
          role: "assistant",
          text: detail.text,
          actionDraft: detail.action,
          tone: "success",
        })
      );
      setQuestionValue("");
      return;
    }

    if (!liveState) {
      setFeedback("El Archivista aun esta cargando el estado del reino.");
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      text: cleanQuestion,
    };

    const nextMessages = appendChatMessages(messages, userMessage);
    const pendingActionContext = buildPendingActionContext(pendingAction);
    const imageContext = attachedImage
      ? `El usuario adjunto una imagen llamada ${attachedImage.name}. Si preparas una accion compatible con imagen, usa imageUrl="__ARCHIVIST_ATTACHED_IMAGE__" en el payload.`
      : "";
    const topicMemory = [
      ...extractTopicMemory(messages),
      pendingActionContext,
      imageContext,
    ].filter(Boolean);
    const contextDocuments = pickKnowledgeContext(
      documentFragments,
      [cleanQuestion, ...topicMemory, runtimeSummary].join(" "),
      isAdmin ? 12 : 9
    );

    if (contextDocuments.length === 0) {
      setFeedback("Todavia no hay fuentes suficientes para responder esa consulta.");
      return;
    }

    shouldStickToBottomRef.current = true;
    setMessages(nextMessages);
    setQuestionValue("");
    setIsAsking(true);
    setFeedback("");
    setLastFailedQuestion("");

    const requestId = ++askRequestRef.current;
    const requestController = new AbortController();
    askAbortRef.current?.abort();
    askAbortRef.current = requestController;
    let result: Awaited<ReturnType<typeof askArchivistAi>>;

    try {
      result = await askArchivistAi({
        question: cleanQuestion,
        contextDocuments,
        mode,
        topicMemory,
        runtimeSummary,
        allowActions: isAdmin,
        signal: requestController.signal,
      });
    } catch {
      if (requestId !== askRequestRef.current) return;
      const message = "No se pudo consultar al Archivista. El borrador pendiente sigue intacto.";
      setFeedback(message);
      setLastFailedQuestion(cleanQuestion);
      setMessages((current) =>
        appendChatMessages(current, {
          id: createMessageId("assistant"),
          role: "assistant",
          text: message,
          tone: "warning",
        })
      );
      return;
    } finally {
      if (requestId === askRequestRef.current) {
        askAbortRef.current = null;
        setIsAsking(false);
      }
    }

    if (requestId !== askRequestRef.current) return;

    if (result.status === "error") {
      setFeedback(result.message);
      setLastFailedQuestion(cleanQuestion);
      setMessages((current) =>
        appendChatMessages(current, {
          id: createMessageId("assistant"),
          role: "assistant",
          text: result.message,
          tone: "warning",
        })
      );
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

    setMessages((current) =>
      appendChatMessages(current, {
        id: createMessageId("assistant"),
        role: "assistant",
        text: result.answer,
        cards,
        notes: result.notes,
        sources:
          result.intent === "answer" || result.intent === "recommendation"
            ? result.sources
            : [],
        actionDraft: isAdmin ? actionDraft ?? null : null,
        followUpQuestion: result.followUpQuestion,
        hideSources: isAdmin && isPlayerGoldQuestion(cleanQuestion),
        tone:
          result.intent === "clarify"
            ? "warning"
            : result.intent === "admin_action"
              ? "success"
              : "default",
      })
    );
  }

  function handleResetConversation() {
    if (isExecuting) return;
    askRequestRef.current += 1;
    askAbortRef.current?.abort();
    askAbortRef.current = null;
    setIsAsking(false);
    shouldStickToBottomRef.current = true;
    setMessages([buildWelcomeMessage(isAdmin)]);
    setPendingAction(null);
    setAttachedImage(null);
    setLastFailedQuestion("");
    setFeedback("");
    setQuestionValue("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleStopRequest() {
    askAbortRef.current?.abort();
  }

  function handleActionStarter(prompt: string) {
    if (isBusy) return;
    setMode("staff");
    setQuestionValue(prompt);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <section className="space-y-4" aria-label="Archivista de Argentis">
      <div className="kd-glass overflow-hidden rounded-[2rem] border border-cyan-500/15 bg-stone-900/85 shadow-2xl shadow-black/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(115deg,transparent_25%,rgba(245,158,11,0.06)_52%,transparent_72%)]"
        />
        <div className="relative px-5 py-6 md:px-7 md:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <SectionHeader eyebrow="Archivo vivo v2.0" title="Archivista de Argentis" />
              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-400">
                Consulta el canon, cruza el estado actual del reino y prepara operaciones revisables sin perder el control humano.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] ${
                status === "ready"
                  ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                  : status === "loading"
                    ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                    : "border-amber-400/25 bg-amber-500/10 text-amber-200"
              }`}>
                <span className={`h-2 w-2 rounded-full ${status === "ready" ? "bg-emerald-300" : status === "loading" ? "bg-cyan-300 motion-safe:animate-pulse" : "bg-amber-300"}`} />
                {status === "ready" ? "Archivo sincronizado" : status === "loading" ? "Sincronizando" : status === "partial" ? "Archivo parcial" : "Requiere revision"}
              </span>
              {isAdmin ? (
                <span className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] ${
                  canExecuteAdminActions
                    ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
                    : "border-rose-400/20 bg-rose-500/10 text-rose-200"
                }`}>
                  {canExecuteAdminActions ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                  {canExecuteAdminActions ? "Admin vinculado" : "Admin sin vincular"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              { label: "Fuentes IA", value: documents.length, icon: LibraryBig },
              { label: "Conectores", value: `${liveMetrics.readySources}/${liveMetrics.totalSources || 0}`, icon: Database },
              { label: "Eventos activos", value: liveMetrics.activeEvents, icon: Swords },
              { label: "Misiones abiertas", value: liveMetrics.openMissions, icon: ScrollText },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-[1.3rem] border border-white/6 bg-black/20 px-3 py-3 backdrop-blur-sm md:px-4">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  <Icon className="h-3.5 w-3.5 text-cyan-300/75" />
                  {label}
                </div>
                <p className="mt-2 font-serif text-xl font-semibold tabular-nums text-stone-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid items-start gap-4 ${isAdmin ? "xl:grid-cols-[19rem_minmax(0,1fr)]" : ""}`}>
        {isAdmin ? <aside className="order-2 space-y-3 xl:order-1 xl:sticky xl:top-5" aria-label="Controles del Archivista">
          <div className="kd-glass rounded-[1.65rem] border border-cyan-500/12 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Enfoque</p>
                <h2 className="mt-1 text-sm font-semibold text-stone-100">Modo de consulta</h2>
              </div>
              <BrainCircuit className="h-5 w-5 text-cyan-300/70" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
              {availableModes.map((option) => {
                const Icon = option.icon;
                const isActive = mode === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setMode(option.id)}
                    disabled={isBusy}
                    className={`kd-touch flex min-h-14 items-center gap-3 rounded-[1.15rem] border px-3 py-2.5 text-left transition ${
                      isActive
                        ? "border-cyan-300/35 bg-cyan-500/12 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                        : "border-stone-800 bg-stone-950/55 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                    } disabled:cursor-not-allowed disabled:opacity-45`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-cyan-400/15 text-cyan-200" : "bg-stone-900 text-stone-500"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-[0.12em]">{option.label}</span>
                      <span className="mt-0.5 hidden text-[10px] leading-4 text-stone-500 xl:block">{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="kd-glass rounded-[1.65rem] border border-cyan-500/12 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Estado vivo</p>
                <h2 className="mt-1 text-sm font-semibold text-stone-100">Fuentes del reino</h2>
              </div>
              <span className="text-[10px] font-bold tabular-nums text-stone-500">{formatRefreshTime(liveState?.updatedAt)}</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {liveState?.sources.map((source) => (
                <div
                  key={source.id}
                  className="flex min-h-11 items-center gap-3 rounded-xl border border-stone-800/80 bg-stone-950/45 px-3 py-2"
                  title={source.message || undefined}
                  aria-label={`${source.label}: ${sourceStatusLabel(source.status)}, ${source.count} registros${source.message ? `. ${source.message}` : ""}`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${source.status === "ready" ? "bg-emerald-300" : source.status === "fallback" ? "bg-amber-300" : "bg-rose-300"}`} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-stone-300">{source.label}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-stone-500">
                    {source.count} · {sourceStatusLabel(source.status)}
                  </span>
                </div>
              )) ?? (
                <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-stone-800 text-xs text-stone-500">
                  Cargando conectores...
                </div>
              )}
            </div>
          </div>
          <div className="kd-glass rounded-[1.65rem] border border-amber-500/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">Mesa de operaciones</p>
                <h2 className="mt-1 text-sm font-semibold text-stone-100">Acciones guiadas</h2>
              </div>
              <ShieldCheck className="h-5 w-5 text-amber-300/70" />
            </div>
            {!canExecuteAdminActions ? (
              <p className="mt-3 rounded-xl border border-rose-400/15 bg-rose-500/8 px-3 py-2 text-[11px] leading-5 text-rose-100/80">
                Puedes preparar borradores, pero debes vincular la cuenta segura para ejecutarlos.
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-1">
              {ADMIN_ACTION_STARTERS.map(({ label, description, prompt, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleActionStarter(prompt)}
                  disabled={isBusy}
                  className="kd-touch flex min-h-14 items-center gap-3 rounded-[1.1rem] border border-stone-800 bg-stone-950/55 px-3 py-2.5 text-left text-stone-300 transition hover:border-amber-300/25 hover:bg-amber-500/8 hover:text-amber-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Icon className="h-4 w-4 shrink-0 text-amber-300/75" />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.11em]">{label}</span>
                    <span className="mt-0.5 hidden text-[10px] leading-4 text-stone-500 xl:block">{description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside> : null}

      <div className="kd-glass order-1 min-w-0 overflow-hidden rounded-[2rem] border border-cyan-500/12 bg-stone-900/80 shadow-2xl shadow-black/35 xl:order-2">
        <div className="border-b border-stone-800/80 px-4 py-4 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Camara de consulta</p>
                <h2 className="mt-1 truncate text-sm font-semibold text-stone-100">Conversacion activa</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAsking ? (
                <button
                  type="button"
                  onClick={handleStopRequest}
                  className="kd-touch inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-500/15"
                >
                  <CircleStop className="h-4 w-4" />
                  <span className="hidden sm:inline">Detener</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleResetConversation}
                disabled={isExecuting}
                aria-label="Iniciar una nueva consulta"
                className="kd-touch inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-stone-700 bg-stone-950/65 text-stone-400 transition hover:border-cyan-300/25 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void loadArchivistBootstrap({ silent: true })}
                disabled={isRefreshing || isBusy}
                aria-label="Sincronizar las fuentes del Archivista"
                className="kd-touch inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-stone-700 bg-stone-950/65 text-stone-400 transition hover:border-cyan-300/25 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "motion-safe:animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-x-visible [&::-webkit-scrollbar]:hidden" aria-label="Consultas sugeridas">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void handleAsk(prompt)}
                disabled={isBusy || status === "loading"}
                className="kd-touch min-h-[52px] shrink-0 rounded-full border border-stone-700 bg-stone-950/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-300 transition hover:border-cyan-300/30 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
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
              role="log"
              aria-live="polite"
              aria-busy={isBusy}
              onScroll={(event) => {
                const node = event.currentTarget;
                shouldStickToBottomRef.current =
                  node.scrollHeight - node.scrollTop - node.clientHeight < 160;
              }}
              className="flex max-h-[58vh] min-h-[22rem] flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-gutter:stable] md:max-h-[68vh] md:min-h-[30rem] md:px-4"
            >
              {messages.map((message) => {
                const isUser = message.role === "user";
                const actionPreview = message.actionDraft
                  ? getActionPayloadPreview(message.actionDraft)
                  : [];

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
                        <div className={`mt-3 rounded-[1.2rem] border p-3 ${isDestructiveAction(message.actionDraft) ? "border-rose-400/20 bg-rose-500/10" : "border-amber-400/20 bg-amber-500/10"}`}>
                          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] ${isDestructiveAction(message.actionDraft) ? "text-rose-200" : "text-amber-200"}`}>
                            {isDestructiveAction(message.actionDraft) ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Vista previa de accion
                          </div>
                          <p className="mt-2 text-sm font-semibold text-stone-50">
                            {message.actionDraft.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-stone-300">
                            {message.actionDraft.confirmationPrompt}
                          </p>
                          {actionPreview.length > 0 ? (
                            <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
                              {actionPreview.map((entry) => (
                                <div key={entry.key} className="rounded-xl border border-black/20 bg-black/15 px-2.5 py-2">
                                  <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500">{entry.label}</dt>
                                  <dd className="mt-1 break-words text-[11px] leading-4 text-stone-200">{entry.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                        </div>
                      ) : null}

                      {message.followUpQuestion ? (
                        <button
                          type="button"
                          onClick={() => void handleAsk(message.followUpQuestion)}
                          disabled={isBusy}
                          className="kd-touch mt-3 inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/8 px-3 text-left text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/12 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          {message.followUpQuestion}
                        </button>
                      ) : null}

                      {message.sources?.length && !message.hideSources ? (
                        <div className="mt-3 flex flex-wrap gap-2" aria-label="Fuentes consultadas">
                          {message.sources.slice(0, 4).map((source) => (
                            <span
                              key={`${message.id}-${source.title}`}
                              title={[source.type, source.category].filter(Boolean).join(" | ")}
                              className="rounded-full border border-stone-700 bg-stone-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400"
                            >
                              {source.title}
                            </span>
                          ))}
                          {message.sources.length > 4 ? (
                            <span className="rounded-full border border-stone-800 bg-stone-950/45 px-2.5 py-1 text-[10px] font-bold text-stone-500">
                              +{message.sources.length - 4}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}

              {isBusy ? (
                <article className="mr-auto md:max-w-[84%]">
                  <div className="flex items-center gap-3 rounded-[1.4rem] border border-stone-800 bg-stone-950/60 px-4 py-3 shadow-sm">
                    {isExecuting ? (
                      <Loader2 className="h-3.5 w-3.5 text-amber-300 motion-safe:animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-cyan-300 motion-safe:animate-pulse" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                      {isExecuting ? "Archivista ejecutando" : "Archivista analizando"}
                    </span>
                    <div className="ml-1 flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/50 motion-safe:animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/50 motion-safe:animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/50 motion-safe:animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </article>
              ) : null}
            </div>

            <div className="border-t border-stone-800 bg-stone-950/45 px-3 py-3 md:px-4">
              {pendingAction ? (
                <div className={`mb-3 rounded-[1.35rem] border p-3.5 ${isDestructiveAction(pendingAction) ? "border-rose-400/25 bg-rose-500/10" : "border-amber-400/20 bg-amber-500/10"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] ${isDestructiveAction(pendingAction) ? "text-rose-200" : "text-amber-200"}`}>
                        {isDestructiveAction(pendingAction) ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Revision obligatoria
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-50">
                        {pendingAction.label}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-stone-300">
                      Borrador, no ejecutado
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-stone-300">
                    {pendingAction.confirmationPrompt}
                  </p>
                  {pendingActionPreview.length > 0 ? (
                    <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {pendingActionPreview.map((entry) => (
                        <div key={entry.key} className="rounded-xl border border-black/20 bg-black/15 px-2.5 py-2">
                          <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500">{entry.label}</dt>
                          <dd className="mt-1 break-words text-[11px] leading-4 text-stone-200">{entry.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleConfirmAction("no")}
                      disabled={isBusy}
                      className="kd-touch inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-950/60 px-3 text-xs font-bold uppercase tracking-[0.12em] text-stone-300 transition hover:border-stone-600 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmAction("si")}
                      disabled={isBusy || !canExecuteAdminActions}
                      title={!canExecuteAdminActions ? "Vincula primero la cuenta admin a la sesion segura." : undefined}
                      className={`kd-touch inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-45 ${isDestructiveAction(pendingAction) ? "bg-rose-400 text-stone-950 hover:bg-rose-300" : "bg-amber-300 text-stone-950 hover:bg-amber-200"}`}
                    >
                      {isDestructiveAction(pendingAction) ? <Trash2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      {isDestructiveAction(pendingAction) ? "Eliminar" : "Confirmar"}
                    </button>
                  </div>
                </div>
              ) : null}

              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAsk();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.nativeEvent.isComposing) {
                      event.preventDefault();
                    }
                  }}
                  maxLength={MAX_QUESTION_LENGTH}
                  aria-label="Escribe una consulta para el Archivista"
                  disabled={isExecuting || status === "loading"}
                  placeholder={
                    pendingAction
                      ? "Si, no, o agrega un dato para ajustar el borrador..."
                      : "Pregunta por lore, mercado, eventos, misiones o magia..."
                  }
                  className="min-h-[52px] min-w-0 flex-1 rounded-[1.25rem] border border-stone-700 bg-stone-950/85 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-cyan-300/45 disabled:cursor-not-allowed disabled:opacity-55"
                />
                <button
                  type="submit"
                  disabled={isBusy || status === "loading"}
                  aria-label="Enviar consulta"
                  className="kd-touch inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[1.25rem] bg-cyan-400 text-stone-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
                {isAdmin ? (
                  <label
                    aria-label="Adjuntar una imagen al proximo borrador"
                    title="Adjuntar imagen (maximo 1.5 MB)"
                    className="kd-touch inline-flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[1.25rem] border border-stone-700 bg-stone-950/80 text-stone-300 transition hover:border-amber-300/35 hover:text-amber-100"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isBusy}
                      className="sr-only"
                      onChange={(event) => {
                        void handleAttachImage(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                    <ImagePlus className="h-4.5 w-4.5" />
                  </label>
                ) : null}
              </form>

              {feedback ? (
                <div role="status" aria-live="polite" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[1rem] border border-stone-800 bg-stone-950/45 px-3 py-2">
                  <p className="min-w-0 flex-1 text-xs leading-5 text-stone-400">{feedback}</p>
                  {lastFailedQuestion ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionValue(lastFailedQuestion);
                        window.requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                      disabled={isBusy}
                      className="kd-touch min-h-[52px] rounded-xl border border-cyan-400/20 bg-cyan-500/8 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Reintentar
                    </button>
                  ) : null}
                </div>
              ) : null}

              {attachedImage ? (
                <div className="mt-3 flex items-center gap-3 rounded-[1rem] border border-amber-400/20 bg-amber-500/10 p-2.5 text-xs text-amber-100">
                  <img src={attachedImage.dataUrl} alt="Vista previa adjunta" className="h-12 w-12 shrink-0 rounded-xl border border-black/20 object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{attachedImage.name}</span>
                    <span className="mt-0.5 block text-[10px] text-amber-100/60">{Math.ceil(attachedImage.size / 1024).toLocaleString("es-PY")} KB, se usara solo en un borrador compatible</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    aria-label="Quitar imagen adjunta"
                    className="kd-touch inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-amber-300/15 bg-black/15 text-amber-200 transition hover:bg-black/25"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
