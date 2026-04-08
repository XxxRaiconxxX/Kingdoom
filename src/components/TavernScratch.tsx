import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, RefreshCw, Sparkles, Ticket, UserRound } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import scratchLoseCard from "../assets/scratch-lose-card.png";
import scratchPristineCard from "../assets/scratch-pristine-card.png";
import scratchWinCard from "../assets/scratch-win-card.png";

const SCRATCH_COST = 400;
const WIN_CHANCE = 0.20;
const MIN_PRIZE = 500;
const MAX_PRIZE = 1000;

type ScratchPhase = "buy" | "ready" | "scratching" | "revealed";

interface ScratchBatchResult {
  totalCost: number;
  quantity: number;
  wins: number;
  loses: number;
  totalPrize: number;
}

export function TavernScratch() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [phase, setPhase] = useState<ScratchPhase>("buy");
  const [quantity, setQuantity] = useState<number>(1);
  const [batchResult, setBatchResult] = useState<ScratchBatchResult | null>(null);
  const [updating, setUpdating] = useState(false);

  const totalCost = SCRATCH_COST * quantity;
  const canBuy = Boolean(player && player.gold >= totalCost && !updating && quantity > 0);
  const maxBuyQuantity = player ? Math.floor(player.gold / SCRATCH_COST) : 0;

  const projectedGold = useMemo(() => {
    if (!player) {
      return null;
    }

    return Math.max(0, player.gold - totalCost);
  }, [player, totalCost]);

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
    const nextGold = player.gold - totalCost;
    const deducted = await setPlayerGold(nextGold);
    setUpdating(false);

    if (!deducted) {
      return;
    }

    setBatchResult(null);
    setPhase("ready");
  }

  async function scratchTicket() {
    if (!player || updating || phase !== "ready") {
      return;
    }

    setPhase("scratching");

    window.setTimeout(async () => {
      let wins = 0;
      let totalPrize = 0;

      for (let i = 0; i < quantity; i++) {
        const didWin = Math.random() < WIN_CHANCE;
        if (didWin) {
          wins++;
          totalPrize += Math.floor(Math.random() * (MAX_PRIZE - MIN_PRIZE + 1)) + MIN_PRIZE;
        }
      }

      setBatchResult({
        totalCost,
        quantity,
        wins,
        loses: quantity - wins,
        totalPrize
      });

      if (totalPrize > 0) {
        setUpdating(true);
        await setPlayerGold((player?.gold ?? 0) + totalPrize);
        setUpdating(false);
      }

      setPhase("revealed");
    }, quantity > 1 ? 2000 : 950);
  }

  function resetScratch() {
    setPhase("buy");
    setBatchResult(null);
  }

  function handleQuantityChange(value: number) {
    if (value < 1) setQuantity(1);
    else if (maxBuyQuantity > 0 && value > maxBuyQuantity) setQuantity(maxBuyQuantity);
    else setQuantity(value);
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
        <div className="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-950/50 p-4 md:px-6">
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
            onClick={handleRefresh}
            disabled={updating}
            className="rounded-xl border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            title="Actualizar saldo"
          >
            <RefreshCw className={`h-5 w-5 ${updating ? "animate-spin" : ""}`} />
          </button>
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

                <div className="mt-6 flex flex-col gap-3 rounded-[1.2rem] border border-stone-800 bg-stone-950/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-stone-300">Cantidad de tickets:</p>
                    <div className="flex items-center gap-1 mx-auto sm:mx-0">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-stone-300 transition hover:bg-stone-700"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxBuyQuantity || 1}
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        className="w-16 rounded-xl border border-stone-700 bg-stone-900 px-2 py-2 text-center font-bold text-amber-300 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-stone-300 transition hover:bg-stone-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => handleQuantityChange(1)} className="rounded-lg bg-stone-800/80 py-2 text-xs font-bold text-stone-300 transition hover:bg-stone-700">x1</button>
                    <button type="button" onClick={() => handleQuantityChange(5)} className="rounded-lg bg-stone-800/80 py-2 text-xs font-bold text-stone-300 transition hover:bg-stone-700">x5</button>
                    <button type="button" disabled={maxBuyQuantity <= 0} onClick={() => handleQuantityChange(maxBuyQuantity)} className="rounded-lg border border-amber-500/20 bg-amber-500/10 py-2 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50">MAX</button>
                  </div>
                </div>

                {projectedGold !== null ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-stone-500">
                    Costo: <span className="font-bold text-amber-400">{totalCost} oro</span> &bull; Te quedarian {projectedGold} de oro
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void buyTicket()}
                  disabled={!canBuy}
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-extrabold transition md:w-auto md:min-w-72 ${
                    canBuy
                      ? "bg-amber-500 text-stone-950 hover:bg-amber-400"
                      : "cursor-not-allowed bg-stone-800 text-stone-500"
                  }`}
                >
                  <Ticket className="h-4 w-4" />
                  {player.gold < totalCost ? "Oro insuficiente" : `Comprar x${quantity} rasca`}
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
                <p className="text-sm font-bold text-amber-300">{quantity === 1 ? "Ticket listo" : "Tickets listos"}</p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {quantity === 1 
                    ? "Toca la carta o usa el boton para rascar y descubrir si el reino te sonrie."
                    : `Tienes un talonario de ${quantity} tickets preparado para ser escaneado internamente.`}
                </p>
                <button
                  type="button"
                  onClick={() => void scratchTicket()}
                  disabled={updating}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-white"
                >
                  <Sparkles className="h-4 w-4" />
                  {quantity === 1 ? "Rascar ahora" : "Rascar todo automaticamente"}
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
                transition={{ duration: quantity > 1 ? 0.2 : 0.55, repeat: Infinity, ease: "easeInOut" }}
              >
                <ScratchArtwork mode="pristine" />
              </motion.div>
              <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5 text-center">
                <p className="text-lg font-bold text-stone-100">
                  {quantity === 1 ? "Rascando la suerte..." : `Scrapeando ${quantity} tickets velozmente...`}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  La carta esta revelando su destino. Cruza los dedos.
                </p>
              </div>
            </motion.div>
          ) : null}

          {phase === "revealed" && batchResult ? (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-5"
            >
              <ScratchArtwork 
                mode={quantity === 1 && batchResult.wins === 0 ? "lose" : batchResult.wins > 0 ? "win" : "pristine"} 
              />

              <div
                className={`rounded-[1.5rem] border p-6 text-center ${
                  batchResult.totalPrize > 0
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-rose-500/20 bg-rose-500/10"
                }`}
              >
                <p
                  className={`text-xl font-black uppercase tracking-wider ${
                    batchResult.totalPrize > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {batchResult.totalPrize > 0 ? "¡Recibo Ganador!" : "Sin suerte esta vez"}
                </p>

                <div className="mx-auto mt-4 max-w-sm rounded-[1rem] bg-stone-950/40 p-5 text-sm text-stone-300">
                  <div className="flex items-center justify-between border-b border-stone-800/60 pb-3">
                    <span className="text-stone-400">Tickets Jugados</span>
                    <span className="font-bold text-stone-100 text-base">{batchResult.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-stone-800/60 py-3">
                    <span className="text-stone-400">Tickets Premiados</span>
                    <span className="font-black text-emerald-400">{batchResult.wins} WIN</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-stone-400">Tickets Vacios</span>
                    <span className="font-black text-rose-500">{batchResult.loses} LOSE</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col items-center justify-center gap-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Premio depositado</p>
                  <p className={`text-3xl font-black ${batchResult.totalPrize > batchResult.totalCost ? "text-emerald-400" : "text-emerald-500"}`}>
                    {batchResult.totalPrize} <span className="text-lg font-bold opacity-70">ORO</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetScratch}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 px-6 py-4 text-sm font-extrabold text-stone-950 transition hover:bg-white md:w-auto"
                >
                  <Coins className="h-5 w-5" />
                  Jugar otra transaccion
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
  const artwork =
    mode === "pristine"
      ? scratchPristineCard
      : mode === "win"
        ? scratchWinCard
        : scratchLoseCard;

  const content = (
    <div className="mx-auto w-full max-w-[320px] rounded-[1.6rem] border border-stone-800 bg-stone-950/70 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)] md:max-w-[360px] md:p-4">
      <div className="relative overflow-hidden rounded-[1.2rem] border border-stone-800/80 bg-stone-950">
        <img
          src={artwork}
          alt={
            mode === "pristine"
              ? "Ticket intacto de rasca y gana"
              : mode === "win"
                ? "Ticket premiado de rasca y gana"
                : "Ticket perdedor de rasca y gana"
          }
          className="block h-auto w-full object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      {interactive ? (
        <div className="mt-3 rounded-full border border-amber-400/25 bg-stone-950/75 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 backdrop-blur-sm">
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
