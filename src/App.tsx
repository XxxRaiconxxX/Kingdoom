import { lazy, Suspense, useEffect, useState, startTransition } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  Castle,
  ChevronDown,
  Download,
  Home,
  Library,
  Sparkles,
  Store,
} from "lucide-react";
import { EventCard } from "./components/EventCard";
import { ExpandableText } from "./components/ExpandableText";
import { PlayerProfilePanel } from "./components/PlayerProfilePanel";
import { SectionHeader } from "./components/SectionHeader";
import { StatCard } from "./components/StatCard";
import { ACTIVE_EVENTS } from "./data/events";
import {
  COMMUNITY_APP_DOWNLOAD_FALLBACK_URL,
  HOME_STATS,
  JOIN_STEPS,
  KINGDOM_ANNOUNCEMENTS,
  KINGDOM_STATUS,
} from "./data/home";
import { fetchRealmEvents } from "./utils/events";
import { fetchCommunityAppDownloadUrl } from "./utils/siteSettings";
import type { NavItem, TabId } from "./types";

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "grimoire", label: "Grimorio", icon: Sparkles },
  { id: "library", label: "Biblioteca", icon: Library },
  { id: "market", label: "Mercado", icon: Store },
];

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
const LibrarySection = lazy(loadLibrarySection);
const GrimoireSection = lazy(loadGrimoireSection);
const MarketSection = lazy(loadMarketSection);

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
    default:
      break;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    startTransition(() => setIsProfileCollapsed(activeTab !== "home"));
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300">
      <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-32 pt-5 md:max-w-6xl md:px-6 md:pt-8">
        <div className="mb-5">
          <PlayerProfilePanel
            collapsed={isProfileCollapsed}
            onCollapsedChange={setIsProfileCollapsed}
          />
        </div>

        <div key={activeTab} className="animate-[content-fade-in_180ms_ease-out]">
          {activeTab === "home" ? <HomeSection /> : null}
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
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-800/80 bg-stone-950/90 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2 px-3 pb-safe pt-3 md:max-w-6xl">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onMouseEnter={() => preloadTab(id)}
                onFocus={() => preloadTab(id)}
                onTouchStart={() => preloadTab(id)}
                onClick={() => {
                  startTransition(() => setActiveTab(id));
                }}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-[10px] font-semibold transition md:min-h-14 md:flex-row md:gap-2 md:text-xs ${
                  isActive
                    ? "border-amber-400/30 bg-amber-500/12 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
                    : "border-transparent bg-stone-900/70 text-stone-400"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-amber-400" : "text-stone-500"}`}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeSection() {
  const StatusIcon = KINGDOM_STATUS.icon;
  const [events, setEvents] = useState(ACTIVE_EVENTS);
  const [communityAppDownloadUrl, setCommunityAppDownloadUrl] = useState(
    COMMUNITY_APP_DOWNLOAD_FALLBACK_URL
  );

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      const [eventsResult, nextUrl] = await Promise.all([
        fetchRealmEvents(),
        fetchCommunityAppDownloadUrl(COMMUNITY_APP_DOWNLOAD_FALLBACK_URL),
      ]);

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setEvents(eventsResult.events);
        setCommunityAppDownloadUrl(nextUrl);
      });
    }

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6 shadow-2xl shadow-black/30 md:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
          <Castle className="h-4 w-4" />
          Reino vivo por WhatsApp
        </div>

        <h1 className="text-4xl font-black leading-none text-stone-100 md:text-5xl">
          Reino de las Sombras
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-300/90 md:text-base">
          Intrigas de corte, guerra entre facciones y reliquias prohibidas en un
          reino donde cada decision puede convertirte en leyenda o condenarte al
          olvido.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 md:max-w-xl">
          {HOME_STATS.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          {communityAppDownloadUrl ? (
            <a
              href={communityAppDownloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-4 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 md:w-fit md:min-w-72"
            >
              <Download className="h-4 w-4" />
              Descargar app de la comunidad
            </a>
          ) : (
            <div className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100 md:w-fit md:min-w-72">
              <p className="font-extrabold text-amber-300">App de la comunidad</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-amber-200/80">
                Configura el enlace de descarga cuando el APK este listo
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/75 p-5 md:p-6">
          <h2 className="text-lg font-bold text-stone-100">La noche se mueve</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Participa en asedios, pactos secretos, cacerias y duelos narrativos
            con estetica medieval oscura y progresion competitiva.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
                {KINGDOM_STATUS.eyebrow}
              </p>
              <p className="mt-2 text-2xl font-black text-stone-100">
                {KINGDOM_STATUS.title}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
              <StatusIcon className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            {KINGDOM_STATUS.description}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 [content-visibility:auto] [contain-intrinsic-size:760px]">
        <SectionHeader
          eyebrow="Agenda del reino"
          title="Eventos activos"
          description="Cada evento conserva imagen, cronica, fechas y estado para que el calendario del rol siempre se sienta vivo."
          rightSlot={
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
              {events.length} eventos
            </span>
          }
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.title} event={event} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr] [content-visibility:auto] [contain-intrinsic-size:680px]">
        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Tablon del reino" title="Anuncios del consejo" />
          <div className="mt-4 space-y-3">
            {KINGDOM_ANNOUNCEMENTS.map((announcement) => (
              <div
                key={announcement.title}
                className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4"
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

        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Primeros pasos" title="Como unirse y empezar" />
          <div className="mt-4 space-y-3">
            {JOIN_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4"
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

      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] [content-visibility:auto] [contain-intrinsic-size:420px]">
        <CollapsiblePanel
          title="Estado del reino"
          subtitle="Una lectura rápida de los frentes abiertos antes de sumarte al conflicto."
        >
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
                Panorama actual
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                <ExpandableText
                  text={`${KINGDOM_STATUS.description} Cada semana cambian las presiones entre facciones, el mercado altera los incentivos y los eventos abiertos mueven el pulso del rol.`}
                  lines={6}
                />
              </p>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Notas del cronista"
          subtitle="Contexto breve para entrar al rol sin perderte entre facciones, reliquias y pactos."
        >
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4">
              <p className="text-sm leading-6 text-stone-400">
                <ExpandableText
                  text="Cada semana el reino gira entre asedios, expediciones, intrigas diplomáticas y pactos que pueden beneficiar o hundir a una facción completa. Entrar con contexto te ayuda a reaccionar mejor cuando el consejo cambia el pulso de la campaña."
                  lines={5}
                />
              </p>
            </div>
          </div>
        </CollapsiblePanel>
      </div>
    </section>
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
    <details className="group rounded-[1.75rem] border border-stone-800 bg-stone-900/75 p-5">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] border border-stone-800 bg-stone-950 px-5 py-6 text-center shadow-2xl shadow-black/40">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
          Cargando
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-300">{message}</p>
      </div>
    </div>
  );
}
