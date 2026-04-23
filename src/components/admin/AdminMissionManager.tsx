import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Coins, Flag, Loader2, ScrollText, UserPlus } from "lucide-react";
import type {
  MissionDifficulty,
  MissionStatus,
  MissionType,
  PlayerAccount,
  RealmMission,
  RealmMissionClaim,
  RealmMissionClaimStatus,
} from "../../types";
import {
  claimRealmMission,
  deleteRealmMission,
  fetchAdminRealmMissions,
  fetchMissionClaims,
  getMissionClaimStatusLabel,
  getMissionDifficultyLabel,
  getMissionStatusLabel,
  getMissionTypeLabel,
  markMissionRewardDelivered,
  updateMissionClaimStatus,
  upsertRealmMission,
} from "../../utils/missions";
import { fetchAllPlayers, updatePlayerGold } from "../../utils/players";
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
  const [players, setPlayers] = useState<PlayerAccount[]>([]);
  const [claims, setClaims] = useState<RealmMissionClaim[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [isClaimingPlayer, setIsClaimingPlayer] = useState(false);
  const [isRewardingClaimId, setIsRewardingClaimId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MissionListFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [claimPlayerId, setClaimPlayerId] = useState("");
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
    void loadBaseData();
  }, []);

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === missionId) ?? null,
    [missionId, missions]
  );
  const selectedClaimPlayer = useMemo(
    () => players.find((player) => player.id === claimPlayerId) ?? null,
    [claimPlayerId, players]
  );

  async function loadBaseData() {
    setIsLoading(true);
    const [missionsResult, playersResult] = await Promise.all([
      fetchAdminRealmMissions(),
      fetchAllPlayers(),
    ]);
    setMissions(missionsResult.missions);
    setPlayers(playersResult);
    setFeedback(missionsResult.message);
    setIsLoading(false);
  }

  async function loadClaimsForMission(nextMissionId: string) {
    if (!nextMissionId.trim()) {
      setClaims([]);
      return;
    }

    setIsLoadingClaims(true);
    const result = await fetchMissionClaims(nextMissionId);
    setClaims(result.claims);
    if (result.status === "error") {
      setFeedback(result.message);
    }
    setIsLoadingClaims(false);
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
    setClaimPlayerId("");
    setClaims([]);
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
    setClaimPlayerId("");
    setFeedback("");

    if (mission.id) {
      void loadClaimsForMission(mission.id);
    } else {
      setClaims([]);
    }
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
      const previouslySelectedMissionId = missionId;
      resetForm();
      await loadBaseData();

      if (previouslySelectedMissionId) {
        const reselected = (await fetchAdminRealmMissions()).missions.find(
          (mission) => mission.id === previouslySelectedMissionId
        );

        if (reselected) {
          preloadMission(reselected);
        }
      }
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
      await loadBaseData();
    }
  }

  async function handleAddParticipant() {
    if (!missionId) {
      setFeedback("Guarda primero la mision antes de agregar participantes.");
      return;
    }

    if (!claimPlayerId) {
      setFeedback("Selecciona un jugador para asignarlo a la mision.");
      return;
    }

    setIsClaimingPlayer(true);
    setFeedback("");

    const result = await claimRealmMission(missionId, claimPlayerId);

    setIsClaimingPlayer(false);
    setFeedback(result.message);

    if (result.status === "claimed" || result.status === "exists") {
      setClaimPlayerId("");
      await loadClaimsForMission(missionId);
    }
  }

  async function handleSetClaimStatus(
    claim: RealmMissionClaim,
    nextStatus: RealmMissionClaimStatus
  ) {
    if (claim.status === nextStatus) {
      return;
    }

    const result = await updateMissionClaimStatus(claim.id, nextStatus);
    setFeedback(result.message);

    if (result.status === "saved") {
      await loadClaimsForMission(claim.missionId);
    }
  }

  async function handleDeliverReward(claim: RealmMissionClaim) {
    if (!selectedMission) {
      setFeedback("Selecciona la mision antes de entregar recompensa.");
      return;
    }

    if (claim.rewardDelivered) {
      setFeedback("La recompensa de este participante ya fue entregada.");
      return;
    }

    const shouldDeliver = window.confirm(
      `Entregar ${selectedMission.rewardGold} de oro a ${claim.playerName}?`
    );

    if (!shouldDeliver) {
      return;
    }

    setIsRewardingClaimId(claim.id);
    setFeedback("");

    const refreshedPlayers = await fetchAllPlayers();
    setPlayers(refreshedPlayers);
    const currentPlayer = refreshedPlayers.find(
      (player) => player.id === claim.playerId
    );

    if (!currentPlayer) {
      setIsRewardingClaimId("");
      setFeedback("No se encontro al jugador para entregar la recompensa.");
      return;
    }

    const updated = await updatePlayerGold(
      currentPlayer.id,
      currentPlayer.gold + selectedMission.rewardGold
    );

    if (!updated) {
      setIsRewardingClaimId("");
      setFeedback("No se pudo actualizar el oro del jugador.");
      return;
    }

    const markResult = await markMissionRewardDelivered(claim.id);
    setIsRewardingClaimId("");
    setFeedback(markResult.message);

    await loadClaimsForMission(claim.missionId);
    setPlayers(await fetchAllPlayers());
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
                className={`w-full rounded-[1.2rem] border px-4 py-3 text-left transition ${
                  mission.id === missionId
                    ? "border-amber-500/35 bg-stone-900"
                    : "border-stone-800 bg-stone-950/50 hover:border-amber-500/20 hover:bg-stone-900"
                }`}
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

        {selectedMission ? (
          <div className="mt-5 rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                  Participantes
                </p>
                <p className="mt-1 text-sm font-bold text-stone-100">
                  {selectedMission.title}
                </p>
              </div>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-200">
                Premio {selectedMission.rewardGold}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-200">
                  Agregar jugador
                </span>
                <select
                  value={claimPlayerId}
                  onChange={(event) => setClaimPlayerId(event.target.value)}
                  className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                >
                  <option value="">Selecciona jugador</option>
                  {players.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.username}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void handleAddParticipant()}
                disabled={isClaimingPlayer || !claimPlayerId}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
              >
                {isClaimingPlayer ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Anadir
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {isLoadingClaims ? (
                <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950/45 px-4 py-3 text-sm text-stone-400">
                  Cargando participantes...
                </div>
              ) : claims.length === 0 ? (
                <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
                  Aun no hay jugadores asignados a esta mision.
                </div>
              ) : (
                claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="rounded-[1.2rem] border border-stone-800 bg-stone-900/55 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-stone-100">
                          {claim.playerName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                          Oro actual: {claim.playerGold}
                        </p>
                      </div>
                      <span className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300">
                        {getMissionClaimStatusLabel(claim.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSetClaimStatus(claim, "claimed")}
                        className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                          claim.status === "claimed"
                            ? "border border-stone-600 bg-stone-800 text-stone-100"
                            : "border border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-500"
                        }`}
                      >
                        Tomada
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSetClaimStatus(claim, "completed")}
                        className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                          claim.status === "completed"
                            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                            : "border border-stone-700 bg-stone-900 text-stone-300 hover:border-emerald-500/30"
                        }`}
                      >
                        Completada
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeliverReward(claim)}
                        disabled={
                          claim.rewardDelivered || isRewardingClaimId === claim.id
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/12 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {isRewardingClaimId === claim.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Pagando...
                          </>
                        ) : (
                          <>
                            <Coins className="h-3.5 w-3.5" />
                            {claim.rewardDelivered ? "Pagada" : "Entregar"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
