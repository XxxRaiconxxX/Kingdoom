import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

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

function getRandomCard(): number {
  return Math.floor(Math.random() * 10) + 1; // 1 to 10
}

type GamePhase = "login" | "betting" | "playing" | "result";

export function TavernCards() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [phase, setPhase] = useState<GamePhase>("login");
  const [bet, setBet] = useState(0);
  const [currentCard, setCurrentCard] = useState<number>(0);
  const [nextCard, setNextCard] = useState<number>(0);
  const [result, setResult] = useState<"win" | "lose" | "tie" | null>(null);
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

  const startGame = async () => {
    if (!player || bet <= 0 || bet > player.gold || updating) return;
    setUpdating(true);
    
    // Deduct bet
    const newBalance = player.gold - bet;
    await setPlayerGold(player.id, newBalance);
    setPlayer({ ...player, gold: newBalance });
    
    setCurrentCard(getRandomCard());
    setPhase("playing");
    setUpdating(false);
  };

  const handleGuess = async (guess: "higher" | "lower") => {
    if (updating || !player) return;
    setUpdating(true);
    
    const drawnCard = getRandomCard();
    setNextCard(drawnCard);
    
    let outcome: "win" | "lose" | "tie" = "lose";
    
    if (drawnCard === currentCard) {
      outcome = "tie";
    } else if (guess === "higher" && drawnCard > currentCard) {
      outcome = "win";
    } else if (guess === "lower" && drawnCard < currentCard) {
      outcome = "win";
    }

    setResult(outcome);
    setPhase("result");

    // Payout
    if (outcome === "win") {
      const finalBalance = player.gold + (bet * 2);
      await setPlayerGold(player.id, finalBalance);
      setPlayer({ ...player, gold: finalBalance });
    } else if (outcome === "tie") {
      const finalBalance = player.gold + bet; // return bet
      await setPlayerGold(player.id, finalBalance);
      setPlayer({ ...player, gold: finalBalance });
    }
    
    setUpdating(false);
  };

  const handlePlayAgain = () => {
    setPhase("betting");
    setBet(0);
    setResult(null);
  };

  if (phase === "login" || !player) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="mb-4 rounded-full bg-indigo-500/10 p-4 text-indigo-400">
          <User className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-stone-100">Cartas del Oráculo</h3>
        <p className="mb-6 text-sm text-stone-400">Ingresa tu nombre para jugar</p>
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
          <input
            type="text"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            placeholder="Tu nombre en el juego"
            className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-center text-stone-100 outline-none focus:border-indigo-500/50"
            required
          />
          {loginError && <p className="text-xs text-rose-400">{loginError}</p>}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-stone-100 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loginLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Sentarse a la mesa"}
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
            <h3 className="mb-4 text-lg font-bold text-stone-100">¿Cuánto oro apuestas a las cartas?</h3>
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
              onClick={startGame}
              disabled={bet <= 0 || bet > player.gold || updating}
              className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-stone-100 transition hover:bg-indigo-500 disabled:opacity-50 active:scale-95"
            >
              Repartir Cartas
            </button>
          </motion.div>
        )}

        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-4 w-full max-w-xs"
          >
            <p className="mb-6 text-stone-400">La carta actual es:</p>
            <div className="mb-8 flex h-40 w-28 items-center justify-center rounded-xl border-2 border-stone-600 bg-stone-100 shadow-xl">
              <span className="text-6xl font-black text-stone-900">{currentCard}</span>
            </div>
            
            <h3 className="mb-4 text-lg font-bold text-stone-100">¿La siguiente será mayor o menor?</h3>
            <div className="flex w-full gap-4">
              <button
                onClick={() => handleGuess("higher")}
                disabled={updating}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/50 py-4 text-emerald-400 transition hover:bg-emerald-600/30 active:scale-95"
              >
                <ArrowUpCircle className="h-8 w-8" />
                <span className="font-bold">Mayor</span>
              </button>
              <button
                onClick={() => handleGuess("lower")}
                disabled={updating}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/50 py-4 text-rose-400 transition hover:bg-rose-600/30 active:scale-95"
              >
                <ArrowDownCircle className="h-8 w-8" />
                <span className="font-bold">Menor</span>
              </button>
            </div>
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-4 w-full max-w-xs"
          >
            <div className="mb-6 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="mb-2 text-xs text-stone-500">Anterior</span>
                <div className="flex h-24 w-16 items-center justify-center rounded-lg border border-stone-700 bg-stone-800 opacity-50">
                  <span className="text-3xl font-bold text-stone-400">{currentCard}</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="mb-2 text-xs text-amber-400 font-bold">Nueva</span>
                <div className="flex h-32 w-24 items-center justify-center rounded-xl border-2 border-amber-400 bg-stone-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <span className="text-5xl font-black text-stone-900">{nextCard}</span>
                </div>
              </div>
            </div>
            
            <h3 className="mb-2 text-2xl font-bold text-stone-100">
              {result === "win" ? "¡Acertaste!" : result === "tie" ? "¡Empate!" : "¡Fallaste!"}
            </h3>
            
            <p className="mb-8 text-stone-400">
              {result === "win" ? (
                `Has ganado ${bet * 2} 🪙`
              ) : result === "tie" ? (
                `Recuperas tus ${bet} 🪙`
              ) : (
                `Has perdido tus ${bet} 🪙`
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
