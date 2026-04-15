import { lazy, Suspense, useState, startTransition } from "react";
import { Home, Library, Sparkles, Store, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PlayerProfilePanel } from "./components/PlayerProfilePanel";
import { HomeSection } from "./sections/HomeSection";
import type { NavItem, TabId } from "./types";

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "grimoire", label: "Grimorio", icon: Sparkles },
  { id: "library", label: "Biblioteca", icon: Library },
  { id: "market", label: "Mercado", icon: Store },
  { id: "ranking", label: "Ranking", icon: Trophy },
];

const pageTransition = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.28, ease: "easeOut" as const },
};

const GrimoireSection = lazy(() =>
  import("./components/GrimoireSection").then((module) => ({
    default: module.GrimoireSection,
  }))
);
const LibrarySection = lazy(() =>
  import("./components/LibrarySection").then((module) => ({
    default: module.LibrarySection,
  }))
);
const MarketSection = lazy(() =>
  import("./sections/MarketSection").then((module) => ({
    default: module.MarketSection,
  }))
);
const RankingSection = lazy(() =>
  import("./sections/RankingSection").then((module) => ({
    default: module.RankingSection,
  }))
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false);

  function handleTabChange(nextTab: TabId) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    startTransition(() => {
      setActiveTab(nextTab);
      setIsProfileCollapsed(nextTab !== "home");
    });
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300">
      <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-32 pt-5 md:max-w-6xl md:px-6 md:pt-8">
        <div className="mb-5">
          <PlayerProfilePanel
            collapsed={isProfileCollapsed}
            onCollapsedChange={setIsProfileCollapsed}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
          >
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
              <Suspense fallback={<SectionLoadingCard message="Cargando catalogos del mercado..." />}>
                <MarketSection />
              </Suspense>
            ) : null}
            {activeTab === "ranking" ? (
              <Suspense fallback={<SectionLoadingCard message="Cargando la tabla del reino..." />}>
                <RankingSection />
              </Suspense>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-800/80 bg-stone-950/90 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-2 px-3 pt-3 pb-safe md:max-w-6xl">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-[10px] font-semibold transition md:min-h-14 md:flex-row md:gap-2 md:text-xs ${
                  isActive
                    ? "border-amber-400/30 bg-amber-500/12 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
                    : "border-transparent bg-stone-900/70 text-stone-400"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-amber-400" : "text-stone-500"
                  }`}
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

function SectionLoadingCard({ message }: { message: string }) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 text-sm leading-6 text-stone-400">
      {message}
    </div>
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
