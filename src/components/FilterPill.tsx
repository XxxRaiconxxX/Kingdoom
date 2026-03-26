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
      className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
          : "border-stone-700 bg-stone-900/70 text-stone-400"
      }`}
    >
      {label}
    </button>
  );
}
