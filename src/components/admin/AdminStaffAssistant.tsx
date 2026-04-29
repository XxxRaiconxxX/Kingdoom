import { useState } from "react";
import type { FormEvent } from "react";
import { ClipboardCheck, Loader2, Sparkles } from "lucide-react";
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

const difficultyLabels: Record<StaffAdvisorResult["recommendedDifficulty"], string> = {
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
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
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

          <LabeledInput
            label="Titulo"
            value={title}
            onChange={setTitle}
            placeholder="Nombre de mision, evento o decision"
          />
          <LabeledTextArea
            label="Descripcion"
            value={description}
            onChange={setDescription}
            placeholder="Contexto, objetivo y lo que debe resolver el staff"
            rows={5}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <NumericInput
              label="Participantes"
              value={participants}
              onChange={setParticipants}
            />
            <LabeledInput
              label="Dificultad"
              value={difficulty}
              onChange={setDifficulty}
              placeholder="Facil, media..."
            />
            <NumericInput
              label="Oro propuesto"
              value={rewardGold}
              onChange={setRewardGold}
            />
          </div>
          <LabeledTextArea
            label="Condiciones"
            value={constraints}
            onChange={setConstraints}
            placeholder="Fechas, pruebas, limites, facciones o riesgos"
            rows={3}
          />

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
              title="Sin analisis"
              message="Carga una situacion y pide una recomendacion."
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
