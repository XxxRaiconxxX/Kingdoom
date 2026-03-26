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
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/65 p-3 text-center">
      <Icon className="mx-auto h-5 w-5 text-amber-400" />
      <p className="mt-2 text-lg font-black text-stone-100">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
