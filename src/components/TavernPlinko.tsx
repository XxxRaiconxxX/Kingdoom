import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coins, Gem, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  buildScratchDateKey,
  getPlayerDailyPlinkoNetWins,
  MAX_DAILY_PLINKO_WIN_LIMIT,
} from "../utils/scratchUtils";
import {
  computePlinkoPath,
  getPlinkoExpectedReturn,
  getPlinkoMultiplier,
  PLINKO_MULTIPLIERS,
  PLINKO_ROWS,
  PLINKO_SLOTS,
  saveDailyResult,
  type PlinkoPath,
} from "../utils/plinkUtils";

type PlinkoPhase = "betting" | "dropping" | "resolved";

type BallFrame = {
  id: number;
  x: number;
  y: number;
  row: number;
  slot?: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
};

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 560;
const PEG_START_Y = 114;
const PEG_GAP_Y = 44;
const SLOT_Y = 478;
const SLOT_HEIGHT = 58;
const BET_PRESETS = [250, 1000, 5000];
const FRAME_MS = 170;
const EXPECTED_RETURN = getPlinkoExpectedReturn();

const SLOT_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#64748b",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(value: number) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function slotX(slot: number) {
  const playableWidth = CANVAS_WIDTH - 96;
  return 48 + (slot / (PLINKO_SLOTS - 1)) * playableWidth;
}

function rowX(row: number, rights: number) {
  const center = CANVAS_WIDTH / 2;
  const step = (CANVAS_WIDTH - 156) / PLINKO_ROWS / 1.18;
  return center + (rights - row / 2) * step;
}

function buildAnimationPoints(path: PlinkoPath) {
  let rights = 0;
  const points = [{ x: CANVAS_WIDTH / 2, y: 42, row: -1 }];

  path.decisions.forEach((decision, index) => {
    if (decision === "R") rights += 1;
    points.push({
      x: rowX(index + 1, rights),
      y: PEG_START_Y + index * PEG_GAP_Y,
      row: index,
    });
  });

  points.push({
    x: slotX(path.slot),
    y: SLOT_Y + SLOT_HEIGHT / 2,
    row: PLINKO_ROWS,
  });

  return points;
}

function drawRuneBoard(ctx: CanvasRenderingContext2D, frames: BallFrame[], resolvedSlots: Record<number, number>) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.imageSmoothingEnabled = false;

  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, "#081310");
  bg.addColorStop(0.5, "#111009");
  bg.addColorStop(1, "#040607");
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 28);
  ctx.fill();

  ctx.fillStyle = "rgba(251, 191, 36, 0.055)";
  for (let x = 16; x < CANVAS_WIDTH; x += 36) {
    for (let y = 18; y < CANVAS_HEIGHT; y += 36) {
      ctx.fillRect(x, y, 1, 8);
      ctx.fillRect(x - 3, y + 3, 7, 1);
    }
  }

  const aura = ctx.createRadialGradient(CANVAS_WIDTH / 2, 80, 20, CANVAS_WIDTH / 2, 190, 380);
  aura.addColorStop(0, "rgba(251, 191, 36, 0.22)");
  aura.addColorStop(0.55, "rgba(20, 184, 166, 0.08)");
  aura.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "rgba(245, 158, 11, 0.28)";
  ctx.lineWidth = 2;
  roundRect(ctx, 20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40, 24);
  ctx.stroke();

  ctx.fillStyle = "#facc15";
  ctx.font = "700 18px serif";
  ctx.textAlign = "center";
  ctx.fillText("TORRE DEL MAGO", CANVAS_WIDTH / 2, 56);
  ctx.font = "700 10px sans-serif";
  ctx.fillStyle = "rgba(226, 232, 240, 0.55)";
  ctx.fillText("8 FILAS DE RUNAS · 9 COFRES · RIESGO CONTROLADO", CANVAS_WIDTH / 2, 76);

  const activeRows = new Set(frames.map((f) => f.row));

  for (let row = 0; row < PLINKO_ROWS; row++) {
    for (let col = 0; col <= row; col++) {
      const x = rowX(row, col);
      const y = PEG_START_Y + row * PEG_GAP_Y;
      const pulse = activeRows.has(row) ? 1 : 0;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((row + col) * 0.6);
      ctx.fillStyle = pulse ? "rgba(34, 211, 238, 0.28)" : "rgba(245, 158, 11, 0.10)";
      ctx.strokeStyle = pulse ? "rgba(103, 232, 249, 0.95)" : "rgba(251, 191, 36, 0.6)";
      ctx.lineWidth = pulse ? 3 : 1.4;
      polygon(ctx, 0, 0, pulse ? 13 : 10, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pulse ? "#e0f2fe" : "#fbbf24";
      ctx.fillRect(-1, -6, 2, 12);
      ctx.fillRect(-6, -1, 12, 2);
      ctx.restore();
    }
  }

  const slotWidth = (CANVAS_WIDTH - 76) / PLINKO_SLOTS;
  const activeFramesInSlot = new Set(frames.map((f) => f.slot).filter((s) => s !== undefined));

  for (let slot = 0; slot < PLINKO_SLOTS; slot++) {
    const x = 38 + slot * slotWidth;
    const color = SLOT_COLORS[slot];
    const active = (resolvedSlots[slot] ?? 0) > 0 || activeFramesInSlot.has(slot);
    const chestGlow = active ? 0.34 : 0.1;

    ctx.fillStyle = `${color}${active ? "4d" : "22"}`;
    ctx.strokeStyle = `${color}${active ? "ff" : "99"}`;
    ctx.lineWidth = active ? 3 : 1.5;
    roundRect(ctx, x + 3, SLOT_Y, slotWidth - 6, SLOT_HEIGHT, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(251, 191, 36, ${chestGlow})`;
    roundRect(ctx, x + slotWidth * 0.22, SLOT_Y + 14, slotWidth * 0.56, 24, 5);
    ctx.fill();
    ctx.fillStyle = active ? "#fff7ed" : "#fbbf24";
    ctx.font = "900 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${PLINKO_MULTIPLIERS[slot]}x`, x + slotWidth / 2, SLOT_Y + 38);

    const count = resolvedSlots[slot] ?? 0;
    if (count > 0) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x + slotWidth - 14, SLOT_Y + 14, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "800 11px sans-serif";
      ctx.fillText(`${count}`, x + slotWidth - 14, SLOT_Y + 18);
    }
  }

  frames.forEach((frame) => {
    frame.trail.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251, 191, 36, ${point.alpha})`;
      ctx.fill();
    });

    const ballGlow = ctx.createRadialGradient(frame.x, frame.y, 3, frame.x, frame.y, 28);
    ballGlow.addColorStop(0, "rgba(255, 255, 255, 0.98)");
    ballGlow.addColorStop(0.32, "rgba(251, 191, 36, 0.95)");
    ballGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = ballGlow;
    ctx.beginPath();
    ctx.arc(frame.x, frame.y, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(frame.x, frame.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#fde68a";
    ctx.fill();
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function polygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function TavernPlinko() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const trailsRef = useRef<Record<number, Array<{ x: number; y: number; alpha: number }>>>({});
  
  const dateKey = useMemo(() => buildScratchDateKey(), []);
  const [phase, setPhase] = useState<PlinkoPhase>("betting");
  const [bet, setBet] = useState(1000);
  const [quantity, setQuantity] = useState(1);
  const [dailyNetWins, setDailyNetWins] = useState(0);
  
  const [lastSlots, setLastSlots] = useState<Record<number, number> | null>(null);
  const [lastTotalPrize, setLastTotalPrize] = useState<number | null>(null);
  const [lastTotalBet, setLastTotalBet] = useState<number | null>(null);
  
  const [message, setMessage] = useState("Elige apuesta, cantidad y deja caer las esferas.");
  const [updating, setUpdating] = useState(false);

  const balance = player?.gold ?? 0;
  const remainingDailyNet = Math.max(0, MAX_DAILY_PLINKO_WIN_LIMIT - dailyNetWins);
  const limitReached = dailyNetWins >= MAX_DAILY_PLINKO_WIN_LIMIT;
  
  const parsedBet = Math.floor(Number.isFinite(bet) ? Math.max(0, bet) : 0);
  const totalStake = parsedBet * quantity;
  const hasEnoughGold = totalStake > 0 && totalStake <= balance;
  
  const canDrop = Boolean(
    player && phase !== "dropping" && !updating && !limitReached && hasEnoughGold
  );

  useEffect(() => {
    if (!player) {
      setDailyNetWins(0);
      return;
    }

    setDailyNetWins(getPlayerDailyPlinkoNetWins(player.id, dateKey));
  }, [dateKey, player]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawRuneBoard(ctx, [], lastSlots ?? {});
  }, [lastSlots]);

  useEffect(
    () => () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    },
    []
  );

  function updateBetInput(value: string) {
    const parsed = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
    setBet(Number.isFinite(parsed) ? parsed : 0);
  }

  async function refreshState() {
    setUpdating(true);
    const fresh = await refreshPlayer();
    if (fresh) setDailyNetWins(getPlayerDailyPlinkoNetWins(fresh.id, dateKey));
    setUpdating(false);
  }

  async function dropBall() {
    if (!player || !canDrop) return;

    setUpdating(true);
    setMessage(`Las runas superiores abren la caida para ${quantity} esfera(s)...`);
    const freshPlayer = await refreshPlayer();
    const currentGold = freshPlayer?.gold ?? player.gold;
    const finalStake = parsedBet * quantity;

    if (finalStake > currentGold || finalStake <= 0) {
      setUpdating(false);
      setMessage("No tienes oro suficiente para esa apuesta total o es invalida.");
      return;
    }

    const paths = Array.from({ length: quantity }, () => computePlinkoPath());
    let totalRawPrize = 0;
    paths.forEach((p) => {
      totalRawPrize += Math.floor(parsedBet * getPlinkoMultiplier(p.slot));
    });

    const rawNet = totalRawPrize - finalStake;
    const cappedNet = rawNet > 0 ? Math.min(rawNet, remainingDailyNet) : rawNet;
    const finalPrize = rawNet > 0 ? finalStake + cappedNet : totalRawPrize;
    const finalGold = currentGold - finalStake + finalPrize;

    const updated = await setPlayerGold(finalGold);
    if (!updated) {
      setUpdating(false);
      setMessage("No se pudo procesar la apuesta. Intenta refrescar tu perfil.");
      return;
    }

    if (cappedNet > 0) {
      setDailyNetWins(saveDailyResult(player.id, dateKey, cappedNet));
    }

    const pointsArray = paths.map((p) => buildAnimationPoints(p));
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) {
      setPhase("resolved");
      setLastSlots({});
      setUpdating(false);
      return;
    }

    setPhase("dropping");
    setLastSlots({});
    setLastTotalPrize(null);
    setLastTotalBet(null);
    trailsRef.current = {};

    const startedAt = performance.now();
    const staggerMs = 150;

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      let allFinished = true;
      const frames: BallFrame[] = [];
      const currentResolved: Record<number, number> = {};

      paths.forEach((path, i) => {
        const ballStart = i * staggerMs;
        const ballElapsed = elapsed - ballStart;
        const points = pointsArray[i];
        const totalMs = (points.length - 1) * FRAME_MS;

        if (ballElapsed < 0) {
          allFinished = false;
          return;
        }

        if (ballElapsed >= totalMs) {
          currentResolved[path.slot] = (currentResolved[path.slot] || 0) + 1;
          return;
        }

        allFinished = false;

        const segment = clamp(Math.floor(ballElapsed / FRAME_MS), 0, points.length - 2);
        const local = clamp((ballElapsed - segment * FRAME_MS) / FRAME_MS, 0, 1);
        const eased = easeInOut(local);
        const from = points[segment];
        const to = points[segment + 1];

        const uniqueOffset = Math.sin(i * 13.37) * 4;
        const wobble = Math.sin(local * Math.PI) * ((segment % 2 === 0 ? 10 : -10) + uniqueOffset);
        const x = from.x + (to.x - from.x) * eased + wobble * 0.2;
        const y = from.y + (to.y - from.y) * eased + Math.sin(local * Math.PI) * (10 + uniqueOffset * 0.5);

        let trail = trailsRef.current[i];
        if (!trail) {
          trail = [];
          trailsRef.current[i] = trail;
        }

        trail.unshift({ x, y, alpha: 0.22 });
        trail.splice(7);
        trail.forEach((point, index) => {
          point.alpha = Math.max(0.03, 0.22 - index * 0.028);
        });

        frames.push({
          id: i,
          x,
          y,
          row: points[segment + 1]?.row ?? -1,
          slot: ballElapsed > totalMs - FRAME_MS ? path.slot : undefined,
          trail,
        });
      });

      drawRuneBoard(ctx, frames, currentResolved);

      if (allFinished) {
        setPhase("resolved");
        setUpdating(false);
        setLastSlots(currentResolved);
        setLastTotalPrize(finalPrize);
        setLastTotalBet(finalStake);

        if (cappedNet > 0 && rawNet > cappedNet) {
          setMessage(`Tope diario aplicado. Cobras ${finalPrize.toLocaleString("es-PY")} oro neto en total.`);
        } else {
          setMessage(
            finalPrize > finalStake
              ? `¡Victoria! Recuperas apuesta y ganas ${(finalPrize - finalStake).toLocaleString("es-PY")} oro neto.`
              : finalPrize === finalStake
                ? "Ni gloria ni tragedia. Recuperaste tu inversion."
                : `Perdida de ${(finalStake - finalPrize).toLocaleString("es-PY")} oro. La torre reclama su peaje.`
          );
        }
        return;
      }

      animationRef.current = window.requestAnimationFrame(animate);
    };

    animationRef.current = window.requestAnimationFrame(animate);
  }

  if (isHydrating) {
    return <PlinkoMessage title="Torre del Mago" description="Recuperando tu perfil del reino..." />;
  }

  if (!player) {
    return <PlinkoMessage title="Torre del Mago" description="Conecta tu perfil para lanzar la esfera runica." />;
  }

  if (limitReached) {
    return (
      <PlinkoMessage
        title="Torre cerrada"
        description={`Ya ganaste ${MAX_DAILY_PLINKO_WIN_LIMIT.toLocaleString("es-PY")} de oro neto hoy en la Torre del Mago.`}
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/20 bg-[#080b08] p-4 shadow-[inset_0_0_55px_rgba(0,0,0,0.72)] md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(245,158,11,0.18),transparent_28%)]" />

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Torre del mago</p>
              <h3 className="mt-1 font-serif text-2xl font-black text-stone-100">Esferas de las runas</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <StatChip label="Oro" value={balance.toLocaleString("es-PY")} />
              <StatChip label="Hoy" value={`${dailyNetWins.toLocaleString("es-PY")}`} />
              <StatChip label="RTP" value={`${Math.round(EXPECTED_RETURN * 100)}%`} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-cyan-400/20 bg-black/45 p-2 shadow-[0_0_40px_rgba(20,184,166,0.08)]">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block aspect-[9/7] h-auto w-full rounded-[1.25rem]"
            />
          </div>

          <div className="mt-3 rounded-2xl border border-stone-800 bg-stone-950/65 p-3 text-sm text-stone-300">
            <span className="font-black text-amber-300">{phase === "dropping" ? "Caida activa: " : "Estado: "}</span>
            {message}
          </div>
        </div>

        <aside className="relative rounded-[1.6rem] border border-stone-800 bg-stone-950/75 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Lanzamiento</p>
              <p className="mt-1 text-[10px] text-stone-500 font-bold">Rafaga de esferas</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshState()}
              disabled={updating || phase === "dropping"}
              className="rounded-2xl border border-stone-700 p-2 text-stone-400 transition hover:border-cyan-300/40 hover:text-cyan-200 disabled:opacity-50"
              title="Refrescar oro"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Cantidad</p>
              <p className="mt-1 text-[10px] font-bold text-stone-500">Esferas a lanzar</p>
            </div>
            <div className="flex gap-1.5">
              {[1, 3, 5, 10].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  disabled={phase === "dropping"}
                  className={`rounded-xl border px-3 py-1 text-xs font-black transition disabled:opacity-50 ${
                    quantity === q
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                      : "border-stone-800 bg-stone-900 text-stone-500 hover:border-cyan-400/35 hover:text-cyan-200"
                  }`}
                >
                  {q}x
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Apuesta por esfera</p>
              <p className="mt-1 text-[11px] font-black text-amber-500/90">
                Costo total: {totalStake.toLocaleString("es-PY")} oro
              </p>
            </div>
          </div>

          <input
            value={bet || ""}
            onChange={(event) => updateBetInput(event.target.value)}
            disabled={phase === "dropping"}
            inputMode="numeric"
            className="mt-3 w-full rounded-2xl border border-stone-700 bg-black px-4 py-3 text-lg font-black text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-300/50"
            placeholder="1000"
          />

          <div className="mt-3 grid grid-cols-3 gap-2">
            {BET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBet(preset)}
                disabled={phase === "dropping"}
                className="rounded-xl border border-stone-800 bg-stone-900 px-2 py-2 text-xs font-black text-stone-300 transition hover:border-amber-400/35 hover:text-amber-200 disabled:opacity-50"
              >
                {preset.toLocaleString("es-PY")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void dropBall()}
            disabled={!canDrop}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-stone-950 shadow-[0_0_28px_rgba(245,158,11,0.2)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500 disabled:shadow-none"
          >
            <Wand2 className="h-4 w-4" />
            {phase === "dropping"
              ? "Cayendo..."
              : updating
                ? "Procesando..."
                : limitReached
                  ? "Limite diario alcanzado"
                  : !hasEnoughGold && parsedBet > 0
                    ? "Oro insuficiente"
                    : parsedBet <= 0
                      ? "Apuesta invalida"
                      : "Lanzar esferas"}
          </button>

          <div className="mt-4 grid gap-2">
            <ResultPanel slots={lastSlots} totalBet={lastTotalBet} totalPrize={lastTotalPrize} />
            <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-3">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Cofres
              </p>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {PLINKO_MULTIPLIERS.map((multiplier, index) => (
                  <span
                    key={`${multiplier}-${index}`}
                    className="rounded-lg border border-stone-800 bg-black/45 px-2 py-1 text-center text-[10px] font-black text-stone-300"
                  >
                    {multiplier}x
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
              <span>Ganancia diaria</span>
              <span>{remainingDailyNet.toLocaleString("es-PY")} libres</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-300 to-orange-500"
                style={{ width: `${clamp((dailyNetWins / MAX_DAILY_PLINKO_WIN_LIMIT) * 100, 0, 100)}%` }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/75 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-black text-stone-100">{value}</p>
    </div>
  );
}

function ResultPanel({ 
  slots, 
  totalBet, 
  totalPrize 
}: { 
  slots: Record<number, number> | null; 
  totalBet: number | null; 
  totalPrize: number | null;
}) {
  if (!slots || totalBet === null || totalPrize === null) return null;

  const totalOrbs = Object.values(slots).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-300">
        <Gem className="h-4 w-4" />
        Resumen de ráfaga
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatChip label="Esferas" value={`${totalOrbs}`} />
        <StatChip label="Inversion" value={totalBet.toLocaleString("es-PY")} />
        <StatChip label="Retorno" value={totalPrize.toLocaleString("es-PY")} />
      </div>
      {Object.keys(slots).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(slots).map(([slot, count]) => (
            <span key={slot} className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
               {PLINKO_MULTIPLIERS[parseInt(slot)]}x ({count})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PlinkoMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-8 text-center shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
        <Coins className="h-8 w-8 text-amber-300" />
      </div>
      <h2 className="font-serif text-2xl font-black text-stone-100">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-400">{description}</p>
    </div>
  );
}
