import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Flag, Loader2, ScrollText } from "lucide-react";
import type {
  MissionDifficulty,
  MissionStatus,
  MissionType,
  RealmMission,
} from "../../types";
import {
  deleteRealmMission,
  fetchAdminRealmMissions,
  getMissionDifficultyLabel,
  getMissionStatusLabel,
  getMissionTypeLabel,
  upsertRealmMission,
} from "../../utils/missions";
import {
  ADMIN_LIST_PREVIEW_COUNT,
  AdminInfoCard,
  AdminModeButton,
  ExpandableListToggle,
  LabeledInput,
  LabeledTextArea,
  NumericInput,
} from "./AdminControlPrimitives";

type MissionListFilter = "all" | MissionStatus;

export function AdminMissionManager() {
  const [missions, setMissions] = useState<RealmMission[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MissionListFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [missionId, setMissionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState(
    "Resolver por rol en WhatsApp. Un admin valida el cierre."
  );
  const [rewardGold, setRewardGold] = useState(0);
  const [difficulty, setDifficulty] = useState<MissionDifficulty>("easy");
  const [type, setType] = useState<MissionType>("story");
  const [status, setStatus] = useState<MissionStatus>("available");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    void loadMissions();
  }, []);

  async function loadMissions() {
    setIsLoading(true);
    const result = await fetchAdminRealmMissions();
    setMissions(result.missions);
    setFeedback(result.message);
    setIsLoading(false);
  }

  const filteredMissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return missions.filter((mission) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : mission.title.toLowerCase().includes(normalizedSearch);
      const matchesFilter = filter === "all" ? true : mission.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [filter, missions, search]);

  const visibleMissions = useMemo(
    () =>
      showAll
        ? filteredMissions
        : filteredMissions.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredMissions, showAll]
  );

  useEffect(() => {
    setShowAll(false);
  }, [filter, search]);

  function resetForm() {
    setMissionId("");
    setTitle("");
    setDescription("");
    setInstructions("Resolver por rol en WhatsApp. Un admin valida el cierre.");
    setRewardGold(0);
    setDifficulty("easy");
    setType("story");
    setStatus("available");
    setVisible(true);
    setFeedback("");
  }

  function preloadMission(mission: RealmMission) {
    setMissionId(mission.id ?? "");
    setTitle(mission.title);
    setDescription(mission.description);
    setInstructions(mission.instructions);
    setRewardGold(mission.rewardGold);
    setDifficulty(mission.difficulty);
    setType(mission.type);
    setStatus(mission.status);
    setVisible(mission.visible);
    setFeedback("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    const result = await upsertRealmMission({
      id: missionId || undefined,
      title,
      description,
      instructions,
      rewardGold,
      difficulty,
      type,
      status,
      visible,
    });

    setIsSaving(false);
    setFeedback(result.message);

    if (result.status === "saved") {
      resetForm();
      await loadMissions();
    }
  }

  async function handleDelete() {
    if (!missionId) {
      setFeedback("Selecciona una mision antes de intentar borrarla.");
      return;
    }

    const shouldDelete = window.confirm(
      `Seguro que quieres borrar "${title}"? Esta accion no se puede deshacer.`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setFeedback("");

    const result = await deleteRealmMission(missionId);

    setIsDeleting(false);
    setFeedback(result.message);

    if (result.status === "deleted") {
      resetForm();
      await loadMissions();
    }
  }

  if (isLoading) {
    return (
      <AdminInfoCard
        title="Cargando misiones"
        message="Leyendo encargos del reino."
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Rol por WhatsApp
            </p>
            <h4 className="mt-1 text-xl font-black text-stone-100">
              Crear o editar mision
            </h4>
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSave}>
          <LabeledInput
            label="Titulo"
            value={title}
            onChange={setTitle}
            placeholder="Caza en la frontera"
          />
          <LabeledTextArea
            label="Descripcion"
            value={description}
            onChange={setDescription}
            placeholder="Que debe resolver el jugador"
          />
          <LabeledTextArea
            label="Indicaciones"
            value={instructions}
            onChange={setInstructions}
            placeholder="Como se valida por WhatsApp"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">Tipo</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as MissionType)}
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                <option value="story">Historia</option>
                <option value="hunt">Caceria</option>
                <option value="escort">Escolta</option>
                <option value="investigation">Investigacion</option>
                <option value="event">Evento</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">
                Dificultad
              </span>
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as MissionDifficulty)
                }
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                <option value="easy">Facil</option>
                <option value="medium">Media</option>
                <option value="hard">Dificil</option>
                <option value="elite">Elite</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">Estado</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as MissionStatus)
                }
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                <option value="available">Disponible</option>
                <option value="in-progress">En curso</option>
                <option value="closed">Cerrada</option>
              </select>
            </label>
            <NumericInput
              label="Recompensa (oro)"
              value={rewardGold}
              onChange={setRewardGold}
            />
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-200">Visible</p>
            </div>
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
              className="h-4 w-4 rounded border-stone-600 bg-stone-950 text-amber-400"
            />
          </label>

          <div className="sticky bottom-0 z-10 -mx-1 mt-4 grid gap-3 rounded-[1.3rem] border border-stone-800 bg-stone-950/90 p-2 shadow-2xl shadow-black/40 backdrop-blur sm:flex sm:flex-wrap sm:items-center">
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  {missionId ? "Actualizar mision" : "Crear mision"}
                </>
              )}
            </button>
            {missionId ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={isDeleting}
                className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
              >
                Cancelar
              </button>
            ) : null}
            {missionId ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSaving || isDeleting}
                className="w-full rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isDeleting ? "Borrando..." : "Borrar"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetForm}
              disabled={isDeleting}
              className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
            >
              Limpiar
            </button>
          </div>

          {feedback ? (
            <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
              {feedback}
            </p>
          ) : null}
        </form>
      </section>

      <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Tablero publico
            </p>
            <h4 className="mt-1 text-xl font-black text-stone-100">
              Misiones del reino
            </h4>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <LabeledInput
            label="Buscar mision"
            value={search}
            onChange={setSearch}
            placeholder="Filtra por titulo"
          />
          <div className="space-y-2 min-w-0 max-w-full">
            <span className="text-sm font-semibold text-stone-200">Estado</span>
            <div className="flex w-full max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex-shrink-0">
                <AdminModeButton
                  label="Todas"
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                />
              </div>
              <div className="flex-shrink-0">
                <AdminModeButton
                  label="Disponibles"
                  active={filter === "available"}
                  onClick={() => setFilter("available")}
                />
              </div>
              <div className="flex-shrink-0">
                <AdminModeButton
                  label="En curso"
                  active={filter === "in-progress"}
                  onClick={() => setFilter("in-progress")}
                />
              </div>
              <div className="flex-shrink-0">
                <AdminModeButton
                  label="Cerradas"
                  active={filter === "closed"}
                  onClick={() => setFilter("closed")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredMissions.length > 0 ? (
            visibleMissions.map((mission) => (
              <button
                key={mission.id ?? mission.title}
                type="button"
                onClick={() => preloadMission(mission)}
                className="w-full rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-100">
                      {mission.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                      {getMissionTypeLabel(mission.type)} -{" "}
                      {getMissionDifficultyLabel(mission.difficulty)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-amber-300">
                      {mission.rewardGold}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                      oro
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300">
                    {getMissionStatusLabel(mission.status)}
                  </span>
                  {!mission.visible ? (
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-200">
                      Oculta
                    </span>
                  ) : null}
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
              No se encontraron misiones para ese filtro.
            </div>
          )}
          <ExpandableListToggle
            shownCount={visibleMissions.length}
            totalCount={filteredMissions.length}
            expanded={showAll}
            onToggle={() => setShowAll((current) => !current)}
            itemLabel="misiones"
          />
        </div>
      </section>
    </div>
  );
}
