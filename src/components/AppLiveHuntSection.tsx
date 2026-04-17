import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeAlert,
  RadioTower,
  Shield,
  Sparkles,
  Swords,
  TimerReset,
  Users,
} from "lucide-react";
import { APP_LIVE_HUNT_ACTION_COPY, APP_LIVE_HUNT_TEMPLATES } from "../data/appLiveHunts";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { supabase } from "../lib/supabase";
import type {
  AppLiveHuntActionType,
  AppLiveHuntMember,
  AppLiveHuntRoom,
  CharacterSheet,
  PvePlayerProgress,
} from "../types";
import { getPlayerSheets } from "../utils/characterSheets";
import {
  buildAppLiveHuntRoomLabel,
  createAppLiveHunt,
  fetchAppLiveHuntSnapshot,
  fetchAppLiveHunts,
  joinAppLiveHunt,
  resolveAppLiveHuntRound,
  setAppLiveHuntStatus,
  submitAppLiveHuntAction,
  type AppLiveHuntSnapshot,
} from "../utils/appLiveHunts";
import { loadPveProgressForSheet, resolveActivePveSheetId } from "../utils/pveProgress";

const PROGRESS_WINDOW_MS = 6 * 60 * 60 * 1000;
const ROUND_COMMAND_WINDOW_MS = 90_000;

function getTemplateTone(tone: "emerald" | "amber" | "rose") {
  switch (tone) {
    case "rose":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    case "emerald":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }
}

function getStatusCopy(status: AppLiveHuntRoom["status"]) {
  switch (status) {
    case "active":
      return "En vivo";
    case "victory":
      return "Victoria";
    case "defeat":
      return "Caida";
    default:
      return "Lobby";
  }
}

function getProgressPower(progress: PvePlayerProgress) {
  return (
    progress.level * 12 +
    progress.stats.strength * 8 +
    progress.stats.life * 7 +
    progress.stats.defense * 7
  );
}

function formatRoomMeta(room: AppLiveHuntRoom) {
  return `R${room.currentRound}/${room.maxRounds} · Amenaza ${room.threat}/${room.threatCap}`;
}

function getRoundDeadline(room: AppLiveHuntRoom | null) {
  if (!room || room.status !== "active") {
    return null;
  }

  const updatedAt = new Date(room.updatedAt).getTime();
  return Number.isNaN(updatedAt) ? null : updatedAt + ROUND_COMMAND_WINDOW_MS;
}

function formatCountdown(msRemaining: number | null) {
  if (msRemaining === null) {
    return "Sin reloj";
  }

  const safe = Math.max(0, msRemaining);
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AppLiveHuntSection() {
  const { player, isHydrating } = usePlayerSession();
  const [rooms, setRooms] = useState<AppLiveHuntRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AppLiveHuntSnapshot | null>(null);
  const [activeSheet, setActiveSheet] = useState<CharacterSheet | null>(null);
  const [activeProgress, setActiveProgress] = useState<PvePlayerProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [backendState, setBackendState] = useState<"ready" | "fallback">("ready");
  const [countdownMs, setCountdownMs] = useState<number | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? snapshot?.room ?? null,
    [rooms, selectedRoomId, snapshot]
  );
  const isHost = Boolean(player && selectedRoom && selectedRoom.hostPlayerId === player.id);
  const currentAction = useMemo(
    () =>
      snapshot?.actions.find(
        (action) =>
          action.roundNumber === snapshot.room.currentRound &&
          action.playerId === player?.id
      ) ?? null,
    [player?.id, snapshot]
  );
  const isJoined = Boolean(
    player && snapshot?.members.some((member) => member.playerId === player.id)
  );
  const roundActionCount = useMemo(
    () =>
      snapshot?.actions.filter((action) => action.roundNumber === snapshot.room.currentRound)
        .length ?? 0,
    [snapshot]
  );
  const roundDeadline = useMemo(() => getRoundDeadline(selectedRoom), [selectedRoom]);

  async function refreshRoomsOnly() {
    const state = await fetchAppLiveHunts();
    setRooms(state.rooms);
    setBackendState(state.status);
    if (state.message) {
      setStatusMessage(state.message);
    }
    setSelectedRoomId((current) => {
      if (current && state.rooms.some((room) => room.id === current)) {
        return current;
      }
      return state.rooms[0]?.id ?? null;
    });
  }

  async function refreshSnapshotForRoom(roomId: string | null) {
    if (!roomId) {
      setSnapshot(null);
      return;
    }
    const nextSnapshot = await fetchAppLiveHuntSnapshot(roomId);
    setSnapshot(nextSnapshot);
  }

  async function refreshRoomsAndSnapshot(nextSelectedRoomId?: string | null) {
    const state = await fetchAppLiveHunts();
    setRooms(state.rooms);
    setBackendState(state.status);
    if (state.message) {
      setStatusMessage(state.message);
    }

    const targetId = nextSelectedRoomId ?? selectedRoomId ?? state.rooms[0]?.id ?? null;
    setSelectedRoomId(targetId);
    await refreshSnapshotForRoom(targetId);
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrateRooms() {
      const state = await fetchAppLiveHunts();
      if (cancelled) {
        return;
      }

      setRooms(state.rooms);
      setBackendState(state.status);
      setStatusMessage(state.message);
      setSelectedRoomId((current) => current ?? state.rooms[0]?.id ?? null);
    }

    void hydrateRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydratePlayerState() {
      if (!player) {
        setActiveSheet(null);
        setActiveProgress(null);
        return;
      }

      const sheets = await getPlayerSheets(player.id);
      if (cancelled) {
        return;
      }

      const activeSheetId = resolveActivePveSheetId(
        player.id,
        sheets.map((sheet) => sheet.id)
      );
      const nextSheet = sheets.find((sheet) => sheet.id === activeSheetId) ?? null;
      setActiveSheet(nextSheet);
      setActiveProgress(
        nextSheet
          ? loadPveProgressForSheet(player.id, nextSheet.id, PROGRESS_WINDOW_MS)
          : null
      );
    }

    void hydratePlayerState();

    return () => {
      cancelled = true;
    };
  }, [player]);

  useEffect(() => {
    if (!selectedRoomId) {
      setSnapshot(null);
      return;
    }

    void refreshSnapshotForRoom(selectedRoomId);
  }, [selectedRoomId]);

  useEffect(() => {
    const channel = supabase
      .channel("app-live-hunts-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_live_hunts" },
        () => {
          void refreshRoomsOnly();
          if (selectedRoomId) {
            void refreshSnapshotForRoom(selectedRoomId);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) {
      return;
    }

    const roomId = selectedRoomId;
    const channel = supabase
      .channel(`app-live-hunt-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_live_hunt_members", filter: `hunt_id=eq.${roomId}` },
        () => void refreshSnapshotForRoom(roomId)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_live_hunt_actions", filter: `hunt_id=eq.${roomId}` },
        () => void refreshSnapshotForRoom(roomId)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_live_hunt_rounds", filter: `hunt_id=eq.${roomId}` },
        () => void refreshSnapshotForRoom(roomId)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedRoomId]);

  useEffect(() => {
    if (!roundDeadline) {
      setCountdownMs(null);
      return;
    }

    const updateCountdown = () => {
      setCountdownMs(Math.max(0, roundDeadline - Date.now()));
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [roundDeadline]);

  async function handleCreateRoom(templateId: string) {
    if (!player || !activeSheet || !activeProgress) {
      setStatusMessage("Conecta tu perfil y activa una ficha para abrir una caceria.");
      return;
    }

    const template = APP_LIVE_HUNT_TEMPLATES.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    if (activeProgress.level < template.minLevel) {
      setStatusMessage(
        `Tu ficha activa necesita nivel ${template.minLevel} para abrir este contrato.`
      );
      return;
    }

    setIsBusy(true);
    const result = await createAppLiveHunt({
      templateId,
      hostPlayerId: player.id,
      hostUsername: player.username,
      hostSheet: activeSheet,
      hostProgress: activeProgress,
    });
    setIsBusy(false);
    setStatusMessage(result.message);
    await refreshRoomsAndSnapshot(result.room?.id ?? null);
  }

  async function handleJoinRoom() {
    if (!player || !activeSheet || !activeProgress || !selectedRoom) {
      return;
    }

    const template = APP_LIVE_HUNT_TEMPLATES.find(
      (entry) => entry.id === selectedRoom.templateId
    );
    if (template && activeProgress.level < template.minLevel) {
      setStatusMessage(
        `Tu ficha activa necesita nivel ${template.minLevel} para entrar en este contrato.`
      );
      return;
    }

    setIsBusy(true);
    const result = await joinAppLiveHunt({
      huntId: selectedRoom.id,
      playerId: player.id,
      username: player.username,
      sheet: activeSheet,
      progress: activeProgress,
    });
    setIsBusy(false);
    setStatusMessage(result.message);
    await refreshRoomsAndSnapshot(selectedRoom.id);
  }

  async function handleOpenHunt() {
    if (!selectedRoom) {
      return;
    }

    setIsBusy(true);
    const result = await setAppLiveHuntStatus(selectedRoom.id, "active");
    setIsBusy(false);
    setStatusMessage(result.message);
    await refreshRoomsAndSnapshot(selectedRoom.id);
  }

  async function handleAction(actionType: AppLiveHuntActionType) {
    if (!player || !activeSheet || !snapshot) {
      return;
    }

    setIsBusy(true);
    const result = await submitAppLiveHuntAction({
      huntId: snapshot.room.id,
      roundNumber: snapshot.room.currentRound,
      playerId: player.id,
      playerUsername: player.username,
      sheetId: activeSheet.id,
      sheetName: activeSheet.name || "Ficha sin nombre",
      actionType,
    });
    setIsBusy(false);
    setStatusMessage(result.message);
  }

  async function handleResolveRound() {
    if (!snapshot) {
      return;
    }

    setIsBusy(true);
    const result = await resolveAppLiveHuntRound(snapshot);
    setIsBusy(false);
    setStatusMessage(result.message);
    await refreshRoomsAndSnapshot(snapshot.room.id);
  }

  if (isHydrating) {
    return <LiveHuntPlaceholder message="Preparando el canal de cacerias en vivo..." />;
  }

  if (!player) {
    return (
      <LiveHuntPlaceholder message="Conecta tu perfil para entrar a las cacerias comunales exclusivas de la app." />
    );
  }

  if (!activeSheet || !activeProgress) {
    return (
      <LiveHuntPlaceholder message="Activa una ficha de Expedicion desde tu perfil. La caceria comunal usa esa ficha como avatar del contrato." />
    );
  }

  return (
    <div className="space-y-4 pb-28 md:pb-0">
      <div className="overflow-hidden rounded-[1.8rem] border border-emerald-500/15 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_42%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,10,10,0.96))] p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
                Solo app · evento en vivo
              </p>
              <h3 className="mt-2 text-2xl font-black text-stone-100">
                Caceria comunal
              </h3>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                Host, lobby y decisiones sincronizadas al instante. Esta mesa no aparece en la web.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-emerald-300">
              <RadioTower className="h-5 w-5" />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <HeroChip label="Ficha activa" value={activeSheet.name || "Sin nombre"} />
            <HeroChip label="Nivel" value={`Lv ${activeProgress.level}`} />
            <HeroChip label="Poder" value={`${getProgressPower(activeProgress)}`} />
            <HeroChip label="Salas abiertas" value={`${rooms.length}`} />
          </div>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-[1.35rem] border border-stone-800 bg-stone-950/60 px-4 py-3 text-sm leading-6 text-stone-300">
          {statusMessage}
        </div>
      ) : null}

      {backendState === "fallback" && rooms.length === 0 ? (
        <div className="rounded-[1.35rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
          Ejecuta `supabase_app_live_hunts.sql` para activar salas reales. La interfaz ya quedo lista y pensada para movil.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-4">
          <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                  Abrir sala
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Levanta el contrato desde la app y reune a la cuadrilla antes de abrir la primera ronda.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {APP_LIVE_HUNT_TEMPLATES.map((template) => {
                const locked = activeProgress.level < template.minLevel;
                return (
                  <div
                    key={template.id}
                    className="rounded-[1.25rem] border border-stone-800 bg-stone-900/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-stone-100">{template.shortLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-stone-400">
                          {template.description}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${getTemplateTone(template.tone)}`}
                      >
                        Lv {template.minLevel}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-stone-500">
                      <span>Poder {template.recommendedPower}</span>
                      <span>{template.maxRounds} rondas</span>
                    </div>
                    <button
                      type="button"
                      disabled={locked || isBusy}
                      onClick={() => void handleCreateRoom(template.id)}
                      className="mt-3 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {locked ? `Bloqueado hasta Lv ${template.minLevel}` : "Abrir sala"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                Salas activas
              </p>
              <span className="rounded-full border border-stone-700 bg-stone-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                {rooms.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {rooms.length === 0 ? (
                <p className="rounded-[1.25rem] border border-dashed border-stone-800 bg-stone-900/70 px-4 py-5 text-sm leading-6 text-stone-500">
                  Aun no hay cacerias abiertas. La primera sala que abras desde la app aparecera aqui al instante.
                </p>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full rounded-[1.25rem] border p-4 text-left transition ${
                      selectedRoomId === room.id
                        ? "border-emerald-400/25 bg-emerald-500/10"
                        : "border-stone-800 bg-stone-900/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-stone-100">
                          {buildAppLiveHuntRoomLabel(room)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">
                          Host {room.hostUsername}
                        </p>
                      </div>
                      <span className="rounded-full border border-stone-700 bg-stone-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                        {getStatusCopy(room.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-500">
                      {formatRoomMeta(room)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedRoom && snapshot ? (
            <>
              <div className="rounded-[1.7rem] border border-stone-800 bg-stone-950/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                      Sala seleccionada
                    </p>
                    <h4 className="mt-2 text-2xl font-black text-stone-100">
                      {selectedRoom.enemyName}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      {selectedRoom.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-stone-700 bg-stone-950/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                    {getStatusCopy(selectedRoom.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <LiveMetric icon={Swords} label="Vida enemiga" value={`${selectedRoom.enemyHp}/${selectedRoom.enemyMaxHp}`} />
                  <LiveMetric icon={Shield} label="Amenaza" value={`${selectedRoom.threat}/${selectedRoom.threatCap}`} />
                  <LiveMetric icon={Sparkles} label="Botin" value={`${selectedRoom.rewardPool}`} />
                  <LiveMetric icon={TimerReset} label="Reloj" value={formatCountdown(countdownMs)} />
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-stone-800 bg-stone-900/70 px-4 py-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                  {formatRoomMeta(selectedRoom)} · {roundActionCount}/{snapshot.members.length || 1} acciones marcadas
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!isJoined && selectedRoom.status !== "victory" && selectedRoom.status !== "defeat" ? (
                    <button
                      type="button"
                      onClick={() => void handleJoinRoom()}
                      disabled={isBusy}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Unirme con mi ficha activa
                    </button>
                  ) : null}
                  {isHost && selectedRoom.status === "lobby" ? (
                    <button
                      type="button"
                      onClick={() => void handleOpenHunt()}
                      disabled={isBusy}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Abrir ronda 1
                    </button>
                  ) : null}
                  {isHost && selectedRoom.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => void handleResolveRound()}
                      disabled={isBusy}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Resolver ronda
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.35rem] border border-stone-800 bg-stone-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                        Cuadrilla
                      </p>
                      <span className="rounded-full border border-stone-700 bg-stone-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                        {snapshot.members.length} integrantes
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {snapshot.members.map((member) => (
                        <MemberCard key={member.id} member={member} hostPlayerId={selectedRoom.hostPlayerId} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-stone-800 bg-stone-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                        Ronda actual
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
                        {roundActionCount} acciones
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {roundActionCount === 0 ? (
                        <p className="rounded-[1rem] border border-dashed border-stone-800 bg-stone-900/70 px-4 py-4 text-sm leading-6 text-stone-500">
                          Todavía nadie marco accion en esta ronda.
                        </p>
                      ) : (
                        snapshot.actions
                          .filter((action) => action.roundNumber === selectedRoom.currentRound)
                          .map((action) => (
                            <div
                              key={action.id}
                              className="rounded-[1rem] border border-stone-800 bg-stone-900/75 px-3 py-3 text-sm text-stone-300"
                            >
                              <span className="font-bold text-stone-100">{action.sheetName}</span>{" "}
                              marco{" "}
                              <span className="text-emerald-200">
                                {APP_LIVE_HUNT_ACTION_COPY[action.actionType].label}
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-stone-800 bg-stone-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                      Bitacora de la caza
                    </p>
                    <BadgeAlert className="h-4 w-4 text-stone-500" />
                  </div>
                  <div className="mt-3 space-y-3">
                    {snapshot.rounds.length === 0 ? (
                      <p className="rounded-[1rem] border border-dashed border-stone-800 bg-stone-900/70 px-4 py-4 text-sm leading-6 text-stone-500">
                        Aun no hay rondas resueltas. Cuando el host cierre una ronda, el resumen aparecera aqui.
                      </p>
                    ) : (
                      snapshot.rounds.map((round) => (
                        <motion.div
                          key={round.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-[1rem] border border-stone-800 bg-stone-900/75 px-4 py-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-stone-100">Ronda {round.roundNumber}</p>
                            <span className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
                              {round.enemyDamage} dano
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-stone-400">{round.summary}</p>
                          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-500">
                            Amenaza {round.threatDelta >= 0 ? "+" : ""}{round.threatDelta} · Botin {round.rewardDelta >= 0 ? "+" : ""}{round.rewardDelta}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {selectedRoom.status === "active" && isJoined ? (
                <div className="fixed inset-x-0 bottom-[5.35rem] z-40 border-t border-stone-800/80 bg-stone-950/95 px-3 py-3 backdrop-blur-xl md:static md:border-0 md:bg-transparent md:px-0 md:py-0">
                  <div className="mx-auto max-w-md md:max-w-none">
                    <div className="mb-2 flex items-center justify-between gap-3 px-1 md:hidden">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                        Tu decision
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
                        {currentAction
                          ? APP_LIVE_HUNT_ACTION_COPY[currentAction.actionType].label
                          : "Sin marcar"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {(Object.keys(APP_LIVE_HUNT_ACTION_COPY) as AppLiveHuntActionType[]).map((actionType) => {
                        const copy = APP_LIVE_HUNT_ACTION_COPY[actionType];
                        const selected = currentAction?.actionType === actionType;
                        return (
                          <button
                            key={actionType}
                            type="button"
                            onClick={() => void handleAction(actionType)}
                            disabled={isBusy}
                            className={`rounded-[1.15rem] border px-3 py-3 text-left transition ${
                              selected
                                ? "border-emerald-400/30 bg-emerald-500/12"
                                : "border-stone-800 bg-stone-900/90"
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-black text-stone-100">{copy.label}</p>
                              {selected ? (
                                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                                  OK
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-xs leading-5 text-stone-400">{copy.summary}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <LiveHuntPlaceholder message="Selecciona una sala activa o abre una nueva caceria comunal desde la app." />
          )}
        </div>
      </div>
    </div>
  );
}

function HeroChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[9rem] rounded-[1.1rem] border border-stone-800 bg-stone-950/70 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-stone-100">{value}</p>
    </div>
  );
}

function LiveMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Swords;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-stone-800 bg-stone-900/75 p-4">
      <div className="flex items-center gap-2 text-stone-500">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black text-stone-100">{value}</p>
    </div>
  );
}

function MemberCard({
  member,
  hostPlayerId,
}: {
  member: AppLiveHuntMember;
  hostPlayerId: string;
}) {
  return (
    <div className="rounded-[1rem] border border-stone-800 bg-stone-900/75 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-stone-100">{member.sheetName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">
            {member.username} · Lv {member.sheetLevel} · Poder {member.sheetPower}
          </p>
        </div>
        {member.playerId === hostPlayerId ? (
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
            Host
          </span>
        ) : null}
      </div>
    </div>
  );
}

function LiveHuntPlaceholder({ message }: { message: string }) {
  return (
    <div className="rounded-[1.7rem] border border-stone-800 bg-stone-900/80 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
        <Users className="h-8 w-8" />
      </div>
      <p className="mt-4 text-sm leading-6 text-stone-400">{message}</p>
    </div>
  );
}
