import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Crown,
  Flag,
  Loader2,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Swords,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { ADMIN_WEEKLY_TEMPLATES } from "../data/adminTemplates";
import { fetchRealmEvents, upsertRealmEvent } from "../utils/events";
import {
  createPlayerAccount,
  fetchAllPlayers,
  updatePlayerGold,
} from "../utils/players";
import {
  fetchAdminWeeklyRankingRows,
  seedCurrentWeeklyRanking,
  upsertAdminWeeklyRankingEntry,
} from "../utils/adminRanking";
import { formatRankingWindow } from "../utils/weeklyRanking";
import type { EventStatus, PlayerAccount, RankingPlayer, RealmEvent } from "../types";

type AdminTab = "overview" | "activity" | "players" | "events" | "templates";
type GoldAdjustmentMode = "add" | "subtract" | "set";

export function AdminControlSheet({ onClose }: { onClose: () => void }) {
  const { player, refreshPlayer } = usePlayerSession();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [players, setPlayers] = useState<PlayerAccount[]>([]);
  const [rankingRows, setRankingRows] = useState<RankingPlayer[]>([]);
  const [rankingMessage, setRankingMessage] = useState("");
  const [windowLabel, setWindowLabel] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );
  const [formPlayerId, setFormPlayerId] = useState("");
  const [formFaction, setFormFaction] = useState("");
  const [formStatus, setFormStatus] = useState<RankingPlayer["status"]>("alive");
  const [formPoints, setFormPoints] = useState(0);
  const [formMissions, setFormMissions] = useState(0);
  const [formEvents, setFormEvents] = useState(0);
  const [formStreak, setFormStreak] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSeedingWeek, setIsSeedingWeek] = useState(false);
  const [playerFeedback, setPlayerFeedback] = useState("");
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [isUpdatingGold, setIsUpdatingGold] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newGold, setNewGold] = useState(0);
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [goldPlayerId, setGoldPlayerId] = useState("");
  const [goldMode, setGoldMode] = useState<GoldAdjustmentMode>("add");
  const [goldAmount, setGoldAmount] = useState(0);
  const [events, setEvents] = useState<RealmEvent[]>([]);
  const [eventFeedback, setEventFeedback] = useState("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventId, setEventId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLongDescription, setEventLongDescription] = useState("");
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventStatus, setEventStatus] = useState<EventStatus>("in-production");
  const [eventFactions, setEventFactions] = useState("");
  const [eventRewards, setEventRewards] = useState("");
  const [eventRequirements, setEventRequirements] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      setStatus("loading");
      const [playersList, rankingResult] = await Promise.all([
        fetchAllPlayers(),
        fetchAdminWeeklyRankingRows(),
      ]);
      const eventsResult = await fetchRealmEvents();

      if (cancelled) {
        return;
      }

      setPlayers(playersList);
      setRankingRows(rankingResult.rows);
      setRankingMessage(rankingResult.message);
      setWindowLabel(formatRankingWindow(rankingResult.window));
      setEvents(eventsResult.events);
      setStatus(rankingResult.status === "ready" ? "ready" : "unavailable");
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadAdminData() {
    setStatus("loading");
    const [playersList, rankingResult] = await Promise.all([
      fetchAllPlayers(),
      fetchAdminWeeklyRankingRows(),
    ]);
    const eventsResult = await fetchRealmEvents();

    setPlayers(playersList);
    setRankingRows(rankingResult.rows);
    setRankingMessage(rankingResult.message);
    setWindowLabel(formatRankingWindow(rankingResult.window));
    setEvents(eventsResult.events);
    setStatus(rankingResult.status === "ready" ? "ready" : "unavailable");
  }

  const selectedPlayer = useMemo(
    () => players.find((entry) => entry.id === formPlayerId) ?? null,
    [formPlayerId, players]
  );
  const selectedGoldPlayer = useMemo(
    () => players.find((entry) => entry.id === goldPlayerId) ?? null,
    [goldPlayerId, players]
  );

  function applyTemplate(points: number, missions: number, events: number) {
    setFormPoints(points);
    setFormMissions(missions);
    setFormEvents(events);
  }

  function preloadFromExisting(row: RankingPlayer) {
    const matchingPlayer =
      players.find((entry) => entry.username === row.name) ?? null;

    if (matchingPlayer) {
      setFormPlayerId(matchingPlayer.id);
    }

    setFormFaction(row.faction);
    setFormStatus(row.status);
    setFormPoints(row.activityPoints);
    setFormMissions(row.missionsCompleted);
    setFormEvents(row.eventsJoined);
    setFormStreak(row.streakDays ?? 0);
    setActiveTab("activity");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPlayer) {
      setFeedback("Selecciona un jugador para cargar o actualizar su semana.");
      return;
    }

    setIsSaving(true);
    setFeedback("");

    const result = await upsertAdminWeeklyRankingEntry({
      player: selectedPlayer,
      faction: formFaction.trim() || "Sin faccion",
      status: formStatus,
      activityPoints: formPoints,
      missionsCompleted: formMissions,
      eventsJoined: formEvents,
      streakDays: formStreak,
    });

    setIsSaving(false);
    setFeedback(result.message);

    if (result.status === "saved") {
      await reloadAdminData();
    }
  }

  async function handleSeedWeek() {
    setIsSeedingWeek(true);
    setFeedback("");
    const result = await seedCurrentWeeklyRanking();
    setIsSeedingWeek(false);
    setFeedback(result.message);
    await reloadAdminData();
  }

  async function handleCreatePlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingPlayer(true);
    setPlayerFeedback("");

    const result = await createPlayerAccount({
      username: newUsername,
      gold: newGold,
      isAdmin: newIsAdmin,
    });

    setIsCreatingPlayer(false);
    setPlayerFeedback(result.message);

    if (result.status === "created") {
      setNewUsername("");
      setNewGold(0);
      setNewIsAdmin(false);
      await reloadAdminData();
    }
  }

  async function handleUpdateGold(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedGoldPlayer) {
      setPlayerFeedback("Selecciona un jugador para editar su oro.");
      return;
    }

    const sanitizedAmount = Math.max(0, goldAmount);
    const nextGold =
      goldMode === "set"
        ? sanitizedAmount
        : goldMode === "add"
          ? selectedGoldPlayer.gold + sanitizedAmount
          : Math.max(0, selectedGoldPlayer.gold - sanitizedAmount);

    setIsUpdatingGold(true);
    setPlayerFeedback("");

    const updated = await updatePlayerGold(selectedGoldPlayer.id, nextGold);

    setIsUpdatingGold(false);

    if (!updated) {
      setPlayerFeedback("No se pudo actualizar el oro del jugador.");
      return;
    }

    setPlayerFeedback("Oro actualizado correctamente.");
    await reloadAdminData();

    if (player?.id === selectedGoldPlayer.id) {
      await refreshPlayer();
    }
  }

  function preloadEvent(event: RealmEvent) {
    setEventId(event.id ?? "");
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEventLongDescription(event.longDescription);
    setEventImageUrl(event.imageUrl);
    setEventStartDate(event.startDate);
    setEventEndDate(event.endDate);
    setEventStatus(event.status);
    setEventFactions(event.factions.join(", "));
    setEventRewards(event.rewards);
    setEventRequirements(event.requirements);
    setActiveTab("events");
  }

  function resetEventForm() {
    setEventId("");
    setEventTitle("");
    setEventDescription("");
    setEventLongDescription("");
    setEventImageUrl("");
    setEventStartDate("");
    setEventEndDate("");
    setEventStatus("in-production");
    setEventFactions("");
    setEventRewards("");
    setEventRequirements("");
  }

  async function handleSaveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingEvent(true);
    setEventFeedback("");

    const result = await upsertRealmEvent({
      id: eventId || undefined,
      title: eventTitle,
      description: eventDescription,
      longDescription: eventLongDescription,
      imageUrl: eventImageUrl,
      startDate: eventStartDate,
      endDate: eventEndDate,
      status: eventStatus,
      factions: eventFactions.split(","),
      rewards: eventRewards,
      requirements: eventRequirements,
    });

    setIsSavingEvent(false);
    setEventFeedback(result.message);

    if (result.status === "saved") {
      resetEventForm();
      await reloadAdminData();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/70 px-4 py-4 backdrop-blur-md md:px-6 md:py-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4 md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/75">
              Modo administrador
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-100 md:text-3xl">
              Centro de control del reino
            </h3>
            <p className="mt-2 text-sm text-stone-400">
              Acceso activo para {player?.username ?? "admin"}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-stone-800 px-5 py-4 md:px-6">
          <div className="flex flex-wrap gap-2">
            <AdminTabButton
              label="Resumen"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <AdminTabButton
              label="Actividad"
              active={activeTab === "activity"}
              onClick={() => setActiveTab("activity")}
            />
            <AdminTabButton
              label="Jugadores"
              active={activeTab === "players"}
              onClick={() => setActiveTab("players")}
            />
            <AdminTabButton
              label="Eventos"
              active={activeTab === "events"}
              onClick={() => setActiveTab("events")}
            />
            <AdminTabButton
              label="Plantillas"
              active={activeTab === "templates"}
              onClick={() => setActiveTab("templates")}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {status === "loading" ? (
            <AdminInfoCard
              title="Cargando modo admin"
              message="Leyendo jugadores y temporada semanal actual..."
            />
          ) : null}

          {activeTab === "overview" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Semana activa
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      {windowLabel || "Semana actual"}
                    </h4>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-stone-400">
                  Este panel administra la tabla `weekly_activity_rankings`. Si el
                  jugador conectado es `Nothing` o tiene `is_admin = true`, vera
                  este acceso.
                </p>
                {rankingMessage ? (
                  <p className="mt-4 rounded-[1.2rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
                    {rankingMessage}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSeedWeek()}
                    disabled={isSeedingWeek}
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSeedingWeek ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creando semana...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        Nueva semana
                      </>
                    )}
                  </button>
                  <p className="max-w-md text-sm leading-6 text-stone-400">
                    Clona la ultima temporada con puntos reiniciados. Si no hay
                    historial previo, usa la tabla `players` como base inicial.
                  </p>
                </div>
                <div className="mt-4 rounded-[1.3rem] border border-stone-800 bg-stone-950/50 p-4">
                  <p className="text-sm font-bold text-stone-100">
                    Recomendacion tecnica
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    Cuando puedas, anade `is_admin` a la tabla `players` y marca a
                    `Nothing` con `true`. Mientras tanto, el nombre `Nothing`
                    sigue funcionando como llave visual de admin.
                  </p>
                </div>
              </section>

              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Podio administrable
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Temporada en curso
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {rankingRows.slice(0, 5).map((row, index) => (
                    <button
                      key={`${row.id}-${index}`}
                      type="button"
                      onClick={() => preloadFromExisting(row)}
                      className="flex w-full items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
                    >
                      <div>
                        <p className="text-sm font-bold text-stone-100">
                          #{index + 1} {row.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                          {row.faction}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-300">
                          {row.activityPoints}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                          puntos
                        </p>
                      </div>
                    </button>
                  ))}

                  {rankingRows.length === 0 ? (
                    <AdminInfoCard
                      title="Sin filas semanales"
                      message="Todavia no cargaste jugadores en la tabla semanal actual. Usa la pestana Actividad para crear los primeros registros."
                    />
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "activity" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Swords className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Carga manual
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Subir o ajustar ranking
                    </h4>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleSave}>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-stone-200">
                      Jugador
                    </span>
                    <select
                      value={formPlayerId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        setFormPlayerId(nextId);
                        if (nextId && !formFaction) {
                          setFormFaction("Sin faccion");
                        }
                      }}
                      className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                    >
                      <option value="">Selecciona un jugador</option>
                      {players.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.username}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput
                      label="Faccion"
                      value={formFaction}
                      onChange={setFormFaction}
                      placeholder="Cuervos del Norte"
                    />
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">
                        Estado
                      </span>
                      <select
                        value={formStatus}
                        onChange={(event) =>
                          setFormStatus(event.target.value as RankingPlayer["status"])
                        }
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                      >
                        <option value="alive">Vivo</option>
                        <option value="dead">Muerto</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <NumericInput label="Puntos" value={formPoints} onChange={setFormPoints} />
                    <NumericInput
                      label="Misiones"
                      value={formMissions}
                      onChange={setFormMissions}
                    />
                    <NumericInput
                      label="Eventos"
                      value={formEvents}
                      onChange={setFormEvents}
                    />
                    <NumericInput label="Racha" value={formStreak} onChange={setFormStreak} />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        Guardar semana actual
                      </>
                    )}
                  </button>

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
                      Temporada actual
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      {windowLabel || "Semana actual"}
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {rankingRows.length > 0 ? (
                    rankingRows.map((row, index) => (
                      <button
                        key={`${row.id}-${row.name}`}
                        type="button"
                        onClick={() => preloadFromExisting(row)}
                        className="flex w-full items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
                      >
                        <div>
                          <p className="text-sm font-bold text-stone-100">
                            #{index + 1} {row.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                            {row.missionsCompleted} misiones / {row.eventsJoined} eventos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-300">
                            {row.activityPoints}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                            puntos
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <AdminInfoCard
                      title="Semana vacia"
                      message="Aun no hay registros semanales. Puedes crear el primero desde el formulario."
                    />
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "players" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Formulario de alta
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Crear jugador
                    </h4>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleCreatePlayer}>
                  <LabeledInput
                    label="Nombre del jugador"
                    value={newUsername}
                    onChange={setNewUsername}
                    placeholder="Nombre exacto del personaje o usuario"
                  />

                  <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                    <NumericInput
                      label="Oro inicial"
                      value={newGold}
                      onChange={setNewGold}
                    />
                    <label className="flex items-end">
                      <div className="flex w-full items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-200">
                            Crear como admin
                          </p>
                          <p className="mt-1 text-xs leading-5 text-stone-500">
                            Solo si quieres que este jugador vea el panel de administracion.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newIsAdmin}
                          onChange={(event) => setNewIsAdmin(event.target.checked)}
                          className="h-4 w-4 rounded border-stone-600 bg-stone-950 text-amber-400"
                        />
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingPlayer}
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingPlayer ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Crear jugador
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 border-t border-stone-800 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        Correcciones y premios
                      </p>
                      <h4 className="mt-1 text-xl font-black text-stone-100">
                        Editar oro
                      </h4>
                    </div>
                  </div>

                  <form className="mt-5 space-y-4" onSubmit={handleUpdateGold}>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">
                        Jugador
                      </span>
                      <select
                        value={goldPlayerId}
                        onChange={(event) => setGoldPlayerId(event.target.value)}
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                      >
                        <option value="">Selecciona un jugador</option>
                        {players.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.username}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <AdminModeButton
                        label="Sumar"
                        active={goldMode === "add"}
                        onClick={() => setGoldMode("add")}
                      />
                      <AdminModeButton
                        label="Restar"
                        active={goldMode === "subtract"}
                        onClick={() => setGoldMode("subtract")}
                      />
                      <AdminModeButton
                        label="Fijar"
                        active={goldMode === "set"}
                        onClick={() => setGoldMode("set")}
                      />
                    </div>

                    <NumericInput
                      label={
                        goldMode === "set"
                          ? "Nuevo total de oro"
                          : goldMode === "add"
                            ? "Oro a sumar"
                            : "Oro a restar"
                      }
                      value={goldAmount}
                      onChange={setGoldAmount}
                    />

                    {selectedGoldPlayer ? (
                      <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                        Oro actual de <span className="font-bold text-stone-100">{selectedGoldPlayer.username}</span>:{" "}
                        <span className="font-black text-amber-300">{selectedGoldPlayer.gold}</span>
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isUpdatingGold}
                      className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdatingGold ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Coins className="h-4 w-4" />
                          Actualizar oro
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {playerFeedback ? (
                  <p className="mt-5 rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                    {playerFeedback}
                  </p>
                ) : null}
              </section>

              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Base actual
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Jugadores registrados
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {players.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-stone-100">
                          {entry.username}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                          {entry.isAdmin ? "Admin" : "Jugador"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-300">{entry.gold}</p>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                          oro
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "events" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Flag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Gestor del inicio
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Crear o editar eventos
                    </h4>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleSaveEvent}>
                  <LabeledInput
                    label="Titulo"
                    value={eventTitle}
                    onChange={setEventTitle}
                    placeholder="Nombre del evento"
                  />
                  <LabeledTextArea
                    label="Descripcion corta"
                    value={eventDescription}
                    onChange={setEventDescription}
                    placeholder="Resumen visible en la tarjeta"
                  />
                  <LabeledTextArea
                    label="Cronica o descripcion larga"
                    value={eventLongDescription}
                    onChange={setEventLongDescription}
                    placeholder="Detalle desplegable del evento"
                    rows={4}
                  />
                  <LabeledInput
                    label="URL de imagen"
                    value={eventImageUrl}
                    onChange={setEventImageUrl}
                    placeholder="https://..."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput
                      label="Fecha de inicio"
                      value={eventStartDate}
                      onChange={setEventStartDate}
                      placeholder="18 de abril"
                    />
                    <LabeledInput
                      label="Fecha de cierre"
                      value={eventEndDate}
                      onChange={setEventEndDate}
                      placeholder="21 de abril"
                    />
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-stone-200">
                      Estado
                    </span>
                    <select
                      value={eventStatus}
                      onChange={(event) =>
                        setEventStatus(event.target.value as EventStatus)
                      }
                      className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                    >
                      <option value="active">Activo</option>
                      <option value="in-production">En produccion</option>
                      <option value="finished">Finalizado</option>
                    </select>
                  </label>

                  <LabeledInput
                    label="Facciones (separadas por coma)"
                    value={eventFactions}
                    onChange={setEventFactions}
                    placeholder="Cuervos del Norte, Guardianes del Umbral"
                  />
                  <LabeledTextArea
                    label="Recompensas"
                    value={eventRewards}
                    onChange={setEventRewards}
                    placeholder="Prestigio, oro, reliquias..."
                  />
                  <LabeledTextArea
                    label="Requisitos"
                    value={eventRequirements}
                    onChange={setEventRequirements}
                    placeholder="Personaje activo, inscripcion previa..."
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingEvent}
                      className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingEvent ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Flag className="h-4 w-4" />
                          {eventId ? "Actualizar evento" : "Crear evento"}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetEventForm}
                      className="rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
                    >
                      Limpiar formulario
                    </button>
                  </div>

                  {eventFeedback ? (
                    <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                      {eventFeedback}
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
                      Agenda visible
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Eventos del inicio
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {events.map((entry) => (
                    <button
                      key={entry.id ?? entry.title}
                      type="button"
                      onClick={() => preloadEvent(entry)}
                      className="flex w-full items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
                    >
                      <div>
                        <p className="text-sm font-bold text-stone-100">
                          {entry.title}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                          {entry.startDate} / {entry.endDate}
                        </p>
                      </div>
                      <div className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300">
                        {entry.status}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "templates" ? (
            <div className="space-y-4">
              <AdminInfoCard
                title="Plantillas de semana"
                message="Usalas como referencia rapida para decidir cuantos puntos otorgar sin improvisar cada vez."
              />
              <div className="grid gap-4 xl:grid-cols-3">
                {ADMIN_WEEKLY_TEMPLATES.map((template) => (
                  <article
                    key={template.id}
                    className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-stone-100">
                          {template.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-stone-400">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {template.scoring.map((entry) => (
                        <button
                          key={`${template.id}-${entry.label}`}
                          type="button"
                          onClick={() =>
                            applyTemplate(
                              entry.points,
                              entry.label.toLowerCase().includes("mision") ? 1 : 0,
                              entry.label.toLowerCase().includes("evento") ? 1 : 0
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[1.1rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
                        >
                          <span className="text-sm text-stone-300">{entry.label}</span>
                          <span className="text-sm font-black text-amber-300">
                            +{entry.points}
                          </span>
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AdminTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
          : "border-stone-700 bg-stone-900/70 text-stone-400"
      }`}
    >
      {label}
    </button>
  );
}

function AdminModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
          : "border-stone-700 bg-stone-900/70 text-stone-400"
      }`}
    >
      {label}
    </button>
  );
}

function AdminInfoCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5">
      <p className="text-sm font-bold text-stone-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-400">{message}</p>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
      />
    </label>
  );
}

function LabeledTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
      />
    </label>
  );
}

function NumericInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
      />
    </label>
  );
}
