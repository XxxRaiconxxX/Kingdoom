import { Crown } from "lucide-react";
import type { RankingPlayer } from "../types";

type PodiumSlot = {
  orderLabel: string;
  heightClass: string;
  ringClass: string;
  glowClass: string;
  crown?: boolean;
};

const podiumStyles: Record<1 | 2 | 3, PodiumSlot> = {
  1: {
    orderLabel: "1",
    heightClass: "h-40 md:h-48",
    ringClass: "ring-2 ring-amber-300/70 text-amber-100",
    glowClass:
      "border-amber-300/45 bg-[linear-gradient(180deg,rgba(245,158,11,0.22),rgba(28,25,23,0.96))] shadow-[0_0_36px_rgba(245,158,11,0.18)]",
    crown: true,
  },
  2: {
    orderLabel: "2",
    heightClass: "h-28 md:h-36",
    ringClass: "ring-1 ring-stone-500/60 text-stone-200",
    glowClass:
      "border-stone-700/80 bg-[linear-gradient(180deg,rgba(68,64,60,0.26),rgba(28,25,23,0.94))]",
  },
  3: {
    orderLabel: "3",
    heightClass: "h-24 md:h-32",
    ringClass: "ring-1 ring-amber-900/60 text-amber-200/90",
    glowClass:
      "border-amber-900/50 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(28,25,23,0.94))]",
  },
};

export function WeeklyRankingPodium({
  players,
}: {
  players: RankingPlayer[];
}) {
  const slots: Array<{ placement: 1 | 2 | 3; player?: RankingPlayer }> = [
    { placement: 2, player: players[1] },
    { placement: 1, player: players[0] },
    { placement: 3, player: players[2] },
  ];

  if (players.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400/80">
            Podio semanal
          </p>
          <h3 className="mt-2 text-2xl font-black text-stone-100">
            Campeones de la semana
          </h3>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
          <Crown className="h-5 w-5" />
        </div>
      </div>

      <div className="grid grid-cols-3 items-end gap-3 md:gap-5">
        {slots.map(({ placement, player }) => {
          const style = podiumStyles[placement];

          if (!player) {
            return (
              <div
                key={`empty-${placement}`}
                className="flex flex-col items-center text-center opacity-40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-900/80 ring-1 ring-stone-700/70">
                  <span className="text-xs font-bold text-stone-500">-</span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
                  Vacante
                </p>
                <div
                  className={`mt-7 flex w-full flex-col justify-end rounded-[1.8rem] border border-dashed border-stone-700/70 bg-stone-950/55 px-3 pb-4 pt-5 ${style.heightClass}`}
                >
                  <p className="text-3xl font-black text-stone-500">{style.orderLabel}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-stone-600">
                    lugar
                  </p>
                </div>
              </div>
            );
          }

          const initial = player.name.charAt(0).toUpperCase();

          return (
            <article
              key={`${placement}-${player.id}`}
              className="flex flex-col items-center text-center"
            >
              <div className="relative">
                {style.crown ? (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-amber-500/14 p-2 text-amber-300 shadow-[0_0_22px_rgba(245,158,11,0.18)]">
                    <Crown className="h-4 w-4" />
                  </div>
                ) : null}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-stone-950/80 text-sm font-black ${style.ringClass}`}
                >
                  {initial}
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                {player.faction}
              </p>
              <h4 className="mt-1 text-sm font-bold text-stone-100 md:text-base">
                {player.name}
              </h4>
              <p className="mt-2 text-lg font-black text-amber-300">
                {player.activityPoints}
              </p>

              <div
                className={`mt-3 flex w-full flex-col justify-end rounded-[1.8rem] border px-3 pb-4 pt-5 ${style.heightClass} ${style.glowClass}`}
              >
                <p className="text-3xl font-black text-stone-100">{style.orderLabel}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-stone-400">
                  lugar
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
