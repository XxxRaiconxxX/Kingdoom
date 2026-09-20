import { lazy, Suspense, useEffect, useId, useRef, useState, startTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Bell,
  Castle,
  ChevronDown,
  ChevronRight,
  Compass,
  Sparkles,
  Store,
  Swords,
  UserRound,
} from "lucide-react";
import { RealmNavigation, REALM_NAVIGATION, KINGDOOM_EMBLEM } from "./components/RealmNavigation";
import { EventCard } from "./components/EventCard";
import { AuthFlowPreview } from "./components/AuthFlowPreview";
import { ExpandableText } from "./components/ExpandableText";
import { SectionHeader } from "./components/SectionHeader";
import { StatCard } from "./components/StatCard";
import { usePlayerSession } from "./context/PlayerSessionContext";
import { ACTIVE_EVENTS } from "./data/events";
import { FALLBACK_MISSIONS } from "./data/missions";
import {
  HOME_STATS,
  JOIN_STEPS,
  KINGDOM_ANNOUNCEMENTS,
  KINGDOM_STATUS,
} from "./data/home";
import { useGsapStaggerReveal } from "./hooks/useGsapStaggerReveal";
import { supabase } from "./utils/supabaseClient";
import type {
  HomeStat,
  RealmEvent,
  RealmEventParticipant,
  RealmMission,
  RealmMissionClaim,
  TabId,
} from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSupabaseRecordId(value?: string) {
  return Boolean(value && UUID_PATTERN.test(value.trim()));
}

const missionDifficultyLabels = {
  easy: "Facil",
  medium: "Media",
  hard: "Dificil",
  elite: "Elite",
} as const;

const missionStatusLabels = {
  available: "Disponible",
  "in-progress": "En curso",
  closed: "Cerrada",
} as const;

const missionTypeLabels = {
  story: "Historia",
  hunt: "Caceria",
  escort: "Escolta",
  investigation: "Investigacion",
  event: "Evento",
} as const;

const missionClaimStatusLabels = {
  claimed: "Postulado",
  completed: "Pendiente validar",
  rewarded: "Aprobada",
} as const;

const loadEventUtils = () => import("./utils/events");
const loadMissionUtils = () => import("./utils/missions");
const loadCharacterSheetUtils = () => import("./utils/characterSheets");

const loadLibrarySection = () =>
  import("./components/LibrarySection").then((module) => ({
    default: module.LibrarySection,
  }));
const loadGrimoireSection = () =>
  import("./components/GrimoireSection").then((module) => ({
    default: module.GrimoireSection,
  }));
const loadMarketSection = () =>
  import("./sections/MarketSection").then((module) => ({
    default: module.MarketSection,
  }));
const loadRealmSiegeSection = () =>
  import("./sections/RealmSiegeSection").then((module) => ({
    default: module.RealmSiegeSection,
  }));
const loadArchivistSection = () =>
  import("./components/ArchivistSection").then((module) => ({
    default: module.ArchivistSection,
  }));
const loadAnimeHubSection = () =>
  import("./components/AnimeHubSection").then((module) => ({
    default: module.AnimeHubSection,
  }));
const loadPlayerProfilePanel = () =>
  import("./components/PlayerProfilePanel").then((module) => ({
    default: module.PlayerProfilePanel,
  }));
const LibrarySection = lazy(loadLibrarySection);
const GrimoireSection = lazy(loadGrimoireSection);
const MarketSection = lazy(loadMarketSection);
const RealmSiegeSection = lazy(loadRealmSiegeSection);
const ArchivistSection = lazy(loadArchivistSection);
const AnimeHubSection = lazy(loadAnimeHubSection);
const PlayerProfilePanel = lazy(loadPlayerProfilePanel);

function preloadTab(tabId: TabId) {
  switch (tabId) {
    case "grimoire":
      void loadGrimoireSection();
      break;
    case "library":
      void loadLibrarySection();
      break;
    case "market":
      void loadMarketSection();
      break;
    case "anime":
      void loadAnimeHubSection();
      break;
    case "archivist":
      void loadArchivistSection();
      break;
    default:
      break;
  }
}

function isRealmSiegeStandaloneRoute() {
  if (typeof window === "undefined") {
    return false;
  }

  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    path.endsWith("/asedio-reinos") ||
    params.get("catalogo") === "asedio-reinos" ||
    params.get("view") === "asedio-reinos"
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(true);
  const [isRealmSiegeStandalone] = useState(isRealmSiegeStandaloneRoute);
  const stageRef = useRef<HTMLDivElement>(null);
  const previousTab = useRef(activeTab);
  const { player } = usePlayerSession();
  const activeDestination = REALM_NAVIGATION.find((item) => item.id === activeTab);
  const navigateTo = (tab: TabId) => startTransition(() => setActiveTab(tab));
  const openProfile = () => {
    setIsProfileCollapsed(false);
    document.getElementById("player-profile")?.scrollIntoView({ block: "start" });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    startTransition(() => setIsProfileCollapsed(true));
    if (previousTab.current !== activeTab) {
      stageRef.current?.focus({ preventScroll: true });
      previousTab.current = activeTab;
    }
  }, [activeTab]);

  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("auth-preview") === "1") {
    return <AuthFlowPreview />;
  }

  if (isRealmSiegeStandalone) {
    return (
      <div
        className="kd-ambient min-h-screen bg-stone-950 text-stone-300"
        data-kd-theme="market"
      >
        <main className="kd-shell mx-auto min-h-screen w-full max-w-7xl px-2.5 py-3 sm:px-4 sm:py-5 md:px-6 md:py-8">
          <Suspense fallback={<FullscreenLoadingOverlay message="Abriendo El Asedio de los Reinos..." />}>
            <RealmSiegeSection standalone />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div
      className="kd-ambient realm-app min-h-screen bg-stone-950 text-stone-300"
      data-kd-theme={activeTab}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-amber-300 focus:p-3 focus:text-stone-950">Saltar al contenido</a>
      <RealmNavigation activeTab={activeTab} onNavigate={navigateTo} onPreload={preloadTab} />
      <div className="realm-workspace">
      <header className="realm-topbar">
        <button className="realm-mobile-brand" onClick={() => navigateTo("home")} aria-label="Kingdoom, ir al inicio"><img className="realm-logo" src={KINGDOOM_EMBLEM} width="48" height="48" alt="" /><span>Kingdoom</span></button>
        <div className="realm-location"><span>Reino de las Sombras</span><ChevronRight aria-hidden="true" /><strong>{activeDestination?.label ?? "Portal anime"}</strong></div>
        <button className="realm-profile-trigger realm-entry-button" onClick={openProfile} aria-expanded={!isProfileCollapsed} aria-controls="player-profile"><UserRound aria-hidden="true" /><span>{player?.username ?? "Entrar al reino"}</span><ChevronDown aria-hidden="true" /></button>
      </header>
      <main id="main-content" tabIndex={-1} className="realm-main">
        <div id="player-profile" className="realm-profile-area">
          <Suspense
            fallback={
              <div role="status" aria-label="Cargando perfil" className="kd-glass flex min-h-20 items-center gap-3 rounded-2xl px-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-stone-700/50" />
                <div className="h-4 w-40 animate-pulse rounded bg-stone-700/50" />
              </div>
            }
          >
            <PlayerProfilePanel
              collapsed={isProfileCollapsed}
              compactDisconnected
              onCollapsedChange={setIsProfileCollapsed}
              showAnimeShortcut={activeTab === "home"}
              onOpenAnime={() => navigateTo("anime")}
            />
          </Suspense>
        </div>

        <div
          key={activeTab}
          ref={stageRef}
          tabIndex={-1}
          aria-label={activeDestination?.label ?? "Portal anime"}
          className="kd-stage realm-stage"
        >
          {activeTab === "home" ? <HomeSection onNavigate={navigateTo} onConnect={openProfile} /> : null}
          {activeTab === "grimoire" ? (
            <Suspense fallback={<FullscreenLoadingOverlay message="Abriendo el grimorio prohibido..." />}>
              <GrimoireSection />
            </Suspense>
          ) : null}
          {activeTab === "library" ? (
            <Suspense fallback={<FullscreenLoadingOverlay message="Consultando la biblioteca real..." />}>
              <LibrarySection />
            </Suspense>
          ) : null}
          {activeTab === "market" ? (
            <Suspense fallback={<FullscreenLoadingOverlay message="Abriendo el mercado clandestino..." />}>
              <MarketSection />
            </Suspense>
          ) : null}
          {activeTab === "anime" ? (
            <Suspense fallback={<FullscreenLoadingOverlay message="Inicializando el portal anime..." />}>
              <AnimeHubSection />
            </Suspense>
          ) : null}
          {activeTab === "archivist" ? (
            <Suspense fallback={<FullscreenLoadingOverlay message="Abriendo el archivo de Argentis..." />}>
              <ArchivistSection />
            </Suspense>
          ) : null}
        </div>
      </main>

      <footer className="realm-page-footer"><Castle aria-hidden="true" /><span>Kingdoom · Cada historia deja su huella.</span><button onClick={() => navigateTo("library")}>Conoce el reino</button></footer>
      </div>
    </div>
  );
}

function HomeSection({ onNavigate, onConnect }: { onNavigate: (tab: TabId) => void; onConnect: () => void }) {
  const homeRevealRef = useRef<HTMLElement | null>(null);
  const { player, isHydrating } = usePlayerSession();
  const StatusIcon = KINGDOM_STATUS.icon;
  const [events, setEvents] = useState(ACTIVE_EVENTS);
  const [missions, setMissions] = useState(FALLBACK_MISSIONS);
  const [showAllMissions, setShowAllMissions] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState("");
  const [submittingEvidenceMissionId, setSubmittingEvidenceMissionId] =
    useState("");
  const [claimFeedback, setClaimFeedback] = useState<Record<string, string>>({});
  const [playerMissionClaims, setPlayerMissionClaims] = useState<
    Record<string, RealmMissionClaim>
  >({});
  const [eventFeedback, setEventFeedback] = useState<Record<string, string>>({});
  const [eventLoadingId, setEventLoadingId] = useState("");
  const [eventParticipantsByEventId, setEventParticipantsByEventId] = useState<
    Record<string, RealmEventParticipant[]>
  >({});
  const [playerEventParticipations, setPlayerEventParticipations] = useState<
    Record<string, RealmEventParticipant>
  >({});
  const [characterCount, setCharacterCount] = useState<number | null>(null);

  useGsapStaggerReveal(homeRevealRef, {
    selector: "[data-gsap-home]",
    duration: 0.6,
    stagger: 0.09,
    y: 20,
    delay: 0.04,
    dependencies: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      const [{ fetchRealmEvents }, { fetchPublicRealmMissions }, { getActiveCharacterSheetCount }] =
        await Promise.all([
          loadEventUtils(),
          loadMissionUtils(),
          loadCharacterSheetUtils(),
        ]);
      const [eventsResult, missionsResult, nextCharacterCount] = await Promise.all([
        fetchRealmEvents(),
        fetchPublicRealmMissions(),
        getActiveCharacterSheetCount(),
      ]);

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setEvents(eventsResult.events);
        setMissions(missionsResult.missions);
        setCharacterCount(nextCharacterCount);
      });
    }

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshCharacterCount() {
      const { getActiveCharacterSheetCount } = await loadCharacterSheetUtils();
      const nextCount = await getActiveCharacterSheetCount();

      if (cancelled) {
        return;
      }

      setCharacterCount(nextCount);
    }

    const channel = supabase
      .channel("home-character-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "character_sheets" },
        () => {
          void refreshCharacterCount();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  const homeStats: HomeStat[] = HOME_STATS.map((stat) =>
    stat.label === "Personajes"
      ? {
          ...stat,
          value:
            characterCount === null ? "..." : characterCount.toLocaleString("es-PY"),
        }
      : stat
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPlayerMissionClaims() {
      if (!player) {
        if (!cancelled) {
          setPlayerMissionClaims({});
        }
        return;
      }

      const missionIds = missions
        .map((mission) => mission.id ?? "")
        .filter((id) => isSupabaseRecordId(id));

      const { fetchPlayerMissionClaims } = await loadMissionUtils();
      const claimsResult = await fetchPlayerMissionClaims(player.id, missionIds);

      if (cancelled) {
        return;
      }

      setPlayerMissionClaims(claimsResult.claimsByMissionId);

      if (claimsResult.status === "error") {
        setClaimFeedback((current) => ({
          ...current,
          global: claimsResult.message,
        }));
      }
    }

    void loadPlayerMissionClaims();

    return () => {
      cancelled = true;
    };
  }, [missions, player]);

  async function refreshCurrentPlayerMissionClaims() {
    if (!player) {
      setPlayerMissionClaims({});
      return;
    }

    const missionIds = missions
      .map((mission) => mission.id ?? "")
      .filter((id) => isSupabaseRecordId(id));
    const { fetchPlayerMissionClaims } = await loadMissionUtils();
    const claimsResult = await fetchPlayerMissionClaims(player.id, missionIds);
    setPlayerMissionClaims(claimsResult.claimsByMissionId);
  }

  async function refreshMissionsData() {
    const { fetchPublicRealmMissions } = await loadMissionUtils();
    const result = await fetchPublicRealmMissions();
    startTransition(() => {
      setMissions(result.missions);
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadEventParticipationData() {
      const eventIds = events
        .map((event) => event.id ?? "")
        .filter((id) => isSupabaseRecordId(id));

      if (eventIds.length === 0) {
        if (!cancelled) {
          setEventParticipantsByEventId({});
          setPlayerEventParticipations({});
        }
        return;
      }

      const {
        fetchPublicEventParticipants,
        fetchPlayerEventParticipations,
      } = await loadEventUtils();
      const participantsResult = await fetchPublicEventParticipants(eventIds);

      if (!cancelled) {
        setEventParticipantsByEventId(participantsResult.participantsByEventId);
      }

      if (!player) {
        if (!cancelled) {
          setPlayerEventParticipations({});
        }
        return;
      }

      const myResult = await fetchPlayerEventParticipations(player.id, eventIds);

      if (!cancelled) {
        setPlayerEventParticipations(myResult.participationsByEventId);
      }
    }

    void loadEventParticipationData();

    return () => {
      cancelled = true;
    };
  }, [events, player]);

  async function refreshEventParticipationData() {
    const eventIds = events
      .map((event) => event.id ?? "")
      .filter((id) => isSupabaseRecordId(id));

    if (eventIds.length === 0) {
      setEventParticipantsByEventId({});
      setPlayerEventParticipations({});
      return;
    }

    const { fetchPublicEventParticipants, fetchPlayerEventParticipations } =
      await loadEventUtils();
    const participantsResult = await fetchPublicEventParticipants(eventIds);
    setEventParticipantsByEventId(participantsResult.participantsByEventId);

    if (!player) {
      setPlayerEventParticipations({});
      return;
    }

    const myResult = await fetchPlayerEventParticipations(player.id, eventIds);
    setPlayerEventParticipations(myResult.participationsByEventId);
  }

  async function handleJoinEvent(event: RealmEvent) {
    if (!player) {
      if (event?.id) {
        const eventId = event.id;
        setEventFeedback((current) => ({
          ...current,
          [eventId]: "Conecta tu perfil para unirte al evento.",
        }));
      }
      return;
    }

    if (!event?.id || !isSupabaseRecordId(event.id)) {
      return;
    }

    const eventId = event.id;
    setEventLoadingId(eventId);
    const { joinRealmEvent } = await loadEventUtils();
    const result = await joinRealmEvent(eventId, player.id);
    setEventLoadingId("");
    setEventFeedback((current) => ({
      ...current,
      [eventId]: result.message,
    }));

    if (result.status === "joined" || result.status === "exists") {
      await refreshEventParticipationData();
    }
  }

  async function handleLeaveEvent(event: RealmEvent) {
    if (!player) {
      return;
    }

    if (!event?.id || !isSupabaseRecordId(event.id)) {
      return;
    }

    const eventId = event.id;
    setEventLoadingId(eventId);
    const { leaveRealmEvent } = await loadEventUtils();
    const result = await leaveRealmEvent(eventId, player.id);
    setEventLoadingId("");
    setEventFeedback((current) => ({
      ...current,
      [eventId]: result.message,
    }));

    if (result.status === "left") {
      await refreshEventParticipationData();
    }
  }

  async function handleClaimMission(mission: RealmMission) {
    if (!mission.id) {
      return;
    }

    if (!player) {
      setClaimFeedback((current) => ({
        ...current,
        [mission.id as string]: "Conecta tu perfil para tomar esta mision.",
      }));
      return;
    }

    setClaimingMissionId(mission.id);
    const { claimRealmMission } = await loadMissionUtils();
    const result = await claimRealmMission(mission.id, player.id);
    setClaimingMissionId("");
    setClaimFeedback((current) => ({
      ...current,
      [mission.id as string]: result.message,
    }));

    if (result.status === "claimed" || result.status === "exists") {
      await refreshCurrentPlayerMissionClaims();
      await refreshMissionsData();
    }
  }

  async function handleSubmitMissionEvidence(
    mission: RealmMission,
    evidence: {
      proofText: string;
      proofImageFile?: File | null;
    }
  ) {
    if (!mission.id || !player) {
      return;
    }

    const currentClaim = playerMissionClaims[mission.id];

    if (!currentClaim) {
      setClaimFeedback((current) => ({
        ...current,
        [mission.id as string]:
          "Primero debes postularte a la mision para enviar evidencia.",
      }));
      return;
    }

    setSubmittingEvidenceMissionId(mission.id);
    const { submitMissionClaimEvidence } = await loadMissionUtils();
    const result = await submitMissionClaimEvidence(currentClaim.id, player.id, {
      proofText: evidence.proofText,
      proofLink: "",
      proofImageUrl: "",
      proofImageFile: evidence.proofImageFile,
    });
    setSubmittingEvidenceMissionId("");

    setClaimFeedback((current) => ({
      ...current,
      [mission.id as string]: result.message,
    }));

    if (result.status === "saved") {
      await refreshCurrentPlayerMissionClaims();
    }
  }

  return (
    <section ref={homeRevealRef} className="space-y-5">
      <div className="realm-hero">
        <img className="realm-hero-art" src={`${import.meta.env.BASE_URL}img/realm-citadel.webp`} alt="" width="1536" height="1024" fetchPriority="high" />
        <div className="realm-hero-mist" aria-hidden="true" />
        <div className="realm-embers" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
        <div className="realm-hero-seal"><img className="realm-logo" src={KINGDOOM_EMBLEM} alt="Escudo de Kingdoom: dos grifos, un castillo y el dado 20" width="220" height="220" /><span>Kingdoom</span></div>
        <div className="realm-hero-content">
          <p className="realm-hero-kicker"><span aria-hidden="true" /> Un mundo de rol por descubrir</p>
          <h1>Reino de<br />las Sombras</h1>
          <p className="realm-hero-description">Entre coronas y cenizas, tu historia está por escribirse. Elige tu camino, forja alianzas y deja tu huella en el reino.</p>
          <div className="realm-hero-actions">
            <a className="realm-button realm-button-primary" href="#realm-missions"><Swords aria-hidden="true" /> Explorar misiones</a>
            <button className="realm-button realm-button-quiet" onClick={() => onNavigate("library")}><Compass aria-hidden="true" /> Descubrir el mundo</button>
          </div>
        </div>
        <div className="realm-hero-caption"><Castle aria-hidden="true" /><span>Las fronteras guardan historias.<br /><strong>La siguiente puede ser la tuya.</strong></span></div>
      </div>
      <div className="realm-overview" data-gsap-home>
        <div className="realm-stats">{homeStats.map((stat) => <StatCard key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />)}</div>
        <div className="realm-world-state"><StatusIcon aria-hidden="true" /><div><span>{KINGDOM_STATUS.eyebrow}</span><strong>{KINGDOM_STATUS.title}</strong></div></div>
      </div>
      <div className="realm-paths" aria-label="Caminos del reino">
        <button onClick={() => onNavigate("grimoire")}><span className="realm-path-icon"><Sparkles aria-hidden="true" /></span><span><strong>Despierta tu poder</strong><small>Magias, criaturas y secretos</small></span><ChevronRight aria-hidden="true" /></button>
        <button onClick={() => onNavigate("market")}><span className="realm-path-icon"><Store aria-hidden="true" /></span><span><strong>Visita el mercado</strong><small>Reliquias, comercio y taberna</small></span><ChevronRight aria-hidden="true" /></button>
        <button onClick={onConnect}><span className="realm-path-icon"><UserRound aria-hidden="true" /></span><span><strong>{player ? "Tu personaje te espera" : "Comienza tu historia"}</strong><small>{player ? "Abre tu perfil y tus fichas" : "Conecta tu perfil al reino"}</small></span><ChevronRight aria-hidden="true" /></button>
      </div>

      <div
        id="realm-missions"
        data-gsap-home
        className="realm-content-block"
      >
        <SectionHeader
          eyebrow="El tablón de las aventuras"
          title="Misiones del reino"
          rightSlot={
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
              {missions.length} abiertas
            </span>
          }
        />
        <div id="realm-mission-list" className="realm-adventure-grid mt-5 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
          {(showAllMissions ? missions : missions.slice(0, 3)).map((mission) => {
            const hasPersistedMission = isSupabaseRecordId(mission.id);
            const missionClaim = mission.id
              ? playerMissionClaims[mission.id]
              : undefined;
            const canClaim =
              Boolean(player) &&
              !isHydrating &&
              hasPersistedMission &&
              !missionClaim;

            return (
              <MissionCard
                key={mission.id ?? mission.title}
                mission={mission}
                claim={missionClaim}
                onClaim={handleClaimMission}
                onSubmitEvidence={handleSubmitMissionEvidence}
                isClaiming={claimingMissionId === mission.id}
                isSubmittingEvidence={
                  submittingEvidenceMissionId === mission.id
                }
                canClaim={canClaim}
                disabledLabel={
                  hasPersistedMission ? "Conecta tu perfil" : "Solo lectura"
                }
                feedback={mission.id ? claimFeedback[mission.id] : ""}
              />
            );
          })}
          </AnimatePresence>
        </div>
        {missions.length > 3 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              aria-expanded={showAllMissions}
              aria-controls="realm-mission-list"
              onClick={() => setShowAllMissions(!showAllMissions)}
              className="realm-disclosure realm-show-missions"
            >
              {showAllMissions ? "Ocultar misiones" : `Ver todas las misiones (${missions.length})`}
              <ChevronDown aria-hidden="true" className={showAllMissions ? "rotate-180" : ""} />
            </button>
          </div>
        )}
      </div>

      <div
        id="realm-events"
        data-gsap-home
        className="realm-content-block"
      >
        <SectionHeader
          eyebrow="Agenda del reino"
          title="Eventos activos"
          rightSlot={
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
              {events.length} eventos
            </span>
          }
        />
        <div className="realm-adventure-grid mt-5 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const eventId = event.id ?? "";
            const hasPersistedEvent = isSupabaseRecordId(eventId);
            const participants = hasPersistedEvent
              ? eventParticipantsByEventId[eventId] ?? []
              : [];
            const myParticipation = hasPersistedEvent
              ? playerEventParticipations[eventId]
              : undefined;
            const eventMaxParticipants = Math.max(0, event.maxParticipants ?? 0);
            const isEventFull =
              eventMaxParticipants > 0 &&
              participants.length >= eventMaxParticipants;
            const canJoin =
              Boolean(player) &&
              !myParticipation &&
              hasPersistedEvent &&
              event.status === "in-production" &&
              !isEventFull;
            const canLeave =
              Boolean(myParticipation) &&
              hasPersistedEvent &&
              event.status === "in-production";

            return (
              <EventCard
                key={event.id ?? event.title}
                event={event}
                participants={participants}
                myParticipation={myParticipation}
                canJoin={canJoin}
                canLeave={canLeave}
                isSubmitting={eventLoadingId === eventId}
                feedback={eventFeedback[eventId]}
                onJoin={handleJoinEvent}
                onLeave={handleLeaveEvent}
              />
            );
          })}
        </div>
      </div>

      <div
        data-gsap-home
        className="grid gap-4 md:grid-cols-[0.95fr_1.05fr] [content-visibility:auto] [contain-intrinsic-size:680px]"
      >
        <div className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Tablon del reino" title="Anuncios del consejo" />
          <div className="mt-4 space-y-3">
            {KINGDOM_ANNOUNCEMENTS.map((announcement) => (
              <div
                key={announcement.title}
                className="kd-hover-lift rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-100">
                      {announcement.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Primeros pasos" title="Como unirse y empezar" />
          <div className="mt-4 space-y-3">
            {JOIN_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="kd-hover-lift rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-sm font-black text-amber-300">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-100">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        data-gsap-home
        className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] [content-visibility:auto] [contain-intrinsic-size:420px]"
      >
        <CollapsiblePanel
          title="Estado del reino"
          subtitle="Una lectura rápida de los frentes abiertos antes de sumarte al conflicto."
        >
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
                Panorama actual
              </p>
              <div className="mt-3 text-sm leading-6 text-stone-400">
                <ExpandableText
                  text={`${KINGDOM_STATUS.description} Cada semana cambian las presiones entre facciones, el mercado altera los incentivos y los eventos abiertos mueven el pulso del rol.`}
                  lines={6}
                />
              </div>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Notas del cronista"
          subtitle="Contexto breve para entrar al rol sin perderte entre facciones, reliquias y pactos."
        >
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4">
              <div className="text-sm leading-6 text-stone-400">
                <ExpandableText
                  text="Cada semana el reino gira entre asedios, expediciones, intrigas diplomáticas y pactos que pueden beneficiar o hundir a una facción completa. Entrar con contexto te ayuda a reaccionar mejor cuando el consejo cambia el pulso de la campaña."
                  lines={5}
                />
              </div>
            </div>
          </div>
        </CollapsiblePanel>
      </div>
    </section>
  );
}

function MissionCard({
  mission,
  claim,
  onClaim,
  onSubmitEvidence,
  isClaiming,
  isSubmittingEvidence,
  canClaim,
  disabledLabel,
  feedback,
}: {
  mission: RealmMission;
  claim?: RealmMissionClaim;
  onClaim: (mission: RealmMission) => Promise<void>;
  onSubmitEvidence: (
    mission: RealmMission,
    evidence: {
      proofText: string;
      proofImageFile?: File | null;
    }
  ) => Promise<void>;
  isClaiming: boolean;
  isSubmittingEvidence: boolean;
  canClaim: boolean;
  disabledLabel: string;
  feedback?: string;
}) {
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [showMissionDetails, setShowMissionDetails] = useState(false);
  const detailId = useId();
  const reduceMotion = useReducedMotion();
  const [proofText, setProofText] = useState(claim?.proofText ?? "");
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState("");

  useEffect(() => {
    setProofText(claim?.proofText ?? "");
    setProofImageFile(null);
    setProofImagePreview("");
  }, [claim?.proofText, claim?.id]);

  const canSendEvidence =
    Boolean(claim) && claim?.status !== "rewarded" && !claim?.rewardDelivered;

  async function handleEvidenceSubmit() {
    await onSubmitEvidence(mission, {
      proofText,
      proofImageFile,
    });
    setShowEvidenceForm(false);
  }

  useEffect(() => {
    return () => {
      if (proofImagePreview) {
        URL.revokeObjectURL(proofImagePreview);
      }
    };
  }, [proofImagePreview]);

  return (
    <motion.article className="realm-mission-card realm-adventure-card rounded-2xl border p-5" data-difficulty={mission.difficulty} data-expanded={showMissionDetails}
      layout="position" initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }} exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }} transition={{ duration: reduceMotion ? 0 : 0.45 }}>
      <div className="realm-card-insignia" aria-hidden="true"><Swords /></div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300/80">
              {missionTypeLabels[mission.type]}
            </p>
            {mission.id ? (
              <span className="text-xs text-gray-500 font-mono">
                ID: {mission.id.substring(0, 6).toUpperCase()}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-black leading-tight text-stone-100">
            {mission.title}
          </h3>
        </div>
        <div className="realm-reward shrink-0 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-right">
          <p className="text-lg font-black leading-none text-amber-300">
            {mission.rewardGold.toLocaleString("es")}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/70">
            oro
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <p
          className="line-clamp-3 text-sm leading-6 text-stone-400"
        >
          {mission.description}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="realm-difficulty-badge">
          {missionDifficultyLabels[mission.difficulty]}
        </span>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
          {missionStatusLabels[mission.status]}
        </span>
        <span className="rounded-full border border-stone-700 bg-stone-950/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-300">
          Cupos {Math.max(0, mission.maxParticipants - (mission.activeClaims || 0))}
        </span>
        {claim ? (
          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200">
            {missionClaimStatusLabels[claim.status]}
          </span>
        ) : null}
      </div>

      <div className="realm-mission-scroll mt-4">
        <button
          type="button"
          aria-expanded={showMissionDetails}
          aria-controls={detailId}
          onClick={() => setShowMissionDetails((current) => !current)}
          className="realm-disclosure"
        >
          <span>
            {showMissionDetails ? "Cerrar pergamino" : "Desplegar misión"}
          </span>
          <ChevronDown aria-hidden="true" className={showMissionDetails ? "rotate-180" : ""} />
        </button>
        <AnimatePresence initial={false}>
          {showMissionDetails && <motion.div id={detailId} className="realm-unfold" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}>
            <div className="realm-parchment">
              <h4>La encomienda</h4><p>{mission.description}</p>
              <h4>Tu objetivo</h4><p>{mission.instructions || "Consulta los detalles con el director de la misión."}</p>
            </div>
          </motion.div>}
        </AnimatePresence>
      </div>

      {mission.id ? (
        <>
          {!claim ? (
            <button
              type="button"
              onClick={() => void onClaim(mission)}
              disabled={isClaiming || !canClaim}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/12 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClaiming ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200/70 border-t-transparent" />
                  Postulando...
                </>
              ) : canClaim ? (
                "Postularme"
              ) : (
                disabledLabel
              )}
            </button>
          ) : null}

          {claim ? (
            <div className="mt-4 rounded-2xl border border-stone-800 bg-stone-900/65 px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                Estado actual
              </p>
              <p className="mt-1 text-sm font-bold text-stone-100">
                {missionClaimStatusLabels[claim.status]}
              </p>
              {claim.status === "completed" ? (
                <p className="mt-1 text-xs text-amber-200">
                  Esperando validacion del staff.
                </p>
              ) : null}
              {claim.status === "rewarded" ? (
                <p className="mt-1 text-xs text-emerald-200">
                  Recompensa confirmada.
                </p>
              ) : null}

              {canSendEvidence ? (
                <button
                  type="button"
                  onClick={() => setShowEvidenceForm((current) => !current)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/12 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  {showEvidenceForm ? "Ocultar evidencia" : "Entregar evidencia"}
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {showEvidenceForm && canSendEvidence ? (
        <div className="mt-3 space-y-2 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-3">
          <input
            type="text"
            value={proofText}
            onChange={(event) => setProofText(event.target.value)}
            placeholder="Resumen de la evidencia"
            className="w-full rounded-xl border border-stone-700 bg-stone-950/85 px-3 py-2 text-xs text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-cyan-400/45"
          />
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/12 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/22">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setProofImageFile(file);
                if (proofImagePreview) {
                  URL.revokeObjectURL(proofImagePreview);
                }
                if (file) {
                  setProofImagePreview(URL.createObjectURL(file));
                } else {
                  setProofImagePreview("");
                }
              }}
            />
            Adjuntar desde galeria
          </label>
          {proofImageFile ? (
            <p className="text-[11px] text-cyan-100">
              Archivo: {proofImageFile.name}
            </p>
          ) : null}
          {proofImagePreview ? (
            <img loading="lazy" decoding="async" 
              src={proofImagePreview}
              alt="Vista previa de evidencia"
              className="h-20 w-20 rounded-lg border border-cyan-500/30 object-cover"
            />
          ) : null}
          <button
            type="button"
            onClick={() => void handleEvidenceSubmit()}
            disabled={isSubmittingEvidence || (!proofText.trim() && !proofImageFile)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingEvidence ? "Enviando..." : "Enviar evidencia"}
          </button>
        </div>
      ) : null}

      {feedback ? (
        <p className="mt-3 rounded-xl border border-stone-800 bg-stone-900/60 px-3 py-2 text-xs leading-5 text-stone-300">
          {feedback}
        </p>
      ) : null}

    </motion.article>
  );
}

function CollapsiblePanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <details className="kd-glass kd-hover-lift group rounded-[1.75rem] border border-stone-800 bg-stone-900/75 p-5">
      <summary className="kd-touch flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-stone-100">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-stone-800 p-3 text-stone-300 transition group-open:rotate-180 group-open:text-amber-300">
          <ChevronDown className="h-5 w-5" />
        </div>
      </summary>
      <div className="mt-4 border-t border-stone-800 pt-4">{children}</div>
    </details>
  );
}

function FullscreenLoadingOverlay({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="realm-loading">
      <div className="realm-loading-card">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
          Cargando
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-300">{message}</p>
      </div>
    </div>
  );
}
