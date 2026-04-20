type FilterPillProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function FilterPill({ label, active, onClick }: FilterPillProps) {
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
