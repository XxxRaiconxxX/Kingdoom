import { Store } from "lucide-react";
import type { MarketCategoryId, MarketItem, Rarity, StockStatus } from "../../types";
import type { AiDebugInfo } from "../../utils/aiDebug";

export const ADMIN_LIST_PREVIEW_COUNT = 4;

export function AdminTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`kd-touch rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border-amber-400/40 bg-amber-500/14 text-amber-200 shadow-[inset_0_0_18px_rgba(245,158,11,0.08)]"
          : "border-stone-700 bg-stone-900/70 text-stone-400 hover:border-amber-500/25 hover:text-stone-200"
      }`}
    >
      {label}
    </button>
  );
}

export function AdminModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`kd-touch rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border-amber-400/40 bg-amber-500/14 text-amber-200 shadow-[inset_0_0_18px_rgba(245,158,11,0.08)]"
          : "border-stone-700 bg-stone-900/70 text-stone-400 hover:border-amber-500/25 hover:text-stone-200"
      }`}
    >
      {label}
    </button>
  );
}

export function AdminInfoCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="kd-glass rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5">
      <p className="text-sm font-bold text-stone-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-400">{message}</p>
    </div>
  );
}

export function AdminAiDebugCard({
  debug,
}: {
  debug: AiDebugInfo | null;
}) {
  if (!debug) {
    return null;
  }

  const attemptSummary = debug.attempts
    .map((attempt) => {
      const providerLabel =
        attempt.provider === "gemini"
          ? `g${attempt.keyIndex ? `#${attempt.keyIndex}` : ""}`
          : attempt.provider === "groq"
            ? `groq${attempt.keyIndex ? `#${attempt.keyIndex}` : ""}`
            : attempt.provider === "nvidia"
              ? `nvidia${attempt.keyIndex ? `#${attempt.keyIndex}` : ""}`
              : `openrouter${attempt.keyIndex ? `#${attempt.keyIndex}` : ""}`;
      const label =
        attempt.status === "success"
          ? "ok"
          : attempt.status === "fallback"
            ? "fallback"
            : "error";

      return `${providerLabel} ${label}`;
    })
    .join(" · ");

  const providerLabel =
    debug.provider === "gemini"
      ? "Gemini"
      : debug.provider === "groq"
        ? "Groq"
        : debug.provider === "nvidia"
          ? "NVIDIA"
          : "OpenRouter";

  const metaSummary = [
    debug.keyIndexUsed ? `key #${debug.keyIndexUsed}` : "sin key",
    debug.quotaFailures > 0
      ? `${debug.quotaFailures} salto${debug.quotaFailures > 1 ? "s" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-2xl border border-cyan-500/18 bg-cyan-500/6 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <CompactDebugPill label="IA" tone="info" />
        <CompactDebugPill label={providerLabel} tone="info" />
        <CompactDebugPill label={debug.model} />
        {debug.fallbackUsed ? <CompactDebugPill label="fallback" tone="warn" /> : null}
        {debug.exhaustedByQuota ? (
          <CompactDebugPill label="pool agotado" tone="danger" />
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100/70">
        {metaSummary ? <span>{metaSummary}</span> : null}
        {attemptSummary ? <span className="text-cyan-100/50">{attemptSummary}</span> : null}
      </div>
    </div>
  );
}

export function ExpandableListToggle({
  shownCount,
  totalCount,
  expanded,
  onToggle,
  itemLabel,
}: {
  shownCount: number;
  totalCount: number;
  expanded: boolean;
  onToggle: () => void;
  itemLabel: string;
}) {
  if (totalCount <= ADMIN_LIST_PREVIEW_COUNT || shownCount === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="kd-touch w-full rounded-[1.1rem] border border-stone-700 bg-stone-950/35 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
    >
      {expanded
        ? `Leer menos ${itemLabel}`
        : `Leer mas ${itemLabel} (${shownCount}/${totalCount})`}
    </button>
  );
}

export function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]"
      />
    </label>
  );
}

export function LabeledTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]"
      />
    </label>
  );
}

export function NumericInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]"
      />
    </label>
  );
}

function CompactDebugPill({
  label,
  tone,
}: {
  label: string;
  tone?: "default" | "info" | "danger" | "warn";
}) {
  const toneClass =
    tone === "info"
      ? "border-cyan-400/25 text-cyan-100"
      : tone === "warn"
        ? "border-amber-400/25 text-amber-200"
        : tone === "danger"
          ? "border-red-400/25 text-red-200"
          : "border-stone-700 text-stone-200";

  return (
    <span
      className={`rounded-full border bg-stone-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${toneClass}`}
    >
      {label}
    </span>
  );
}

export function MarketAdminPreview({ item }: { item: MarketItem }) {
  return (
    <div className="rounded-[1.4rem] border border-amber-500/15 bg-stone-950/55 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 text-stone-600">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full"
              style={{
                objectFit: item.imageFit ?? "contain",
                objectPosition: item.imagePosition ?? "center",
              }}
              loading="lazy"
            />
          ) : (
            <Store className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-black text-stone-100">{item.name}</p>
            {item.featured ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-200">
                Destacado
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-400">
            {item.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
            <span>{adminCategoryLabel(item.category)}</span>
            <span>{adminRarityLabel(item.rarity)}</span>
            <span>{adminStockLabel(item.stockStatus)}</span>
            <span className="text-amber-300">{item.price} oro</span>
          </div>
        </div>
      </div>
      {item.ability ? (
        <p className="mt-3 line-clamp-2 rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-2 text-xs leading-5 text-stone-300">
          {item.ability}
        </p>
      ) : null}
    </div>
  );
}

export function adminCategoryLabel(category: MarketCategoryId) {
  const labels: Record<MarketCategoryId, string> = {
    potions: "Pociones",
    armors: "Armaduras",
    swords: "Espadas",
    others: "Otros",
  };

  return labels[category];
}

export function adminRarityLabel(rarity: Rarity) {
  const labels: Record<Rarity, string> = {
    common: "Comun",
    rare: "Raro",
    epic: "Epico",
    legendary: "Legendario",
  };

  return labels[rarity];
}

export function adminStockLabel(stock: StockStatus) {
  const labels: Record<StockStatus, string> = {
    available: "Disponible",
    limited: "Limitado",
    "sold-out": "Agotado",
  };

  return labels[stock];
}
