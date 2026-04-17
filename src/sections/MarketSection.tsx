import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, Dices } from "lucide-react";
import { FilterPill } from "../components/FilterPill";
import { MarketItemCard } from "../components/MarketItemCard";
import { SectionHeader } from "../components/SectionHeader";
import { MARKET_CATEGORIES, MARKET_ITEMS } from "../data/market";
import { fetchMarketItems } from "../utils/market";
import type { MarketCategory, MarketCategoryId, MarketItem } from "../types";

type TavernMode = "expedition" | "chests" | "roulette" | "cards" | "scratch" | "crash";

const TAVERN_MODES: {
  id: TavernMode;
  label: string;
  description: string;
}[] = [
  {
    id: "expedition",
    label: "Expedicion",
    description: "Combate PvE arcade: eliges contrato, atacas, te defiendes y cazas recompensas sin saturar la pantalla.",
  },
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
  {
    id: "crash",
    label: "Multiplicador",
    description: "El Multiplicador del Vacio: Retira tu apuesta antes de que la energia colapse.",
  },
];

const TavernExpedition = lazy(() =>
  import("../components/TavernExpeditionArcade").then((module) => ({
    default: module.TavernExpeditionArcade,
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    MarketCategoryId | "all"
  >("all");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [tavernMode, setTavernMode] = useState<TavernMode>("expedition");
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
        : MARKET_CATEGORIES.filter((category) => category.id === selectedCategoryId),
    [selectedCategoryId]
  );

  const featuredItems = useMemo(
    () => marketItems.filter((item) => item.featured),
    [marketItems]
  );

  const modalCategory = useMemo(
    () =>
      selectedItem
        ? MARKET_CATEGORIES.find((category) => category.id === selectedItem.category)
        : undefined,
    [selectedItem]
  );

  const tavernContent = useMemo(() => {
    switch (tavernMode) {
      case "expedition":
        return <TavernExpedition />;
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
              <h3 className="mt-2 text-xl font-bold text-stone-100">Juegos de azar</h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                La mesa sigue viva dentro del mercado. Ahora tambien puedes tomar contratos PvE arcade sin salir de la taberna.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end sm:justify-start">
            <div className="rounded-2xl bg-stone-800 p-3 text-stone-300 transition group-open:rotate-180 group-open:text-rose-300">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </summary>

        <div className="mt-5 border-t border-stone-800 pt-5">
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
              {TAVERN_MODES.find((mode) => mode.id === tavernMode)?.description}
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
          <SectionHeader eyebrow="Selecciones del mercader" title="Objetos destacados" />
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

      <div className="space-y-4" style={{ contentVisibility: "auto", containIntrinsicSize: "1200px" }}>
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
    <details className="group rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
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

      <div className="mt-5 grid gap-4 border-t border-stone-800 pt-5 md:grid-cols-2 xl:grid-cols-3">
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
