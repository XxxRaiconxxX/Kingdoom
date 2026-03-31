import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Loader2 } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import ruletaImg from "../assets/ruleta.png";

interface Player {
  id: string;
  username: string;
  gold: number;
}

async function fetchPlayer(username: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("id, username, gold")
    .ilike("username", username.trim())
    .single();
  if (error || !data) return null;
  return data as Player;
}

async function setPlayerGold(id: string, gold: number): Promise<void> {
  await supabase
    .from("players")
    .update({ gold: Math.max(0, gold) })
    .eq("id", id);
}

const MULTIPLIERS = [0, 0.5, 1.5, 2, 5, 10];
const PROBABILITIES = [0.45, 0.25, 0.15, 0.10, 0.04, 0.01];

function getRandomMultiplier(): number {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < PROBABILITIES.length; i++) {
    cumulative += PROBABILITIES[i];
    if (rand <= cumulative) return MULTIPLIERS[i];
  }
  return 0;
}

type GamePhase = "login" | "betting" | "spinning" | "result";

export function TavernRoulette() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [phase, setPhase] = useState<GamePhase>("login");
  const [bet, setBet] = useState(0);
  const [resultMultiplier, setResultMultiplier] = useState<number>(0);
  const [spinDegrees, setSpinDegrees] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = window.setInterval(async () => {
      const fresh = await fetchPlayer(player.username);
      if (fresh) setPlayer(fresh);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [player]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = loginInput.trim();
    if (!name) return;
    setLoginLoading(true);
    setLoginError("");
    const found = await fetchPlayer(name);
    setLoginLoading(false);
    if (!found) {
      setLoginError("Jugador no encontrado.");
      return;
    }
    setPlayer(found);
    setPhase("betting");
  };

  const handleSpin = async () => {
    if (!player || bet <= 0 || bet > player.gold || updating) return;
    setUpdating(true);
    
    // Deduct bet
    const newBalance = player.gold - bet;
    await setPlayerGold(player.id, newBalance);
    setPlayer({ ...player, gold: newBalance });
    
    const multiplier = getRandomMultiplier();
    setResultMultiplier(multiplier);
    
    // Generar grados aleatorios para que la ruleta gire varias vueltas (5 vueltas = 1800 grados) 
    // y se detenga en un ángulo aleatorio
    const extraRotation = Math.floor(Math.random() * 360);
    setSpinDegrees(1800 + extraRotation);
    
    setPhase("spinning");

    // Simulate spin delay
    setTimeout(async () => {
      const winnings = Math.floor(bet * multiplier);
      if (winnings > 0) {
        const finalBalance = newBalance + winnings;
        await setPlayerGold(player.id, finalBalance);
        setPlayer({ ...player, gold: finalBalance });
      }
      setPhase("result");
      setUpdating(false);
    }, 3000);
  };

  const handlePlayAgain = () => {
    setPhase("betting");
    setBet(0);
  };

  if (phase === "login" || !player) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="mb-4 rounded-full bg-amber-500/10 p-4 text-amber-400">
          <User className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-stone-100">La Ruleta del Destino</h3>
        <p className="mb-6 text-sm text-stone-400">Ingresa tu nombre para jugar</p>
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
          <input
            type="text"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            placeholder="Tu nombre en el juego"
            className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-center text-stone-100 outline-none focus:border-amber-500/50"
            required
          />
          {loginError && <p className="text-xs text-rose-400">{loginError}</p>}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-xl bg-amber-600 py-3 font-bold text-stone-900 transition hover:bg-amber-500 disabled:opacity-50"
          >
            {loginLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Entrar a la Ruleta"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 text-center">
      <div className="mb-6 flex w-full items-center justify-between rounded-2xl bg-stone-900/80 px-4 py-3 border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-stone-300">
            <User className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-xs text-stone-500">Jugador</p>
            <p className="font-bold text-stone-200">{player.username}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500">Oro disponible</p>
          <p className="flex items-center gap-1 font-mono text-lg font-bold text-amber-400">
            {player.gold} <span className="text-sm">🪙</span>
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "betting" && (
          <motion.div
            key="betting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xs"
          >
            <h3 className="mb-4 text-lg font-bold text-stone-100">¿Cuánto oro apuestas a la ruleta?</h3>
            <div className="mb-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setBet(Math.max(0, bet - 10))}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-xl font-bold text-stone-300 hover:bg-stone-700 active:scale-95"
              >-</button>
              <div className="flex h-16 w-24 items-center justify-center rounded-2xl border-2 border-stone-700 bg-stone-900 text-2xl font-bold text-amber-400">
                {bet}
              </div>
              <button
                onClick={() => setBet(Math.min(player.gold, bet + 10))}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-xl font-bold text-stone-300 hover:bg-stone-700 active:scale-95"
              >+</button>
            </div>
            <div className="mb-6 flex justify-center gap-2">
              <button onClick={() => setBet(10)} className="rounded-lg bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700 hover:text-stone-200">Min</button>
              <button onClick={() => setBet(Math.floor(player.gold / 2))} className="rounded-lg bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700 hover:text-stone-200">Mitad</button>
              <button onClick={() => setBet(player.gold)} className="rounded-lg bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700 hover:text-stone-200">Todo</button>
            </div>
            <button
              onClick={handleSpin}
              disabled={bet <= 0 || bet > player.gold || updating}
              className="w-full rounded-xl bg-amber-600 py-4 font-bold text-stone-900 transition hover:bg-amber-500 disabled:opacity-50 active:scale-95"
            >
              Girar Ruleta
            </button>
          </motion.div>
        )}

        {phase === "spinning" && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8"
          >
            <div className="relative mb-8 flex h-56 w-56 items-center justify-center">
              {/* Flecha indicadora superior */}
              <div className="absolute -top-6 z-10 text-amber-400 drop-shadow-md">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 7l-5-5-5 5"/>
                </svg>
              </div>
              
              <motion.img
                src={ruletaImg}
                alt="Ruleta"
                animate={{ rotate: spinDegrees }}
                transition={{ duration: 3, ease: "circOut" }}
                className="h-full w-full rounded-full object-cover shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                onError={(e) => {
                  // Fallback visual por si la imagen no está disponible
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement?.classList.add('border-8', 'border-stone-800', 'bg-stone-900');
                }}
              />
              {/* Fallback div in case image fails to load */}
              <motion.div
                animate={{ rotate: spinDegrees }}
                transition={{ duration: 3, ease: "circOut" }}
                className="absolute inset-0 -z-10 rounded-full border-8 border-stone-800 bg-stone-900"
                style={{ display: 'none' }} // Solo se muestra si la imagen falla mediante CSS
              >
                <div className="absolute left-1/2 top-0 h-1/2 w-1 -translate-x-1/2 bg-amber-500" />
                <div className="absolute left-0 top-1/2 h-1 w-1/2 -translate-y-1/2 bg-rose-500" />
                <div className="absolute bottom-0 left-1/2 h-1/2 w-1 -translate-x-1/2 bg-emerald-500" />
                <div className="absolute right-0 top-1/2 h-1 w-1/2 -translate-y-1/2 bg-indigo-500" />
              </motion.div>
            </div>
            <p className="animate-pulse text-lg font-bold text-amber-400">La ruleta está girando...</p>
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-4 w-full max-w-xs"
          >
            <div className={`mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 ${resultMultiplier > 1 ? 'border-amber-400 bg-amber-500/20 text-amber-400' : resultMultiplier === 0 ? 'border-rose-500 bg-rose-500/20 text-rose-500' : 'border-stone-500 bg-stone-500/20 text-stone-300'}`}>
              <span className="text-4xl font-black">x{resultMultiplier}</span>
            </div>
            
            <h3 className="mb-2 text-2xl font-bold text-stone-100">
              {resultMultiplier === 0 ? "¡Mala suerte!" : resultMultiplier < 1 ? "Recuperas algo" : resultMultiplier === 10 ? "¡JACKPOT!" : "¡Ganaste!"}
            </h3>
            
            <p className="mb-8 text-stone-400">
              {resultMultiplier === 0 ? (
                `Has perdido tus ${bet} 🪙`
              ) : (
                `Te llevas ${Math.floor(bet * resultMultiplier)} 🪙`
              )}
            </p>

            <button
              onClick={handlePlayAgain}
              className="w-full rounded-xl bg-stone-800 py-4 font-bold text-stone-200 transition hover:bg-stone-700 active:scale-95"
            >
              Jugar de nuevo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
