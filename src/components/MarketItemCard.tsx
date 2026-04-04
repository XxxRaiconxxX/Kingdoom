import { useState } from "react";
import { Coins, PackageCheck, ShieldAlert } from "lucide-react";
import type { MarketItem, Rarity, StockStatus } from "../types";

const rarityStyles: Record<
  Rarity,
  { label: string; card: string; badge: string; imageRing: string }
> = {
  legendary: {
    label: "Legendario",
    card: "border-amber-400/70 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.12)]",
    badge: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25",
    imageRing: "ring-amber-400/45",
  },
  epic: {
    label: "Epico",
    card: "border-fuchsia-400/55 bg-fuchsia-500/10",
    badge: "bg-fuchsia-400/15 text-fuchsia-200 ring-1 ring-fuchsia-400/25",
    imageRing: "ring-fuchsia-400/40",
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
  const style = rarityStyles[item.rarity];
  const stock = stockStyles[item.stockStatus];

  return (
    <article className={`overflow-hidden rounded-[1.5rem] border ${style.card}`}>
      {!hideImage ? (
        <div className="relative aspect-[4/5] bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
          {!imageFailed ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
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

      <div className={`space-y-3 ${hideImage ? "p-5" : "p-4"}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="text-lg font-bold text-stone-100">{item.name}</h4>
          <div className="flex flex-wrap justify-end gap-2">
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}
            >
              {style.label}
            </span>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${stock.badge}`}
            >
              {stock.label}
            </span>
          </div>
        </div>

        <p className="text-sm leading-6 text-stone-300/90">{item.description}</p>

        {item.ability ? (
          <div className="rounded-2xl border border-amber-500/10 bg-stone-950/45 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
              Habilidad
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300/85">
              {item.ability}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-stone-950/55 px-3 py-2 text-sm font-bold text-amber-300 ring-1 ring-inset ring-amber-500/10">
            <Coins className="h-4 w-4" />
            {item.price} de oro
          </div>
          {item.featured ? (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
              Destacado
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onBuy}
          disabled={stock.buttonDisabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
            stock.buttonDisabled
              ? "cursor-not-allowed bg-stone-800 text-stone-500"
              : "bg-amber-500 text-stone-950 hover:bg-amber-400"
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          {stock.buttonDisabled ? "No disponible" : "Comprar"}
        </button>
      </div>
    </article>
  );
}
