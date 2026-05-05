import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Coins,
  Crown,
  FlaskConical,
  Gem,
  RefreshCw,
  Shield,
  Skull,
  Sparkles,
  Sword,
  UserRound,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  addPlayerDailySlotsNetWins,
  buildScratchDateKey,
  getPlayerDailySlotsNetWins,
  MAX_DAILY_SLOTS_WIN_LIMIT,
} from "../utils/scratchUtils";

type SlotPhase = "betting" | "spinning" | "resolved";
type SymbolId = "crown" | "gem" | "sword" | "potion" | "shield" | "skull";

type SlotSymbol = {
  id: SymbolId;
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  tone: string;
  glow: string;
};

type SpinOutcome = {
  reels: [SymbolId, SymbolId, SymbolId];
  multiplier: number;
  title: string;
};

const SYMBOLS: SlotSymbol[] = [
  {
    id: "crown",
    label: "Corona",
    shortLabel: "Corona",
    Icon: Crown,
    tone: "from-amber-200 via-amber-400 to-orange-500 text-stone-950",
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.38)]",
  },
  {
    id: "gem",
    label: "Gema",
    shortLabel: "Gema",
    Icon: Gem,
    tone: "from-cyan-200 via-teal-300 to-emerald-500 text-stone-950",
    glow: "shadow-[0_0_24px_rgba(45,212,191,0.34)]",
  },
  {
    id: "sword",
    label: "Espada",
    shortLabel: "Espada",
    Icon: Sword,
    tone: "from-stone-100 via-slate-300 to-slate-500 text-stone-950",
    glow: "shadow-[0_0_22px_rgba(226,232,240,0.26)]",
  },
  {
    id: "potion",
    label: "Pocion",
    shortLabel: "Pocion",
    Icon: FlaskConical,
    tone: "from-rose-200 via-pink-400 to-rose-600 text-stone-950",
    glow: "shadow-[0_0_22px_rgba(244,114,182,0.3)]",
  },
  {
    id: "shield",
    label: "Escudo",
    shortLabel: "Escudo",
    Icon: Shield,
    tone: "from-lime-200 via-green-400 to-emerald-700 text-stone-950",
    glow: "shadow-[0_0_18px_rgba(74,222,128,0.24)]",
  },
  {
    id: "skull",
    label: "Marca",
    shortLabel: "Marca",
    Icon: Skull,
    tone: "from-stone-500 via-stone-700 to-black text-stone-100",
    glow: "shadow-[0_0_18px_rgba(120,113,108,0.22)]",
  },
];

const SYMBOL_IDS = SYMBOLS.map((symbol) => symbol.id);
const INITIAL_REELS: [SymbolId, SymbolId, SymbolId] = ["sword", "crown", "shield"];
const REEL_STOP_DELAYS = [780, 1120, 1480];
const BET_PRESETS = [100, 500, 1000];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomSymbol(excluded?: SymbolId[]) {
  const available = SYMBOL_IDS.filter((symbol) => !excluded?.includes(symbol));
  return available[Math.floor(Math.random() * available.length)] ?? "shield";
}

function getSymbol(id: SymbolId) {
  return SYMBOLS.find((symbol) => symbol.id === id) ?? SYMBOLS[0];
}

function countSymbols(reels: [SymbolId, SymbolId, SymbolId]) {
  return reels.reduce<Record<SymbolId, number>>(
    (counts, symbol) => {
      counts[symbol] += 1;
      return counts;
    },
    {
      crown: 0,
      gem: 0,
      sword: 0,
      potion: 0,
      shield: 0,
      skull: 0,
    }
  );
}

function resolveMultiplier(reels: [SymbolId, SymbolId, SymbolId]) {
  const counts = countSymbols(reels);
  const triple = SYMBOL_IDS.find((symbol) => counts[symbol] === 3);
  const pair = SYMBOL_IDS.find((symbol) => counts[symbol] === 2 && symbol !== "skull");

  if (triple === "crown") return 24;
  if (triple === "gem") return 16;
  if (triple === "sword") return 10;
  if (triple === "potion") return 6;
  if (triple === "shield") return 4;
  if (pair) return 1.5;
  return 0;
}

function buildLosingReels(): [SymbolId, SymbolId, SymbolId] {
  const first = randomSymbol();
  const second = randomSymbol([first]);
  const third = randomSymbol([first, second]);
  return [first, second, third];
}

function buildPairReels(): [SymbolId, SymbolId, SymbolId] {
  const pair = randomSymbol(["skull"]);
  const odd = randomSymbol([pair]);
  const reels: [SymbolId, SymbolId, SymbolId] = [pair, pair, odd];
  return reels.sort(() => Math.random() - 0.5) as [SymbolId, SymbolId, SymbolId];
}

function generateSpinOutcome(): SpinOutcome {
  const roll = Math.random();
  let reels: [SymbolId, SymbolId, SymbolId];

  if (roll < 0.008) {
    reels = ["crown", "crown", "crown"];
  } else if (roll < 0.099) {
    reels = ["gem", "gem", "gem"];
  } else if (roll < 0.125) {
    reels = ["sword", "sword", "sword"];
  } else if (roll < 0.200) {
    reels = ["potion", "potion", "potion"];
  } else if (roll < 0.250) {
    reels = ["shield", "shield", "shield"];
  } else if (roll < 0.450) {
    reels = buildPairReels();
  } else {
    reels = buildLosingReels();
  }

  const multiplier = resolveMultiplier(reels);
  const title =
    multiplier >= 8
      ? "Tesoro mayor"
      : multiplier >= 2
        ? "Cobro noble"
        : multiplier > 0
          ? "Recuperas ventaja"
          : "Sin premio";

  return { reels, multiplier, title };
}

function buildVisibleStrip(center: SymbolId): [SymbolId, SymbolId, SymbolId] {
  return [randomSymbol([center]), center, randomSymbol([center])];
}

export function TavernSlots() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const intervalRefs = useRef<number[]>([]);
  const timeoutRefs = useRef<number[]>([]);
  const dateKey = useMemo(() => buildScratchDateKey(), []);
  const [phase, setPhase] = useState<SlotPhase>("betting");
  const [bet, setBet] = useState(100);
  const [visibleReels, setVisibleReels] = useState<[SymbolId[], SymbolId[], SymbolId[]]>([
    buildVisibleStrip(INITIAL_REELS[0]),
    buildVisibleStrip(INITIAL_REELS[1]),
    buildVisibleStrip(INITIAL_REELS[2]),
  ]);
  const [dailyNetWins, setDailyNetWins] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<SpinOutcome | null>(null);
  const [lastPrize, setLastPrize] = useState(0);
  const [message, setMessage] = useState("Elige apuesta y gira la maquina.");
  const [updating, setUpdating] = useState(false);

  const balance = player?.gold ?? 0;
  const maxAllowedBet = Math.max(1, balance);
  const safeBet = clamp(Math.floor(Number.isFinite(bet) ? bet : 0), 1, maxAllowedBet);
  const remainingDailyNet = Math.max(0, MAX_DAILY_SLOTS_WIN_LIMIT - dailyNetWins);
  const limitReached = dailyNetWins >= MAX_DAILY_SLOTS_WIN_LIMIT;
  const canSpin = Boolean(player && !updating && phase !== "spinning" && safeBet > 0 && safeBet <= balance && !limitReached);
  const potentialTopPrize = safeBet + Math.min(safeBet * 11, remainingDailyNet);

  useEffect(() => {
    if (!player) {
      setDailyNetWins(0);
      return;
    }

    setDailyNetWins(getPlayerDailySlotsNetWins(player.id, dateKey));
  }, [dateKey, player]);

  useEffect(
    () => () => {
      clearTimers();
    },
    []
  );

  function clearTimers() {
    intervalRefs.current.forEach((id) => window.clearInterval(id));
    timeoutRefs.current.forEach((id) => window.clearTimeout(id));
    intervalRefs.current = [];
    timeoutRefs.current = [];
  }

  async function handleRefresh() {
    setUpdating(true);
    await refreshPlayer();
    if (player) {
      setDailyNetWins(getPlayerDailySlotsNetWins(player.id, dateKey));
    }
    setUpdating(false);
  }

  function handleBetInput(value: string) {
    const raw = value.replace(/[^0-9]/g, "");

    if (!raw) {
      setBet(0);
      return;
    }

    setBet(clamp(parseInt(raw, 10) || 0, 0, maxAllowedBet));
  }

  async function resolveSpin(outcome: SpinOutcome, lockedBet: number) {
    if (!player) {
      return;
    }

    const rawPayout = Math.floor(lockedBet * outcome.multiplier);
    const rawNetWin = Math.max(0, rawPayout - lockedBet);
    const cappedNetWin = Math.min(rawNetWin, remainingDailyNet);
    const finalPayout = outcome.multiplier > 0 ? lockedBet + cappedNetWin : 0;
    const nextGold = player.gold - lockedBet + finalPayout;
    const updated = await setPlayerGold(nextGold);

    if (!updated) {
      setMessage("No se pudo actualizar el oro. Refresca tu perfil.");
      setUpdating(false);
      setPhase("resolved");
      return;
    }

    if (cappedNetWin > 0) {
      setDailyNetWins(addPlayerDailySlotsNetWins(player.id, dateKey, cappedNetWin));
    }

    setLastPrize(finalPayout);
    setLastOutcome(outcome);
    setMessage(
      outcome.multiplier <= 0
        ? "La maquina retuvo la apuesta."
        : cappedNetWin < rawNetWin
          ? `Cobro limitado: ${finalPayout.toLocaleString("es-PY")} oro.`
          : `Cobras ${finalPayout.toLocaleString("es-PY")} oro.`
    );
    setUpdating(false);
    setPhase("resolved");
  }

  function spin() {
    if (!canSpin || !player) {
      return;
    }

    clearTimers();
    const lockedBet = safeBet;
    const outcome = generateSpinOutcome();
    setBet(lockedBet);
    setLastOutcome(null);
    setLastPrize(0);
    setPhase("spinning");
    setUpdating(true);
    setMessage("Los sellos giran...");

    for (let reelIndex = 0; reelIndex < 3; reelIndex += 1) {
      const intervalId = window.setInterval(() => {
        setVisibleReels((current) => {
          const next = [...current] as [SymbolId[], SymbolId[], SymbolId[]];
          next[reelIndex] = buildVisibleStrip(randomSymbol());
          return next;
        });
      }, 82 + reelIndex * 18);
      intervalRefs.current.push(intervalId);

      const timeoutId = window.setTimeout(() => {
        window.clearInterval(intervalId);
        setVisibleReels((current) => {
          const next = [...current] as [SymbolId[], SymbolId[], SymbolId[]];
          next[reelIndex] = buildVisibleStrip(outcome.reels[reelIndex]);
          return next;
        });
      }, REEL_STOP_DELAYS[reelIndex]);
      timeoutRefs.current.push(timeoutId);
    }

    const finalTimeout = window.setTimeout(() => {
      void resolveSpin(outcome, lockedBet);
    }, REEL_STOP_DELAYS[2] + 320);
    timeoutRefs.current.push(finalTimeout);
  }

  function reset() {
    if (phase === "spinning") {
      return;
    }

    setPhase("betting");
    setLastOutcome(null);
    setLastPrize(0);
    setMessage("Elige apuesta y gira la maquina.");
  }

  if (isHydrating) {
    return <SlotsMessage title="Maquina del Tesoro" description="Recuperando tu perfil del reino..." />;
  }

  if (!player) {
    return <SlotsMessage title="Maquina del Tesoro" description="Conecta tu perfil para usar la maquina." />;
  }

  if (limitReached && phase === "betting") {
    return (
      <SlotsMessage
        title="Limite diario alcanzado"
        description={`Ya ganaste ${MAX_DAILY_SLOTS_WIN_LIMIT.toLocaleString("es-PY")} de oro neto hoy en Slots.`}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#080b0c] shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <div className="border-b border-cyan-300/15 bg-[linear-gradient(135deg,#091516,#1a0d13_48%,#241505)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Tragaperras arcano
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-50 sm:text-3xl">
              Maquina del Tesoro
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-stone-300">
            <StatusChip label="Oro" value={balance.toLocaleString("es-PY")} />
            <StatusChip label="Premio" value={lastPrize ? lastPrize.toLocaleString("es-PY") : "0"} />
            <StatusChip label="Max" value={potentialTopPrize.toLocaleString("es-PY")} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:p-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-cyan-200/20 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#101112,#030303)] p-3 shadow-[inset_0_0_34px_rgba(0,0,0,0.85)]">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-1 -translate-y-1/2 bg-cyan-200/60 shadow-[0_0_22px_rgba(103,232,249,0.8)]" />
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.72),transparent_30%,transparent_68%,rgba(0,0,0,0.78))]" />
            <div className="grid h-[18rem] grid-cols-3 gap-2 sm:h-[22rem] sm:gap-3">
              {visibleReels.map((reel, index) => (
                <Reel
                  key={index}
                  symbols={reel}
                  spinning={phase === "spinning"}
                  active={Boolean(lastOutcome && lastOutcome.reels[index] === reel[1] && lastOutcome.multiplier > 0)}
                  delay={index * 0.08}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="rounded-[1.25rem] border border-stone-800 bg-stone-950/70 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/80">
                Estado
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-300">{message}</p>
            </div>
            {phase === "resolved" ? (
              <button
                type="button"
                onClick={reset}
                className="kd-touch rounded-[1.25rem] border border-stone-700 bg-stone-950 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-stone-200 hover:border-cyan-300/30"
              >
                Nueva ronda
              </button>
            ) : null}
          </div>
        </div>

        <aside className="space-y-3">
          <Panel title="Apuesta" icon={<Coins className="h-4 w-4" />}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={bet === 0 ? "" : bet}
              onChange={(event) => handleBetInput(event.target.value)}
              disabled={phase === "spinning"}
              className="w-full rounded-2xl border border-cyan-300/20 bg-black px-4 py-3 text-lg font-black text-cyan-100 outline-none transition focus:border-cyan-200/60 disabled:opacity-60"
              placeholder="0"
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {BET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBet(clamp(preset, 1, maxAllowedBet))}
                  disabled={phase === "spinning"}
                  className="kd-touch rounded-xl border border-stone-800 bg-stone-900 px-2 py-2 text-xs font-bold text-stone-300 hover:border-cyan-300/25 disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBet(Math.max(1, Math.floor(balance / 2)))}
                disabled={phase === "spinning"}
                className="kd-touch rounded-xl border border-stone-800 bg-stone-900 px-2 py-2 text-xs font-bold text-stone-300 hover:border-cyan-300/25 disabled:opacity-50"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setBet(maxAllowedBet)}
                disabled={phase === "spinning"}
                className="kd-touch rounded-xl border border-amber-400/25 bg-amber-400/10 px-2 py-2 text-xs font-black text-amber-200 disabled:opacity-50"
              >
                ALL IN
              </button>
            </div>
            <button
              type="button"
              onClick={spin}
              disabled={!canSpin}
              className="kd-touch mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-4 text-sm font-black uppercase tracking-[0.12em] text-stone-950 shadow-[0_0_26px_rgba(103,232,249,0.22)] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500 disabled:shadow-none"
            >
              <Zap className="h-4 w-4" />
              Girar
            </button>
          </Panel>

          <Panel title="Limite diario" icon={<Sparkles className="h-4 w-4" />}>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
              <span>Ganancia neta</span>
              <span className="text-cyan-200">
                {dailyNetWins.toLocaleString("es-PY")} / {MAX_DAILY_SLOTS_WIN_LIMIT.toLocaleString("es-PY")}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black">
              <div
                className="h-full rounded-full bg-cyan-300 transition-all"
                style={{ width: `${clamp((dailyNetWins / MAX_DAILY_SLOTS_WIN_LIMIT) * 100, 0, 100)}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={updating}
              className="kd-touch mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-black/40 px-3 py-2 text-xs font-bold text-stone-300 hover:border-cyan-300/30 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
              Refrescar oro
            </button>
          </Panel>

          <Panel title="Pagos" icon={<Crown className="h-4 w-4" />}>
            <div className="grid gap-2 text-xs font-bold text-stone-300">
              <PayRow label="3 coronas" value="x12" />
              <PayRow label="3 gemas" value="x8" />
              <PayRow label="3 espadas" value="x5" />
              <PayRow label="3 pociones" value="x3" />
              <PayRow label="3 escudos" value="x2" />
              <PayRow label="2 iguales" value="x1.25" />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Reel({
  symbols,
  spinning,
  active,
  delay,
}: {
  symbols: SymbolId[];
  spinning: boolean;
  active: boolean;
  delay: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.1rem] border border-stone-700 bg-[linear-gradient(180deg,#151515,#050505)] p-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.85)]">
      <motion.div
        animate={spinning ? { y: [0, -8, 8, 0] } : { y: 0 }}
        transition={{ duration: 0.22, repeat: spinning ? Infinity : 0, delay }}
        className="grid h-full grid-rows-3 gap-2"
      >
        {symbols.map((symbol, index) => (
          <SlotSymbolTile key={`${symbol}-${index}`} symbol={symbol} center={index === 1} active={active && index === 1} />
        ))}
      </motion.div>
    </div>
  );
}

function SlotSymbolTile({ symbol, center, active }: { symbol: SymbolId; center: boolean; active: boolean }) {
  const slotSymbol = getSymbol(symbol);
  const Icon = slotSymbol.Icon;

  return (
    <motion.div
      layout
      className={`flex min-h-0 flex-col items-center justify-center rounded-xl border ${
        center ? "border-cyan-100/20 bg-stone-950" : "border-white/5 bg-black/30 opacity-45"
      } ${active ? slotSymbol.glow : ""}`}
    >
      <div className={`rounded-xl bg-gradient-to-br p-2 ${slotSymbol.tone}`}>
        <Icon className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.6} />
      </div>
      <span className="mt-1 max-w-full truncate px-1 text-[9px] font-black uppercase tracking-[0.08em] text-stone-300 sm:text-[10px]">
        {slotSymbol.shortLabel}
      </span>
    </motion.div>
  );
}

function StatusChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-black/35 px-3 py-2">
      <span className="block text-[9px] text-stone-500">{label}</span>
      <span className="mt-1 block text-sm text-cyan-100">{value}</span>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/70 p-3">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-800 bg-black/35 px-3 py-2">
      <span>{label}</span>
      <span className="text-cyan-200">{value}</span>
    </div>
  );
}

function SlotsMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-950/70 p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
        <UserRound className="h-7 w-7" />
      </div>
      <p className="text-lg font-black text-stone-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-400">{description}</p>
    </div>
  );
}
