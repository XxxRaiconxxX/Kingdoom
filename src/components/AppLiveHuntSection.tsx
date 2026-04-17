import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeAlert,
  RadioTower,
  Shield,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { APP_LIVE_HUNT_ACTION_COPY, APP_LIVE_HUNT_TEMPLATES } from "../data/appLiveHunts";
import { usePlayerSession } from "../context/PlayerSessionContext";
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
import {
  loadPveProgressForSheet,
  resolveActivePveSheetId,
} from "../utils/pveProgress";

const PROGRESS_WINDOW_MS = 6 * 60 * 60 * 1000;

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

function formatRoomMeta(room: AppLiveHuntRoom) {
  return `R${room.currentRound}/${room.maxRounds} · Amenaza ${room.threat}/${room.threatCap}`;
}

function getProgressPower(progress: PvePlayerProgress) {
  return (
    progress.level * 12 +
    progress.stats.strength * 8 +
    progress.stats.life * 7 +
    progress.stats.defense * 7
  );
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

    let cancelled = false;
    const roomId = selectedRoomId;

    async function hydrateSnapshot() {
      const nextSnapshot = await fetchAppLiveHuntSnapshot(roomId);
      if (cancelled) {
        return;
      }
      setSnapshot(nextSnapshot);
    }

    void hydrateSnapshot();
    const intervalId = window.setInterval(() => {
      void hydrateSnapshot();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedRoomId]);

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

  async function refreshRoomsAndSnapshot(nextSelectedRoomId?: string | null) {
    const state = await fetchAppLiveHunts();
    setRooms(state.rooms);
    setBackendState(state.status);
    if (state.message) {
      setStatusMessage(state.message);
    }

    const targetId = nextSelectedRoomId ?? selectedRoomId ?? state.rooms[0]?.id ?? null;
    setSelectedRoomId(targetId);
    if (targetId) {
      const nextSnapshot = await fetchAppLiveHuntSnapshot(targetId);
      setSnapshot(nextSnapshot);
    } else {
      setSnapshot(null);
    }
  }

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
    await refreshRoomsAndSnapshot(snapshot.room.id);
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
    <div className="space-y-4">
      <div className="rounded-[1.7rem] border border-emerald-500/15 bg-gradient-to-br from-stone-900 to-stone-950 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
              Solo app
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-100">
              Caceria comunal
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">
              Evento en vivo por rondas: el host abre la sala, las fichas entran con su nivel real de Expedicion y cada ronda se resuelve con acciones colectivas.
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">
              Tu ficha activa
            </p>
            <p className="mt-2 text-base font-black text-stone-100">
              {activeSheet.name || "Ficha sin nombre"}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Lv {activeProgress.level} · Poder {getProgressPower(activeProgress)}
            </p>
          </div>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/60 px-4 py-3 text-sm leading-6 text-stone-300">
          {statusMessage}
        </div>
      ) : null}

      {backendState === "fallback" && rooms.length === 0 ? (
        <div className="rounded-[1.4rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
          Ejecuta `supabase_app_live_hunts.sql` para activar salas reales en vivo. La UI ya quedo lista en la app.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                  Abrir sala
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Elige el contrato que quieres hostear. Cada sala nace en lobby y luego la abres cuando la cuadrilla este lista.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                <RadioTower className="h-5 w-5" />
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
              Salas activas
            </p>
            <div className="mt-4 space-y-3">
              {rooms.length === 0 ? (
                <p className="rounded-[1.25rem] border border-dashed border-stone-800 bg-stone-900/70 px-4 py-5 text-sm leading-6 text-stone-500">
                  Aun no hay cacerias abiertas. El primer host que pulse `Abrir sala` levanta el evento.
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

        <div className="rounded-[1.7rem] border border-stone-800 bg-stone-950/60 p-4">
          {selectedRoom && snapshot ? (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                <div className="rounded-[1.2rem] border border-stone-800 bg-stone-900/80 px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Estado
                  </p>
                  <p className="mt-2 text-lg font-black text-stone-100">
                    {getStatusCopy(selectedRoom.status)}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatRoomMeta(selectedRoom)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <LiveMetric icon={Swords} label="Vida enemiga" value={`${selectedRoom.enemyHp}/${selectedRoom.enemyMaxHp}`} />
                <LiveMetric icon={Shield} label="Amenaza" value={`${selectedRoom.threat}/${selectedRoom.threatCap}`} />
                <LiveMetric icon={Sparkles} label="Botin potencial" value={`${selectedRoom.rewardPool} oro`} />
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

              <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.25rem] border border-stone-800 bg-stone-900/75 p-4">
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

                  <div className="rounded-[1.25rem] border border-stone-800 bg-stone-900/75 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                      Accion actual
                    </p>
                    {selectedRoom.status === "active" && isJoined ? (
                      <div className="mt-3 grid gap-2">
                        {(Object.keys(APP_LIVE_HUNT_ACTION_COPY) as AppLiveHuntActionType[]).map((actionType) => {
                          const copy = APP_LIVE_HUNT_ACTION_COPY[actionType];
                          return (
                            <button
                              key={actionType}
                              type="button"
                              onClick={() => void handleAction(actionType)}
                              disabled={isBusy}
                              className={`rounded-[1.1rem] border px-4 py-3 text-left transition ${
                                currentAction?.actionType === actionType
                                  ? "border-emerald-400/25 bg-emerald-500/10"
                                  : "border-stone-800 bg-stone-950/70"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-black text-stone-100">{copy.label}</p>
                                {currentAction?.actionType === actionType ? (
                                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                                    Elegida
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-stone-400">{copy.summary}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">{copy.hint}</p>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-[1.1rem] border border-dashed border-stone-800 bg-stone-950/70 px-4 py-4 text-sm leading-6 text-stone-500">
                        {selectedRoom.status === "lobby"
                          ? "El host aun no abrio la ronda."
                          : selectedRoom.status === "active"
                          ? "Unete a la sala para elegir accion."
                          : "La sala ya cerro. Puedes revisar el resumen abajo."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.25rem] border border-stone-800 bg-stone-900/75 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                        Ronda {selectedRoom.currentRound}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
                        {snapshot.actions.filter((action) => action.roundNumber === selectedRoom.currentRound).length} acciones
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {snapshot.actions
                        .filter((action) => action.roundNumber === selectedRoom.currentRound)
                        .map((action) => (
                          <div
                            key={action.id}
                            className="rounded-[1rem] border border-stone-800 bg-stone-950/70 px-3 py-3 text-sm text-stone-300"
                          >
                            <span className="font-bold text-stone-100">{action.sheetName}</span>{" "}
                            marco <span className="text-emerald-200">{APP_LIVE_HUNT_ACTION_COPY[action.actionType].label}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-stone-800 bg-stone-900/75 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                        Bitacora
                      </p>
                      <BadgeAlert className="h-4 w-4 text-stone-500" />
                    </div>
                    <div className="mt-3 space-y-3">
                      {snapshot.rounds.length === 0 ? (
                        <p className="rounded-[1rem] border border-dashed border-stone-800 bg-stone-950/70 px-4 py-4 text-sm leading-6 text-stone-500">
                          Aun no hay rondas resueltas. Cuando el host cierre una ronda, el resumen aparecera aqui.
                        </p>
                      ) : (
                        snapshot.rounds.map((round) => (
                          <motion.div
                            key={round.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-[1rem] border border-stone-800 bg-stone-950/70 px-4 py-4"
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
              </div>
            </>
          ) : (
            <LiveHuntPlaceholder message="Selecciona una sala activa o abre una nueva caceria comunal desde la app." />
          )}
        </div>
      </div>
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
    <div className="rounded-[1rem] border border-stone-800 bg-stone-950/70 px-3 py-3">
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
