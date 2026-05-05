import { useState } from "react";
import { Coins, PackageCheck, ShieldAlert } from "lucide-react";
import type { MarketItem, Rarity, StockStatus } from "../types";

const rarityStyles: Record<
  Rarity,
  {
    label: string;
    card: string;
    badge: string;
    imageRing: string;
    glow?: string;
    glowBorder?: string;
    glowAnimation?: string;
    sheen?: string;
    sheenAnimation?: string;
  }
> = {
  mythic: {
    label: "Mitico",
    card: "border-red-200/90 bg-red-950/40 shadow-[0_0_42px_rgba(220,38,38,0.36),0_0_90px_rgba(127,29,29,0.28)]",
    badge: "bg-red-500/20 text-red-100 ring-1 ring-red-200/45 shadow-[0_0_18px_rgba(248,113,113,0.28)]",
    imageRing: "ring-red-300/60",
    glow:
      "bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.18),transparent_22%),radial-gradient(circle_at_top,rgba(248,113,113,0.46),transparent_48%),radial-gradient(circle_at_bottom,rgba(127,29,29,0.38),transparent_54%),linear-gradient(135deg,rgba(185,28,28,0.24),transparent_58%)] shadow-[0_0_34px_rgba(239,68,68,0.52),0_0_88px_rgba(153,27,27,0.42)]",
    glowBorder:
      "border border-red-100/65 shadow-[inset_0_0_24px_rgba(248,113,113,0.36),0_0_20px_rgba(239,68,68,0.22)]",
    glowAnimation: "market-neon-mythic",
    sheen:
      "bg-[linear-gradient(115deg,transparent_10%,rgba(255,255,255,0.04)_21%,rgba(254,202,202,0.34)_36%,rgba(255,255,255,0.18)_48%,rgba(220,38,38,0.28)_58%,rgba(255,228,230,0.08)_66%,transparent_82%)] opacity-90 blur-xl",
    sheenAnimation: "market-sheen-mythic",
  },
  legendary: {
    label: "Legendario",
    card: "border-amber-200/80 bg-amber-500/12 shadow-[0_0_34px_rgba(245,158,11,0.22)]",
    badge: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25",
    imageRing: "ring-amber-400/45",
    glow:
      "bg-[radial-gradient(circle_at_top,rgba(253,224,71,0.34),transparent_52%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.18),transparent_46%),radial-gradient(circle_at_center,rgba(252,211,77,0.12),transparent_62%)] shadow-[0_0_26px_rgba(245,158,11,0.38),0_0_62px_rgba(251,191,36,0.24)]",
    glowBorder:
      "border border-amber-100/55 shadow-[inset_0_0_18px_rgba(253,224,71,0.32),0_0_14px_rgba(252,211,77,0.12)]",
    glowAnimation: "market-neon-legendary",
    sheen:
      "bg-[linear-gradient(115deg,transparent_14%,rgba(255,251,235,0.03)_24%,rgba(253,224,71,0.22)_40%,rgba(255,255,255,0.12)_49%,rgba(245,158,11,0.18)_58%,rgba(255,244,214,0.06)_64%,transparent_80%)] opacity-75 blur-xl",
    sheenAnimation: "market-sheen-legendary",
  },
  epic: {
    label: "Epico",
    card: "border-fuchsia-200/70 bg-fuchsia-500/12 shadow-[0_0_28px_rgba(192,38,211,0.18)]",
    badge: "bg-fuchsia-400/15 text-fuchsia-200 ring-1 ring-fuchsia-400/25",
    imageRing: "ring-fuchsia-400/40",
    glow:
      "bg-[radial-gradient(circle_at_top,rgba(232,121,249,0.28),transparent_52%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.16),transparent_46%),radial-gradient(circle_at_center,rgba(217,70,239,0.08),transparent_62%)] shadow-[0_0_22px_rgba(192,38,211,0.3),0_0_52px_rgba(217,70,239,0.18)]",
    glowBorder:
      "border border-fuchsia-100/42 shadow-[inset_0_0_15px_rgba(232,121,249,0.24),0_0_12px_rgba(217,70,239,0.08)]",
    glowAnimation: "market-neon-epic",
    sheen:
      "bg-[linear-gradient(115deg,transparent_14%,rgba(255,255,255,0.03)_26%,rgba(232,121,249,0.18)_42%,rgba(255,255,255,0.08)_50%,rgba(168,85,247,0.14)_58%,transparent_78%)] opacity-66 blur-xl",
    sheenAnimation: "market-sheen-epic",
  },
  rare: {
    label: "Raro",
    card: "border-sky-400/55 bg-sky-500/10",
    badge: "bg-sky-400/15 text-sky-200 ring-1 ring-sky-400/25",
    imageRing: "ring-sky-400/35",
  },
  common: {
    label: "Comun",
    card: "border-stone-700 bg-stone-900/80",
    badge: "bg-stone-700/40 text-stone-300 ring-1 ring-stone-600/40",
    imageRing: "ring-stone-700/60",
  },
};

const stockStyles: Record<
  StockStatus,
  { label: string; badge: string; buttonDisabled: boolean }
> = {
  available: {
    label: "Disponible",
    badge: "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/20",
    buttonDisabled: false,
  },
  limited: {
    label: "Limitado",
    badge: "bg-amber-500/12 text-amber-300 ring-1 ring-amber-400/20",
    buttonDisabled: false,
  },
  "sold-out": {
    label: "Agotado",
    badge: "bg-rose-500/12 text-rose-200 ring-1 ring-rose-400/20",
    buttonDisabled: true,
  },
};

export function MarketItemCard({
  item,
  onBuy,
  hideImage = false,
}: {
  item: MarketItem;
  onBuy: () => void;
  hideImage?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAbilityExpanded, setIsAbilityExpanded] = useState(false);
  const style = rarityStyles[item.rarity];
  const stockLimit = Math.max(0, Math.floor(item.stockLimit ?? 0));
  const stockSold = Math.max(0, Math.floor(item.stockSold ?? 0));
  const remainingStock = stockLimit > 0 ? Math.max(0, stockLimit - stockSold) : null;
  const effectiveStockStatus =
    item.stockStatus === "sold-out" || remainingStock === 0
      ? "sold-out"
      : item.stockStatus;
  const stock = stockStyles[effectiveStockStatus];
  const stockLabel =
    effectiveStockStatus === "limited" && remainingStock !== null
      ? `${stock.label} ${remainingStock}/${stockLimit}`
      : stock.label;

  return (
    <article
      className={`kd-hover-lift relative overflow-hidden rounded-[1.5rem] border ${style.card}`}
    >
      {style.glow ? (
        <>
          <div
            className={`pointer-events-none absolute inset-0 rounded-[inherit] ${style.glow} ${style.glowAnimation ?? ""}`}
          />
          <div
            className={`pointer-events-none absolute inset-[1px] rounded-[calc(1.5rem-1px)] ${style.glowBorder} ${style.glowAnimation ?? ""}`}
          />
          {style.sheen ? (
            <div
              className={`pointer-events-none absolute inset-0 rounded-[inherit] ${style.sheen} ${style.sheenAnimation ?? ""}`}
            />
          ) : null}
        </>
      ) : null}

      {!hideImage ? (
        <div className="relative aspect-[5/4] bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 md:aspect-[4/5]">
          {!imageFailed ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              decoding="async"
              width={500}
              height={400}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              style={{
                objectFit: item.imageFit ?? "cover",
                objectPosition: item.imagePosition ?? "center",
              }}
              className={`h-full w-full ring-1 ring-inset ${style.imageRing}`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-stone-900 to-stone-950 p-6 text-center">
              <ShieldAlert className="h-8 w-8 text-amber-400" />
              <p className="text-sm font-semibold text-stone-200">
                Imagen externa no disponible
              </p>
              <p className="text-xs leading-5 text-stone-500">
                Revisa que la URL apunte directo a una imagen publica.
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-stone-950 via-stone-950/55 to-transparent" />
        </div>
      ) : null}

      <div className={`space-y-3 ${hideImage ? "p-4 md:p-5" : "p-3.5 md:p-4"}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="text-base font-bold text-stone-100 md:text-lg">{item.name}</h4>
          <div className="flex flex-wrap justify-end gap-1.5 md:gap-2">
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold md:px-3 md:text-xs ${style.badge}`}
            >
              {style.label}
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold md:px-3 md:text-xs ${stock.badge}`}
            >
              {stockLabel}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p
            className={`text-sm leading-6 text-stone-300/90 md:hidden ${
              isDescriptionExpanded ? "" : "line-clamp-2"
            }`}
          >
            {item.description}
          </p>
          <p className="hidden text-sm leading-6 text-stone-300/90 md:block">
            {item.description}
          </p>
          {item.description.length > 90 ? (
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded((current) => !current)}
              className="kd-touch text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300 transition hover:text-amber-200 md:hidden"
            >
              {isDescriptionExpanded ? "Ver menos" : "Ver mas"}
            </button>
          ) : null}
        </div>

        {item.ability ? (
          <>
            <div className="rounded-2xl border border-amber-500/10 bg-stone-950/45 px-3.5 py-3 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  Habilidad
                </p>
                <button
                  type="button"
                  onClick={() => setIsAbilityExpanded((current) => !current)}
                  className="kd-touch text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 transition hover:text-stone-200"
                >
                  {isAbilityExpanded ? "Ocultar" : "Ver"}
                </button>
              </div>
              {isAbilityExpanded ? (
                <p className="mt-2 text-sm leading-6 text-stone-300/85">
                  {item.ability}
                </p>
              ) : null}
            </div>
            <div className="hidden rounded-2xl border border-amber-500/10 bg-stone-950/45 px-4 py-3 md:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                Habilidad
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-300/85">
                {item.ability}
              </p>
            </div>
          </>
        ) : null}

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-stone-950/55 px-3 py-2 text-sm font-bold text-amber-300 ring-1 ring-inset ring-amber-500/10">
            <Coins className="h-4 w-4" />
            {item.price} de oro
          </div>
          {item.featured ? (
            <span className="w-fit rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
              Destacado
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onBuy}
          disabled={stock.buttonDisabled}
          className={`kd-touch flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition md:py-3 ${
            stock.buttonDisabled
              ? "cursor-not-allowed bg-stone-800 text-stone-500"
              : "bg-amber-500 text-stone-950 hover:bg-amber-400"
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          {stock.buttonDisabled ? "Agotado" : "Comprar"}
        </button>
      </div>
    </article>
  );
}
