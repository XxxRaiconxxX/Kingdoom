import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, UserRound } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";

type GamePhase = "betting" | "playing" | "result";

function getRandomCard() {
  return Math.floor(Math.random() * 10) + 1;
}

export function TavernCards() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [phase, setPhase] = useState<GamePhase>("betting");
  const [bet, setBet] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [nextCard, setNextCard] = useState(0);
  const [result, setResult] = useState<"win" | "lose" | "tie" | null>(null);
  const [updating, setUpdating] = useState(false);

  async function handleRefresh() {
    setUpdating(true);
    await refreshPlayer();
    setUpdating(false);
  }

  async function startGame() {
    if (!player || bet <= 0 || bet > player.gold || updating) {
      return;
    }

    setUpdating(true);
    const balanceAfterBet = player.gold - bet;
    const deductedPlayer = await setPlayerGold(balanceAfterBet);

    if (!deductedPlayer) {
      setUpdating(false);
      return;
    }

    setCurrentCard(getRandomCard());
    setPhase("playing");
    setUpdating(false);
  }

  async function handleGuess(guess: "higher" | "lower") {
    if (updating || !player) {
      return;
    }

    setUpdating(true);

    const drawnCard = getRandomCard();
    setNextCard(drawnCard);

    let outcome: "win" | "lose" | "tie" = "lose";

    if (drawnCard === currentCard) {
      outcome = "tie";
    } else if (guess === "higher" && drawnCard > currentCard) {
      outcome = "win";
    } else if (guess === "lower" && drawnCard < currentCard) {
      outcome = "win";
    }

    setResult(outcome);
    setPhase("result");

    if (outcome === "win") {
      await setPlayerGold(player.gold + bet * 2);
    } else if (outcome === "tie") {
      await setPlayerGold(player.gold + bet);
    }

    setUpdating(false);
  }

  function handlePlayAgain() {
    setPhase("betting");
    setBet(0);
    setResult(null);
    setCurrentCard(0);
    setNextCard(0);
  }

  if (isHydrating) {
    return (
      <CardsMessage
        title="Cartas del Oraculo"
        description="Recuperando tu sesion del reino..."
      />
    );
  }

  if (!player) {
    return (
      <CardsMessage
        title="Cartas del Oraculo"
        description="Conecta tu perfil del reino en el panel superior para jugar sin escribir tu nombre en cada ronda."
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
              ¿Cuanto oro apuestas a las cartas?
            </h3>
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
              onClick={() => void startGame()}
              disabled={bet <= 0 || bet > player.gold || updating}
              className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-stone-100 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              Repartir cartas
            </button>
          </motion.div>
        ) : null}

        {phase === "playing" ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-xs flex-col items-center py-4"
          >
            <p className="mb-6 text-stone-400">La carta actual es:</p>
            <div className="mb-8 flex h-40 w-28 items-center justify-center rounded-xl border-2 border-stone-600 bg-stone-100 shadow-xl">
              <span className="text-6xl font-black text-stone-900">{currentCard}</span>
            </div>

            <h3 className="mb-4 text-lg font-bold text-stone-100">
              ¿La siguiente sera mayor o menor?
            </h3>
            <div className="flex w-full gap-4">
              <button
                type="button"
                onClick={() => void handleGuess("higher")}
                disabled={updating}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-600/20 py-4 text-emerald-400 transition hover:bg-emerald-600/30 active:scale-95"
              >
                <ArrowUpCircle className="h-8 w-8" />
                <span className="font-bold">Mayor</span>
              </button>
              <button
                type="button"
                onClick={() => void handleGuess("lower")}
                disabled={updating}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-rose-500/50 bg-rose-600/20 py-4 text-rose-400 transition hover:bg-rose-600/30 active:scale-95"
              >
                <ArrowDownCircle className="h-8 w-8" />
                <span className="font-bold">Menor</span>
              </button>
            </div>
          </motion.div>
        ) : null}

        {phase === "result" ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-xs flex-col items-center py-4"
          >
            <div className="mb-6 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="mb-2 text-xs text-stone-500">Anterior</span>
                <div className="flex h-24 w-16 items-center justify-center rounded-lg border border-stone-700 bg-stone-800 opacity-50">
                  <span className="text-3xl font-bold text-stone-400">
                    {currentCard}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="mb-2 text-xs font-bold text-amber-400">Nueva</span>
                <div className="flex h-32 w-24 items-center justify-center rounded-xl border-2 border-amber-400 bg-stone-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <span className="text-5xl font-black text-stone-900">
                    {nextCard}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="mb-2 text-2xl font-bold text-stone-100">
              {result === "win"
                ? "Acertaste"
                : result === "tie"
                  ? "Empate"
                  : "Fallaste"}
            </h3>

            <p className="mb-8 text-stone-400">
              {result === "win"
                ? `Has ganado ${bet * 2} de oro`
                : result === "tie"
                  ? `Recuperas tus ${bet} de oro`
                  : `Has perdido tus ${bet} de oro`}
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

function CardsMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="mb-4 rounded-full bg-indigo-500/10 p-4 text-indigo-400">
        <UserRound className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-stone-100">{title}</h3>
      <p className="max-w-sm text-sm text-stone-400">{description}</p>
    </div>
  );
}
