import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  Coins,
  Flame,
  History as HistoryIcon,
  RefreshCw,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  cashOutCrashSecure,
  fetchCrashSessionState,
  startCrashGameSecure,
} from "../utils/minigamesSecure";

type GameStatus = "betting" | "starting" | "rising" | "crashed" | "cashed_out";

interface Point {
  time: number;
  multiplier: number;
}

const SPINUP_SECONDS = 1.2;

export function TavernCrash() {
  const { player, isHydrating, refreshPlayer } = usePlayerSession();
  const [status, setStatus] = useState<GameStatus>("betting");
  const [bet, setBet] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [history, setHistory] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [autoCashOut, setAutoCashOut] = useState<number>(0);
  const [crashError, setCrashError] = useState("");
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const pointsRef = useRef<Point[]>([]);
  const logicalSizeRef = useRef({ width: 0, height: 0 });

  const statusRef = useRef<GameStatus>("betting");
  const autoCashOutRef = useRef<number>(0);
  const multiplierRef = useRef(1);
  const startTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    autoCashOutRef.current = autoCashOut;
  }, [autoCashOut]);
  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);
  useEffect(() => {
    startTimestampRef.current = startTimestamp;
  }, [startTimestamp]);

  const projectedCashOut = useMemo(() => Math.floor(bet * multiplier), [bet, multiplier]);

  useEffect(() => {
    let active = true;

    async function hydrateCrash() {
      if (!player) {
        return;
      }

      const result = await fetchCrashSessionState();

      if (!active) {
        return;
      }

      if (result.status === "error") {
        setCrashError(result.message);
        return;
      }

      setHistory(result.history);
      setStatus(result.session.phase);
      setBet(result.session.bet);
      setMultiplier(result.session.multiplier);
      setLastWin(result.session.lastWin);
      setAutoCashOut(result.session.autoCashOut);
    }

    void hydrateCrash();

    return () => {
      active = false;
    };
  }, [player]);

  useEffect(() => {
    if (status !== "starting" && status !== "rising") {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const result = await fetchCrashSessionState();

      if (result.status === "error") {
        setCrashError(result.message);
        return;
      }

      setHistory(result.history);
      setStatus(result.session.phase);
      setMultiplier(result.session.multiplier);
      setLastWin(result.session.lastWin);
      setAutoCashOut(result.session.autoCashOut);

      if (result.session.phase === "rising" && startTimestampRef.current === null) {
        const timestamp = performance.now() - SPINUP_SECONDS * 1000;
        setStartTimestamp(timestamp);
        pointsRef.current = [{ time: 0, multiplier: 1 }];
      }

      if (result.session.phase === "crashed" || result.session.phase === "cashed_out") {
        await refreshPlayer();
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshPlayer, status]);

  const drawGraph = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currentMultiplier: number,
    elapsed: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    const maxX = Math.max(10, elapsed * 1.25);
    let maxY = Math.max(2, currentMultiplier * 1.3);

    if (autoCashOutRef.current >= 1.01) {
      if (
        autoCashOutRef.current > maxY &&
        autoCashOutRef.current <= Math.max(5, currentMultiplier * 3)
      ) {
        maxY = autoCashOutRef.current * 1.1;
      }
    }

    const padding = { left: 45, bottom: 35, right: 25, top: 25 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (chartWidth <= 0 || chartHeight <= 0) {
      return;
    }

    const getX = (t: number) => padding.left + (t / maxX) * chartWidth;
    const getY = (m: number) =>
      height - padding.bottom - ((m - 1) / (maxY - 1)) * chartHeight;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    const xStep = maxX / 5;
    for (let i = 0; i <= 5; i += 1) {
      const x = getX(i * xStep);
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
    }
    const yStep = (maxY - 1) / 5;
    for (let i = 0; i <= 5; i += 1) {
      const y = getY(1 + i * yStep);
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.fillText(`${maxX.toFixed(0)}s`, width - padding.right - 10, height - 15);
    ctx.fillText(`${maxY.toFixed(1)}x`, 10, padding.top + 5);

    if (autoCashOutRef.current >= 1.01 && autoCashOutRef.current <= maxY) {
      const y = getY(autoCashOutRef.current);
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(251, 191, 36, 0.8)";
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.fillText(`AUTO ${autoCashOutRef.current.toFixed(2)}x`, padding.left + 4, y - 4);
      ctx.restore();
    }

    if (pointsRef.current.length > 1) {
      const isDangerous = statusRef.current === "crashed";
      const isSecured = statusRef.current === "cashed_out";

      ctx.strokeStyle = isDangerous
        ? "#e11d48"
        : isSecured
          ? "rgba(16, 185, 129, 0.6)"
          : "#f59e0b";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowBlur = 12;
      ctx.shadowColor = ctx.strokeStyle as string;

      ctx.beginPath();
      const startX = getX(pointsRef.current[0].time);
      const startY = getY(pointsRef.current[0].multiplier);
      ctx.moveTo(startX, startY);
      pointsRef.current.forEach((point) => {
        ctx.lineTo(getX(point.time), getY(point.multiplier));
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  const animateGraph = (time: number) => {
    if (
      statusRef.current !== "rising" &&
      statusRef.current !== "cashed_out" &&
      statusRef.current !== "crashed"
    ) {
      return;
    }

    const start = startTimestampRef.current ?? time;
    const elapsedSeconds = Math.max((time - start) / 1000, 0);
    const currentMultiplier = multiplierRef.current;

    pointsRef.current.push({ time: elapsedSeconds, multiplier: currentMultiplier });
    if (pointsRef.current.length > 200) {
      pointsRef.current.shift();
    }

    const canvas = canvasRef.current;
    if (canvas && logicalSizeRef.current.width > 0) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawGraph(
          ctx,
          logicalSizeRef.current.width,
          logicalSizeRef.current.height,
          currentMultiplier,
          elapsedSeconds
        );
      }
    }

    requestRef.current = window.requestAnimationFrame(animateGraph);
  };

  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        logicalSizeRef.current = { width: rect.width, height: rect.height };
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          drawGraph(ctx, rect.width, rect.height, multiplierRef.current, 0);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  useEffect(() => {
    if (status === "rising" || status === "cashed_out" || status === "crashed") {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      requestRef.current = window.requestAnimationFrame(animateGraph);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [status]);

  async function handleStart() {
    if (!player || bet <= 0 || bet > player.gold || updating) {
      return;
    }

    setUpdating(true);
    setCrashError("");

    const result = await startCrashGameSecure({
      bet,
      autoCashOut,
    });

    if (result.status === "error") {
      setCrashError(result.message);
      setUpdating(false);
      return;
    }

    setStatus(result.session.phase);
    setMultiplier(result.session.multiplier);
    setLastWin(result.session.lastWin);
    setHistory(result.history);
    setStartTimestamp(performance.now());
    startTimestampRef.current = performance.now();
    pointsRef.current = [{ time: 0, multiplier: 1 }];
    await refreshPlayer();
    setUpdating(false);
  }

  async function handleCashOut() {
    if (status !== "rising" || updating) {
      return;
    }

    setUpdating(true);
    const result = await cashOutCrashSecure();

    if (result.status === "error") {
      setCrashError(result.message);
      setUpdating(false);
      return;
    }

    setStatus(result.session.phase);
    setMultiplier(result.session.multiplier);
    setLastWin(result.session.lastWin);
    setHistory(result.history);
    await refreshPlayer();
    setUpdating(false);
  }

  if (isHydrating) {
    return <Placeholder title="El Multiplicador" description="Cargando las leyes del Vacio..." />;
  }

  if (!player) {
    return <Placeholder title="El Multiplicador" description="Conectate para apostar en el Vacio." />;
  }

  return (
    <div className="flex flex-col items-center py-2">
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
          <p className="text-[10px] uppercase tracking-wider text-stone-500">Saldo actual</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-mono text-lg font-black text-amber-400">{player.gold}</p>
            <button
              type="button"
              onClick={() => void refreshPlayer()}
              disabled={updating}
              className="rounded-lg p-1 text-stone-500 transition hover:text-amber-400 disabled:opacity-30"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {crashError ? (
        <div className="mb-4 w-full rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {crashError}
        </div>
      ) : null}

      <div className="grid w-full gap-6 lg:grid-cols-[1fr_300px]">
        <div className="relative aspect-video w-full overflow-hidden rounded-[2.5rem] border border-stone-800 bg-stone-950 shadow-2xl group">
          <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {status === "betting" ? (
                <motion.div key="betting-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                  <Zap className="mb-2 h-10 w-10 text-stone-800" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-700">PULSACION DETECTADA</p>
                </motion.div>
              ) : (
                <motion.div
                  key="active-ui"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <h2
                    className={`text-6xl font-black tabular-nums drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] md:text-8xl ${
                      status === "crashed"
                        ? "text-rose-600"
                        : status === "cashed_out"
                          ? "text-emerald-500/60"
                          : "text-stone-50"
                    }`}
                  >
                    {multiplier.toFixed(2)}x
                  </h2>

                  {status === "crashed" ? (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="mt-4 rounded-xl border border-rose-500/30 bg-rose-600/20 px-6 py-2 backdrop-blur-sm"
                    >
                      <p className="text-lg font-black uppercase tracking-widest text-rose-500 italic">¡COLAPSO!</p>
                    </motion.div>
                  ) : null}

                  {status === "cashed_out" ? (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="mt-4 flex flex-col items-center gap-1"
                    >
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-500/90">
                        Energia asegurada
                      </p>
                      <p className="flex items-center gap-2 text-2xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                        <Coins className="h-6 w-6" />
                        +{lastWin}
                      </p>
                    </motion.div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {status === "starting" ? (
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-amber-500/5" />
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6">
            <div className="mb-4 flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-stone-500" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                Registros del Vacio
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.length > 0 ? (
                history.map((value, index) => (
                  <div
                    key={`${value}-${index}`}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-black ${
                      value >= 10
                        ? "border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                        : value >= 2
                          ? "border-emerald-500/30 text-emerald-500/70"
                          : "border-stone-800 text-stone-500"
                    }`}
                  >
                    {value.toFixed(2)}x
                  </div>
                ))
              ) : (
                <p className="text-[10px] italic text-stone-600">Sin datos de colapso...</p>
              )}
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/60 p-6">
            {status === "rising" ? <div className="pointer-events-none absolute inset-0 bg-emerald-500/5 transition-opacity" /> : null}

            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-100">
                <Flame className="h-3 w-3 text-amber-500" />
                Apuesta de energia
              </h3>

              <div className="mb-4 flex items-center gap-3">
                <input
                  type="number"
                  value={bet}
                  onChange={(event) =>
                    setBet(Math.min(player.gold, Math.max(0, parseInt(event.target.value, 10) || 0)))
                  }
                  disabled={status === "rising" || status === "starting"}
                  className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-lg font-black text-stone-100 transition focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBet(Math.floor(player.gold / 2))}
                  disabled={status === "rising" || status === "starting"}
                  className="rounded-xl bg-stone-800 py-2 text-[10px] font-black text-stone-400 transition hover:text-stone-100"
                >
                  50% SALDO
                </button>
                <button
                  onClick={() => setBet(player.gold)}
                  disabled={status === "rising" || status === "starting"}
                  className="rounded-xl bg-stone-800 py-2 text-[10px] font-black text-stone-400 transition hover:text-stone-100"
                >
                  ALL IN
                </button>
              </div>

              <div className="mb-6 flex flex-col gap-1">
                <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-stone-500">
                  <Zap className="h-3 w-3 text-amber-500/60" />
                  Retiro automatico
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={autoCashOut === 0 ? "" : autoCashOut}
                    onChange={(event) => setAutoCashOut(parseFloat(event.target.value) || 0)}
                    disabled={status === "rising" || status === "starting"}
                    placeholder="Ej: 1.50  (0 = desactivado)"
                    className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 pr-8 text-base font-black text-amber-400 placeholder:font-normal placeholder:text-stone-600 transition focus:border-amber-500/50 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-stone-500">x</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {status === "rising" ? (
                <button
                  onClick={() => void handleCashOut()}
                  disabled={updating}
                  className="group relative w-full overflow-hidden rounded-2xl bg-emerald-600 py-5 font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500 active:scale-95"
                >
                  <span className="relative z-10 flex flex-col items-center">
                    <span className="mb-0.5 text-[10px] uppercase tracking-widest opacity-70">
                      {autoCashOut >= 1.01
                        ? `Auto en ${autoCashOut.toFixed(2)}x — o retira ya`
                        : "Asegurar ahora"}
                    </span>
                    <span className="flex items-center gap-2 text-xl font-black">
                      <Coins className="h-5 w-5" />
                      {projectedCashOut}
                    </span>
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => void handleStart()}
                  disabled={bet <= 0 || bet > player.gold || updating || status === "starting"}
                  className="group relative w-full overflow-hidden rounded-2xl bg-stone-100 py-5 font-black text-stone-900 transition hover:bg-white active:scale-95 disabled:opacity-30"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-tighter">
                    <TrendingUp className="h-5 w-5" />
                    {status === "starting" ? "CARGANDO..." : "INICIAR RONDA"}
                  </span>
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-[9px] font-black uppercase leading-normal tracking-[0.2em] text-stone-600">
              El Vacio no perdona la duda.
              <br />
              Retira de forma segura o pierdelo todo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 rounded-3xl bg-amber-500/10 p-6 text-amber-400 shadow-xl shadow-black/20">
        <AlertOctagon className="h-10 w-10 text-amber-500" />
      </div>
      <h3 className="mb-2 text-2xl font-black uppercase tracking-widest text-stone-100">{title}</h3>
      <p className="max-w-xs text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}
