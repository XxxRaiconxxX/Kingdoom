import { useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, RefreshCw, UserRound } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import type { PlayerAccount } from "../types";
import cofreCerrado from "../assets/cofre-cerrado.png";
import cofreOro from "../assets/cofre-oro.png";
import cofreVacio from "../assets/cofre-vacio.png";

type GamePhase = "betting" | "playing" | "revealed";
type ResultType = "x2" | "x1" | "x0" | null;

export function TavernGame() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [phase, setPhase] = useState<GamePhase>("betting");
  const [bet, setBet] = useState(0);
  const [consecutiveSpins, setConsecutiveSpins] = useState(0);
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [chestResults, setChestResults] = useState<ResultType[]>([
    null,
    null,
    null,
  ]);
  const [updating, setUpdating] = useState(false);

  const balance = player?.gold ?? 0;
  const difficultyLevel = Math.floor(consecutiveSpins / 2);
  const x2Chance = Math.max(3.3, 33.3 - difficultyLevel * 10);
  const x1Chance = 33.3;

  async function refreshBalance() {
    if (updating) {
      return;
    }

    setUpdating(true);
    await refreshPlayer();
    setUpdating(false);
  }

  async function applyGold(nextGold: number) {
    return setPlayerGold(nextGold);
  }

  async function startRound(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!player || updating) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const betAmount = Number(formData.get("betAmount"));

    if (betAmount < 1 || betAmount > player.gold) {
      return;
    }

    setUpdating(true);
    setBet(betAmount);

    const updatedPlayer = await applyGold(player.gold - betAmount);

    setUpdating(false);

    if (!updatedPlayer) {
      return;
    }

    setPhase("playing");
    setChestResults([null, null, null]);
    setSelectedChest(null);
  }

  async function openChest(index: number) {
    if (phase !== "playing" || !player || updating) {
      return;
    }

    const rand = Math.random() * 100;
    let actualResult: ResultType = "x0";

    if (rand <= x2Chance) {
      actualResult = "x2";
    } else if (rand <= x2Chance + x1Chance) {
      actualResult = "x1";
    }

    const available = (["x2", "x1", "x0"] as ResultType[]).filter(
      (result) => result !== actualResult
    );
    available.sort(() => Math.random() - 0.5);

    const newResults: ResultType[] = [];
    let availableIndex = 0;

    for (let cardIndex = 0; cardIndex < 3; cardIndex += 1) {
      newResults.push(
        cardIndex === index ? actualResult : available[availableIndex++]
      );
    }

    setChestResults(newResults);
    setSelectedChest(index);
    setPhase("revealed");

    const balanceAfterBet = player.gold;
    setUpdating(true);

    if (actualResult === "x2") {
      await applyGold(balanceAfterBet + bet * 2);
      setConsecutiveSpins((current) => current + 1);
    } else if (actualResult === "x1") {
      await applyGold(balanceAfterBet + bet);
      setConsecutiveSpins((current) => current + 1);
    } else {
      setConsecutiveSpins(0);
    }

    setUpdating(false);
  }

  function resetGame() {
    setPhase("betting");
    setBet(0);
    setChestResults([null, null, null]);
    setSelectedChest(null);
  }

  function getChestImage(index: number) {
    if (phase === "playing") {
      return cofreCerrado;
    }

    const result = chestResults[index];

    if (result === "x2" || result === "x1") {
      return cofreOro;
    }

    if (result === "x0") {
      return cofreVacio;
    }

    return cofreCerrado;
  }

  if (isHydrating) {
    return (
      <TavernPlaceholder
        title="La Mesa Oscura"
        description="Estamos recuperando tu sesion del reino para sentarte a jugar."
      />
    );
  }

  if (!player) {
    return (
      <TavernPlaceholder
        title="La Mesa Oscura"
        description="Conecta tu perfil del reino en el panel superior para apostar sin volver a escribir tu nombre."
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-900/80 p-6 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)] md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.03)_0%,transparent_50%)]" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
        <PlayerBalanceHeader
          player={player}
          updating={updating}
          onRefresh={refreshBalance}
        />

        {balance <= 0 && phase === "betting" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center"
          >
            <p className="text-lg font-black text-rose-400">Sin oro</p>
            <p className="mt-1 text-sm text-stone-400">
              Tu perfil no tiene suficiente oro para apostar ahora mismo.
            </p>
          </motion.div>
        ) : null}

        {phase === "betting" && balance > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5"
          >
            <h3 className="text-lg font-bold text-stone-100">Haz tu apuesta</h3>

            {difficultyLevel > 0 ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 p-2 text-xs font-semibold text-rose-300">
                <AlertOctagon className="h-4 w-4" />
                La casa sospecha de tu racha. El riesgo ha aumentado.
              </div>
            ) : null}

            <form onSubmit={startRound} className="mt-4 flex gap-3">
              <input
                name="betAmount"
                type="number"
                required
                min={1}
                max={balance}
                defaultValue={bet > 0 ? bet : ""}
                className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-lg font-bold text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/40"
                placeholder="Oro a apostar"
              />
              <button
                type="submit"
                disabled={updating}
                className="shrink-0 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Jugar
              </button>
            </form>
          </motion.div>
        ) : null}

        {phase === "playing" || phase === "revealed" ? (
          <div className="flex flex-col items-center py-4">
            <h3 className="mb-8 text-xl font-black uppercase tracking-[0.2em] text-stone-200">
              {phase === "playing" ? "Elige un cofre" : "Resultado"}
            </h3>

            <div className="grid w-full max-w-lg grid-cols-3 gap-3 md:gap-6">
              {[0, 1, 2].map((index) => {
                const isSelected = selectedChest === index;
                const result = chestResults[index];
                let chestClass =
                  "border-stone-700 bg-stone-900 hover:border-amber-500/50 hover:bg-stone-800 cursor-pointer";
                let glowColor = "transparent";
                let labelElement: React.ReactNode = null;

                if (phase === "revealed") {
                  if (result === "x2") {
                    chestClass =
                      "border-emerald-500 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                    glowColor = "rgba(16,185,129,0.15)";
                    labelElement = (
                      <span className="mt-2 text-lg font-black text-emerald-400">
                        WIN x2
                      </span>
                    );
                  } else if (result === "x1") {
                    chestClass =
                      "border-amber-500 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
                    glowColor = "rgba(245,158,11,0.15)";
                    labelElement = (
                      <span className="mt-2 text-base font-bold text-amber-400">
                        Recuperas
                      </span>
                    );
                  } else {
                    chestClass =
                      "border-rose-600 bg-rose-950/40 shadow-[0_0_20px_rgba(225,29,72,0.2)]";
                    glowColor = "rgba(225,29,72,0.15)";
                    labelElement = (
                      <span className="mt-2 text-lg font-black text-rose-500">
                        MIMIC
                      </span>
                    );
                  }

                  if (!isSelected) {
                    chestClass += " opacity-40 scale-95 grayscale";
                  }
                }

                return (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => void openChest(index)}
                    disabled={phase === "revealed" || updating}
                    whileHover={phase === "playing" ? { scale: 1.05, y: -5 } : {}}
                    whileTap={phase === "playing" ? { scale: 0.95 } : {}}
                    animate={{
                      y: phase === "playing" ? [0, -3, 0] : 0,
                      boxShadow: `0 0 20px ${glowColor}`,
                    }}
                    transition={{
                      y: {
                        repeat: Infinity,
                        duration: 2,
                        delay: index * 0.2,
                        ease: "easeInOut",
                      },
                      boxShadow: { duration: 0.5 },
                    }}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all duration-500 ${chestClass}`}
                  >
                    {phase === "playing" ? (
                      <img
                        src={cofreCerrado}
                        alt="Cofre cerrado"
                        className="h-16 w-16 object-contain md:h-20 md:w-20"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          bounce: 0.5,
                          delay: isSelected ? 0 : 0.15,
                        }}
                        className="flex flex-col items-center"
                      >
                        <img
                          src={getChestImage(index)}
                          alt={result === "x0" ? "Cofre vacio" : "Cofre con oro"}
                          className="h-16 w-16 object-contain md:h-20 md:w-20"
                          style={{ imageRendering: "pixelated" }}
                        />
                        {labelElement}
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {phase === "revealed" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 w-full space-y-4"
              >
                <button
                  type="button"
                  onClick={resetGame}
                  disabled={updating}
                  className="mx-auto block w-full rounded-2xl bg-stone-100 px-6 py-4 text-center text-sm font-black text-stone-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:min-w-64"
                >
                  {balance <= 0 ? "Sin oro, espera refuerzo" : "Jugar otra ronda"}
                </button>
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                    Apuesta: {bet} de oro | Dificultad: fase {difficultyLevel + 1}
                  </p>
                </div>
              </motion.div>
            ) : null}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

function PlayerBalanceHeader({
  player,
  updating,
  onRefresh,
}: {
  player: PlayerAccount;
  updating: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-950/50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            {player.username}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-black text-amber-300">
              {player.gold}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={updating}
        className="rounded-xl border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        title="Actualizar saldo"
      >
        <RefreshCw className={`h-5 w-5 ${updating ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

function TavernPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-8 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <UserRound className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-black text-stone-100">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">{description}</p>
      </div>
    </motion.div>
  );
}
