import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  const valueClass =
    value.length > 7 ? "text-sm leading-tight md:text-base" : "text-lg";

  return (
    <div className="kd-hover-lift kd-stat-card rounded-2xl border border-stone-800 bg-stone-950/65 p-3 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
        <Icon className="h-5 w-5 text-[color:var(--kd-accent-strong)]" />
      </div>
      <p className={`mt-2 font-black text-stone-100 ${valueClass}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
