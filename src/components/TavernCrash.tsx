import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Flame, 
  Coins, 
  RefreshCw, 
  UserRound, 
  TrendingUp, 
  AlertOctagon, 
  History as HistoryIcon,
  Zap
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";

type GameStatus = "betting" | "starting" | "rising" | "crashed" | "cashed_out";

interface Point {
  time: number;
  multiplier: number;
}

export function TavernCrash() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  
  const [status, setStatus] = useState<GameStatus>("betting");
  const [bet, setBet] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [autoCashOut, setAutoCashOut] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const pointsRef = useRef<Point[]>([]);
  const logicalSizeRef = useRef({ width: 0, height: 0 });
  
  // Refs para evitar stale closures en el animation loop
  const statusRef = useRef<GameStatus>("betting");
  const autoCashOutRef = useRef<number>(0);
  const autoCashedRef = useRef<boolean>(false); // guardia para no disparar auto cashout dos veces
  const betRef = useRef(bet);
  const playerRef = useRef(player);
  const updatingRef = useRef(updating);
  const multiplierRef = useRef(multiplier);
  const setPlayerGoldRef = useRef(setPlayerGold);

  // Mantener refs sincronizados
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { autoCashOutRef.current = autoCashOut; }, [autoCashOut]);
  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { updatingRef.current = updating; }, [updating]);
  useEffect(() => { setPlayerGoldRef.current = setPlayerGold; }, [setPlayerGold]);

  const generateCrashPoint = () => {
    if (Math.random() < 0.03) return 1.00;
    const point = 0.99 / (1 - Math.random());
    return Math.min(Math.max(point, 1.01), 1000);
  };

  const drawGraph = (ctx: CanvasRenderingContext2D, width: number, height: number, currentMultiplier: number, elapsed: number) => {
    ctx.clearRect(0, 0, width, height);

    const maxX = Math.max(10, elapsed * 1.25);
    let maxY = Math.max(2, currentMultiplier * 1.3);
    
    const autoCashOutVal = autoCashOutRef.current;
    if (autoCashOutVal >= 1.01) {
      if (autoCashOutVal > maxY && autoCashOutVal <= Math.max(5, currentMultiplier * 3)) {
        maxY = autoCashOutVal * 1.1;
      }
    }

    const padding = { left: 45, bottom: 35, right: 25, top: 25 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    const getX = (t: number) => padding.left + (t / maxX) * chartWidth;
    const getY = (m: number) => height - padding.bottom - ((m - 1) / (maxY - 1)) * chartHeight;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const xStep = maxX / 5;
    for (let i = 0; i <= 5; i++) {
        const x = getX(i * xStep);
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
    }
    const yStep = (maxY - 1) / 5;
    for (let i = 0; i <= 5; i++) {
        const y = getY(1 + i * yStep);
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.fillText(`${maxX.toFixed(0)}s`, width - padding.right - 10, height - 15);
    ctx.fillText(`${maxY.toFixed(1)}x`, 10, padding.top + 5);

    // Línea de auto cashout
    if (autoCashOutVal >= 1.01 && autoCashOutVal <= maxY) {
      const y = getY(autoCashOutVal);
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
      ctx.fillText(`AUTO ${autoCashOutVal.toFixed(2)}x`, padding.left + 4, y - 4);
      ctx.restore();
    }

    if (pointsRef.current.length > 1) {
        const isDangerous = statusRef.current === "crashed";
        const isSecured = statusRef.current === "cashed_out";
        
        ctx.strokeStyle = isDangerous ? "#e11d48" : isSecured ? "rgba(16, 185, 129, 0.6)" : "#f59e0b";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.strokeStyle as string;
        
        ctx.beginPath();
        const startX = getX(pointsRef.current[0].time);
        const startY = getY(pointsRef.current[0].multiplier);
        ctx.moveTo(startX, startY);
        
        pointsRef.current.forEach(p => {
            ctx.lineTo(getX(p.time), getY(p.multiplier));
        });
        ctx.stroke();

        ctx.shadowBlur = 0;
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, isDangerous ? "rgba(225, 29, 72, 0.25)" : "rgba(245, 158, 11, 0.25)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = gradient;
        ctx.lineTo(getX(pointsRef.current[pointsRef.current.length - 1].time), height - padding.bottom);
        ctx.lineTo(startX, height - padding.bottom);
        ctx.closePath();
        ctx.fill();

        if (statusRef.current === "rising" || (statusRef.current === "cashed_out" && currentMultiplier < crashPointRef.current)) {
            const head = pointsRef.current[pointsRef.current.length - 1];
            ctx.fillStyle = "#fff";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#fff";
            ctx.beginPath();
            ctx.arc(getX(head.time), getY(head.multiplier), 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
  };

  const updateMultiplier = (time: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }
    
    const elapsedSeconds = (time - startTimeRef.current) / 1000;
    const currentMult = Math.pow(1.065, elapsedSeconds);

    // ✅ Auto cashout: se activa si el multiplicador alcanzó el objetivo
    // No hacemos return para que el loop siga y muestre hasta dónde hubiera llegado
    if (
      autoCashOutRef.current >= 1.01 &&
      currentMult >= autoCashOutRef.current &&
      statusRef.current === "rising" &&
      !autoCashedRef.current
    ) {
      autoCashedRef.current = true;
      handleCashOut(autoCashOutRef.current);
      // Loop continúa intencionalmente — igual que el cashout manual
    }
    
    // Core game step: Check for crash
    if (currentMult >= crashPointRef.current) {
      setMultiplier(crashPointRef.current);
      multiplierRef.current = crashPointRef.current;
      setStatus("crashed");
      setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10));
      return; // Stop animation loop
    }

    setMultiplier(currentMult);
    multiplierRef.current = currentMult;
    pointsRef.current.push({ time: elapsedSeconds, multiplier: currentMult });

    // Handle physical drawing
    const canvas = canvasRef.current;
    if (canvas && logicalSizeRef.current.width > 0) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawGraph(ctx, logicalSizeRef.current.width, logicalSizeRef.current.height, currentMult, elapsedSeconds);
      }
    }

    // Schedule next frame unless crashed
    requestRef.current = requestAnimationFrame(updateMultiplier);
  };

  const handleStart = async () => {
    if (!player || bet <= 0 || bet > player.gold || updating) return;

    setUpdating(true);
    const success = await setPlayerGold(player.gold - bet);
    if (!success) {
      setUpdating(false);
      return;
    }

    const crashPoint = generateCrashPoint();
crashPointRef.current = crashPoint;

if (crashPoint <= 1.00) {
  setMultiplier(1.00);
  setStatus("crashed");
  setHistory(prev => [1.00, ...prev].slice(0, 10));
  setLastWin(0);
  setUpdating(false);
  return;
}

setMultiplier(1.0);
multiplierRef.current = 1.0;
setLastWin(0);
autoCashedRef.current = false;
pointsRef.current = [{ time: 0, multiplier: 1.0 }];

setStatus("starting");
setUpdating(false);

    
    setTimeout(() => {
      setStatus("rising");
      startTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(updateMultiplier);
    }, 1200);
  };

  const handleCashOut = async (exactMultiplier?: number | React.MouseEvent) => {
    if (statusRef.current !== "rising" || updatingRef.current || !playerRef.current) return;

    const m = typeof exactMultiplier === "number" ? exactMultiplier : multiplierRef.current;
    const winAmount = Math.floor(betRef.current * m);
    
    setUpdating(true);
    const success = await setPlayerGoldRef.current(playerRef.current.gold + winAmount);
    
    if (success) {
      setLastWin(winAmount);
      setStatus("cashed_out");
      // The updateMultiplier loop continues because statusRef.current is not "crashed"
    }
    setUpdating(false);
  };

  // Resize Effect (Static relative to game state)
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
                  // Refresh draw if betting
                  if (statusRef.current === "betting") {
                      drawGraph(ctx, rect.width, rect.height, 1, 0);
                  }
              }
          }
      };

      window.addEventListener("resize", updateCanvasSize);
      updateCanvasSize();

      return () => {
          window.removeEventListener("resize", updateCanvasSize);
      };
  }, []); // Only on mount

  // Global cleanup effect
  useEffect(() => {
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (isHydrating) return <Placeholder title="El Multiplicador" description="Cargando las leyes del Vacío..." />;
  if (!player) return <Placeholder title="El Multiplicador" description="Conéctate para apostar en el Vacío." />;

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
          <p className="text-[10px] uppercase tracking-wider text-stone-500">Saldo Actual</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-mono text-lg font-black text-amber-400">{player.gold}</p>
            <RefreshCw className={`h-4 w-4 text-stone-500 ${updating ? "animate-spin" : ""}`} />
          </div>
        </div>
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-[1fr_300px]">
        <div className="relative aspect-video w-full overflow-hidden rounded-[2.5rem] border border-stone-800 bg-stone-950 shadow-2xl overflow-hidden group">
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full block"
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                {status === "betting" ? (
                    <motion.div 
                        key="betting-ui"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="flex flex-col items-center"
                    >
                        <Zap className="h-10 w-10 text-stone-800 mb-2" />
                        <p className="text-stone-700 font-black uppercase tracking-[0.3em] text-[10px]">PULSACIÓN DETECTADA</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="active-ui"
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative">
                            <h2 className={`text-6xl md:text-8xl font-black tabular-nums transition-colors duration-300 drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] ${
                                status === "crashed" ? "text-rose-600" : 
                                status === "cashed_out" ? "text-emerald-500/60" : "text-stone-50"
                            }`}>
                                {multiplier.toFixed(2)}x
                            </h2>
                        </div>

                        {status === "crashed" && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }}
                                className="mt-4 rounded-xl bg-rose-600/20 border border-rose-500/30 px-6 py-2 backdrop-blur-sm"
                            >
                                <p className="text-rose-500 font-black uppercase tracking-widest text-lg italic">¡COLAPSO!</p>
                            </motion.div>
                        )}

                        {status === "cashed_out" && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }}
                                className="mt-4 flex flex-col items-center gap-1"
                            >
                                <p className="text-emerald-500 font-black uppercase tracking-widest text-xs opacity-90">ENERGÍA ASEGURADA</p>
                                <p className="text-amber-400 font-black text-2xl flex items-center gap-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                                <Coins className="h-6 w-6" />
                                +{lastWin}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            
            {status === "starting" && (
                <div className="absolute inset-0 bg-amber-500/5 animate-pulse pointer-events-none" />
            )}
        </div>

        <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <HistoryIcon className="h-4 w-4 text-stone-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Registros del Vacío</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {history.length > 0 ? history.map((val, i) => (
                        <div key={i} className={`px-2 py-1 rounded-lg text-[10px] font-black border ${
                            val >= 10 ? "border-amber-500 text-amber-500 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]" :
                            val >= 2 ? "border-emerald-500/30 text-emerald-500/70" :
                            "border-stone-800 text-stone-500"
                        }`}>
                            {val.toFixed(2)}x
                        </div>
                    )) : (
                        <p className="text-[10px] text-stone-600 italic">Sin datos de colapso...</p>
                    )}
                </div>
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6 flex flex-col justify-between flex-1 relative overflow-hidden">
                {status === "rising" && (
                    <div className="absolute inset-0 bg-emerald-500/5 transition-opacity pointer-events-none" />
                )}

                <div>
                    <h3 className="mb-4 text-xs font-black text-stone-100 uppercase tracking-widest flex items-center gap-2">
                        <Flame className="h-3 w-3 text-amber-500" />
                        Apuesta de Energía
                    </h3>
                    
                    {/* Input de apuesta */}
                    <div className="flex items-center gap-3 mb-4">
                        <input 
                            type="number"
                            value={bet}
                            onChange={(e) => {
  const raw = e.target.value;
  if (raw === "" || raw === "-") return;
  const parsed = parseInt(raw);
  if (!isNaN(parsed)) setBet(Math.min(player.gold, Math.max(0, parsed)));
}}

                            disabled={status === "rising" || status === "starting"}
                            className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-lg font-black text-stone-100 focus:outline-none focus:border-amber-500/50 transition"
                        />
                    </div>

                    {/* Botones rápidos */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                         <button 
                            onClick={() => setBet(Math.floor(player.gold / 2))}
                            disabled={status === "rising" || status === "starting"}
                            className="py-2 rounded-xl bg-stone-800 text-[10px] font-black text-stone-400 hover:text-stone-100 transition"
                         >
                            50% SALDO
                         </button>
                         <button 
                            onClick={() => setBet(player.gold)}
                            disabled={status === "rising" || status === "starting"}
                            className="py-2 rounded-xl bg-stone-800 text-[10px] font-black text-stone-400 hover:text-stone-100 transition"
                         >
                            ALL IN
                         </button>
                    </div>

                    {/* ✅ Retiro automático */}
                    <div className="flex flex-col gap-1 mb-6">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500/60" />
                        Retiro Automático
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={autoCashOut === 0 ? "" : autoCashOut}
                          onChange={(e) => setAutoCashOut(parseFloat(e.target.value) || 0)}
                          disabled={status === "rising" || status === "starting"}
                          placeholder="Ej: 1.50  (0 = desactivado)"
                          className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 pr-8 text-base font-black text-amber-400 placeholder:text-stone-600 placeholder:font-normal focus:outline-none focus:border-amber-500/50 transition"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 font-black text-sm">x</span>
                      </div>
                      {autoCashOut >= 1.01 ? (
                        <p className="text-[9px] text-amber-500/80 font-black uppercase tracking-widest flex items-center gap-1">
                          ⚡ Activo — retira en {autoCashOut.toFixed(2)}x automáticamente
                        </p>
                      ) : (
                        <p className="text-[9px] text-stone-600 uppercase tracking-widest">
                          Desactivado — retirá manualmente
                        </p>
                      )}
                    </div>
                </div>

                <div className="space-y-4">
                    {status === "rising" ? (
                        <button
                            onClick={handleCashOut}
                            disabled={updating}
                            className="w-full group relative overflow-hidden rounded-2xl bg-emerald-600 py-5 font-black text-white hover:bg-emerald-500 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                        >
                            <span className="relative z-10 flex flex-col items-center">
                                <span className="text-[10px] opacity-70 mb-0.5 uppercase tracking-widest">
                                  {autoCashOut >= 1.01 ? `Auto en ${autoCashOut.toFixed(2)}x — o retirá ya` : "Asegurar ahora"}
                                </span>
                                <span className="flex items-center gap-2 text-xl font-black">
                                    <Coins className="h-5 w-5" />
                                    {Math.floor(bet * multiplier)}
                                </span>
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={bet <= 0 || bet > player.gold || updating || status === "starting" || (status === "cashed_out" && multiplier < crashPointRef.current)}
                            className="w-full group relative overflow-hidden rounded-2xl bg-stone-100 py-5 font-black text-stone-900 transition hover:bg-white active:scale-95 disabled:opacity-30"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-tighter">
                                <TrendingUp className="h-5 w-5" />
                                {status === "starting" ? "CARGANDO..." : status === "cashed_out" && multiplier < (crashPointRef.current || 0) ? "ESPERANDO COLAPSO..." : "INICIAR RONDA"}
                            </span>
                        </button>
                    )}
                </div>
                
                <p className="mt-4 text-[9px] text-stone-600 uppercase font-black tracking-[0.2em] text-center leading-normal">
                    El Vacío no perdona la duda.<br/>
                    Retira de forma segura o piérdelo todo.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="mb-6 rounded-3xl bg-amber-500/10 p-6 text-amber-400 shadow-xl shadow-black/20">
        <AlertOctagon className="h-10 w-10 text-amber-500" />
      </div>
      <h3 className="mb-2 text-2xl font-black text-stone-100 uppercase tracking-widest">{title}</h3>
      <p className="max-w-xs text-sm text-stone-500 leading-6">{description}</p>
    </div>
  );
}
