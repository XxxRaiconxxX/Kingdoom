import { Crown, Skull } from "lucide-react";
import type { RankingPlayer } from "../types";

export function RankingCard({
  player,
  index,
}: {
  player: RankingPlayer;
  index: number;
}) {
  const isDead = player.status === "dead";

  return (
    <div
      className={`rounded-[1.75rem] border border-stone-800 bg-stone-900/80 p-4 transition ${
        isDead ? "grayscale opacity-80" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-800 text-lg font-black text-amber-300">
          #{index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-stone-100">{player.name}</h3>
            {index === 0 ? <Crown className="h-5 w-5 text-amber-400" /> : null}
            {isDead ? <Skull className="h-4 w-4 text-stone-400" /> : null}
          </div>

          <p className="mt-1 text-sm text-stone-400">{player.faction}</p>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <RankingMetric label="Nivel" value={player.level} />
            <RankingMetric label="Oro" value={player.gold} />
            <RankingMetric
              label="Estado"
              value={isDead ? "Muerto" : "Vivo"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RankingMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/55 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-200">{value}</p>
    </div>
  );
}
