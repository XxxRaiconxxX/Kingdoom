import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ClipboardCheck,
  Coins,
  Loader2,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  AdminAiDebugCard,
  AdminInfoCard,
  AdminModeButton,
  LabeledInput,
  LabeledTextArea,
  NumericInput,
} from "./AdminControlPrimitives";
import type { AiDebugInfo } from "../../utils/aiDebug";
import {
  requestStaffAdvice,
  type StaffAdvisorResult,
  type StaffAdvisorTaskType,
} from "../../utils/staffAi";

const taskOptions: Array<{ value: StaffAdvisorTaskType; label: string }> = [
  { value: "mission", label: "Mision" },
  { value: "event", label: "Evento" },
  { value: "reward", label: "Recompensa" },
  { value: "lore", label: "Lore" },
  { value: "market", label: "Mercado" },
  { value: "general", label: "General" },
];

const taskTypeCopy: Record<
  StaffAdvisorTaskType,
  {
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    constraintsPlaceholder: string;
    helper: string;
    checklist: string[];
  }
> = {
  mission: {
    titleLabel: "Nombre de la mision",
    titlePlaceholder: "Ej: Frontera en llamas",
    descriptionLabel: "Que debe pasar",
    descriptionPlaceholder:
      "Resume objetivo, zona, amenaza, que deben hacer los jugadores y que valida el staff.",
    constraintsPlaceholder:
      "Pruebas requeridas, limite de tiempo, facciones, condiciones de exito o fallo",
    helper:
      "Usalo para revisar cupos, recompensa, dificultad y claridad antes de publicar una mision.",
    checklist: [
      "Nombra el objetivo principal.",
      "Aclara que debe entregar el jugador.",
      "Define si es individual o grupal.",
    ],
  },
  event: {
    titleLabel: "Nombre del evento",
    titlePlaceholder: "Ej: Eclipse sobre Vyralis",
    descriptionLabel: "Que ocurrira",
    descriptionPlaceholder:
      "Explica el evento, quienes participan, su impacto en el reino y que espera el staff al cierre.",
    constraintsPlaceholder:
      "Fecha de inicio/cierre, reglas de salida, evidencias, recompensa grupal, facciones",
    helper:
      "Ideal para ordenar eventos grandes y dejar claro cupo, riesgo, recompensa y validacion final.",
    checklist: [
      "Marca si se puede entrar o salir.",
      "Aclara el premio grupal.",
      "Define como se cierra y quien valida.",
    ],
  },
  reward: {
    titleLabel: "Que recompensa revisas",
    titlePlaceholder: "Ej: Pago por mision de rango medio",
    descriptionLabel: "Por que se dara",
    descriptionPlaceholder:
      "Cuenta que logro el jugador o grupo y por que el staff quiere premiarlo.",
    constraintsPlaceholder:
      "Limites, antecedentes, si hubo riesgo real, tiempo invertido o apoyo del grupo",
    helper:
      "Sirve para revisar si una recompensa de oro o dificultad esta pasada, corta o justa.",
    checklist: [
      "Explica el merito real.",
      "Aclara si es individual o compartido.",
      "Marca si debe repetirse o es unico.",
    ],
  },
  lore: {
    titleLabel: "Tema del lore",
    titlePlaceholder: "Ej: Juramento de los vigias del norte",
    descriptionLabel: "Que quieres validar",
    descriptionPlaceholder:
      "Resume la idea narrativa, su impacto y donde encaja dentro del canon actual.",
    constraintsPlaceholder:
      "Conflictos de canon, fuentes, facciones implicadas, riesgos de incoherencia",
    helper:
      "Pensado para revisar coherencia, impacto en el mundo y riesgos de contradiccion narrativa.",
    checklist: [
      "Menciona la faccion o zona implicada.",
      "Aclara si cambia canon o solo amplia.",
      "Indica si necesita revision humana extra.",
    ],
  },
  market: {
    titleLabel: "Item o decision del mercado",
    titlePlaceholder: "Ej: Espada del Umbral",
    descriptionLabel: "Que se quiere evaluar",
    descriptionPlaceholder:
      "Describe el item, utilidad, rareza, impacto en juego o economia y por que necesita revision.",
    constraintsPlaceholder:
      "Disponibilidad, rareza, limite por jugador, sinergias, riesgo de abuso",
    helper:
      "Util para revisar precio, impacto economico y si un item esta fuerte, flojo o sano.",
    checklist: [
      "Explica para que sirve.",
      "Aclara rareza o acceso.",
      "Marca si afecta combate o economia.",
    ],
  },
  general: {
    titleLabel: "Decision a revisar",
    titlePlaceholder: "Ej: Ajuste de actividad semanal",
    descriptionLabel: "Contexto",
    descriptionPlaceholder:
      "Resume la situacion, que necesita decidir el staff y por que ahora.",
    constraintsPlaceholder:
      "Limites, riesgos, jugadores implicados, fechas, impacto esperado",
    helper:
      "Modo libre para dudas operativas del staff cuando no encajan en una sola categoria.",
    checklist: [
      "Cuenta que problema quieres resolver.",
      "Aclara a quienes afecta.",
      "Marca si buscas oro, cupos, dificultad o coherencia.",
    ],
  },
};

const difficultyLabels: Record<
  StaffAdvisorResult["recommendedDifficulty"],
  string
> = {
  easy: "Facil",
  medium: "Media",
  hard: "Dificil",
  elite: "Elite",
};

const riskLabels: Record<StaffAdvisorResult["riskLevel"], string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

export default function AdminStaffAssistant() {
  const [taskType, setTaskType] = useState<StaffAdvisorTaskType>("mission");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState(1);
  const [difficulty, setDifficulty] = useState("");
  const [rewardGold, setRewardGold] = useState(0);
  const [constraints, setConstraints] = useState("");
  const [result, setResult] = useState<StaffAdvisorResult | null>(null);
  const [debug, setDebug] = useState<AiDebugInfo | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentCopy = taskTypeCopy[taskType];

  function applyQuickPreset(preset: "low" | "mid" | "high") {
    if (preset === "low") {
      setParticipants(1);
      setDifficulty("Facil");
      setRewardGold(300);
      return;
    }

    if (preset === "mid") {
      setParticipants(2);
      setDifficulty("Media");
      setRewardGold(900);
      return;
    }

    setParticipants(4);
    setDifficulty("Dificil");
    setRewardGold(1800);
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() && !description.trim()) {
      setFeedback("Describe lo que quieres revisar.");
      return;
    }

    setIsLoading(true);
    setFeedback("");
    setDebug(null);

    const response = await requestStaffAdvice({
      taskType,
      title,
      description,
      participants,
      difficulty,
      rewardGold,
      constraints,
      includeDebug: true,
    });

    setIsLoading(false);

    if (response.status === "error") {
      setResult(null);
      setFeedback(response.message);
      setDebug(response.debug ?? null);
      return;
    }

    setResult(response.result);
    setDebug(response.debug ?? null);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
      <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-stone-500">
              Asistente operativo
            </p>
            <h3 className="font-serif text-2xl font-bold text-stone-100">
              Staff IA
            </h3>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="mt-5 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {taskOptions.map((option) => (
              <AdminModeButton
                key={option.value}
                label={option.label}
                active={taskType === option.value}
                onClick={() => setTaskType(option.value)}
              />
            ))}
          </div>

          <div className="rounded-[1.4rem] border border-cyan-500/15 bg-cyan-500/7 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-cyan-500/12 p-2.5 text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Como usarlo
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-200">
                  {currentCopy.helper}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentCopy.checklist.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-cyan-400/15 bg-stone-950/45 px-2.5 py-1 text-[11px] font-bold text-cyan-100/90"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
              1. Que quieres revisar
            </p>
            <div className="mt-3 space-y-4">
              <LabeledInput
                label={currentCopy.titleLabel}
                value={title}
                onChange={setTitle}
                placeholder={currentCopy.titlePlaceholder}
              />
              <LabeledTextArea
                label={currentCopy.descriptionLabel}
                value={description}
                onChange={setDescription}
                placeholder={currentCopy.descriptionPlaceholder}
                rows={5}
              />
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
                2. Parametros de trabajo
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyQuickPreset("low")}
                  className="kd-touch rounded-full border border-stone-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-300 transition hover:border-amber-400/30 hover:text-stone-100"
                >
                  Base baja
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPreset("mid")}
                  className="kd-touch rounded-full border border-stone-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-300 transition hover:border-amber-400/30 hover:text-stone-100"
                >
                  Base media
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPreset("high")}
                  className="kd-touch rounded-full border border-stone-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-300 transition hover:border-amber-400/30 hover:text-stone-100"
                >
                  Base alta
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <NumericInput
                label="Participantes previstos"
                value={participants}
                onChange={setParticipants}
              />
              <LabeledInput
                label="Dificultad actual"
                value={difficulty}
                onChange={setDifficulty}
                placeholder="Facil, media, dificil..."
              />
              <NumericInput
                label="Oro que pensabas dar"
                value={rewardGold}
                onChange={setRewardGold}
              />
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
              3. Limites o condiciones
            </p>
            <div className="mt-3">
              <LabeledTextArea
                label="Que debe respetar el staff"
                value={constraints}
                onChange={setConstraints}
                placeholder={currentCopy.constraintsPlaceholder}
                rows={3}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <QuickInfoCard
              icon={<Users className="h-4 w-4" />}
              label="Participantes"
              value={`${participants}`}
            />
            <QuickInfoCard
              icon={<ScrollText className="h-4 w-4" />}
              label="Dificultad"
              value={difficulty.trim() || "Sin marcar"}
            />
            <QuickInfoCard
              icon={<Coins className="h-4 w-4" />}
              label="Oro"
              value={rewardGold > 0 ? rewardGold.toLocaleString("es-PY") : "0"}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              Analizar
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setDescription("");
                setParticipants(1);
                setDifficulty("");
                setRewardGold(0);
                setConstraints("");
                setResult(null);
                setFeedback("");
                setDebug(null);
              }}
              className="kd-touch rounded-2xl border border-stone-700 px-5 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
            >
              Limpiar
            </button>
          </div>
        </form>

        {feedback ? (
          <p className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/8 px-4 py-3 text-sm leading-6 text-amber-100/85">
            {feedback}
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-stone-500">
              Dictamen
            </p>
            <h3 className="font-serif text-2xl font-bold text-stone-100">
              Recomendacion
            </h3>
          </div>
        </div>

        {!result ? (
          <div className="mt-5">
            <AdminInfoCard
              title="Esperando consulta"
              message="Completa los tres pasos de la izquierda y el asistente te dira si el planteo esta sano, cuanto conviene pagar y que revisar antes de aprobar."
            />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4">
              <p className="text-sm leading-6 text-stone-200">{result.summary}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Metric label="Riesgo" value={riskLabels[result.riskLevel]} />
                <Metric
                  label="Dificultad"
                  value={difficultyLabels[result.recommendedDifficulty]}
                />
                <Metric
                  label="Oro"
                  value={result.recommendedRewardGold.toLocaleString("es-PY")}
                />
              </div>
              <Metric
                className="mt-2"
                label="Cupos"
                value={`${result.recommendedParticipants.min}-${result.recommendedParticipants.max}`}
              />
            </div>

            <ResultList title="Validacion" items={result.validationChecklist} />
            <ResultList title="Notas staff" items={result.staffNotes} />
            {result.playerFacingBrief ? (
              <div className="rounded-[1.4rem] border border-amber-500/15 bg-amber-500/8 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  Texto publicable
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-50/90">
                  {result.playerFacingBrief}
                </p>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-4">
          <AdminAiDebugCard debug={debug} />
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-stone-800 bg-stone-950/55 px-4 py-3 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-stone-100">{value}</p>
    </div>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p
            key={item}
            className="rounded-xl border border-stone-800 bg-stone-900/55 px-3 py-2 text-sm leading-5 text-stone-300"
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function QuickInfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950/40 p-3">
      <div className="flex items-center gap-2 text-stone-500">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm font-bold text-stone-100">{value}</p>
    </div>
  );
}
