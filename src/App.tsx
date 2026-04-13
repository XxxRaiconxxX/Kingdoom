import { lazy, Suspense, useEffect, useMemo, useState, startTransition } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  Castle,
  ChevronDown,
  Dices,
  Home,
  Map,
  ScrollText,
  Store,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { EventCard } from "./components/EventCard";
import { ExpandableText } from "./components/ExpandableText";
import { FilterPill } from "./components/FilterPill";
import { MarketItemCard } from "./components/MarketItemCard";
import { PlayerProfilePanel } from "./components/PlayerProfilePanel";
import { RankingCard } from "./components/RankingCard";
import { SectionHeader } from "./components/SectionHeader";
import { StatCard } from "./components/StatCard";
import { ACTIVE_EVENTS } from "./data/events";
import {
  HOME_STATS,
  JOIN_STEPS,
  KINGDOM_ANNOUNCEMENTS,
  KINGDOM_STATUS,
  WHATSAPP_JOIN_URL,
} from "./data/home";
import { LORE_CHAPTERS, LORE_RULES, REALM_FACTIONS } from "./data/lore";
import { MARKET_CATEGORIES, MARKET_ITEMS } from "./data/market";
import {
  COMMON_THREATS,
  DEMOGRAPHIC_BLOCS,
  DIPLOMATIC_TENSIONS,
  WORLD_STATUS,
} from "./data/world";
import {
  fetchWeeklyRanking,
  formatCountdown,
  formatRankingWindow,
} from "./utils/weeklyRanking";
import { fetchRealmEvents } from "./utils/events";
import { fetchMarketItems } from "./utils/market";
import type {
  MarketCategory, MarketCategoryId, MarketItem, NavItem, RankingPlayer, RankingWindow, TabId,
} from "./types";

type TavernMode = "chests" | "roulette" | "cards" | "scratch";

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "lore", label: "Lore", icon: ScrollText },
  { id: "world", label: "Mundo", icon: Map },
  { id: "market", label: "Mercado", icon: Store },
  { id: "ranking", label: "Ranking", icon: Trophy },
];

const TAVERN_MODES: {
  id: TavernMode;
  label: string;
  description: string;
}[] = [
  {
    id: "chests",
    label: "Cofres",
    description: "Doble o nada con cofres malditos y recompensas inmediatas.",
  },
  {
    id: "roulette",
    label: "Ruleta",
    description: "Gira la rueda y apuesta por multiplicadores impredecibles.",
  },
  {
    id: "cards",
    label: "Cartas",
    description: "Adivina si la siguiente carta sube o baja para llevarte el pozo.",
  },
  {
    id: "scratch",
    label: "Rasca",
    description: "Compra un rasca y gana y prueba suerte por un premio entre 500 y 1000 de oro.",
  },
];

const pageTransition = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.28, ease: "easeOut" as const },
};

const TavernGame = lazy(() =>
  import("./components/TavernGame").then((module) => ({
    default: module.TavernGame,
  }))
);
const TavernRoulette = lazy(() =>
  import("./components/TavernRoulette").then((module) => ({
    default: module.TavernRoulette,
  }))
);
const TavernCards = lazy(() =>
  import("./components/TavernCards").then((module) => ({
    default: module.TavernCards,
  }))
);
const TavernScratch = lazy(() =>
  import("./components/TavernScratch").then((module) => ({
    default: module.TavernScratch,
  }))
);
const PurchaseModal = lazy(() =>
  import("./components/PurchaseModal").then((module) => ({
    default: module.PurchaseModal,
  }))
);
const WeeklyRankingPodium = lazy(() =>
  import("./components/WeeklyRankingPodium").then((module) => ({
    default: module.WeeklyRankingPodium,
  }))
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300">
      <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-32 pt-5 md:max-w-6xl md:px-6 md:pt-8">
        <div className="mb-5">
          <PlayerProfilePanel />
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
            {activeTab === "lore" ? <LoreSection /> : null}
            {activeTab === "world" ? <WorldSection /> : null}
            {activeTab === "market" ? <MarketSection /> : null}
            {activeTab === "ranking" ? <RankingSection /> : null}
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

function HomeSection() {
  const StatusIcon = KINGDOM_STATUS.icon;
  const [events, setEvents] = useState(ACTIVE_EVENTS);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      const result = await fetchRealmEvents();

      if (cancelled) {
        return;
      }

      setEvents(result.events);
    }

    void loadEvents();

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

        <a
          href={WHATSAPP_JOIN_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-4 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 md:w-fit md:min-w-72"
        >
          Unirse al Gremio (WhatsApp)
        </a>
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

      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
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

      <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
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
    </section>
  );
}

function LoreSection() {
  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Lore y reglas"
          title="Leyes de la penumbra"
          description="Aqui dejamos lo mas importante para jugar: reglas base, cronica principal y las facciones narrativas que empujan la temporada."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {LORE_RULES.map((rule) => {
          const Icon = rule.icon;

          return (
            <article
              key={rule.title}
              className="rounded-[1.75rem] border border-stone-800 bg-stone-900/75 p-5"
            >
              <div className="w-fit rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-stone-100">
                {rule.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                {rule.description}
              </p>
            </article>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Historia principal"
          title="El pulso de la temporada"
          description="La cronica larga queda resumida al principio y puedes expandir cada bloque solo si te interesa leer mas."
        />
        <div className="mt-4 rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-5">
          <ExpandableText
            lines={4}
            text="Hace veinte inviernos, el Sol de Ceniza desaparecio detras de un eclipse eterno. Desde entonces, el Reino de las Sombras vive dividido entre casas nobles en decadencia, ordenes religiosas quebradas y gremios que comercian con reliquias prohibidas. La Corona de Carbon ha vuelto a emitir un fulgor oscuro bajo las ruinas de Valdren, y quien la reclame podria unir el reino o romperlo por completo."
          />
        </div>
      </div>

      <div className="space-y-3">
        {LORE_CHAPTERS.map((chapter) => (
          <CollapsiblePanel
            key={chapter.title}
            title={chapter.title}
            subtitle={chapter.summary}
          >
            <ExpandableText text={chapter.content} lines={4} />
          </CollapsiblePanel>
        ))}
      </div>

      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Facciones"
          title="Fuerzas del relato"
          description="Las principales facciones del rol quedan resumidas para que el jugador nuevo no se pierda."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {REALM_FACTIONS.map((faction) => (
            <article
              key={faction.name}
              className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-5"
            >
              <h3 className="text-lg font-bold text-stone-100">{faction.name}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                {faction.motto}
              </p>
              <div className="mt-3">
                <ExpandableText text={faction.description} lines={3} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorldSection() {
  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Mundo y geopolitica"
          title="Aethelgardia"
          description="Aqui vive el worldbuilding pesado para que el lore no se sienta saturado: demografia, tensiones diplomaticas y amenazas del continente."
        />
      </div>

      <div className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Estado del mundo"
          title={WORLD_STATUS.title}
          description={WORLD_STATUS.description}
        />
      </div>

      <div className="space-y-3">
        {DEMOGRAPHIC_BLOCS.map((bloc) => (
          <CollapsiblePanel
            key={bloc.realm}
            title={bloc.realm}
            subtitle={bloc.epithet}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {bloc.groups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-[1.35rem] border border-stone-800 bg-stone-950/45 p-4"
                >
                  <p className="text-sm font-bold text-stone-100">{group.title}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    {group.races.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </CollapsiblePanel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Diplomacia" title="Tensiones activas" />
          <div className="mt-4 space-y-3">
            {DIPLOMATIC_TENSIONS.map((note) => (
              <article
                key={note.title}
                className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4"
              >
                <h3 className="text-sm font-bold text-stone-100">{note.title}</h3>
                <div className="mt-3">
                  <ExpandableText text={note.description} lines={3} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader
            eyebrow="Peligros del continente"
            title="Amenazas comunes"
          />
          <div className="mt-4 space-y-3">
            {COMMON_THREATS.map((note) => (
              <article
                key={note.title}
                className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4"
              >
                <h3 className="text-sm font-bold text-stone-100">{note.title}</h3>
                <div className="mt-3">
                  <ExpandableText text={note.description} lines={3} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketSection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    MarketCategoryId | "all"
  >("all");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [tavernMode, setTavernMode] = useState<TavernMode>("chests");
  const [marketItems, setMarketItems] = useState<MarketItem[]>(MARKET_ITEMS);

  useEffect(() => {
    let cancelled = false;

    async function loadMarketItems() {
      const result = await fetchMarketItems();

      if (cancelled) {
        return;
      }

      setMarketItems(result.items);
    }

    void loadMarketItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoriesToRender = useMemo(
    () =>
      selectedCategoryId === "all"
        ? MARKET_CATEGORIES
        : MARKET_CATEGORIES.filter(
            (category) => category.id === selectedCategoryId
          ),
    [selectedCategoryId]
  );

  const featuredItems = useMemo(
    () => marketItems.filter((item) => item.featured),
    [marketItems]
  );

  const modalCategory = useMemo(
    () =>
      selectedItem
        ? MARKET_CATEGORIES.find(
            (category) => category.id === selectedItem.category
          )
        : undefined,
    [selectedItem]
  );

  const tavernContent = useMemo(() => {
    switch (tavernMode) {
      case "roulette":
        return <TavernRoulette />;
      case "cards":
        return <TavernCards />;
      case "scratch":
        return <TavernScratch />;
      default:
        return <TavernGame />;
    }
  }, [tavernMode]);

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Mercado negro"
          title="Catalogos del reino"
          description="La compra usa tu perfil conectado para verificar y descontar el oro en Supabase, y cada categoria queda organizada como un catalogo desplegable."
          rightSlot={
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
              {marketItems.length} articulos
            </span>
          }
        />
      </div>

      <details className="group rounded-[2rem] border border-rose-500/15 bg-stone-900/75 p-6">
        <summary className="flex cursor-pointer list-none flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-300">
              <Dices className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
                Taberna clandestina
              </p>
              <h3 className="mt-2 text-xl font-bold text-stone-100">
                Juegos de azar
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                La mesa sigue viva dentro del mercado. Cambia entre cofres, ruleta o cartas sin salir de la taberna.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end sm:justify-start">
            <div className="rounded-2xl bg-stone-800 p-3 text-stone-300 transition group-open:rotate-180 group-open:text-rose-300">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </summary>

        <div className="border-t border-stone-800 pt-5 mt-5">
          <div className="flex flex-wrap gap-2">
            {TAVERN_MODES.map((mode) => (
              <FilterPill
                key={mode.id}
                label={mode.label}
                active={tavernMode === mode.id}
                onClick={() => setTavernMode(mode.id)}
              />
            ))}
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-stone-800 bg-stone-950/45 px-4 py-3">
            <p className="text-sm leading-6 text-stone-400">
              {
                TAVERN_MODES.find((mode) => mode.id === tavernMode)?.description
              }
            </p>
          </div>

          <div className="mt-5">
            <Suspense fallback={<EmbeddedLoadingCard message="Abriendo la mesa de juego..." />}>
              {tavernContent}
            </Suspense>
          </div>
        </div>
      </details>

      {featuredItems.length > 0 ? (
        <div className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6">
          <SectionHeader
            eyebrow="Selecciones del mercader"
            title="Objetos destacados"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {featuredItems.map((item) => (
              <MarketItemCard
                key={`featured-${item.name}`}
                item={item}
                onBuy={() => setSelectedItem(item)}
                hideImage
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
        <SectionHeader
          eyebrow="Filtrar catalogo"
          title="Categorias del mercado"
          description="Puedes ver todo junto o quedarte solo con una familia de objetos."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterPill
            label="Todos"
            active={selectedCategoryId === "all"}
            onClick={() => setSelectedCategoryId("all")}
          />
          {MARKET_CATEGORIES.map((category) => (
            <FilterPill
              key={category.id}
              label={category.title}
              active={selectedCategoryId === category.id}
              onClick={() => setSelectedCategoryId(category.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {categoriesToRender.map((category) => (
          <MarketCategoryPanel
            key={category.id}
            category={category}
            items={marketItems.filter((item) => item.category === category.id)}
            onBuy={(item) => setSelectedItem(item)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedItem ? (
          <Suspense fallback={<FullscreenLoadingOverlay message="Preparando el pedido del mercado..." />}>
            <PurchaseModal
              item={selectedItem}
              category={modalCategory}
              onClose={() => setSelectedItem(null)}
            />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function RankingSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [rankingMessage, setRankingMessage] = useState("");
  const [rankingWindow, setRankingWindow] = useState<RankingWindow | null>(null);
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [factionFilter, setFactionFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;

    async function loadRanking() {
      setIsLoading(true);
      const ranking = await fetchWeeklyRanking();

      if (cancelled) {
        return;
      }

      setPlayers(ranking.players);
      setRankingWindow(ranking.window);
      setRankingMessage(ranking.message);
      setTimeLeft(formatCountdown(ranking.window.weekEndsAt));
      setIsLoading(false);
    }

    void loadRanking();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!rankingWindow) {
      return;
    }

    setTimeLeft(formatCountdown(rankingWindow.weekEndsAt));

    const intervalId = window.setInterval(() => {
      setTimeLeft(formatCountdown(rankingWindow.weekEndsAt));
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [rankingWindow]);

  const factions = useMemo(
    () => Array.from(new Set(players.map((player) => player.faction))),
    [players]
  );

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) =>
        factionFilter === "all" ? true : player.faction === factionFilter
      ),
    [factionFilter, players]
  );

  const podiumPlayers = useMemo(() => filteredPlayers.slice(0, 3), [filteredPlayers]);
  const rankingLabel = rankingWindow ? formatRankingWindow(rankingWindow) : "";

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 md:p-7">
        <SectionHeader
          eyebrow="Temporada semanal"
          title="Ranking de actividad"
          description="El podio premia a quienes mas participan en misiones y eventos oficiales durante la semana actual."
          rightSlot={
            <div className="rounded-[1.4rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Cierra en
              </p>
              <p className="mt-1 text-lg font-black text-stone-100">
                {timeLeft || "--"}
              </p>
            </div>
          }
        />
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
          <span className="rounded-full border border-stone-700 bg-stone-950/55 px-3 py-2">
            {rankingLabel || "Semana actual"}
          </span>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-300">
            Misiones + eventos
          </span>
        </div>
        {rankingMessage ? (
          <p className="mt-4 text-sm leading-6 text-stone-400">{rankingMessage}</p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 text-sm text-stone-400">
          Cargando la temporada semanal...
        </div>
      ) : (
        <>
          <Suspense
            fallback={
              <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 text-sm text-stone-400">
                Preparando el podio semanal...
              </div>
            }
          >
            <WeeklyRankingPodium players={podiumPlayers} />
          </Suspense>

          <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
            <SectionHeader
              eyebrow="Filtro tactico"
              title="Enfocar por faccion"
              description="El ranking se reordena solo para la faccion elegida, sin tocar la tabla general."
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <FilterPill
                label="Todas las facciones"
                active={factionFilter === "all"}
                onClick={() => setFactionFilter("all")}
              />
              {factions.map((faction) => (
                <FilterPill
                  key={faction}
                  label={faction}
                  active={factionFilter === faction}
                  onClick={() => setFactionFilter(faction)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
            <SectionHeader
              eyebrow="Tabla completa"
              title="Participacion acumulada"
              description="Cada punto refleja presencia en misiones, eventos y racha de actividad dentro de la semana."
            />
            <div className="mt-5 space-y-4">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, index) => (
                  <RankingCard key={player.id} player={player} index={index} />
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-stone-700 bg-stone-950/45 p-5 text-sm leading-6 text-stone-400">
                  No hay jugadores cargados para esa faccion en la temporada actual.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function MarketCategoryPanel({
  category,
  items,
  onBuy,
}: {
  category: MarketCategory;
  items: MarketItem[];
  onBuy: (item: MarketItem) => void;
}) {
  const Icon = category.icon;

  return (
    <details
      open
      className="group rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-100">{category.title}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              {category.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-300">
            {items.length} items
          </span>
          <div className="rounded-2xl bg-stone-800 p-3 text-stone-300 transition group-open:rotate-180 group-open:text-amber-300">
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </summary>

      <div className="mt-5 grid gap-4 border-t border-stone-800 pt-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <MarketItemCard
            key={`${category.id}-${item.name}`}
            item={item}
            onBuy={() => onBuy(item)}
          />
        ))}
      </div>
    </details>
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

function EmbeddedLoadingCard({ message }: { message: string }) {
  return (
    <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/45 p-5 text-sm leading-6 text-stone-400">
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
