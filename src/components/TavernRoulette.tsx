import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, RefreshCw, UserRound } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import ruletaImg from "../assets/ruleta-optimized.jpg";
import { spinRouletteSecure } from "../utils/minigamesSecure";

const SPIN_DURATION_MS = 7000;

type GamePhase = "betting" | "spinning" | "result";

export function TavernRoulette() {
  const { player, isHydrating, refreshPlayer } = usePlayerSession();
  const [phase, setPhase] = useState<GamePhase>("betting");
  const [bet, setBet] = useState(0);
  const [resultMultiplier, setResultMultiplier] = useState(0);
  const [resultWinnings, setResultWinnings] = useState(0);
  const [spinDegrees, setSpinDegrees] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [rouletteError, setRouletteError] = useState("");

  async function handleRefresh() {
    setUpdating(true);
    await refreshPlayer();
    setUpdating(false);
  }

  async function handleSpin() {
    if (!player || bet <= 0 || bet > player.gold || updating) {
      return;
    }

    setUpdating(true);
    setRouletteError("");

    const extraRotation = Math.floor(Math.random() * 1080);
    setSpinDegrees(3600 + extraRotation);
    setPhase("spinning");

    const result = await spinRouletteSecure(bet);

    if (result.status === "error") {
      setRouletteError(result.message);
      setPhase("betting");
      setUpdating(false);
      return;
    }

    setResultMultiplier(result.multiplier);
    setResultWinnings(result.winnings);

    window.setTimeout(async () => {
      await refreshPlayer();
      setPhase("result");
      setUpdating(false);
    }, SPIN_DURATION_MS);
  }

  function handlePlayAgain() {
    setPhase("betting");
    setBet(0);
    setResultMultiplier(0);
    setResultWinnings(0);
    setRouletteError("");
  }

  if (isHydrating) {
    return (
      <TavernMessage
        title="La Ruleta del Destino"
        description="Recuperando tu sesion del reino..."
      />
    );
  }

  if (!player) {
    return (
      <TavernMessage
        title="La Ruleta del Destino"
        description="Conecta tu perfil del reino en el panel superior para girar sin iniciar sesion otra vez."
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 text-center">
      <div className="mb-6 flex w-full items-center justify-between rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-stone-300">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-xs text-stone-500">Jugador</p>
            <p className="font-bold text-stone-200">{player.username}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-stone-500">Oro disponible</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-mono text-lg font-bold text-amber-400">
              {player.gold} de oro
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={updating}
              className="rounded-lg p-1 text-stone-500 transition hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "betting" ? (
          <motion.div
            key="betting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xs"
          >
            <h3 className="mb-4 text-lg font-bold text-stone-100">
              ¿Cuanto oro apuestas a la ruleta?
            </h3>
            {rouletteError ? (
              <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {rouletteError}
              </div>
            ) : null}
            <div className="mb-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setBet(Math.max(0, bet - 10))}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-xl font-bold text-stone-300 hover:bg-stone-700 active:scale-95"
              >
                -
              </button>
              <div className="flex h-16 w-24 items-center justify-center rounded-2xl border-2 border-stone-700 bg-stone-900 text-2xl font-bold text-amber-400">
                {bet}
              </div>
              <button
                type="button"
                onClick={() => setBet(Math.min(player.gold, bet + 10))}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-xl font-bold text-stone-300 hover:bg-stone-700 active:scale-95"
              >
                +
              </button>
            </div>
            <div className="mb-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setBet(Math.min(player.gold, 10))}
                className="rounded-lg bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700 hover:text-stone-200"
              >
                Min
              </button>
              <button
                type="button"
                onClick={() => setBet(Math.floor(player.gold / 2))}
                className="rounded-lg bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700 hover:text-stone-200"
              >
                Mitad
              </button>
              <button
                type="button"
                onClick={() => setBet(player.gold)}
                className="rounded-lg bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700 hover:text-stone-200"
              >
                Todo
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleSpin()}
              disabled={bet <= 0 || bet > player.gold || updating}
              className="w-full rounded-xl bg-amber-600 py-4 font-bold text-stone-900 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              Girar ruleta segura
            </button>
          </motion.div>
        ) : null}

        {phase === "spinning" ? (
          <motion.div
            key="spinning"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8"
          >
            <div className="relative mb-8 flex h-56 w-56 items-center justify-center">
              <div className="absolute -top-6 z-10 text-amber-400 drop-shadow-md">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2v20M17 7l-5-5-5 5" />
                </svg>
              </div>

              <motion.img
                src={ruletaImg}
                alt="Ruleta"
                decoding="async"
                animate={{ rotate: spinDegrees }}
                transition={{ duration: SPIN_DURATION_MS / 1000, ease: "circOut" }}
                className="h-full w-full rounded-full object-cover shadow-[0_0_40px_rgba(245,158,11,0.3)]"
              />
            </div>
            <p className="animate-pulse text-lg font-bold text-amber-400">
              La ruleta esta girando...
            </p>
          </motion.div>
        ) : null}

        {phase === "result" ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-xs flex-col items-center py-4"
          >
            <div
              className={`mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 ${
                resultMultiplier > 1
                  ? "border-amber-400 bg-amber-500/20 text-amber-400"
                  : resultMultiplier === 0
                    ? "border-rose-500 bg-rose-500/20 text-rose-500"
                    : "border-stone-500 bg-stone-500/20 text-stone-300"
              }`}
            >
              <span className="text-4xl font-black">x{resultMultiplier}</span>
            </div>

            <h3 className="mb-2 text-2xl font-bold text-stone-100">
              {resultMultiplier === 0
                ? "Mala suerte"
                : resultMultiplier < 1
                  ? "Recuperas algo"
                  : resultMultiplier === 10
                    ? "JACKPOT"
                    : "Ganaste"}
            </h3>

            <p className="mb-8 text-stone-400">
              {resultMultiplier === 0
                ? `Has perdido tus ${bet} de oro`
                : `Te llevas ${resultWinnings} de oro`}
            </p>

            <button
              type="button"
              onClick={handlePlayAgain}
              className="w-full rounded-xl bg-stone-800 py-4 font-bold text-stone-200 transition hover:bg-stone-700 active:scale-95"
            >
              Jugar de nuevo
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TavernMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="mb-4 rounded-full bg-amber-500/10 p-4 text-amber-400">
        <Coins className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-stone-100">{title}</h3>
      <p className="max-w-sm text-sm text-stone-400">{description}</p>
    </div>
  );
}
