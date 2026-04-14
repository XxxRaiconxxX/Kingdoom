import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, UserRound, Coins, Trophy, Ban } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  MAX_DAILY_CARDS_WIN_LIMIT,
  getPlayerDailyCardsGrossWins,
  addPlayerDailyCardsGrossWins,
} from "../utils/scratchUtils";

type GamePhase = "betting" | "playing" | "choice" | "gameOver";

function getRandomCard() {
  return Math.floor(Math.random() * 15) + 1;
}

function getTodayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TavernCards() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [phase, setPhase] = useState<GamePhase>("betting");
  const [bet, setBet] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [nextCard, setNextCard] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pool, setPool] = useState(0);
  const [updating, setUpdating] = useState(false);

  const dateKey = useMemo(() => getTodayDateKey(), []);

  const dailyWins = player
    ? getPlayerDailyCardsGrossWins(player.id, dateKey)
    : 0;

  const limitReached = dailyWins >= MAX_DAILY_CARDS_WIN_LIMIT;
  const remaining = Math.max(0, MAX_DAILY_CARDS_WIN_LIMIT - dailyWins);

  async function handleRefresh() {
    setUpdating(true);
    await refreshPlayer();
    setUpdating(false);
  }

  async function startGame() {
    if (!player || bet <= 0 || bet > player.gold || updating) return;

    setUpdating(true);
    const deducted = await setPlayerGold(player.gold - bet);
    if (!deducted) {
      setUpdating(false);
      return;
    }

    setCurrentCard(getRandomCard());
    setPool(bet);
    setStreak(0);
    setPhase("playing");
    setUpdating(false);
  }

  async function handleGuess(guess: "higher" | "lower") {
    if (updating || !player) return;
    setUpdating(true);

    const drawnCard = getRandomCard();
    setNextCard(drawnCard);

    if (drawnCard === currentCard) {
      setPhase("choice");
    } else if (
      (guess === "higher" && drawnCard > currentCard) ||
      (guess === "lower" && drawnCard < currentCard)
    ) {
      setPool((prev) => prev * 2);
      setStreak((prev) => prev + 1);
      setPhase("choice");
    } else {
      setPhase("gameOver");
    }

    setUpdating(false);
  }

  async function handleCashout() {
    if (!player || updating) return;
    setUpdating(true);

    // Capear el pozo al límite diario restante
    const cappedPool = Math.min(pool, remaining);
    const wasLimitHit = cappedPool < pool;

    if (cappedPool > 0) {
      const netWin = Math.max(0, cappedPool - bet);
      addPlayerDailyCardsGrossWins(player.id, dateKey, netWin);
      await setPlayerGold(player.gold + cappedPool);
    }

    // Si el límite se alcanzó durante el cobro, mostrarlo brevemente
    if (wasLimitHit) {
      setPool(cappedPool);
    }

    setPhase("betting");
    setBet(0);
    setPool(0);
    setStreak(0);
    setUpdating(false);
  }

  function handleContinue() {
    setCurrentCard(nextCard);
    setNextCard(0);
    setPhase("playing");
  }

  function handlePlayAgain() {
    setPhase("betting");
    setBet(0);
    setPool(0);
    setStreak(0);
    setCurrentCard(0);
    setNextCard(0);
  }

  if (isHydrating) {
    return <CardsMessage title="Cartas del Oráculo" description="Recuperando tu sesión del reino..." />;
  }

  if (!player) {
    return <CardsMessage title="Cartas del Oráculo" description="Conecta tu perfil del reino en el panel superior para jugar." />;
  }

  // Límite alcanzado y no está en medio de una partida
  if (limitReached && phase === "betting") {
    return (
      <CardsMessage
        title="Límite Diario Alcanzado"
        description={`Has alcanzado el límite de ${MAX_DAILY_CARDS_WIN_LIMIT.toLocaleString()} de oro en ganancias hoy. La taberna cierra esta mesa por hoy. Vuelve mañana a las 00:00.`}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 text-center">
      {/* Header Balance */}
      <div className="mb-6 flex w-full items-center justify-between rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-stone-300">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider text-stone-500">Jugador</p>
            <p className="font-bold text-stone-200">{player.username}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-stone-500">Oro disponible</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-mono text-lg font-bold text-amber-400">{player.gold}</p>
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

      {/* Barra de límite diario — solo visible si ya ganó algo hoy */}
      {dailyWins > 0 && phase === "betting" && (
        <div className="mb-4 w-full rounded-xl border border-stone-800 bg-stone-950/50 px-4 py-3 text-left">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
            <span>Límite diario</span>
            <span className="text-amber-400">{dailyWins.toLocaleString()} / {MAX_DAILY_CARDS_WIN_LIMIT.toLocaleString()}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-stone-800">
            <div
              className="h-1.5 rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.min(100, (dailyWins / MAX_DAILY_CARDS_WIN_LIMIT) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "betting" && (
          <motion.div
            key="betting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm"
          >
            <div className="mt-2 rounded-2xl border border-stone-800 bg-stone-950/40 p-6">
              <h3 className="mb-6 text-xl font-black text-stone-100 uppercase tracking-widest">
                ¿Cuánto apuestas?
              </h3>

              <div className="mb-6 flex items-center justify-center gap-4">
                <button type="button" onClick={() => setBet(Math.max(0, bet - 10))} className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-xl font-bold text-stone-300 hover:bg-stone-700 active:scale-90 transition-all">-</button>
                <div className="flex h-20 w-32 items-center justify-center rounded-2xl border-2 border-stone-700 bg-stone-900 text-3xl font-black text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  {bet}
                </div>
                <button type="button" onClick={() => setBet(Math.min(player.gold, bet + 10))} className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-xl font-bold text-stone-300 hover:bg-stone-700 active:scale-90 transition-all">+</button>
              </div>

              <div className="mb-8 grid grid-cols-3 gap-2">
                {[
                  { label: "10", val: 10 },
                  { label: "50%", val: Math.floor(player.gold / 2) },
                  { label: "ALL-IN", val: player.gold },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => setBet(Math.min(player.gold, btn.val))}
                    className="rounded-xl border border-stone-800 bg-stone-900 py-2 text-xs font-bold text-stone-400 hover:border-amber-500/50 hover:text-amber-400 transition-all"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void startGame()}
                disabled={bet <= 0 || bet > player.gold || updating}
                className="group relative w-full overflow-hidden rounded-2xl bg-indigo-600 py-5 font-black text-white transition-all hover:bg-indigo-500 disabled:opacity-50 active:scale-95 shadow-lg shadow-indigo-900/40"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Coins className="h-5 w-5" />
                  REPARTIR CARTA
                </span>
                <div className="absolute inset-0 translate-y-full bg-gradient-to-t from-white/10 to-transparent transition-transform group-hover:translate-y-0" />
              </button>

              <p className="mt-4 text-[10px] text-stone-500 uppercase font-bold tracking-widest">
                Rango de cartas: 1 - 15
              </p>
            </div>
          </motion.div>
        )}

        {phase === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex w-full max-w-sm flex-col items-center">
            {streak > 0 && (
              <div className="mb-4 flex gap-2">
                <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-black text-amber-400">
                  <Trophy className="h-3.5 w-3.5" /> RACHA x{streak}
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-black text-emerald-400">
                  POZO: {pool}
                </div>
              </div>
            )}
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">La carta es</p>
            <motion.div layoutId="card" className="mb-8 flex h-48 w-32 items-center justify-center rounded-2xl border-[3px] border-stone-700 bg-stone-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 left-2 text-stone-900 font-black text-xl">{currentCard}</div>
              <div className="text-7xl font-black text-stone-900 drop-shadow-sm">{currentCard}</div>
              <div className="absolute bottom-2 right-2 rotate-180 text-stone-900 font-black text-xl">{currentCard}</div>
            </motion.div>
            <h3 className="mb-6 text-lg font-black text-stone-100 uppercase tracking-wider">¿La siguiente será...?</h3>
            <div className="grid w-full grid-cols-2 gap-4">
              <button type="button" onClick={() => void handleGuess("higher")} disabled={updating} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-600/10 py-6 text-emerald-400 transition-all hover:bg-emerald-600/20 active:scale-95 group">
                <ArrowUpCircle className="h-10 w-10 transition-transform group-hover:-translate-y-1" />
                <span className="font-black uppercase tracking-widest text-sm">Mayor</span>
              </button>
              <button type="button" onClick={() => void handleGuess("lower")} disabled={updating} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-600/10 py-6 text-rose-400 transition-all hover:bg-rose-600/20 active:scale-95 group">
                <ArrowDownCircle className="h-10 w-10 transition-transform group-hover:translate-y-1" />
                <span className="font-black uppercase tracking-widest text-sm">Menor</span>
              </button>
            </div>
          </motion.div>
        )}

        {phase === "choice" && (
          <motion.div key="choice" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex w-full max-w-sm flex-col items-center">
            <div className="mb-8 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-black uppercase text-stone-500 tracking-wider">Anterior</span>
                <div className="flex h-28 w-20 items-center justify-center rounded-xl border border-stone-700 bg-stone-800/50 opacity-40">
                  <span className="text-3xl font-bold text-stone-400">{currentCard}</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-black uppercase text-amber-400 tracking-widest">¡NUEVA!</span>
                <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className="flex h-36 w-24 items-center justify-center rounded-xl border-2 border-amber-400 bg-white shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  <span className="text-5xl font-black text-stone-950">{nextCard}</span>
                </motion.div>
              </div>
            </div>

            <div className="mb-8 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 p-6 w-full text-center">
              <h3 className="text-2xl font-black text-emerald-400 uppercase mb-1">
                {nextCard === currentCard ? "¡EMPATE!" : "¡ACERTASTE!"}
              </h3>
              <div className="flex flex-col items-center gap-1">
                <span className="text-stone-400 text-xs font-bold uppercase">Pozo Acumulado</span>
                <span className="text-3xl font-black text-amber-400 flex items-center gap-2">
                  <Coins className="h-6 w-6" /> {pool}
                </span>
                {pool > remaining && (
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                    ⚠️ Solo cobrarás {remaining.toLocaleString()} (límite diario)
                  </span>
                )}
                <span className="text-stone-500 text-[10px] uppercase font-black mt-2 tracking-widest">
                  Racha Actual: {streak} aciertos
                </span>
              </div>
            </div>

            <div className="grid w-full gap-4">
              <button
                type="button"
                onClick={handleContinue}
                disabled={pool >= remaining}
                className="w-full rounded-2xl bg-amber-500 py-5 font-black text-stone-950 transition-all hover:bg-amber-400 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-5 w-5" />
                DOBLE O NADA
              </button>
              <button
                type="button"
                onClick={() => void handleCashout()}
                disabled={updating}
                className="w-full rounded-2xl bg-stone-800 py-4 font-black text-stone-200 transition-all hover:bg-stone-700 active:scale-95 flex items-center justify-center gap-2"
              >
                <Trophy className="h-5 w-5 text-amber-400" />
                PLANTARSE Y COBRAR
              </button>
            </div>
          </motion.div>
        )}

        {phase === "gameOver" && (
          <motion.div key="gameOver" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex w-full max-w-sm flex-col items-center">
            <div className="mb-8 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-black uppercase text-stone-500 tracking-wider">Esperabas</span>
                <div className="flex h-28 w-20 items-center justify-center rounded-xl border border-stone-700 bg-stone-800/50 opacity-40">
                  <span className="text-3xl font-bold text-stone-400">{currentCard}</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-black uppercase text-rose-500 tracking-widest">RESULTADO</span>
                <div className="flex h-36 w-24 items-center justify-center rounded-xl border-2 border-rose-600 bg-stone-900">
                  <span className="text-5xl font-black text-rose-500">{nextCard}</span>
                </div>
              </div>
            </div>
            <div className="mb-8 rounded-2xl bg-rose-600/10 border border-rose-500/20 p-8 w-full text-center">
              <Ban className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-rose-500 uppercase mb-2">FALLASTE</h3>
              <p className="text-stone-400 text-sm font-bold leading-relaxed">
                Has perdido tu apuesta inicial y <br />
                <span className="text-stone-200">todo el pozo acumulado.</span>
              </p>
            </div>
            <button type="button" onClick={handlePlayAgain} className="w-full rounded-2xl bg-stone-100 py-5 font-black text-stone-900 transition-all hover:bg-white active:scale-95 shadow-lg">
              INTENTAR DE NUEVO
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CardsMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-6 rounded-3xl bg-indigo-500/10 p-6 text-indigo-400 shadow-inner">
        <UserRound className="h-10 w-10" />
      </div>
      <h3 className="mb-3 text-2xl font-black text-stone-100 uppercase tracking-widest">{title}</h3>
      <p className="max-w-xs text-sm text-stone-400 leading-6">{description}</p>
    </div>
  );
}
