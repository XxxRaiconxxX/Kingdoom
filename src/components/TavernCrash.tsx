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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const pointsRef = useRef<Point[]>([]);

  // House edge and distribution logic
  const generateCrashPoint = () => {
    if (Math.random() < 0.02) return 1.00;
    const point = 0.99 / (1 - Math.random());
    return Math.min(Math.max(point, 1.01), 1000);
  };

  const drawGraph = (ctx: CanvasRenderingContext2D, width: number, height: number, currentMultiplier: number, elapsed: number) => {
    ctx.clearRect(0, 0, width, height);

    // Dynamic Scaling
    const maxX = Math.max(10, elapsed * 1.2);
    const maxY = Math.max(2, currentMultiplier * 1.3);

    const padding = { left: 40, bottom: 30, right: 20, top: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Helper to map data to pixel coordinates
    const getX = (t: number) => padding.left + (t / maxX) * chartWidth;
    const getY = (m: number) => height - padding.bottom - ((m - 1) / (maxY - 1)) * chartHeight;

    // Draw Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Vertical Lines
    for (let i = 0; i <= 5; i++) {
        const x = padding.left + (i / 5) * chartWidth;
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
    }
    // Horizontal Lines
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (i / 5) * chartHeight;
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
    }
    ctx.stroke();

    // Draw Axes Labels (Simple)
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`${maxX.toFixed(0)}s`, width - padding.right - 20, height - 10);
    ctx.fillText(`${maxY.toFixed(1)}x`, 5, padding.top + 10);

    // Draw the Curve
    if (pointsRef.current.length > 1) {
        ctx.strokeStyle = status === "crashed" ? "#e11d48" : status === "cashed_out" ? "rgba(16, 185, 129, 0.6)" : "#f59e0b";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle as string;
        
        ctx.beginPath();
        ctx.moveTo(getX(pointsRef.current[0].time), getY(pointsRef.current[0].multiplier));
        
        pointsRef.current.forEach(p => {
            ctx.lineTo(getX(p.time), getY(p.multiplier));
        });
        ctx.stroke();

        // Fill under curve
        ctx.shadowBlur = 0;
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, status === "crashed" ? "rgba(225, 29, 72, 0.2)" : "rgba(245, 158, 11, 0.2)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = gradient;
        ctx.lineTo(getX(pointsRef.current[pointsRef.current.length - 1].time), height - padding.bottom);
        ctx.lineTo(getX(pointsRef.current[0].time), height - padding.bottom);
        ctx.closePath();
        ctx.fill();

        // Draw Head Point
        if (status === "rising" || (status === "cashed_out" && multiplier < crashPointRef.current)) {
            const head = pointsRef.current[pointsRef.current.length - 1];
            ctx.fillStyle = "#fff";
            ctx.shadowBlur = 15;
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
    
    if (currentMult >= crashPointRef.current) {
      setMultiplier(crashPointRef.current);
      setStatus("crashed");
      setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10));
      return;
    }

    setMultiplier(currentMult);
    pointsRef.current.push({ time: elapsedSeconds, multiplier: currentMult });

    // Handle drawing
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawGraph(ctx, canvas.width, canvas.height, currentMult, elapsedSeconds);
      }
    }

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

    crashPointRef.current = generateCrashPoint();
    setMultiplier(1.0);
    setLastWin(0);
    pointsRef.current = [{ time: 0, multiplier: 1.0 }];
    
    // Clear canvas for new game
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    setStatus("starting");
    setUpdating(false);
    
    setTimeout(() => {
      setStatus("rising");
      startTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(updateMultiplier);
    }, 1200);
  };

  const handleCashOut = async () => {
    if (status !== "rising" || updating || !player) return;

    const winAmount = Math.floor(bet * multiplier);
    setUpdating(true);
    const success = await setPlayerGold(player.gold + winAmount);
    
    if (success) {
      setLastWin(winAmount);
      setStatus("cashed_out");
    }
    setUpdating(false);
  };

  // Sync canvas size on mount/resize
  useEffect(() => {
      const updateCanvasSize = () => {
          const canvas = canvasRef.current;
          if (canvas && canvas.parentElement) {
              const rect = canvas.parentElement.getBoundingClientRect();
              // Device Pixel Ratio for Sharpness
              const dpr = window.devicePixelRatio || 1;
              canvas.width = rect.width * dpr;
              canvas.height = rect.height * dpr;
              const ctx = canvas.getContext("2d");
              if (ctx) ctx.scale(dpr, dpr);
              
              // Initial static draw if betting
              if (status === "betting" && ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
          }
      };

      window.addEventListener("resize", updateCanvasSize);
      updateCanvasSize();

      return () => {
          window.removeEventListener("resize", updateCanvasSize);
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
        {/* Graph Area */}
        <div className="relative aspect-video w-full overflow-hidden rounded-[2.5rem] border border-stone-800 bg-stone-950 shadow-2xl">
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full"
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
                        <Zap className="h-12 w-12 text-stone-800 mb-4" />
                        <p className="text-stone-600 font-black uppercase tracking-[0.3em] text-xs">LISTO PARA EL SALTO</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="active-ui"
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative">
                            <h2 className={`text-6xl md:text-8xl font-black tabular-nums transition-colors duration-300 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
                                status === "crashed" ? "text-rose-600" : 
                                status === "cashed_out" ? "text-emerald-500/50" : "text-stone-50"
                            }`}>
                                {multiplier.toFixed(2)}x
                            </h2>
                        </div>

                        {status === "crashed" && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }}
                                className="mt-4 rounded-xl bg-rose-600/20 border border-rose-500/30 px-6 py-2"
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
                                <p className="text-emerald-500 font-black uppercase tracking-widest text-xs opacity-80">ENERGÍA ASEGURADA</p>
                                <p className="text-amber-400 font-black text-2xl flex items-center gap-2">
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

        {/* Action Panel */}
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
                    <div className="absolute inset-0 bg-emerald-500/5 transition-opacity" />
                )}

                <div>
                    <h3 className="mb-4 text-xs font-black text-stone-100 uppercase tracking-widest flex items-center gap-2">
                        <Flame className="h-3 w-3 text-amber-500" />
                        Apuesta de Energía
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <input 
                            type="number"
                            value={bet}
                            onChange={(e) => setBet(Math.min(player.gold, Math.max(0, parseInt(e.target.value) || 0)))}
                            disabled={status === "rising" || status === "starting"}
                            className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-lg font-black text-stone-100 focus:outline-none focus:border-amber-500/50 transition"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-6">
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
                </div>

                <div className="space-y-4">
                    {status === "rising" ? (
                        <button
                            onClick={handleCashOut}
                            disabled={updating}
                            className="w-full group relative overflow-hidden rounded-2xl bg-emerald-600 py-5 font-black text-white hover:bg-emerald-500 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                        >
                            <span className="relative z-10 flex flex-col items-center">
                                <span className="text-[10px] opacity-70 mb-0.5 uppercase tracking-widest">Asegurar ahora</span>
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 rounded-3xl bg-amber-500/10 p-6 text-amber-400">
        <AlertOctagon className="h-10 w-10" />
      </div>
      <h3 className="mb-2 text-2xl font-black text-stone-100 uppercase tracking-widest">{title}</h3>
      <p className="max-w-xs text-sm text-stone-500 leading-6">{description}</p>
    </div>
  );
}
