import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  Coins,
  RefreshCw,
  Trophy,
  UserRound,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  MAX_DAILY_CARDS_WIN_LIMIT,
} from "../utils/scratchUtils";
import {
  cashOutCardsSecure,
  CardsSessionState,
  continueCardsSecure,
  fetchCardsSession,
  guessCardsSecure,
  startCardsGameSecure,
} from "../utils/minigamesSecure";

type GamePhase = "betting" | "playing" | "choice" | "gameOver";

function getInitialSession(): CardsSessionState {
  return {
    bet: 0,
    pool: 0,
    streak: 0,
    currentCard: 0,
    nextCard: 0,
    phase: "betting",
    dailyWins: 0,
    remainingNet: MAX_DAILY_CARDS_WIN_LIMIT,
  };
}

export function TavernCards() {
  const { player, isHydrating, refreshPlayer } = usePlayerSession();
  const [phase, setPhase] = useState<GamePhase>("betting");
  const [bet, setBet] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [nextCard, setNextCard] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pool, setPool] = useState(0);
  const [dailyWins, setDailyWins] = useState(0);
  const [remainingNet, setRemainingNet] = useState(MAX_DAILY_CARDS_WIN_LIMIT);
  const [updating, setUpdating] = useState(false);
  const [cardsError, setCardsError] = useState("");

  const limitReached = dailyWins >= MAX_DAILY_CARDS_WIN_LIMIT;
  const canCashOut = streak >= 2 && phase === "choice";
  const maxTotalCashout = useMemo(() => bet + remainingNet, [bet, remainingNet]);
  const isContinueBlocked = pool >= maxTotalCashout && canCashOut;

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!player) {
        return;
      }

      const result = await fetchCardsSession();

      if (!active) {
        return;
      }

      if (result.status === "error") {
        setCardsError(result.message);
        return;
      }

    applySession(result.session, false);
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [player]);

function applySession(session: CardsSessionState, overrideBet = true) {
  if (overrideBet) setBet(session.bet);
  setPool(session.pool);

    setStreak(session.streak);
    setCurrentCard(session.currentCard);
    setNextCard(session.nextCard);
    setDailyWins(session.dailyWins);
    setRemainingNet(session.remainingNet);
    setPhase(session.phase);
  }

  async function handleRefresh() {
    setUpdating(true);
    await refreshPlayer();

    if (player) {
      const result = await fetchCardsSession();
      if (result.status === "success") {
        applySession(result.session);
      } else {
        setCardsError(result.message);
      }
    }

    setUpdating(false);
  }

  async function startGame() {
    if (!player || bet <= 0 || bet > player.gold || updating) {
      return;
    }

    setUpdating(true);
    setCardsError("");

    const result = await startCardsGameSecure(bet);

    if (result.status === "error") {
      setCardsError(result.message);
      setUpdating(false);
      return;
    }

    applySession(result.session);
    await refreshPlayer();
    setUpdating(false);
  }

  async function handleGuess(guess: "higher" | "lower") {
    if (updating || !player) {
      return;
    }

    setUpdating(true);
    setCardsError("");

    const result = await guessCardsSecure(guess);

    if (result.status === "error") {
      setCardsError(result.message);
      setUpdating(false);
      return;
    }

    applySession(result.session);
    setUpdating(false);
  }

  async function handleCashout() {
    if (!player || updating || !canCashOut) {
      return;
    }

    setUpdating(true);
    setCardsError("");

    const result = await cashOutCardsSecure();

    if (result.status === "error") {
      setCardsError(result.message);
      setUpdating(false);
      return;
    }

    applySession(result.session);
    await refreshPlayer();
    setUpdating(false);
  }

  async function handleContinue() {
    if (updating || phase !== "choice") {
      return;
    }

    setUpdating(true);
    setCardsError("");

    const result = await continueCardsSecure();

    if (result.status === "error") {
      setCardsError(result.message);
      setUpdating(false);
      return;
    }

    applySession(result.session);
    setUpdating(false);
  }

  function handlePlayAgain() {
    const session = getInitialSession();
    session.dailyWins = dailyWins;
    session.remainingNet = remainingNet;
    applySession(session);
    setCardsError("");
  }

  if (isHydrating) {
    return (
      <CardsMessage title="Cartas del Oraculo" description="Recuperando tu sesion del reino..." />
    );
  }

  if (!player) {
    return (
      <CardsMessage
        title="Cartas del Oraculo"
        description="Conecta tu perfil del reino en el panel superior para jugar."
      />
    );
  }

  if (limitReached && phase === "betting") {
    return (
      <CardsMessage
        title="Limite diario alcanzado"
        description={`Has alcanzado el limite de ${MAX_DAILY_CARDS_WIN_LIMIT.toLocaleString()} de oro en ganancias netas hoy. La taberna cierra esta mesa por hoy. Vuelve manana.`}
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

      {cardsError ? (
        <div className="mb-4 w-full rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-left text-sm text-rose-200">
          {cardsError}
        </div>
      ) : null}

      {dailyWins > 0 && phase === "betting" && (
        <div className="mb-4 w-full rounded-xl border border-stone-800 bg-stone-950/50 px-4 py-3 text-left">
          <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
            <span>Limite diario</span>
            <span className="text-amber-400">
              {dailyWins.toLocaleString()} / {MAX_DAILY_CARDS_WIN_LIMIT.toLocaleString()}
            </span>
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
              <h3 className="mb-6 text-xl font-black uppercase tracking-widest text-stone-100">
                Cuanto apuestas?
              </h3>

              <div className="mb-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setBet(Math.max(0, bet - 10))}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-xl font-bold text-stone-300 transition-all hover:bg-stone-700 active:scale-90"
                >
                  -
                </button>
                <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={bet === 0 ? "" : bet}
  onChange={(e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") { setBet(0); return; }
    const parsed = parseInt(raw);
    if (!isNaN(parsed)) setBet(Math.min(player.gold, Math.max(0, parsed)));
  }}
  placeholder="0"
  className="flex h-20 w-32 items-center justify-center rounded-2xl border-2 border-stone-700 bg-stone-900 text-center text-3xl font-black text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)] focus:outline-none focus:border-amber-500/50"
/>

                <button
                  type="button"
                  onClick={() => setBet(Math.min(player.gold, bet + 10))}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-xl font-bold text-stone-300 transition-all hover:bg-stone-700 active:scale-90"
                >
                  +
                </button>
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
                    className="rounded-xl border border-stone-800 bg-stone-900 py-2 text-xs font-bold text-stone-400 transition-all hover:border-amber-500/50 hover:text-amber-400"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void startGame()}
                disabled={bet <= 0 || bet > player.gold || updating}
                className="group relative w-full overflow-hidden rounded-2xl bg-indigo-600 py-5 font-black text-white shadow-lg shadow-indigo-900/40 transition-all hover:bg-indigo-500 disabled:opacity-50 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Coins className="h-5 w-5" />
                  REPARTIR CARTA
                </span>
              </button>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                Rango de cartas: 1 - 15
              </p>
            </div>
          </motion.div>
        )}

        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full max-w-sm flex-col items-center"
          >
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
            <motion.div
              layoutId="card"
              className="relative mb-8 flex h-48 w-32 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-stone-700 bg-stone-100 shadow-2xl"
            >
              <div className="absolute left-2 top-2 text-xl font-black text-stone-900">{currentCard}</div>
              <div className="text-7xl font-black text-stone-900 drop-shadow-sm">{currentCard}</div>
              <div className="absolute bottom-2 right-2 rotate-180 text-xl font-black text-stone-900">{currentCard}</div>
            </motion.div>
            <h3 className="mb-6 text-lg font-black uppercase tracking-wider text-stone-100">
              La siguiente sera...
            </h3>
            <div className="grid w-full grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => void handleGuess("higher")}
                disabled={updating}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-600/10 py-6 text-emerald-400 transition-all hover:bg-emerald-600/20 active:scale-95"
              >
                <ArrowUpCircle className="h-10 w-10 transition-transform group-hover:-translate-y-1" />
                <span className="text-sm font-black uppercase tracking-widest">Mayor</span>
              </button>
              <button
                type="button"
                onClick={() => void handleGuess("lower")}
                disabled={updating}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-600/10 py-6 text-rose-400 transition-all hover:bg-rose-600/20 active:scale-95"
              >
                <ArrowDownCircle className="h-10 w-10 transition-transform group-hover:translate-y-1" />
                <span className="text-sm font-black uppercase tracking-widest">Menor</span>
              </button>
            </div>
          </motion.div>
        )}

        {phase === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-sm flex-col items-center"
          >
            <div className="mb-8 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-black uppercase tracking-wider text-stone-500">
                  Anterior
                </span>
                <div className="flex h-28 w-20 items-center justify-center rounded-xl border border-stone-700 bg-stone-800/50 opacity-40">
                  <span className="text-3xl font-bold text-stone-400">{currentCard}</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
                  NUEVA
                </span>
                <motion.div
                  initial={{ rotateY: 90 }}
                  animate={{ rotateY: 0 }}
                  className="flex h-36 w-24 items-center justify-center rounded-xl border-2 border-amber-400 bg-white shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                  <span className="text-5xl font-black text-stone-950">{nextCard}</span>
                </motion.div>
              </div>
            </div>

            <div className="mb-8 w-full rounded-2xl border border-emerald-500/20 bg-emerald-600/10 p-6 text-center">
              <h3 className="mb-1 text-2xl font-black uppercase text-emerald-400">
                {nextCard === currentCard ? "EMPATE" : "ACERTASTE"}
              </h3>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold uppercase text-stone-400">Pozo acumulado</span>
                <span className="flex items-center gap-2 text-3xl font-black text-amber-400">
                  <Coins className="h-6 w-6" /> {pool}
                </span>
                {pool > maxTotalCashout && (
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                    Solo cobraras {maxTotalCashout.toLocaleString()} por el limite diario
                  </span>
                )}
                {!canCashOut && (
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Plantarse se desbloquea desde la ronda 2
                  </span>
                )}
                <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Racha actual: {streak} aciertos
                </span>
              </div>
            </div>

            <div className="grid w-full gap-4">
              <button
                type="button"
                onClick={() => void handleContinue()}
                disabled={isContinueBlocked || updating}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-5 font-black text-stone-950 shadow-lg shadow-amber-900/20 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className="h-5 w-5" />
                DOBLE O NADA
              </button>
              <button
                type="button"
                onClick={() => void handleCashout()}
                disabled={updating || !canCashOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-800 py-4 font-black text-stone-200 transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              >
                <Trophy className="h-5 w-5 text-amber-400" />
                PLANTARSE Y COBRAR
              </button>
            </div>
          </motion.div>
        )}

        {phase === "gameOver" && (
          <motion.div
            key="gameOver"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-sm flex-col items-center"
          >
            <div className="mb-8 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-black uppercase tracking-wider text-stone-500">
                  Esperabas
                </span>
                <div className="flex h-28 w-20 items-center justify-center rounded-xl border border-stone-700 bg-stone-800/50 opacity-40">
                  <span className="text-3xl font-bold text-stone-400">{currentCard}</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-black uppercase tracking-widest text-rose-500">
                  Resultado
                </span>
                <div className="flex h-36 w-24 items-center justify-center rounded-xl border-2 border-rose-600 bg-stone-900">
                  <span className="text-5xl font-black text-rose-500">{nextCard}</span>
                </div>
              </div>
            </div>
            <div className="mb-8 w-full rounded-2xl border border-rose-500/20 bg-rose-600/10 p-8 text-center">
              <Ban className="mx-auto mb-4 h-12 w-12 text-rose-500" />
              <h3 className="mb-2 text-2xl font-black uppercase text-rose-500">Fallaste</h3>
              <p className="text-sm font-bold leading-relaxed text-stone-400">
                Has perdido tu apuesta inicial y <br />
                <span className="text-stone-200">todo el pozo acumulado.</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handlePlayAgain}
              className="w-full rounded-2xl bg-stone-100 py-5 font-black text-stone-900 shadow-lg transition-all hover:bg-white active:scale-95"
            >
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
      <h3 className="mb-3 text-2xl font-black uppercase tracking-widest text-stone-100">{title}</h3>
      <p className="max-w-xs text-sm leading-6 text-stone-400">{description}</p>
    </div>
  );
}
