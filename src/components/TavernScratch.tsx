import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, RefreshCw, Sparkles, Ticket, UserRound } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import scratchLoseSheet from "../assets/scratch-lose-sheet.png";
import scratchWinSheet from "../assets/scratch-win-sheet.png";

const SCRATCH_COST = 250;
const WIN_CHANCE = 0.2;
const MIN_PRIZE = 500;
const MAX_PRIZE = 1000;

type ScratchPhase = "buy" | "ready" | "scratching" | "revealed";
type ScratchResult = "win" | "lose" | null;

export function TavernScratch() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [phase, setPhase] = useState<ScratchPhase>("buy");
  const [result, setResult] = useState<ScratchResult>(null);
  const [prize, setPrize] = useState(0);
  const [updating, setUpdating] = useState(false);

  const canBuy = Boolean(player && player.gold >= SCRATCH_COST && !updating);
  const projectedGold = useMemo(() => {
    if (!player) {
      return null;
    }

    return Math.max(0, player.gold - SCRATCH_COST);
  }, [player]);

  async function handleRefresh() {
    setUpdating(true);
    await refreshPlayer();
    setUpdating(false);
  }

  async function buyTicket() {
    if (!player || !canBuy) {
      return;
    }

    setUpdating(true);
    const nextGold = player.gold - SCRATCH_COST;
    const deducted = await setPlayerGold(nextGold);
    setUpdating(false);

    if (!deducted) {
      return;
    }

    setPrize(0);
    setResult(null);
    setPhase("ready");
  }

  async function scratchTicket() {
    if (!player || updating || phase !== "ready") {
      return;
    }

    const didWin = Math.random() < WIN_CHANCE;
    const nextPrize = didWin
      ? Math.floor(Math.random() * (MAX_PRIZE - MIN_PRIZE + 1)) + MIN_PRIZE
      : 0;

    setPhase("scratching");

    window.setTimeout(async () => {
      setResult(didWin ? "win" : "lose");
      setPrize(nextPrize);

      if (didWin) {
        setUpdating(true);
        await setPlayerGold((player?.gold ?? 0) + nextPrize);
        setUpdating(false);
      }

      setPhase("revealed");
    }, 950);
  }

  function resetScratch() {
    setPhase("buy");
    setResult(null);
    setPrize(0);
  }

  if (isHydrating) {
    return (
      <ScratchMessage
        title="Rasca y gana"
        description="Recuperando tu sesion del reino para validar tus monedas..."
      />
    );
  }

  if (!player) {
    return (
      <ScratchMessage
        title="Rasca y gana"
        description="Conecta tu perfil del reino en el panel superior para comprar tu ticket sin volver a iniciar sesion."
      />
    );
  }

  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-6 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)] md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-950/50 px-4 py-3">
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

        <div className="grid gap-4 rounded-[1.6rem] border border-stone-800 bg-stone-950/45 p-4 text-sm text-stone-300 md:grid-cols-3">
          <StatBubble label="Costo" value={`${SCRATCH_COST} oro`} />
          <StatBubble label="Probabilidad" value={`${Math.round(WIN_CHANCE * 100)}%`} />
          <StatBubble label="Premio" value={`${MIN_PRIZE}-${MAX_PRIZE}`} />
        </div>

        <AnimatePresence mode="wait">
          {phase === "buy" ? (
            <motion.div
              key="buy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <ScratchArtwork mode="pristine" />

              <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5 text-center">
                <h3 className="text-lg font-bold text-stone-100">
                  Compra un ticket de fortuna
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Pagas <span className="font-bold text-amber-300">{SCRATCH_COST} de oro</span> y
                  tienes un <span className="font-bold text-amber-300">{Math.round(WIN_CHANCE * 100)}%</span> de
                  sacar un premio entre {MIN_PRIZE} y {MAX_PRIZE} monedas.
                </p>

                {projectedGold !== null ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-500">
                    Si compras ahora, te quedarian {projectedGold} de oro antes del resultado
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void buyTicket()}
                  disabled={!canBuy}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition md:w-auto md:min-w-72 ${
                    canBuy
                      ? "bg-amber-500 text-stone-950 hover:bg-amber-400"
                      : "cursor-not-allowed bg-stone-800 text-stone-500"
                  }`}
                >
                  <Ticket className="h-4 w-4" />
                  {player.gold < SCRATCH_COST ? "Oro insuficiente" : "Comprar rasca"}
                </button>
              </div>
            </motion.div>
          ) : null}

          {phase === "ready" ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-5"
            >
              <ScratchArtwork mode="pristine" interactive onScratch={() => void scratchTicket()} />

              <div className="rounded-[1.5rem] border border-amber-500/15 bg-amber-500/10 p-4 text-center">
                <p className="text-sm font-bold text-amber-300">Ticket listo</p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Toca la carta o usa el boton para rascar y descubrir si el reino te sonrie.
                </p>
                <button
                  type="button"
                  onClick={() => void scratchTicket()}
                  disabled={updating}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-white"
                >
                  <Sparkles className="h-4 w-4" />
                  Rascar ahora
                </button>
              </div>
            </motion.div>
          ) : null}

          {phase === "scratching" ? (
            <motion.div
              key="scratching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <motion.div
                animate={{ rotate: [0, -1.5, 1.5, 0], scale: [1, 1.01, 0.99, 1] }}
                transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
              >
                <ScratchArtwork mode="pristine" />
              </motion.div>
              <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5 text-center">
                <p className="text-lg font-bold text-stone-100">Rascando la suerte...</p>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  La carta esta revelando su destino. Cruza los dedos.
                </p>
              </div>
            </motion.div>
          ) : null}

          {phase === "revealed" ? (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-5"
            >
              <ScratchArtwork mode={result === "win" ? "win" : "lose"} />

              <div
                className={`rounded-[1.5rem] border p-5 text-center ${
                  result === "win"
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-rose-500/20 bg-rose-500/10"
                }`}
              >
                <p
                  className={`text-lg font-black ${
                    result === "win" ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {result === "win" ? "¡Ticket premiado!" : "No hubo premio"}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {result === "win"
                    ? `Ganaste ${prize} de oro y ya fue acreditado a tu perfil.`
                    : `Perdiste los ${SCRATCH_COST} de oro del ticket, pero siempre puedes intentarlo otra vez.`}
                </p>
                <button
                  type="button"
                  onClick={resetScratch}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-white"
                >
                  <Coins className="h-4 w-4" />
                  Comprar otro ticket
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ScratchArtwork({
  mode,
  interactive = false,
  onScratch,
}: {
  mode: "pristine" | "win" | "lose";
  interactive?: boolean;
  onScratch?: () => void;
}) {
  const sheet = mode === "lose" ? scratchLoseSheet : scratchWinSheet;
  const backgroundPosition =
    mode === "pristine" ? "left top" : "right top";

  const content = (
    <div
      className="relative aspect-[1.52/1] overflow-hidden rounded-[1.8rem] border border-stone-800 bg-stone-950"
      style={{
        backgroundImage: `url(${sheet})`,
        backgroundPosition,
        backgroundRepeat: "no-repeat",
        backgroundSize: "200% auto",
      }}
    >
      {interactive ? (
        <div className="absolute inset-x-4 bottom-4 rounded-full border border-amber-400/25 bg-stone-950/75 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 backdrop-blur-sm">
          Toca para rascar
        </div>
      ) : null}
    </div>
  );

  if (!interactive) {
    return content;
  }

  return (
    <motion.button
      type="button"
      onClick={onScratch}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className="block w-full text-left"
    >
      {content}
    </motion.button>
  );
}

function StatBubble({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-800 bg-stone-900/80 px-4 py-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-stone-100">{value}</p>
    </div>
  );
}

function ScratchMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="mb-4 rounded-full bg-amber-500/10 p-4 text-amber-400">
        <Ticket className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-stone-100">{title}</h3>
      <p className="max-w-sm text-sm text-stone-400">{description}</p>
    </div>
  );
}
