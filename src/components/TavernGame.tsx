// src/components/TavernGame.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HandCoins, AlertOctagon, User, Loader2, RefreshCw } from "lucide-react";
import { TavernCashoutModal } from "./TavernCashoutModal";
import { supabase } from "../utils/supabaseClient";

import cofreCerrado from "../assets/cofre-cerrado.png";
import cofreVacio from "../assets/cofre-vacio.png";
import cofreOro from "../assets/cofre-oro.png";

type GamePhase = "setup" | "betting" | "playing" | "revealed";
type ResultType = "x2" | "x1" | "x0" | null;

interface Player {
  id: string;
  username: string;
  gold: number;
}

// ── Helpers Supabase ────────────────────────────────────────

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

// ── Componente ──────────────────────────────────────────────

export function TavernGame() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [phase, setPhase] = useState<GamePhase>("betting");
  const [bet, setBet] = useState(0);
  const [consecutiveSpins, setConsecutiveSpins] = useState(0);
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [chestResults, setChestResults] = useState<ResultType[]>([null, null, null]);
  const [showCashout, setShowCashout] = useState(false);
  const [updating, setUpdating] = useState(false);

  const balance = player?.gold ?? 0;
  const difficultyLevel = Math.floor(consecutiveSpins / 2);
  const x2Chance = Math.max(3.3, 33.3 - difficultyLevel * 10);
  const x1Chance = 33.3;

  // Refresca el saldo desde Supabase cada vez que la pestaña vuelve a estar activa
  useEffect(() => {
    if (!player) return;
    const onFocus = async () => {
      const fresh = await fetchPlayer(player.username);
      if (fresh) setPlayer(fresh);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [player]);

  // Auto-refresh del saldo cada 5 segundos
  useEffect(() => {
    if (!player) return;
    const interval = window.setInterval(async () => {
      const fresh = await fetchPlayer(player.username);
      if (fresh) setPlayer(fresh);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [player]);

  // ── Login ────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = loginInput.trim();
    if (!name) return;
    setLoginLoading(true);
    setLoginError("");
    const found = await fetchPlayer(name);
    setLoginLoading(false);
    if (!found) {
      setLoginError("Jugador no encontrado. Pide al admin que te registre.");
      return;
    }
    setPlayer(found);
    setLoginInput("");
    setPhase("betting");
  };

  const handleLogout = () => {
    setPlayer(null);
    setPhase("betting");
    setBet(0);
    setConsecutiveSpins(0);
    setChestResults([null, null, null]);
    setSelectedChest(null);
  };

  // Refresca el saldo manualmente desde Supabase
  const refreshBalance = async () => {
    if (!player || updating) return;
    setUpdating(true);
    const fresh = await fetchPlayer(player.username);
    if (fresh) setPlayer(fresh);
    setUpdating(false);
  };

  // ── Actualiza oro en Supabase y en estado local ──────────

  const updateGold = async (newGold: number) => {
    if (!player) return;
    const clamped = Math.max(0, newGold);
    setPlayer((p) => p ? { ...p, gold: clamped } : p); // optimistic UI
    await setPlayerGold(player.id, clamped);
  };

  // ── Ronda ────────────────────────────────────────────────

  const startRound = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!player || updating) return;
    const formData = new FormData(e.currentTarget);
    const bt = Number(formData.get("betAmount"));
    if (bt < 1 || bt > balance) return;
    setUpdating(true);
    setBet(bt);
    await updateGold(balance - bt);
    setUpdating(false);
    setPhase("playing");
    setChestResults([null, null, null]);
    setSelectedChest(null);
  };

  const openChest = async (index: number) => {
    if (phase !== "playing" || !player || updating) return;

    const rand = Math.random() * 100;
    let actualResult: ResultType = "x0";
    if (rand <= x2Chance) actualResult = "x2";
    else if (rand <= x2Chance + x1Chance) actualResult = "x1";

    const available = (["x2", "x1", "x0"] as ResultType[]).filter((x) => x !== actualResult);
    available.sort(() => Math.random() - 0.5);
    const newResults: ResultType[] = [];
    let ai = 0;
    for (let i = 0; i < 3; i++) newResults.push(i === index ? actualResult : available[ai++]);

    setChestResults(newResults);
    setSelectedChest(index);
    setPhase("revealed");

    // balanceAfterBet = saldo real en Supabase después de descontar la apuesta
    const balanceAfterBet = balance; // balance ya tiene el bet descontado (se actualizó en startRound)
    setUpdating(true);
    if (actualResult === "x2") {
      await updateGold(balanceAfterBet + bet * 2); // devuelve apuesta x2
      setConsecutiveSpins((p) => p + 1);
    } else if (actualResult === "x1") {
      await updateGold(balanceAfterBet + bet); // devuelve solo la apuesta
      setConsecutiveSpins((p) => p + 1);
    } else {
      // x0: apuesta ya descontada, no se devuelve nada
      setConsecutiveSpins(0);
    }
    setUpdating(false);
  };

  const resetGame = () => {
    const gold = player?.gold ?? 0;
    if (gold <= 0) { handleLogout(); return; }
    setPhase("betting");
    setBet(0);
    setChestResults([null, null, null]);
    setSelectedChest(null);
  };

  const handleCashoutComplete = () => {
    setShowCashout(false);
    handleLogout();
  };

  const getChestImage = (i: number) => {
    if (phase === "playing") return cofreCerrado;
    const res = chestResults[i];
    if (res === "x2" || res === "x1") return cofreOro;
    if (res === "x0") return cofreVacio;
    return cofreCerrado;
  };

  // ── PANTALLA: Login ──────────────────────────────────────

  if (!player) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-8 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <User className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-stone-100">La Mesa Oscura</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Identifícate ante la taberna antes de apostar.
          </p>
          <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3">
            <input
              type="text"
              value={loginInput}
              onChange={(e) => { setLoginInput(e.target.value); setLoginError(""); }}
              placeholder="Tu nombre de jugador"
              disabled={loginLoading}
              className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-center text-lg font-bold text-amber-400 placeholder-stone-600 outline-none transition focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/40 disabled:opacity-50"
            />
            {loginError && (
              <p className="text-xs font-semibold text-rose-400">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.15)] transition hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
              ) : (
                "Entrar a la mesa"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  // ── PANTALLA: Juego ──────────────────────────────────────

  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-6 md:p-8 relative overflow-hidden shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.03)_0%,transparent_50%)]" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">

        {/* Cabecera: jugador + saldo */}
        <div className="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-950/50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              {player.username}
            </p>
            <div className="flex items-center gap-2">
              <p className="mt-1 text-2xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                {player.gold} 🪙
              </p>
              <button
                onClick={refreshBalance}
                disabled={updating}
                className="mt-1 rounded-lg p-1 text-stone-500 transition hover:text-amber-400 disabled:opacity-30"
                title="Actualizar saldo"
              >
                <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {balance > 0 && (
              <button
                onClick={() => setShowCashout(true)}
                className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-400 transition hover:bg-amber-500/20"
              >
                <HandCoins className="h-4 w-4" />
                Retirarse
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-xl border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Sin oro */}
        {balance <= 0 && phase === "betting" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center"
          >
            <p className="text-lg font-black text-rose-400">Sin oro</p>
            <p className="mt-1 text-sm text-stone-400">
              No tienes suficiente oro para apostar. Habla con el admin.
            </p>
            <button onClick={handleLogout}
              className="mt-4 rounded-xl bg-stone-800 px-5 py-2 text-sm font-bold text-stone-200 transition hover:bg-stone-700"
            >
              Volver al inicio
            </button>
          </motion.div>
        )}

        {/* Apuesta */}
        {phase === "betting" && balance > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5"
          >
            <h3 className="text-lg font-bold text-stone-100">Haz tu apuesta</h3>
            {difficultyLevel > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 p-2 text-xs font-semibold text-rose-300">
                <AlertOctagon className="h-4 w-4" />
                La casa está atenta. Riesgo aumentado por racha ganadora.
              </div>
            )}
            <form onSubmit={startRound} className="mt-4 flex gap-3">
              <input
                name="betAmount"
                type="number"
                required
                min={1}
                max={balance}
                defaultValue={bet > 0 ? bet : ""}
                className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-lg font-bold text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/40"
                placeholder="Oro a apostar"
              />
              <button type="submit" disabled={updating}
                className="shrink-0 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:opacity-50"
              >
                Jugar
              </button>
            </form>
          </motion.div>
        )}

        {/* Cofres */}
        {(phase === "playing" || phase === "revealed") && (
          <div className="flex flex-col items-center py-4">
            <h3 className="mb-8 text-xl font-black uppercase tracking-[0.2em] text-stone-200">
              {phase === "playing" ? "Elige un cofre" : "Resultado"}
            </h3>
            <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-lg">
              {[0, 1, 2].map((i) => {
                const isSelected = selectedChest === i;
                const res = chestResults[i];
                let chestClass = "border-stone-700 bg-stone-900 hover:border-amber-500/50 hover:bg-stone-800 cursor-pointer";
                let bgGlow = "transparent";
                let labelEl: React.ReactNode = null;

                if (phase === "revealed") {
                  if (res === "x2") {
                    chestClass = "border-emerald-500 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                    bgGlow = "rgba(16,185,129,0.15)";
                    labelEl = <span className="mt-2 text-lg font-black text-emerald-400">WIN x2</span>;
                  } else if (res === "x1") {
                    chestClass = "border-amber-500 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
                    bgGlow = "rgba(245,158,11,0.15)";
                    labelEl = <span className="mt-2 text-base font-bold text-amber-400">Recuperas</span>;
                  } else {
                    chestClass = "border-rose-600 bg-rose-950/40 shadow-[0_0_20px_rgba(225,29,72,0.2)]";
                    bgGlow = "rgba(225,29,72,0.15)";
                    labelEl = <span className="mt-2 text-lg font-black text-rose-500">MIMIC</span>;
                  }
                  if (!isSelected) chestClass += " opacity-40 scale-95 grayscale";
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => openChest(i)}
                    disabled={phase === "revealed" || updating}
                    whileHover={phase === "playing" ? { scale: 1.05, y: -5 } : {}}
                    whileTap={phase === "playing" ? { scale: 0.95 } : {}}
                    animate={{ y: phase === "playing" ? [0, -3, 0] : 0, boxShadow: `0 0 20px ${bgGlow}` }}
                    transition={{
                      y: { repeat: Infinity, duration: 2, delay: i * 0.2, ease: "easeInOut" },
                      boxShadow: { duration: 0.5 },
                    }}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all duration-500 ${chestClass}`}
                  >
                    {phase === "playing" ? (
                      <img src={cofreCerrado} alt="Cofre cerrado"
                        className="w-16 h-16 md:w-20 md:h-20 object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: isSelected ? 0 : 0.15 }}
                        className="flex flex-col items-center"
                      >
                        <img src={getChestImage(i)} alt={res === "x0" ? "Cofre vacío" : "Cofre con oro"}
                          className="w-16 h-16 md:w-20 md:h-20 object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                        {labelEl}
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {phase === "revealed" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }} className="mt-8 space-y-4 w-full"
              >
                <button onClick={resetGame} disabled={updating}
                  className="w-full rounded-2xl bg-stone-100 px-6 py-4 text-sm font-black text-stone-900 transition hover:bg-white md:w-auto md:min-w-64 mx-auto block text-center disabled:opacity-50"
                >
                  {(player?.gold ?? 0) <= 0 ? "Sin oro — volver al inicio" : "Jugar otra ronda"}
                </button>
                <div className="text-center">
                  <p className="text-xs text-stone-500 font-semibold uppercase tracking-widest">
                    Apuesta: {bet} 🪙 | Dificultad: Fase {difficultyLevel + 1}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showCashout && balance > 0 && (
          <TavernCashoutModal
            balance={balance}
            onClose={() => setShowCashout(false)}
            onSuccess={handleCashoutComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
