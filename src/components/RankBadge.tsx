import type { RankName, RankTier } from "../types";

export type RankBadgeProps = {
  rank?: RankName | null;
  tier?: RankTier | null;
  points?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const RANK_META: Record<
  RankName,
  {
    label: string;
    image: string;
    accentClass: string;
    borderClass: string;
    glowClass: string;
  }
> = {
  siervo: {
    label: "Siervo",
    image: "img/ranks/siervo.png",
    accentClass: "text-stone-200",
    borderClass: "border-stone-700/80",
    glowClass: "shadow-[0_18px_38px_rgba(10,10,10,0.35)]",
  },
  escudero: {
    label: "Escudero",
    image: "img/ranks/escudero.png",
    accentClass: "text-amber-200",
    borderClass: "border-amber-500/30",
    glowClass: "shadow-[0_18px_38px_rgba(180,120,30,0.22)]",
  },
  caballero: {
    label: "Caballero",
    image: "img/ranks/caballero.png",
    accentClass: "text-slate-100",
    borderClass: "border-sky-400/30",
    glowClass: "shadow-[0_18px_38px_rgba(96,165,250,0.2)]",
  },
  senor: {
    label: "Senor",
    image: "img/ranks/senor.png",
    accentClass: "text-violet-200",
    borderClass: "border-violet-400/30",
    glowClass: "shadow-[0_18px_38px_rgba(139,92,246,0.24)]",
  },
  "senor-oscuro": {
    label: "Senor Oscuro",
    image: "img/ranks/senor-oscuro.png",
    accentClass: "text-rose-200",
    borderClass: "border-rose-500/35",
    glowClass: "shadow-[0_18px_38px_rgba(225,29,72,0.28)]",
  },
};

const SIZE_META = {
  sm: {
    wrap: "gap-3 rounded-[1.2rem] px-3 py-3",
    imageBox: "h-16 w-16 rounded-[1rem]",
    tierPill: "right-1.5 top-1.5 px-2 py-0.5 text-[9px]",
    title: "text-sm",
    subtitle: "text-[10px]",
    points: "text-[11px]",
  },
  md: {
    wrap: "gap-4 rounded-[1.45rem] px-4 py-4",
    imageBox: "h-24 w-24 rounded-[1.25rem]",
    tierPill: "right-2 top-2 px-2.5 py-1 text-[10px]",
    title: "text-base",
    subtitle: "text-[11px]",
    points: "text-xs",
  },
  lg: {
    wrap: "gap-5 rounded-[1.7rem] px-5 py-5",
    imageBox: "h-28 w-28 rounded-[1.35rem]",
    tierPill: "right-2.5 top-2.5 px-3 py-1 text-[11px]",
    title: "text-lg",
    subtitle: "text-xs",
    points: "text-sm",
  },
} as const;

function normalizeRank(rank?: RankName | null): RankName {
  return rank && rank in RANK_META ? rank : "siervo";
}

function normalizeTier(tier?: RankTier | null): RankTier {
  return tier === "I" || tier === "II" || tier === "III" ? tier : "III";
}

export function RankBadge({
  rank,
  tier,
  points,
  size = "md",
  className = "",
}: RankBadgeProps) {
  const safeRank = normalizeRank(rank);
  const safeTier = normalizeTier(tier);
  const meta = RANK_META[safeRank];
  const scale = SIZE_META[size];
  const imageUrl = `${import.meta.env.BASE_URL}${meta.image}`;
  const hasPoints = typeof points === "number" && Number.isFinite(points);

  return (
    <div
      className={[
        "relative flex items-center border bg-[linear-gradient(135deg,rgba(24,24,20,0.96),rgba(12,10,9,0.84))]",
        meta.borderClass,
        meta.glowClass,
        scale.wrap,
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className={`relative shrink-0 overflow-hidden border border-white/10 bg-black/30 ${scale.imageBox}`}>
        <img
          loading="lazy"
          decoding="async"
          src={imageUrl}
          alt={`Insignia de rango ${meta.label}`}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/5" />
        <span
          className={[
            "absolute rounded-full border border-black/35 bg-black/70 font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm",
            scale.tierPill,
          ].join(" ")}
        >
          {safeTier}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
          Clasificatoria mensual
        </p>
        <p className={`mt-1 font-black uppercase tracking-[0.12em] ${meta.accentClass} ${scale.title}`}>
          {meta.label}
        </p>
        <p className={`mt-1 uppercase tracking-[0.16em] text-stone-400 ${scale.subtitle}`}>
          Escalon {safeTier}
        </p>
        <p className={`mt-2 leading-5 text-stone-300 ${scale.points}`}>
          {hasPoints
            ? `${points?.toLocaleString("es-PY")} pts de temporada`
            : "Insignia visual lista para enlazar con misiones y puntos."}
        </p>
      </div>
    </div>
  );
}
