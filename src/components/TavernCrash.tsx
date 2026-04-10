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

export function TavernCrash() {
  const { player, isHydrating, refreshPlayer, setPlayerGold } = usePlayerSession();
  
  const [status, setStatus] = useState<GameStatus>("betting");
  const [bet, setBet] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  // Security: Keep the point in a ref so it's not visible in standard State DevTools
  const crashPointRef = useRef<number>(0);

  const generateCrashPoint = () => {
    if (Math.random() < 0.02) return 1.00;
    const point = 0.99 / (1 - Math.random());
    return Math.min(Math.max(point, 1.01), 1000);
  };

  const updateMultiplier = (time: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }
    
    const elapsedSeconds = (time - startTimeRef.current) / 1000;
    
    // Exponential formula
    const currentMult = Math.pow(1.065, elapsedSeconds);
    
    if (currentMult >= crashPointRef.current) {
      setMultiplier(crashPointRef.current);
      setStatus("crashed");
      setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10)); // Increased history
      return;
    }

    setMultiplier(currentMult);
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

    // We DON'T cancel animation frame here, let it continue until crash for FOMO
    const winAmount = Math.floor(bet * multiplier);
    setUpdating(true);
    const success = await setPlayerGold(player.gold + winAmount);
    
    if (success) {
      setLastWin(winAmount);
      setStatus("cashed_out");
    }
    setUpdating(false);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Calculate SVG curve path based on multiplier
  const getPathLength = () => {
      if (status === "betting") return 0;
      // We map the multiplier range [1, 10] to [0, 1] for visual growth
      return Math.min(1.2, (multiplier - 1) / 9);
  };

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
        <div className="relative aspect-video w-full overflow-hidden rounded-[2.5rem] border border-stone-800 bg-stone-950 p-8 shadow-2xl flex flex-col items-center justify-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #444 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            <AnimatePresence mode="wait">
              {status === "betting" ? (
                <motion.div 
                    key="betting-ui"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                >
                    <Zap className="h-12 w-12 text-stone-700 mb-4" />
                    <p className="text-stone-500 font-bold uppercase tracking-[0.3em] text-sm italic">Esperando Energía...</p>
                </motion.div>
              ) : (
                <motion.div 
                    key="active-ui"
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center z-10"
                >
                    {status === "starting" && (
                        <p className="absolute -top-12 text-amber-500 font-black animate-pulse uppercase tracking-widest text-xs">Cargando Núcleo...</p>
                    )}
                    
                    <div className="relative">
                        <motion.h2 
                            className={`text-6xl md:text-8xl font-black tabular-nums transition-colors duration-200 ${
                                status === "crashed" ? "text-rose-600" : 
                                status === "cashed_out" ? "text-emerald-500/50" : "text-stone-50"
                            }`}
                        >
                            {multiplier.toFixed(2)}x
                        </motion.h2>
                        
                        <motion.div 
                            className="absolute -inset-10 rounded-full border-4 border-amber-500/20 pointer-events-none"
                            animate={status === "rising" || status === "cashed_out" ? { 
                                scale: [1, 1.1, 1],
                                opacity: [0.1, 0.4, 0.1],
                             } : { scale: 1, opacity: 0 }}
                        />
                    </div>

                    {status === "crashed" && (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }}
                            className="mt-6 rounded-xl bg-rose-600/20 border border-rose-500/30 px-6 py-2"
                        >
                            <p className="text-rose-500 font-black uppercase tracking-widest text-lg">¡COLAPSO!</p>
                        </motion.div>
                    )}

                    {status === "cashed_out" && (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }}
                            className="mt-6 flex flex-col items-center gap-1"
                        >
                             <div className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-6 py-2">
                                <p className="text-emerald-500 font-black uppercase tracking-widest text-sm">ENERGÍA ASEGURADA</p>
                             </div>
                             <p className="text-amber-400 font-black text-xl flex items-center gap-2 mt-2">
                                <Coins className="h-5 w-5" />
                                +{lastWin}
                             </p>
                        </motion.div>
                    )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Curve Visual */}
            <div className="absolute bottom-10 left-10 right-10 h-40 pointer-events-none overflow-hidden">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path 
                        d="M 0 100 Q 15 100, 30 80 T 60 50 T 100 0" 
                        fill="none" 
                        stroke="url(#gradient)" 
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ pathLength: getPathLength() }}
                        transition={{ duration: 0.1 }}
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>

        <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <HistoryIcon className="h-4 w-4 text-stone-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Últimos Colapsos</h4>
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
                        <p className="text-[10px] text-stone-600 italic">No hay profecías aún...</p>
                    )}
                </div>
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6 flex flex-col justify-between flex-1 relative overflow-hidden">
                {status === "rising" && (
                    <div className="absolute inset-0 bg-amber-500/5 transition-opacity" />
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
                            className="w-full group relative overflow-hidden rounded-2xl bg-emerald-600 py-4 font-black text-white hover:bg-emerald-500 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                        >
                            <span className="relative z-10 flex flex-col items-center">
                                <span className="text-[10px] opacity-70 mb-0.5">ASEGURAR AHORA</span>
                                <span className="flex items-center gap-2 text-lg">
                                    <Coins className="h-5 w-5" />
                                    {Math.floor(bet * multiplier)} ORO
                                </span>
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={bet <= 0 || bet > player.gold || updating || status === "starting" || (status === "cashed_out" && multiplier < crashPointRef.current)}
                            className="w-full group relative overflow-hidden rounded-2xl bg-amber-500 py-4 font-black text-stone-950 transition hover:bg-amber-400 active:scale-95 disabled:opacity-30"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                {status === "starting" ? "CARGANDO..." : status === "cashed_out" && multiplier < (crashPointRef.current || 0) ? "ESPERANDO COLAPSO..." : "INICIAR RONDA"}
                            </span>
                        </button>
                    )}
                </div>
                
                <p className="mt-4 text-[9px] text-stone-600 uppercase font-bold tracking-[0.2em] text-center leading-normal">
                    El Vacío colapsa sin avisar.<br/>
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
