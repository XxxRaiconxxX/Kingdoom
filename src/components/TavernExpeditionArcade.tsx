import { useMemo, useState } from "react";
import { Bolt, Coins, Waves } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { ARCADE_ENCOUNTERS } from "../data/pve";

type ArcadeState = {
  encounterId: string;
  wave: number;
  score: number;
  playerHp: number;
  enemyHp: number;
};

// Fallback mode prepared on purpose.
// It is intentionally not wired into App yet so the active experience remains narrative-first.
export function TavernExpeditionArcade() {
  const { player } = usePlayerSession();
  const [selectedEncounterId, setSelectedEncounterId] = useState(
    ARCADE_ENCOUNTERS[0]?.id ?? ""
  );
  const [state, setState] = useState<ArcadeState | null>(null);

  const selectedEncounter = useMemo(
    () =>
      ARCADE_ENCOUNTERS.find((encounter) => encounter.id === selectedEncounterId) ??
      ARCADE_ENCOUNTERS[0],
    [selectedEncounterId]
  );

  function startRun() {
    if (!selectedEncounter) {
      return;
    }

    setState({
      encounterId: selectedEncounter.id,
      wave: 1,
      score: 0,
      playerHp: 100,
      enemyHp: 36,
    });
  }

  function resolveHit(mode: "strike" | "focus") {
    if (!state || !selectedEncounter) {
      return;
    }

    const damage = mode === "strike" ? 16 : 24;
    const nextEnemyHp = state.enemyHp - damage;

    if (nextEnemyHp <= 0) {
      const isLastWave = state.wave >= selectedEncounter.waves;

      if (isLastWave) {
        setState({
          ...state,
          enemyHp: 0,
          score: state.score + selectedEncounter.baseReward,
        });
        return;
      }

      setState({
        ...state,
        wave: state.wave + 1,
        enemyHp: 42 + state.wave * 12,
        score: state.score + 45,
      });
      return;
    }

    setState({
      ...state,
      enemyHp: nextEnemyHp,
      playerHp: Math.max(0, state.playerHp - (mode === "strike" ? 9 : 13)),
    });
  }

  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/80">
            Modo preparado
          </p>
          <h3 className="mt-2 text-xl font-black text-stone-100">PvE arcade</h3>
        </div>
        <span className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
          Offline en UI
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-400">
        Este modo queda listo como reemplazo rapido: oleadas breves, entradas mas directas y ritmo mas arcade.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {ARCADE_ENCOUNTERS.map((encounter) => (
          <button
            key={encounter.id}
            type="button"
            onClick={() => setSelectedEncounterId(encounter.id)}
            className={`rounded-[1.4rem] border p-4 text-left ${
              encounter.id === selectedEncounterId
                ? "border-amber-400/30 bg-amber-500/10"
                : "border-stone-800 bg-stone-950/50"
            }`}
          >
            <h4 className="text-sm font-black text-stone-100">{encounter.title}</h4>
            <p className="mt-2 text-xs leading-5 text-stone-400">{encounter.summary}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-stone-800 bg-stone-950/55 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat icon={Waves} label="Oleadas" value={selectedEncounter?.waves ?? 0} />
          <MiniStat icon={Coins} label="Base" value={selectedEncounter?.baseReward ?? 0} />
          <MiniStat icon={Bolt} label="Ritmo" value={selectedEncounter?.speed ?? "--"} />
        </div>
        <button
          type="button"
          onClick={startRun}
          className="mt-4 w-full rounded-2xl bg-stone-100 px-4 py-3 text-sm font-black text-stone-950"
        >
          Simular run arcade
        </button>
      </div>

      {state ? (
        <div className="mt-5 rounded-[1.4rem] border border-stone-800 bg-stone-950/55 p-4">
          <p className="text-sm text-stone-300">
            {player?.username ?? "Jugador"} avanza por la ola {state.wave} con {state.playerHp} HP y {state.score} puntos.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => resolveHit("strike")}
              className="flex-1 rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-black text-stone-100"
            >
              Golpe rapido
            </button>
            <button
              type="button"
              onClick={() => resolveHit("focus")}
              className="flex-1 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-200"
            >
              Golpe cargado
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Waves;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.2rem] border border-stone-800 bg-stone-900/75 p-3">
      <div className="flex items-center gap-2 text-stone-500">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black text-stone-100">{value}</p>
    </div>
  );
}
