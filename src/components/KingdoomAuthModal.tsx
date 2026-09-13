import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, ShieldCheck, X } from "lucide-react";
import type { PlayerAccount } from "../types";
import { fetchPlayerByUsername } from "../utils/players";
import {
  activateKingdoomAccount,
  signInKingdoom,
} from "../utils/kingdoomAuth";
import { supabase } from "../utils/supabaseClient";

type AuthMode = "login" | "first-access" | "staff-reset";
const field = "w-full rounded-xl border border-stone-700 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20";

export function KingdoomAuthModal({
  onClose,
  onAuthenticated,
  initialUsername = "",
}: {
  onClose: () => void;
  onAuthenticated: (player: PlayerAccount) => void;
  initialUsername?: string;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [code, setCode] = useState("");
  const [resetTarget, setResetTarget] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [remember, setRemember] = useState(() => window.localStorage.getItem("kingdoom.remember-username") === "true");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function finish(usernameToLoad: string) {
    const player = await fetchPlayerByUsername(usernameToLoad);
    if (!player) throw new Error("El perfil no existe en el reino.");
    if (remember) window.localStorage.setItem("kingdoom.remember-username", "true");
    else window.localStorage.removeItem("kingdoom.remember-username");
    window.localStorage.setItem("kingdoom.active-player", player.username);
    onAuthenticated(player);
    onClose();
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setFeedback("");
    try {
      const { error } = await signInKingdoom(username, password);
      if (error) throw error;
      await finish(username);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo iniciar sesion.");
    } finally { setBusy(false); }
  }

  async function handleFirstAccess(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) { setFeedback("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== passwordRepeat) { setFeedback("Las contraseñas no coinciden."); return; }
    if (!/^\d{6}$/.test(code)) { setFeedback("Escribe el código de 6 dígitos recibido por WhatsApp."); return; }
    setBusy(true); setFeedback("");
    try {
      const { error } = await activateKingdoomAccount({ username, password, code });
      if (error) throw error;
      await finish(username);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo activar la cuenta.");
    } finally { setBusy(false); }
  }

  async function handleStaffReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setFeedback("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("La sesión segura del staff no está disponible.");
      const response = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: "reset", username: resetTarget, password: resetPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "No se pudo restablecer la contraseña.");
      setFeedback("Contraseña restablecida y sesiones revocadas.");
      setResetPassword("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo restablecer la contraseña.");
    } finally { setBusy(false); }
  }

  const title = mode === "login" ? "Entrar al reino" : mode === "first-access" ? "Configura tu acceso" : "Restablecer contraseña";

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.section role="dialog" aria-modal="true" aria-labelledby="kingdoom-auth-title" className="w-full max-w-lg rounded-[2rem] border border-amber-400/25 bg-stone-950 p-6 text-stone-100 shadow-2xl shadow-black/60 sm:p-8" initial={{ opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-300/80">Kingdoom · acceso seguro</p><h2 id="kingdoom-auth-title" className="mt-2 text-2xl font-black">{title}</h2></div><button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-100"><X size={20} /></button></div>
          {mode === "login" && <form className="mt-7 space-y-4" onSubmit={handleLogin}><label className="block text-sm text-stone-300">Nombre de usuario<input className={`${field} mt-2`} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><label className="block text-sm text-stone-300">Contraseña<div className="relative mt-2"><input className={`${field} pr-12`} value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" required /><button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 text-stone-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label><label className="flex items-center gap-2 text-xs text-stone-300"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="accent-amber-400" />Recordar usuario</label><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-bold text-stone-950 disabled:opacity-60"><KeyRound size={17} />{busy ? "Verificando..." : "Entrar"}</button></form>}
          {mode === "first-access" && <form className="mt-7 space-y-4" onSubmit={handleFirstAccess}><p className="text-sm leading-6 text-stone-400">Pide tu código con <code className="text-amber-300">!codigo</code> en el chat privado del bot.</p><label className="block text-sm text-stone-300">Usuario<input className={`${field} mt-2`} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-stone-300">Nueva contraseña<input className={`${field} mt-2`} value={password} onChange={(event) => setPassword(event.target.value)} type="password" required /></label><label className="block text-sm text-stone-300">Repite la contraseña<input className={`${field} mt-2`} value={passwordRepeat} onChange={(event) => setPasswordRepeat(event.target.value)} type="password" required /></label></div><label className="block text-sm text-stone-300">Código WhatsApp<input className={`${field} mt-2 text-center tracking-[.4em]`} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required /></label><button disabled={busy} className="w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-stone-950 disabled:opacity-60">{busy ? "Activando..." : "Crear acceso"}</button></form>}
          {mode === "staff-reset" && <form className="mt-7 space-y-4" onSubmit={handleStaffReset}><div className="flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm text-cyan-100"><ShieldCheck size={18} />Solo administradores autenticados pueden usar esta acción.</div><label className="block text-sm text-stone-300">Usuario a restablecer<input className={`${field} mt-2`} value={resetTarget} onChange={(event) => setResetTarget(event.target.value)} required /></label><label className="block text-sm text-stone-300">Nueva contraseña temporal<input className={`${field} mt-2`} value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} type="password" minLength={8} required /></label><button disabled={busy} className="w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-stone-950 disabled:opacity-60">{busy ? "Guardando..." : "Restablecer contraseña"}</button></form>}
          {feedback && <p role="alert" className="mt-4 rounded-xl border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">{feedback}</p>}
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-stone-400"><button type="button" onClick={() => { setMode("login"); setFeedback(""); }}>Iniciar sesión</button><button type="button" onClick={() => { setMode("first-access"); setFeedback(""); }}>Primer acceso</button><button type="button" onClick={() => { setMode("staff-reset"); setFeedback(""); }}>Reset staff</button></div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
