import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, RefreshCw, RotateCcw, Trash2, UserRound } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  ROULETTE_WHEEL_ORDER,
  formatBetLabel,
  getNeighborPreview,
  getPocketColor,
  getPocketParityLabel,
  getWinningPocketIndex,
  resolveRouletteRound,
  ROULETTE_CHIPS,
  ROULETTE_NUMBER_GRID,
  spinRoulette,
  type RouletteBetId,
  type RoulettePocket,
  type RouletteRoundResult,
} from "../utils/rouletteEngine";

const SPIN_DURATION_MS = 6600;
const SEGMENT_ANGLE = 360 / ROULETTE_WHEEL_ORDER.length;
const POCKET_CENTER_OFFSET = SEGMENT_ANGLE / 2;

type RoulettePhase = "betting" | "spinning" | "resolved";
type RouletteBets = Partial<Record<RouletteBetId, number>>;

const OUTSIDE_BET_ROWS: Array<Array<{ id: RouletteBetId; label: string; color?: "red" | "black" }>> = [
  [
    { id: "outside:low", label: "1 a 12" },
    { id: "outside:high", label: "13 a 25" },
  ],
  [
    { id: "outside:even", label: "PAR" },
    { id: "outside:odd", label: "IMPAR" },
    { id: "outside:red", label: "ROJO", color: "red" },
    { id: "outside:black", label: "NEGRO", color: "black" },
  ],
];

function sumBets(bets: RouletteBets) {
  return Object.values(bets).reduce((sum, value) => sum + (value ?? 0), 0);
}

function buildWheelGradient() {
  return `conic-gradient(${ROULETTE_WHEEL_ORDER.map((pocket, index) => {
    const start = index * SEGMENT_ANGLE;
    const end = start + SEGMENT_ANGLE;
    const tone = getPocketColor(pocket) === "red" ? "#e53935" : "#161616";

    return `${tone} ${start}deg ${end}deg`;
  }).join(", ")})`;
}

export function TavernRoulette() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [phase, setPhase] = useState<RoulettePhase>("betting");
  const [selectedChip, setSelectedChip] = useState<number>(ROULETTE_CHIPS[2]);
  const [bets, setBets] = useState<RouletteBets>({});
  const [lastSubmittedBets, setLastSubmittedBets] = useState<RouletteBets>({});
  const [lastNumbers, setLastNumbers] = useState<RoulettePocket[]>(["23", "3", "10", "17", "13", "25", "9", "4", "18", "7"]);
  const [roundResult, setRoundResult] = useState<RouletteRoundResult | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [updating, setUpdating] = useState(false);

  const wheelGradient = useMemo(() => buildWheelGradient(), []);
  const totalBet = useMemo(() => sumBets(bets), [bets]);
  const canSpin = Boolean(player && totalBet > 0 && player.gold >= totalBet && phase !== "spinning" && !updating);
  const highlightedWinningIds = useMemo(() => new Set(roundResult?.winningBets.map((bet) => bet.id) ?? []), [roundResult]);
  const isSpinning = phase === "spinning";

  async function handleRefresh() {
    setUpdating(true);
    await refreshPlayer();
    setUpdating(false);
  }

  function handlePlaceBet(id: RouletteBetId) {
    if (!player || phase === "spinning") {
      return;
    }

    if (id === "outside:red" && (bets["outside:black"] ?? 0) > 0) {
      return;
    }

    if (id === "outside:black" && (bets["outside:red"] ?? 0) > 0) {
      return;
    }

    if (totalBet + selectedChip > player.gold) {
      return;
    }

    setRoundResult(null);
    setPhase("betting");
    setBets((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + selectedChip,
    }));
  }

  function handleClearBets() {
    if (phase === "spinning") {
      return;
    }

    setBets({});
    setRoundResult(null);
    setPhase("betting");
  }

  function handleDoubleBets() {
    if (!player || phase === "spinning" || totalBet <= 0) {
      return;
    }

    if (totalBet * 2 > player.gold) {
      return;
    }

    setBets((current) =>
      Object.fromEntries(
        Object.entries(current).map(([id, amount]) => [id, (amount ?? 0) * 2]),
      ) as RouletteBets,
    );
    setRoundResult(null);
    setPhase("betting");
  }

  function handleRebet() {
    if (!player || phase === "spinning") {
      return;
    }

    const nextTotal = sumBets(lastSubmittedBets);
    if (nextTotal <= 0 || nextTotal > player.gold) {
      return;
    }

    setBets(lastSubmittedBets);
    setRoundResult(null);
    setPhase("betting");
  }

  async function handleSpin() {
    if (!player || !canSpin) {
      return;
    }

    setUpdating(true);
    const snapshot = { ...bets };
    const betCost = sumBets(snapshot);
    const balanceAfterBet = player.gold - betCost;
    const deducted = await setPlayerGold(balanceAfterBet);

    if (!deducted) {
      setUpdating(false);
      return;
    }

    setLastSubmittedBets(snapshot);

    const winningPocket = spinRoulette();
    const result = resolveRouletteRound(snapshot, winningPocket);
    const winningIndex = getWinningPocketIndex(winningPocket);
    const extraSpins = 6 * 360;
    const targetRotation =
      wheelRotation + extraSpins - winningIndex * SEGMENT_ANGLE - POCKET_CENTER_OFFSET;

    setWheelRotation(targetRotation);
    setPhase("spinning");

    window.setTimeout(async () => {
      if (result.totalPayout > 0) {
        await setPlayerGold(balanceAfterBet + result.totalPayout);
      }

      setRoundResult(result);
      setLastNumbers((current) => [winningPocket, ...current].slice(0, 10));
      setBets({});
      setPhase("resolved");
      setUpdating(false);
    }, SPIN_DURATION_MS);
  }

  if (isHydrating) {
    return (
      <RouletteMessage
        title="Mesa de ruleta compacta"
        description="Recuperando tu sesion del reino para abrir la mesa..."
      />
    );
  }

  if (!player) {
    return (
      <RouletteMessage
        title="Mesa de ruleta compacta"
        description="Conecta tu perfil del reino en el panel superior para apostar con tu oro real."
      />
    );
  }

  const winningPocket = roundResult?.winningPocket ?? null;
  const neighborPreview = winningPocket ? getNeighborPreview(winningPocket) : [];
  const winningColor = winningPocket ? getPocketColor(winningPocket) : null;

  return (
    <div className="-mx-2 w-[calc(100%+1rem)] origin-top scale-[0.985] rounded-[2.25rem] bg-[linear-gradient(180deg,#8f6224,#5d3812_38%,#2d1608)] p-[3px] shadow-[0_24px_65px_rgba(0,0,0,0.45)] sm:-mx-1 sm:w-[calc(100%+0.5rem)] sm:scale-[0.992] md:mx-0 md:w-full md:scale-100">
      <div className="space-y-3 rounded-[2.05rem] border border-amber-200/15 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.14),transparent_32%),linear-gradient(180deg,#0f6d30,#0a5225_54%,#073816)] p-2.5 shadow-[inset_0_14px_40px_rgba(255,255,255,0.04),inset_0_-14px_35px_rgba(0,0,0,0.34)] sm:p-3 md:space-y-4 md:p-5">
        <div className="rounded-[1.65rem] border border-amber-200/15 bg-[linear-gradient(180deg,rgba(8,44,20,0.88),rgba(3,25,11,0.78))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm md:px-4 md:py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-300 shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/55">
                  Mesa activa
                </p>
                <p className="text-lg font-black text-stone-50">{player.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
              <StatusChip label="Saldo" value={`${player.gold}`} accent="amber" />
              <StatusChip label="Apuesta" value={`${totalBet}`} accent="emerald" />
              <StatusChip
                label="Ficha"
                value={`x${selectedChip}`}
                accent="stone"
              />
              <button
                type="button"
                onClick={handleRefresh}
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-200 transition hover:border-amber-300/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
                Refrescar
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
          <div className="space-y-4">
            <div className="rounded-[1.8rem] border border-amber-200/15 bg-[linear-gradient(180deg,rgba(9,39,18,0.82),rgba(3,22,10,0.72))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/65">
                    Ruleta compacta
                  </p>
                  <p className="mt-1 text-sm text-stone-200/80">
                    Solo del 1 al 25. Mesa compacta para movil y cobro real sobre tu oro del reino.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/70">
                  1-25
                </span>
              </div>

              <div className="mt-3.5 flex flex-col items-center gap-3 rounded-[1.5rem] border border-amber-200/12 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.08),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.3))] p-2.5 md:mt-4 md:gap-4 md:p-3">
                <RouletteWheel
                  wheelRotation={wheelRotation}
                  wheelGradient={wheelGradient}
                  winningPocket={winningPocket}
                />

                <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/55">
                      Ultimo resultado
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span className={`inline-flex min-h-14 min-w-14 items-center justify-center rounded-full border-2 text-xl font-black ${
                        winningPocket
                          ? winningColor === "red"
                            ? "border-rose-300/25 bg-rose-500/90 text-white"
                            : "border-stone-500 bg-stone-950 text-stone-100"
                          : "border-white/10 bg-black/20 text-stone-300"
                      }`}>
                        {winningPocket ?? "--"}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-black text-stone-100">
                          {winningPocket ? `${winningColor === "red" ? "Rojo" : "Negro"} / ${getPocketParityLabel(winningPocket)}` : "Esperando giro"}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-stone-400">
                          {phase === "spinning"
                            ? "La bola sigue girando"
                            : phase === "resolved"
                              ? roundResult?.totalPayout
                                ? `Pagado ${roundResult.totalPayout}`
                                : "Sin premio"
                              : "Coloca tus fichas"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/55">
                      Ultimos 10
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lastNumbers.map((pocket, index) => (
                        <span
                          key={`${pocket}-${index}`}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border text-sm font-black ${
                            getPocketColor(pocket) === "red"
                              ? "border-rose-300/25 bg-rose-500/90 text-white"
                              : "border-stone-500 bg-stone-950 text-stone-100"
                          }`}
                        >
                          {pocket}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-amber-200/15 bg-[linear-gradient(180deg,rgba(9,39,18,0.82),rgba(3,22,10,0.72))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                  Fichas disponibles
                </p>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                  Valor activo x{selectedChip}
                </span>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {isSpinning ? (
                  <motion.div
                    key="collapsed-chips"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-3 md:mt-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                          Ficha fijada
                        </p>
                        <p className="mt-1 text-sm text-stone-300/80">
                          El valor queda bloqueado hasta que termine el giro.
                        </p>
                      </div>
                      <span className="inline-flex h-14 min-w-14 items-center justify-center rounded-full border-[5px] border-amber-200 bg-gradient-to-br from-amber-200 to-amber-400 px-3 text-lg font-black text-stone-950 shadow-[0_10px_22px_rgba(0,0,0,0.28)]">
                        {selectedChip}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded-chips"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3.5 flex flex-wrap justify-center gap-3 rounded-[1.35rem] border border-white/10 bg-black/20 p-2.5 md:mt-4 md:p-3">
                      {ROULETTE_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setSelectedChip(chip)}
                          className={`inline-flex h-16 w-16 items-center justify-center rounded-full border-[5px] font-black shadow-[0_10px_22px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 ${
                            selectedChip === chip
                              ? "border-amber-200 bg-gradient-to-br from-amber-200 to-amber-400 text-stone-950"
                              : chip === 1
                                ? "border-sky-200 bg-gradient-to-br from-sky-300 to-sky-500 text-white"
                                : chip === 5
                                  ? "border-pink-200 bg-gradient-to-br from-pink-300 to-pink-500 text-white"
                                  : chip === 10
                                    ? "border-lime-200 bg-gradient-to-br from-lime-300 to-lime-600 text-white"
                                    : chip === 25
                                      ? "border-cyan-100 bg-gradient-to-br from-cyan-200 to-cyan-500 text-white"
                                      : "border-rose-100 bg-gradient-to-br from-rose-300 to-rose-600 text-white"
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="self-start rounded-[1.8rem] border border-amber-200/15 bg-[linear-gradient(180deg,rgba(9,39,18,0.84),rgba(3,22,10,0.72))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                  Mesa de apuestas
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/70">
                Gana con pleno x24
              </div>
            </div>

            <div className="mt-3.5 md:mt-5">
              <AnimatePresence initial={false} mode="wait">
                {isSpinning ? (
                  <motion.div
                    key="collapsed-board"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-[1.5rem] border border-amber-200/15 bg-[linear-gradient(180deg,rgba(15,44,20,0.55),rgba(4,20,10,0.48))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                            Mesa replegada
                          </p>
                        </div>
                        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-100">
                          Girando
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded-board"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-[1.5rem] border border-emerald-200/20 bg-[linear-gradient(180deg,rgba(12,116,54,0.36),rgba(8,66,31,0.52))] p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] md:p-3">
                      <div className="space-y-2">
                        {ROULETTE_NUMBER_GRID.map((row, rowIndex) => (
                          <div key={`row-${rowIndex}`} className="grid grid-cols-5 gap-2">
                            {row.map((pocket) => (
                              <BetCell
                                key={pocket}
                                label={pocket}
                                amount={bets[`straight:${pocket}`]}
                                active={highlightedWinningIds.has(`straight:${pocket}`)}
                                tone={getPocketColor(pocket)}
                                onClick={() => handlePlaceBet(`straight:${pocket}`)}
                              />
                            ))}
                          </div>
                        ))}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {OUTSIDE_BET_ROWS[0].map((bet) => (
                            <BetCell
                              key={bet.id}
                              label={bet.label}
                              amount={bets[bet.id]}
                              active={highlightedWinningIds.has(bet.id)}
                              tone="outside"
                              compact
                              onClick={() => handlePlaceBet(bet.id)}
                            />
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {OUTSIDE_BET_ROWS[1].map((bet) => (
                            <BetCell
                              key={bet.id}
                              label={bet.label}
                              amount={bets[bet.id]}
                              active={highlightedWinningIds.has(bet.id)}
                              tone={bet.color ?? "outside"}
                              compact
                              disabled={
                                (bet.id === "outside:red" && (bets["outside:black"] ?? 0) > 0) ||
                                (bet.id === "outside:black" && (bets["outside:red"] ?? 0) > 0)
                              }
                              onClick={() => handlePlaceBet(bet.id)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="rounded-[1.35rem] border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                  Apuestas colocadas
                </p>
                {Object.keys(bets).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(bets).map(([id, amount]) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-stone-950/55 px-3 py-2 text-xs font-bold text-stone-200"
                      >
                        <span>{formatBetLabel(id as RouletteBetId)}</span>
                        <span className="text-amber-300">{amount}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-400">
                    Aun no colocaste fichas en la mesa.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-[1.35rem] border border-white/10 bg-black/20 p-2 sm:grid-cols-4 xl:min-w-[420px]">
                <ActionButton
                  label="Repetir"
                  icon={RotateCcw}
                  disabled={isSpinning || sumBets(lastSubmittedBets) <= 0 || sumBets(lastSubmittedBets) > player.gold}
                  tone="secondary"
                  onClick={handleRebet}
                />
                <ActionButton
                  label="x2 apuesta"
                  icon={Coins}
                  disabled={isSpinning || totalBet <= 0 || totalBet * 2 > player.gold}
                  tone="secondary"
                  onClick={handleDoubleBets}
                />
                <ActionButton
                  label="Limpiar"
                  icon={Trash2}
                  disabled={isSpinning || totalBet <= 0}
                  tone="secondary"
                  onClick={handleClearBets}
                />
                <ActionButton
                  label={isSpinning ? "Girando..." : "Girar"}
                  icon={RefreshCw}
                  disabled={!canSpin}
                  tone="primary"
                  onClick={() => void handleSpin()}
                />
              </div>
            </div>

            <AnimatePresence initial={false}>
              {phase === "resolved" && roundResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 rounded-[1.35rem] border border-amber-200/15 bg-[linear-gradient(180deg,rgba(17,10,4,0.5),rgba(0,0,0,0.2))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                        Resultado de la ronda
                      </p>
                      <p className="mt-2 text-xl font-black text-stone-50">
                        {roundResult.totalPayout > 0
                          ? `Cobraste ${roundResult.totalPayout} de oro`
                          : "La casa se queda esta ronda"}
                      </p>
                      <p className="mt-2 text-sm text-stone-400">
                        Numero ganador: {roundResult.winningPocket}. Vecinos visibles: {neighborPreview.join(" / ")}
                      </p>
                    </div>
                    <div className="rounded-[1rem] border border-white/10 bg-stone-950/45 px-4 py-3 text-sm text-stone-300">
                      <p>Apostado: <span className="font-black text-stone-100">{roundResult.totalBet}</span></p>
                      <p className="mt-1">Ganancia neta: <span className={`font-black ${roundResult.totalPayout > roundResult.totalBet ? "text-emerald-300" : "text-rose-300"}`}>{roundResult.totalPayout - roundResult.totalBet}</span></p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouletteWheel({
  wheelRotation,
  wheelGradient,
  winningPocket,
}: {
  wheelRotation: number;
  wheelGradient: string;
  winningPocket: RoulettePocket | null;
}) {
  return (
    <div className="relative flex h-[292px] w-[292px] items-center justify-center rounded-full bg-[radial-gradient(circle,#6d4118,#3e220d_65%,#1e0d04)] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.42)] sm:h-[328px] sm:w-[328px]">
      <div className="absolute top-2 z-20 h-0 w-0 border-l-[14px] border-r-[14px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]" />
      <motion.div
        animate={{ rotate: wheelRotation }}
        transition={{ duration: SPIN_DURATION_MS / 1000, ease: [0.12, 0.78, 0.16, 1] }}
        className="relative h-full w-full rounded-full border-[12px] border-amber-700 bg-stone-950 shadow-[0_18px_35px_rgba(0,0,0,0.35),inset_0_8px_30px_rgba(0,0,0,0.4)]"
        style={{ backgroundImage: wheelGradient }}
      >
        <div className="absolute inset-[14px] rounded-full border-[12px] border-amber-300/85 bg-[radial-gradient(circle_at_top,#2f9e44,#116329_58%,#0d421d)] shadow-[inset_0_8px_16px_rgba(255,255,255,0.12)]" />

        {ROULETTE_WHEEL_ORDER.map((pocket, index) => {
          const angle = index * SEGMENT_ANGLE + POCKET_CENTER_OFFSET;
          const isWinner = pocket === winningPocket;
          return (
            <div
              key={pocket}
              className="absolute left-1/2 top-1/2 h-[44%] origin-bottom"
              style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
            >
              <div className="relative h-full">
                <div
                  className={`absolute left-1/2 top-2 -translate-x-1/2 text-xs font-black tracking-tight ${
                    isWinner ? "text-amber-200 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)]" : "text-white/95"
                  }`}
                  style={{ transform: `translateX(-50%) rotate(${-angle}deg)` }}
                >
                  {pocket}
                </div>
              </div>
            </div>
          );
        })}

        <div className="absolute inset-[27%] rounded-full border-[10px] border-amber-300 bg-[radial-gradient(circle,#7c5b4c,#5b4137_68%,#3a2925)] shadow-[inset_0_10px_20px_rgba(255,255,255,0.08)]">
          <div className="absolute inset-[18%] rounded-full border border-amber-200/40 bg-[radial-gradient(circle,#1b5e20,#0f3f19)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-24 w-24">
              {[0, 45, 90, 135].map((rotation) => (
                <div
                  key={rotation}
                  className="absolute left-1/2 top-1/2 h-4 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600"
                  style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
                />
              ))}
              <div className="absolute inset-0 m-auto h-9 w-9 rounded-full border-4 border-amber-100 bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.45)]" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BetCell({
  label,
  amount,
  active,
  tone,
  compact = false,
  disabled = false,
  onClick,
}: {
  label: string;
  amount?: number;
  active: boolean;
  tone: "red" | "black" | "green" | "outside";
  compact?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const toneClass =
    tone === "red"
      ? "border-rose-300/30 bg-gradient-to-b from-rose-500 to-rose-700 text-white"
      : tone === "black"
        ? "border-stone-600 bg-gradient-to-b from-stone-800 to-black text-stone-100"
        : tone === "green"
          ? "border-emerald-300/30 bg-gradient-to-b from-emerald-500/40 to-emerald-700/50 text-emerald-100"
          : "border-emerald-300/20 bg-gradient-to-b from-emerald-600/45 to-emerald-900/55 text-stone-100";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative overflow-hidden rounded-[0.95rem] border ${toneClass} ${
        compact ? "min-h-14 px-2 py-2.5 text-sm" : "min-h-14 px-2 py-3 text-base"
      } font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none`}
    >
      {active ? (
        <div className="absolute inset-0 border-2 border-amber-200/90 shadow-[inset_0_0_0_2px_rgba(253,224,71,0.55),0_0_18px_rgba(253,224,71,0.35)]" />
      ) : null}
      <span className="relative z-10">{label}</span>
      {amount ? (
        <span className="absolute bottom-1 right-1 z-10 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-amber-100/30 bg-amber-400 px-1.5 text-[10px] font-black text-stone-950 shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
          {amount}
        </span>
      ) : null}
    </button>
  );
}

function ActionButton({
  label,
  icon: Icon,
  disabled,
  tone,
  onClick,
}: {
  label: string;
  icon: typeof Coins;
  disabled: boolean;
  tone: "primary" | "secondary";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
        tone === "primary"
          ? "border border-rose-300/20 bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_10px_20px_rgba(127,29,29,0.32)] hover:from-rose-400 hover:to-rose-600"
          : "border border-white/10 bg-[linear-gradient(180deg,rgba(15,59,28,0.92),rgba(5,31,14,0.9))] text-stone-100 hover:border-amber-200/25 hover:text-amber-100"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatusChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "amber" | "emerald" | "stone";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-200"
      : accent === "emerald"
        ? "text-emerald-200"
        : "text-stone-100";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/55">
        {label}
      </p>
      <p className={`mt-1 text-sm font-black ${accentClass}`}>{value}</p>
    </div>
  );
}

function RouletteMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-emerald-500/15 bg-[linear-gradient(180deg,#146b31,#0a3f1d)] px-6 py-8 text-center">
      <div className="mb-4 rounded-full bg-amber-300/10 p-4 text-amber-300">
        <Coins className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-black text-stone-100">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-stone-300/80">{description}</p>
    </div>
  );
}
