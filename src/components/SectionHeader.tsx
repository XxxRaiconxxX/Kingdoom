import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  rightSlot?: ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  rightSlot,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black text-stone-100">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-400">
            {description}
          </p>
        ) : null}
      </div>
      {rightSlot}
    </div>
  );
}
