import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  CandlestickChart,
  Clock3,
  Coins,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  REALM_EXCHANGE_ASSETS,
  REALM_EXCHANGE_MAX_STAKE,
  REALM_EXCHANGE_MIN_STAKE,
  REALM_EXCHANGE_TRADE_LOT,
} from "../features/realmExchange/realmExchange.data";
import {
  buildAssetHistory,
  getAssetDelta,
  getAssetPriceAt,
  getNextTickAt,
  resolvePrediction,
} from "../features/realmExchange/realmExchange.simulation";
import {
  buyAssetShares,
  findActivePrediction,
  findPosition,
  loadExchangeState,
  openAssetPrediction,
  saveExchangeState,
  sellAssetShares,
} from "../features/realmExchange/realmExchange.storage";
import type {
  RealmExchangeAsset,
  RealmExchangePlayerState,
  RealmExchangePrediction,
} from "../features/realmExchange/realmExchange.types";

function formatGold(value: number) {
  return new Intl.NumberFormat("es-PY").format(Math.max(0, Math.floor(value)));
}

function formatClock(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function buildChartPath(points: Array<{ price: number }>) {
  if (points.length === 0) {
    return "";
  }

  const width = 320;
  const height = 150;
  const padding = 14;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);

  return points
    .map((point, index) => {
      const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((point.price - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getAssetById(assetId: string): RealmExchangeAsset {
  return REALM_EXCHANGE_ASSETS.find((asset) => asset.id === assetId) ?? REALM_EXCHANGE_ASSETS[0];
}

function PredictionChip({ prediction }: { prediction: RealmExchangePrediction }) {
  const asset = getAssetById(prediction.assetId);
  const done = prediction.status !== "active";
  const tone =
    prediction.status === "won"
      ? "text-emerald-200 border-emerald-400/25 bg-emerald-500/10"
      : prediction.status === "lost"
        ? "text-rose-200 border-rose-400/25 bg-rose-500/10"
        : prediction.status === "refunded"
          ? "text-stone-200 border-stone-500/35 bg-stone-700/25"
          : "text-amber-100 border-amber-400/25 bg-amber-500/10";

  return (
    <div className={`rounded-2xl border p-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.14em]">{asset.kingdomName}</span>
        <span className="text-xs font-bold">{prediction.direction === "up" ? "Sube" : "Baja"}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-lg font-black">{formatGold(prediction.stakeGold)}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-80">
          {done ? prediction.status : formatClock(prediction.settlesAt - Date.now())}
        </span>
      </div>
    </div>
  );
}

export function RealmStockExchange() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const [selectedAssetId, setSelectedAssetId] = useState(REALM_EXCHANGE_ASSETS[0].id);
  const [state, setState] = useState<RealmExchangePlayerState>(() => ({
    positions: [],
    predictions: [],
  }));
  const [stakeGold, setStakeGold] = useState(500);
  const [tradeLots, setTradeLots] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [now, setNow] = useState(Date.now());

  const selectedAsset = useMemo(() => getAssetById(selectedAssetId), [selectedAssetId]);
  const currentPrice = useMemo(() => getAssetPriceAt(selectedAsset, now), [now, selectedAsset]);
  const delta = useMemo(() => getAssetDelta(selectedAsset, now), [now, selectedAsset]);
  const history = useMemo(() => buildAssetHistory(selectedAsset, now), [now, selectedAsset]);
  const chartPath = useMemo(() => buildChartPath(history), [history]);
  const position = useMemo(() => findPosition(state, selectedAsset.id), [selectedAsset.id, state]);
  const activePrediction = useMemo(
    () => findActivePrediction(state, selectedAsset.id),
    [selectedAsset.id, state]
  );
  const shareCost = tradeLots * REALM_EXCHANGE_TRADE_LOT * currentPrice;
  const ownedValue = position ? position.sharesOwned * currentPrice : 0;
  const floatingProfit = position ? ownedValue - position.totalInvested : 0;
  const nextTickAt = useMemo(() => getNextTickAt(selectedAsset, now), [now, selectedAsset]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!player) {
      setState({ positions: [], predictions: [] });
      return;
    }

    setState(loadExchangeState(player.id));
  }, [player]);

  useEffect(() => {
    if (!player || isUpdating) {
      return;
    }

    const activePredictions = state.predictions.filter((prediction) => prediction.status === "active");

    if (activePredictions.length === 0) {
      return;
    }

    const resolved = state.predictions.map((prediction) =>
      resolvePrediction(prediction, getAssetById(prediction.assetId), now)
    );
    const payout = resolved.reduce((total, prediction, index) => {
      const previous = state.predictions[index];
      const justResolved = previous.status === "active" && prediction.status !== "active";
      return total + (justResolved ? prediction.payoutGold ?? 0 : 0);
    }, 0);
    const changed = resolved.some((prediction, index) => prediction.status !== state.predictions[index].status);

    if (!changed) {
      return;
    }

    const nextState = { ...state, predictions: resolved };
    setState(nextState);
    saveExchangeState(player.id, nextState);

    if (payout > 0) {
      void setPlayerGold(player.gold + payout).then(() => {
        setFeedback(`Prediccion resuelta. Cobraste ${formatGold(payout)} de oro.`);
      });
    } else {
      setFeedback("Prediccion resuelta sin premio.");
    }
  }, [isUpdating, now, player, setPlayerGold, state]);

  async function applyOperation(result: ReturnType<typeof buyAssetShares>) {
    if (!player || result.status === "error") {
      setFeedback(result.message);
      return;
    }

    setIsUpdating(true);
    const updated = await setPlayerGold(result.nextGold);

    if (!updated) {
      setFeedback("No se pudo actualizar el oro del jugador.");
      setIsUpdating(false);
      return;
    }

    setState(result.state);
    saveExchangeState(player.id, result.state);
    setFeedback(result.message);
    setIsUpdating(false);
  }

  async function handleBuy() {
    if (!player || isUpdating) {
      return;
    }

    await applyOperation(
      buyAssetShares({
        state,
        asset: selectedAsset,
        gold: player.gold,
        lots: tradeLots,
        at: now,
      })
    );
  }

  async function handleSell() {
    if (!player || isUpdating) {
      return;
    }

    await applyOperation(
      sellAssetShares({
        state,
        asset: selectedAsset,
        gold: player.gold,
        lots: tradeLots,
        at: now,
      })
    );
  }

  async function handlePrediction(direction: "up" | "down") {
    if (!player || isUpdating) {
      return;
    }

    await applyOperation(
      openAssetPrediction({
        state,
        asset: selectedAsset,
        gold: player.gold,
        direction,
        stakeGold,
        at: now,
      })
    );
  }

  const disabled = !player || isUpdating || isHydrating;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-cyan-400/15 bg-stone-950/80 shadow-[0_0_40px_rgba(8,145,178,0.08)]">
      <div className="grid gap-4 border-b border-stone-800 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.88),rgba(12,10,9,0.96))] p-4 md:grid-cols-[1.15fr_.85fr] md:p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">
                Bolsa del reino
              </p>
              <h3 className="mt-1 text-2xl font-black text-stone-100">
                {selectedAsset.assetName}
              </h3>
              <p className="mt-1 text-sm text-stone-400">{selectedAsset.kingdomName}</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshPlayer()}
              className="kd-touch rounded-2xl border border-stone-700 bg-stone-950/70 p-3 text-stone-300 transition hover:border-cyan-400/30 hover:text-cyan-200"
              aria-label="Refrescar oro"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {REALM_EXCHANGE_ASSETS.map((asset) => {
              const active = selectedAssetId === asset.id;
              const price = getAssetPriceAt(asset, now);

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`kd-touch rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-cyan-300/45 bg-cyan-400/10 text-cyan-100"
                      : "border-stone-800 bg-stone-950/55 text-stone-300 hover:border-cyan-400/20"
                  }`}
                >
                  <span className="block truncate text-[10px] font-black uppercase tracking-[0.16em]">
                    {asset.kingdomName}
                  </span>
                  <span className="mt-2 block text-lg font-black">{formatGold(price)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] border border-stone-800 bg-stone-950/62 p-3">
          <Metric label="Oro" value={player ? formatGold(player.gold) : "0"} icon={<Coins className="h-4 w-4" />} />
          <Metric label="Tick" value={formatClock(nextTickAt - now)} icon={<Clock3 className="h-4 w-4" />} />
          <Metric label="Precio" value={formatGold(currentPrice)} icon={<CandlestickChart className="h-4 w-4" />} />
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_.8fr] lg:p-5">
        <div className="rounded-[1.8rem] border border-cyan-400/15 bg-[#071011] p-3">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[1.3rem] border border-stone-800 bg-[linear-gradient(180deg,rgba(8,13,14,0.96),rgba(3,7,7,0.98))]">
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:42px_42px]" />
            <svg viewBox="0 0 320 150" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="realmExchangeFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={selectedAsset.accent} stopOpacity="0.24" />
                  <stop offset="100%" stopColor={selectedAsset.accent} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${chartPath} L 306 140 L 14 140 Z`} fill="url(#realmExchangeFill)" opacity="0.7" />
              <motion.path
                d={chartPath}
                fill="none"
                stroke={selectedAsset.accent}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                initial={{ pathLength: 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7 }}
              />
            </svg>
            <div className="absolute left-4 top-4 rounded-2xl border border-stone-700 bg-stone-950/70 px-3 py-2">
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                Actual
              </span>
              <span className="text-2xl font-black text-stone-100">{formatGold(currentPrice)}</span>
            </div>
            <div
              className={`absolute bottom-4 right-4 rounded-2xl border px-3 py-2 text-sm font-black ${
                delta >= 0
                  ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/25 bg-rose-500/10 text-rose-200"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {formatGold(delta)}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.5rem] border border-amber-400/15 bg-stone-950/62 p-4">
            <PanelTitle icon={<Clock3 className="h-4 w-4" />} label="Prediccion 2h" />
            <div className="mt-3 grid gap-3">
              <input
                type="number"
                value={stakeGold}
                min={REALM_EXCHANGE_MIN_STAKE}
                max={REALM_EXCHANGE_MAX_STAKE}
                disabled={disabled || Boolean(activePrediction)}
                onChange={(event) => setStakeGold(Math.max(0, Number(event.target.value)))}
                className="w-full rounded-2xl border border-stone-700 bg-black px-4 py-3 text-sm font-black text-stone-100 outline-none transition focus:border-amber-400/60"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={disabled || Boolean(activePrediction)}
                  onClick={() => void handlePrediction("up")}
                  className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/12 px-3 py-3 text-sm font-black text-emerald-100 transition hover:border-emerald-300/45 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ArrowUp className="h-4 w-4" />
                  Sube
                </button>
                <button
                  type="button"
                  disabled={disabled || Boolean(activePrediction)}
                  onClick={() => void handlePrediction("down")}
                  className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/12 px-3 py-3 text-sm font-black text-rose-100 transition hover:border-rose-300/45 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ArrowDown className="h-4 w-4" />
                  Baja
                </button>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3 text-xs text-stone-400">
                Pago: x{activePrediction?.lockedPayoutMultiplier.toFixed(2) ?? "segun riesgo"} / Min {formatGold(REALM_EXCHANGE_MIN_STAKE)} / Max {formatGold(REALM_EXCHANGE_MAX_STAKE)}
              </div>
              {activePrediction ? <PredictionChip prediction={activePrediction} /> : null}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-cyan-400/15 bg-stone-950/62 p-4">
            <PanelTitle icon={<WalletCards className="h-4 w-4" />} label="Acciones" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="Posees" value={position ? formatGold(position.sharesOwned) : "0"} />
              <Metric label="Promedio" value={position ? formatGold(position.averagePrice) : "0"} />
              <Metric label="Valor" value={formatGold(ownedValue)} />
              <Metric label="Resultado" value={`${floatingProfit >= 0 ? "+" : ""}${formatGold(floatingProfit)}`} />
            </div>
            <div className="mt-3 grid gap-2">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  value={tradeLots}
                  min={1}
                  disabled={disabled}
                  onChange={(event) => setTradeLots(Math.max(1, Number(event.target.value)))}
                  className="w-full rounded-2xl border border-stone-700 bg-black px-4 py-3 text-sm font-black text-stone-100 outline-none transition focus:border-cyan-400/60"
                />
                <div className="rounded-2xl border border-stone-800 bg-stone-950/70 px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-stone-400">
                  Lotes
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={disabled || shareCost <= 0}
                  onClick={() => void handleBuy()}
                  className="kd-touch rounded-2xl border border-sky-300/25 bg-sky-500/12 px-3 py-3 text-sm font-black text-sky-100 transition hover:border-sky-300/45 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Comprar
                </button>
                <button
                  type="button"
                  disabled={disabled || !position}
                  onClick={() => void handleSell()}
                  className="kd-touch rounded-2xl border border-amber-300/25 bg-amber-500/12 px-3 py-3 text-sm font-black text-amber-100 transition hover:border-amber-300/45 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Vender
                </button>
              </div>
              <div className="text-xs font-bold text-stone-500">
                {REALM_EXCHANGE_TRADE_LOT} acciones por lote / Costo actual {formatGold(shareCost)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-stone-800 p-4 lg:grid-cols-[.8fr_1.2fr] lg:p-5">
        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
          <PanelTitle icon={<WalletCards className="h-4 w-4" />} label="Cartera" />
          <div className="mt-3 grid gap-2">
            {state.positions.length > 0 ? (
              state.positions.map((item) => {
                const asset = getAssetById(item.assetId);
                return (
                  <div key={item.assetId} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-black/30 p-3">
                    <div>
                      <p className="text-sm font-black text-stone-100">{asset.kingdomName}</p>
                      <p className="text-xs text-stone-500">{item.sharesOwned} acciones</p>
                    </div>
                    <p className="text-sm font-black text-amber-200">{formatGold(item.sharesOwned * getAssetPriceAt(asset, now))}</p>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-stone-800 bg-black/30 p-3 text-sm text-stone-500">
                Sin acciones todavia.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
          <PanelTitle icon={<Clock3 className="h-4 w-4" />} label="Predicciones" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {state.predictions.length > 0 ? (
              state.predictions.slice(-4).reverse().map((prediction) => (
                <PredictionChip key={prediction.id} prediction={prediction} />
              ))
            ) : (
              <p className="rounded-2xl border border-stone-800 bg-black/30 p-3 text-sm text-stone-500">
                Sin predicciones abiertas.
              </p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {feedback ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-stone-800 bg-stone-950/70 px-4 py-3 text-sm font-bold text-stone-300 lg:px-5"
          >
            {feedback}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-stone-800 bg-black/30 p-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 truncate text-lg font-black text-stone-100">{value}</p>
    </div>
  );
}

function PanelTitle({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
      {icon}
      <span>{label}</span>
    </div>
  );
}
