import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Box,
  ChevronDown,
  Dices,
  Info,
  RotateCcw,
  ScrollText,
  Sparkles,
  Swords,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { FilterPill } from "../components/FilterPill";
import { MarketItemCard } from "../components/MarketItemCard";
import { SectionHeader } from "../components/SectionHeader";
import { MARKET_CATEGORIES, MARKET_ITEMS } from "../data/market";
import { useGsapStaggerReveal } from "../hooks/useGsapStaggerReveal";
import { fetchMarketItems } from "../utils/market";
import { isNativeApp } from "../utils/platform";
import type { LucideIcon } from "lucide-react";
import type { MarketCategory, MarketCategoryId, MarketItem, Rarity } from "../types";

type TavernMode =
  | "expedition"
  | "liveHunt"
  | "chests"
  | "roulette"
  | "cards"
  | "scratch"
  | "crash";

const TAVERN_MODES: {
  id: TavernMode;
  label: string;
  description: string;
  status: string;
  icon: LucideIcon;
}[] = [
  {
    id: "expedition",
    label: "Expedicion",
    description: "Combate PvE arcade: eliges contrato, atacas, te defiendes y cazas recompensas sin saturar la pantalla.",
    status: "PvE",
    icon: Swords,
  },
  {
    id: "liveHunt",
    label: "Comunal",
    description:
      "Evento exclusivo de la app: host, sala en vivo, fichas reales de Expedicion y rondas cooperativas para tumbar contratos entre varios jugadores.",
    status: "App",
    icon: Sparkles,
  },
  {
    id: "chests",
    label: "Cofres",
    description: "Doble o nada con cofres malditos y recompensas inmediatas.",
    status: "Azar",
    icon: Box,
  },
  {
    id: "roulette",
    label: "Ruleta",
    description: "Gira la rueda y apuesta por multiplicadores impredecibles.",
    status: "Riesgo",
    icon: RotateCcw,
  },
  {
    id: "cards",
    label: "Cartas",
    description: "Adivina si la siguiente carta sube o baja para llevarte el pozo.",
    status: "Azar",
    icon: ScrollText,
  },
  {
    id: "scratch",
    label: "Rasca",
    description: "Compra un rasca y gana y prueba suerte por un premio entre 500 y 1000 de oro.",
    status: "Rapido",
    icon: Ticket,
  },
  {
    id: "crash",
    label: "Multiplicador",
    description: "El Multiplicador del Vacio: Retira tu apuesta antes de que la energia colapse.",
    status: "Riesgo",
    icon: TrendingUp,
  },
];

const MARKET_RARITY_FILTERS: Array<{ id: Rarity | "all"; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "common", label: "Comun" },
  { id: "rare", label: "Raro" },
  { id: "epic", label: "Epico" },
  { id: "legendary", label: "Legendario" },
];

type PriceSort = "featured" | "low" | "high";

const PRICE_SORTS: Array<{ id: PriceSort; label: string }> = [
  { id: "featured", label: "Destacado" },
  { id: "low", label: "Menor precio" },
  { id: "high", label: "Mayor precio" },
];

const TAVERN_MODE_STORAGE_KEY = "kingdoom:last-tavern-mode";

const TavernExpedition = lazy(() =>
  import("../components/TavernExpeditionArcade").then((module) => ({
    default: module.TavernExpeditionArcade,
  }))
);
const AppLiveHuntSection = lazy(() =>
  import("../components/AppLiveHuntSection").then((module) => ({
    default: module.AppLiveHuntSection,
  }))
);
const TavernGame = lazy(() =>
  import("../components/TavernGame").then((module) => ({
    default: module.TavernGame,
  }))
);
const TavernRoulette = lazy(() =>
  import("../components/TavernRoulette").then((module) => ({
    default: module.TavernRoulette,
  }))
);
const TavernCards = lazy(() =>
  import("../components/TavernCards").then((module) => ({
    default: module.TavernCards,
  }))
);
const TavernScratch = lazy(() =>
  import("../components/TavernScratch").then((module) => ({
    default: module.TavernScratch,
  }))
);
const TavernCrash = lazy(() =>
  import("../components/TavernCrash").then((module) => ({
    default: module.TavernCrash,
  }))
);
const PurchaseModal = lazy(() =>
  import("../components/PurchaseModal").then((module) => ({
    default: module.PurchaseModal,
  }))
);

export function MarketSection() {
  const marketRevealRef = useRef<HTMLElement | null>(null);
  const nativeApp = isNativeApp();
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    MarketCategoryId | "all"
  >("all");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [tavernMode, setTavernMode] = useState<TavernMode>("expedition");
  const [isTavernInfoOpen, setIsTavernInfoOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [priceSort, setPriceSort] = useState<PriceSort>("featured");
  const [marketItems, setMarketItems] = useState<MarketItem[]>(MARKET_ITEMS);

  useEffect(() => {
    const storedMode = window.localStorage.getItem(TAVERN_MODE_STORAGE_KEY) as TavernMode | null;

    if (!storedMode) {
      return;
    }

    if (storedMode === "liveHunt" && !nativeApp) {
      return;
    }

    if (TAVERN_MODES.some((mode) => mode.id === storedMode)) {
      setTavernMode(storedMode);
    }
  }, [nativeApp]);

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
        : MARKET_CATEGORIES.filter((category) => category.id === selectedCategoryId),
    [selectedCategoryId]
  );

  const filteredMarketItems = useMemo(() => {
    const filteredItems = rarityFilter === "all"
      ? marketItems
      : marketItems.filter((item) => item.rarity === rarityFilter);

    return filteredItems.slice().sort((a, b) => {
      if (priceSort === "low") {
        return a.price - b.price;
      }

      if (priceSort === "high") {
        return b.price - a.price;
      }

      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [marketItems, priceSort, rarityFilter]);

  const featuredItems = useMemo(
    () => filteredMarketItems.filter((item) => item.featured),
    [filteredMarketItems]
  );

  const modalCategory = useMemo(
    () =>
      selectedItem
        ? MARKET_CATEGORIES.find((category) => category.id === selectedItem.category)
        : undefined,
    [selectedItem]
  );

  const tavernModes = useMemo(
    () => TAVERN_MODES.filter((mode) => nativeApp || mode.id !== "liveHunt"),
    [nativeApp]
  );

  const currentTavernMode = useMemo(
    () => tavernModes.find((mode) => mode.id === tavernMode) ?? tavernModes[0],
    [tavernMode, tavernModes]
  );

  const tavernContent = useMemo(() => {
    switch (tavernMode) {
      case "expedition":
        return <TavernExpedition />;
      case "liveHunt":
        return nativeApp ? <AppLiveHuntSection /> : <TavernExpedition />;
      case "roulette":
        return <TavernRoulette />;
      case "cards":
        return <TavernCards />;
      case "scratch":
        return <TavernScratch />;
      case "crash":
        return <TavernCrash />;
      default:
        return <TavernGame />;
    }
  }, [nativeApp, tavernMode]);

  const selectTavernMode = (mode: TavernMode) => {
    setTavernMode(mode);
    window.localStorage.setItem(TAVERN_MODE_STORAGE_KEY, mode);
  };

  useGsapStaggerReveal(marketRevealRef, {
    selector: "[data-gsap-market]",
    duration: 0.54,
    stagger: 0.07,
    y: 18,
    delay: 0.03,
    dependencies: [
      selectedCategoryId,
      rarityFilter,
      priceSort,
      tavernMode,
      categoriesToRender.length,
      featuredItems.length,
    ],
  });

  return (
    <section ref={marketRevealRef} className="space-y-5">
      <div
        data-gsap-market
        className="kd-glass kd-stagger rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6"
      >
        <SectionHeader
          eyebrow="Mercado negro"
          title="Catalogos del reino"
          rightSlot={
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
              {marketItems.length} articulos
            </span>
          }
        />
      </div>

      <details
        data-gsap-market
        className="kd-glass kd-hover-lift group rounded-[2rem] border border-rose-500/15 bg-stone-900/75 p-6"
      >
        <summary className="kd-touch flex cursor-pointer list-none flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-300">
              <Dices className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
                Taberna clandestina
              </p>
              <h3 className="mt-2 text-xl font-bold text-stone-100">Juegos de azar</h3>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end sm:justify-start">
            <div className="rounded-2xl bg-stone-800 p-3 text-stone-300 transition group-open:rotate-180 group-open:text-rose-300">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </summary>

        <div className="mt-5 border-t border-stone-800 pt-5">
          <div className="flex w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tavernModes.map((mode) => {
              const Icon = mode.icon;
              const active = tavernMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => selectTavernMode(mode.id)}
                  className={`kd-touch flex min-w-[8.2rem] flex-col gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-amber-400/35 bg-amber-500/12 text-amber-100"
                      : "border-stone-800 bg-stone-950/55 text-stone-400 hover:border-amber-500/20"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <Icon className={`h-4 w-4 ${active ? "text-amber-300" : "text-stone-500"}`} />
                    <span className="rounded-full border border-stone-700/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]">
                      {mode.status}
                    </span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.14em]">
                    {mode.label}
                  </span>
                </button>
              );
            })}
          </div>

          {currentTavernMode ? (
            <div className="mt-3 rounded-[1.3rem] border border-stone-800 bg-stone-950/45 p-3">
              <button
                type="button"
                onClick={() => setIsTavernInfoOpen((current) => !current)}
                className="kd-touch flex w-full items-center justify-between gap-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-300"
              >
                <span className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-300" />
                  Info del modo
                </span>
                <ChevronDown className={`h-4 w-4 transition ${isTavernInfoOpen ? "rotate-180 text-amber-300" : "text-stone-500"}`} />
              </button>
              {isTavernInfoOpen ? (
                <p className="mt-3 text-sm leading-6 text-stone-400">
                  {currentTavernMode.description}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5">
            <Suspense fallback={<EmbeddedLoadingCard message="Abriendo la mesa de juego..." />}>
              {tavernContent}
            </Suspense>
          </div>
        </div>
      </details>

      {featuredItems.length > 0 ? (
        <div
          data-gsap-market
          className="kd-glass rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6"
        >
          <SectionHeader eyebrow="Selecciones del mercader" title="Objetos destacados" />
          <div className="kd-stagger mt-5 grid gap-4 md:grid-cols-2">
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

      <div
        data-gsap-market
        className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6"
      >
        <SectionHeader
          eyebrow="Filtrar catalogo"
          title="Categorias del mercado"
        />
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex-shrink-0">
            <FilterPill
              label="Todos"
              active={selectedCategoryId === "all"}
              onClick={() => setSelectedCategoryId("all")}
            />
          </div>
          {MARKET_CATEGORIES.map((category) => (
            <div key={category.id} className="flex-shrink-0">
              <FilterPill
                label={category.title}
                active={selectedCategoryId === category.id}
                onClick={() => setSelectedCategoryId(category.id)}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsAdvancedFiltersOpen((current) => !current)}
          className="kd-touch mt-4 inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/70 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-300 transition hover:border-amber-500/25 hover:text-stone-100"
        >
          <ChevronDown
            className={`h-4 w-4 transition ${isAdvancedFiltersOpen ? "rotate-180 text-amber-300" : "text-stone-500"}`}
          />
          {isAdvancedFiltersOpen ? "Ocultar filtros" : "Ver filtros"}
        </button>
        <div className={`mt-4 space-y-4 ${isAdvancedFiltersOpen ? "block" : "hidden"}`}>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Rareza
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {MARKET_RARITY_FILTERS.map((filter) => (
                <div key={filter.id} className="flex-shrink-0">
                  <FilterPill
                    label={filter.label}
                    active={rarityFilter === filter.id}
                    onClick={() => setRarityFilter(filter.id)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Orden
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PRICE_SORTS.map((sort) => (
                <div key={sort.id} className="flex-shrink-0">
                  <FilterPill
                    label={sort.label}
                    active={priceSort === sort.id}
                    onClick={() => setPriceSort(sort.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        data-gsap-market
        className="space-y-4"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1200px" }}
      >
        {categoriesToRender.map((category) => (
          <MarketCategoryPanel
            key={category.id}
            category={category}
            items={filteredMarketItems.filter((item) => item.category === category.id)}
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
    <details className="kd-glass kd-hover-lift group rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
      <summary className="kd-touch flex cursor-pointer list-none items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-100">{category.title}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-400">{category.subtitle}</p>
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

      <div className="kd-stagger mt-5 grid gap-4 border-t border-stone-800 pt-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <MarketItemCard key={`${category.id}-${item.name}`} item={item} onBuy={() => onBuy(item)} />
        ))}
      </div>
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
