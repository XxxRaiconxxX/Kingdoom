import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, HandCoins, AlertOctagon, RefreshCcw } from "lucide-react";
import { TavernCashoutModal } from "./TavernCashoutModal";

// Importa tus imágenes de cofres
import cofreCerrado from "../assets/cofre-cerrado.png";
import cofreVacio from "../assets/cofre-vacio.png";
import cofreOro from "../assets/cofre-oro.png";

type GamePhase = "setup" | "betting" | "playing" | "revealed";
type ResultType = "x2" | "x1" | "x0" | null;

export function TavernGame() {
  const [balance, setBalance] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [bet, setBet] = useState<number>(0);
  const [consecutiveSpins, setConsecutiveSpins] = useState(0);

  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [chestResults, setChestResults] = useState<ResultType[]>([null, null, null]);
  const [showCashout, setShowCashout] = useState(false);

  const difficultyLevel = Math.floor(consecutiveSpins / 2);
  const x2Chance = Math.max(3.3, 33.3 - difficultyLevel * 10);
  const x1Chance = 33.3;

  const handleSetup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const initial = Number(formData.get("initialAmount"));
    if (initial > 0) {
      setBalance(initial);
      setPhase("betting");
    }
  };

  const startRound = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bt = Number(formData.get("betAmount") || bet);
    if (bt > 0 && balance !== null && bt <= balance) {
      setBet(bt);
      setBalance((prev) => (prev ?? 0) - bt);
      setPhase("playing");
      setChestResults([null, null, null]);
      setSelectedChest(null);
    }
  };

  const openChest = (index: number) => {
    if (phase !== "playing") return;

    const rand = Math.random() * 100;
    let actualResult: ResultType = "x0";

    if (rand <= x2Chance) {
      actualResult = "x2";
    } else if (rand <= x2Chance + x1Chance) {
      actualResult = "x1";
    }

    const available = ["x2", "x1", "x0"].filter((x) => x !== actualResult) as ResultType[];
    available.sort(() => Math.random() - 0.5);

    const newResults: ResultType[] = [];
    let availIdx = 0;
    for (let i = 0; i < 3; i++) {
      if (i === index) newResults.push(actualResult);
      else newResults.push(available[availIdx++]);
    }

    setChestResults(newResults);
    setSelectedChest(index);
    setPhase("revealed");

    if (actualResult === "x2") {
      setBalance((prev) => (prev ?? 0) + bet * 2);
      setConsecutiveSpins((prev) => prev + 1);
    } else if (actualResult === "x1") {
      setBalance((prev) => (prev ?? 0) + bet);
      setConsecutiveSpins((prev) => prev + 1);
    } else {
      setConsecutiveSpins(0);
    }
  };

  const resetGame = () => {
    setPhase("betting");
    setBet(0);
    setChestResults([null, null, null]);
    setSelectedChest(null);
    if (balance === 0) {
      setBalance(null);
      setPhase("setup");
    }
  };

  const handleCashoutComplete = () => {
    setShowCashout(false);
    setBalance(null);
    setPhase("setup");
    setConsecutiveSpins(0);
  };

  // Devuelve la imagen correcta según el estado del cofre
  const getChestImage = (index: number): string => {
    if (phase === "playing") {
      // Todos cerrados mientras se elige
      return cofreCerrado;
    }
    if (phase === "revealed") {
      const res = chestResults[index];
      if (res === "x2" || res === "x1") return cofreOro;   // Abierto con oro
      if (res === "x0") return cofreVacio;                  // Abierto vacío (Mimic)
    }
    return cofreCerrado;
  };

  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-6 md:p-8 relative overflow-hidden shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)]">

      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.03)_0%,transparent_50%)]" />

      {phase === "setup" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <Coins className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-stone-100">La Mesa Oscura</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Doble o nada. Un juego cruel donde los enanos apuestan reliquias. Saca tus monedas.
          </p>
          <form onSubmit={handleSetup} className="mt-6 flex flex-col gap-3">
            <input
              name="initialAmount"
              type="number"
              required
              min={1}
              className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-center text-xl font-bold text-amber-400 placeholder-stone-600 outline-none transition focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/40"
              placeholder="¿Cuánto oro traes?"
            />
            <button
              type="submit"
              className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.15)] transition hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Sentarme a la mesa
            </button>
          </form>
        </motion.div>
      )}

      {phase !== "setup" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
          <div className="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-950/50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Saldo actual</p>
              <p className="mt-1 text-2xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                {balance} 🪙
              </p>
            </div>
            {balance && balance > 0 ? (
              <button
                onClick={() => setShowCashout(true)}
                className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-400 transition hover:bg-amber-500/20"
              >
                <HandCoins className="h-4 w-4" />
                Retirarse
              </button>
            ) : null}
          </div>

          {phase === "betting" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5">
              <h3 className="text-lg font-bold text-stone-100">Haz tu apuesta</h3>
              {difficultyLevel > 0 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 p-2 text-xs font-semibold text-rose-300">
                  <AlertOctagon className="h-4 w-4" />
                  La casa está atenta. Riesgo aumentado por racha ganadora.
                </div>
              )}
              <form onSubmit={startRound} className="mt-4 flex gap-3">
                <input
                  name="betAmount"
                  type="number"
                  required
                  min={1}
                  max={balance ?? 0}
                  defaultValue={bet > 0 ? bet : ""}
                  className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-lg font-bold text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/40"
                  placeholder="Oro a apostar"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-extrabold text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                >
                  Jugar
                </button>
              </form>
            </motion.div>
          )}

          {(phase === "playing" || phase === "revealed") && (
            <div className="flex flex-col items-center py-4">
              <h3 className="mb-8 text-xl font-black uppercase tracking-[0.2em] text-stone-200">
                {phase === "playing" ? "Elige un cofre" : "Resultado"}
              </h3>

              <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-lg">
                {[0, 1, 2].map((i) => {
                  const isSelected = selectedChest === i;
                  const res = chestResults[i];

                  // Clases del borde/fondo según resultado
                  let chestClass = "border-stone-700 bg-stone-900 hover:border-amber-500/50 hover:bg-stone-800 cursor-pointer";
                  let bgGlow = "transparent";
                  let labelEl: React.ReactNode = null;

                  if (phase === "revealed") {
                    if (res === "x2") {
                      chestClass = "border-emerald-500 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                      bgGlow = "rgba(16,185,129,0.15)";
                      labelEl = (
                        <span className="mt-2 text-lg font-black text-emerald-400 drop-shadow-md">WIN x2</span>
                      );
                    } else if (res === "x1") {
                      chestClass = "border-amber-500 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
                      bgGlow = "rgba(245,158,11,0.15)";
                      labelEl = (
                        <span className="mt-2 text-base font-bold text-amber-400">Recuperas</span>
                      );
                    } else {
                      chestClass = "border-rose-600 bg-rose-950/40 shadow-[0_0_20px_rgba(225,29,72,0.2)]";
                      bgGlow = "rgba(225,29,72,0.15)";
                      labelEl = (
                        <span className="mt-2 text-lg font-black text-rose-500">MIMIC</span>
                      );
                    }
                    if (!isSelected) {
                      chestClass += " opacity-40 scale-95 grayscale";
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      onClick={() => openChest(i)}
                      disabled={phase === "revealed"}
                      whileHover={phase === "playing" ? { scale: 1.05, y: -5 } : {}}
                      whileTap={phase === "playing" ? { scale: 0.95 } : {}}
                      animate={{
                        y: phase === "playing" ? [0, -3, 0] : 0,
                        boxShadow: `0 0 20px ${bgGlow}`,
                      }}
                      transition={{
                        y: { repeat: Infinity, duration: 2, delay: i * 0.2, ease: "easeInOut" },
                        boxShadow: { duration: 0.5 },
                      }}
                      className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all duration-500 ${chestClass}`}
                    >
                      {phase === "playing" ? (
                        // Cofre cerrado — estático
                        <img
                          src={cofreCerrado}
                          alt="Cofre cerrado"
                          className="w-16 h-16 md:w-20 md:h-20 object-contain pixelated"
                          style={{ imageRendering: "pixelated" }}
                        />
                      ) : (
                        // Cofre abierto — animado al revelar
                        <motion.div
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", bounce: 0.5, delay: isSelected ? 0 : 0.15 }}
                          className="flex flex-col items-center"
                        >
                          <img
                            src={getChestImage(i)}
                            alt={res === "x2" ? "Cofre con oro" : res === "x1" ? "Cofre con oro" : "Cofre vacío"}
                            className="w-16 h-16 md:w-20 md:h-20 object-contain"
                            style={{ imageRendering: "pixelated" }}
                          />
                          {labelEl}
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {phase === "revealed" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 space-y-4 w-full"
                >
                  <button
                    onClick={resetGame}
                    className="w-full rounded-2xl bg-stone-100 px-6 py-4 text-sm font-black text-stone-900 transition hover:bg-white md:w-auto md:min-w-64 mx-auto block text-center"
                  >
                    Jugar otra ronda
                  </button>
                  <div className="text-center">
                    <p className="text-xs text-stone-500 font-semibold uppercase tracking-widest">
                      Apuesta actual: {bet} | Dificultad: Fase {difficultyLevel + 1}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showCashout && balance && balance > 0 && (
          <TavernCashoutModal
            balance={balance}
            onClose={() => setShowCashout(false)}
            onSuccess={handleCashoutComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
