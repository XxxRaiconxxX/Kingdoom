import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  Check,
  CircleAlert,
  Clock3,
  CreditCard,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { usePlayerSession } from "../context/PlayerSessionContext";
import type {
  BankInstallment,
  BankLoan,
  BankSnapshot,
} from "../types";
import {
  bankCreateLoan,
  bankDeposit,
  bankGetSnapshot,
  bankPayLoan,
  bankPayLoanEarly,
  bankWithdrawDeposit,
  createBankIdempotencyKey,
} from "../utils/bank";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const goldFormatter = new Intl.NumberFormat("es-PY");
const dateFormatter = new Intl.DateTimeFormat("es-PY", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatGold(value: number) {
  return `${goldFormatter.format(value)} oro`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function parseFormInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} debe ser un numero entero positivo.`);
  }
  return parsed;
}

function getBankErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "No se pudo completar la operacion del Banco.";
}

type BankerPose =
  | "idle"
  | "greeting"
  | "coins"
  | "deposit"
  | "withdraw"
  | "approved"
  | "rejected"
  | "payment"
  | "tap";

type BankEffect = "none" | "deposit" | "withdraw" | "approved" | "rejected" | "payment";

type BankAction = "deposit" | "withdraw" | "loan" | "payment" | "reputation" | "transactions";

const BANKER_DURATIONS: Record<BankerPose, number[]> = {
  idle: [140, 140, 140, 140, 140, 140],
  greeting: [110, 110, 140, 140, 110, 110],
  coins: [110, 110, 110, 110, 110, 110],
  deposit: [100, 110, 130, 160, 130, 120],
  withdraw: [100, 120, 160, 150, 130, 120],
  approved: [110, 120, 140, 170, 140, 120],
  rejected: [140, 140, 140, 140, 140, 140],
  payment: [120, 140, 160, 160, 140, 120],
  tap: [90, 100, 120, 120, 100, 90],
};

const BANKER_FILES = {
  background: `${import.meta.env.BASE_URL}img/banker-v3-background-sheet.png`,
  character: `${import.meta.env.BASE_URL}img/banker-v3-character-sheet.png`,
  props: `${import.meta.env.BASE_URL}img/banker-v3-props-sheet.png`,
};

const BANKER_COPY: Record<BankerPose, string> = {
  idle: "La bóveda vela por tu oro.",
  greeting: "Saludos, viajero. Bienvenido a la bóveda.",
  coins: "Contando tu oro...",
  deposit: "Depósito recibido y protegido.",
  withdraw: "Retiro preparado desde la caja fuerte.",
  approved: "Préstamo aprobado. Sello listo.",
  rejected: "La operación fue rechazada.",
  payment: "Cuota registrada en el libro.",
  tap: "Las llaves tintinean. ¿Qué necesitas?",
};

function BankerSprite({
  pose,
  effect = "none",
  loopEffect = false,
  onTap,
}: {
  pose: BankerPose;
  effect?: BankEffect;
  loopEffect?: boolean;
  onTap: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => document.visibilityState === "visible");
  const [isReducedMotion, setIsReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const row = { idle: 0, greeting: 1, coins: 2, deposit: 3, withdraw: 4, approved: 5, rejected: 6, payment: 7, tap: 8 }[pose];
  const duration = isReducedMotion ? 1500 : BANKER_DURATIONS[pose].reduce((total, frame) => total + frame, 0);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => setIsDocumentVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotion = () => setIsReducedMotion(media.matches);
    media.addEventListener("change", handleMotion);
    return () => media.removeEventListener("change", handleMotion);
  }, []);

  const isPlaying = isIntersecting && isDocumentVisible;
  const lastTapAtRef = useRef(0);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapAtRef.current < 1000) return;
    lastTapAtRef.current = now;
    onTap();
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTap();
    }
  };

  return (
    <div className="banker-v3-stage-wrap">
      <picture className="banker-v3-stage-backdrop" aria-hidden="true">
        <source media="(min-width: 768px)" srcSet={`${import.meta.env.BASE_URL}img/bank-hero-desktop.webp`} />
        <img src={`${import.meta.env.BASE_URL}img/bank-hero-mobile.webp`} width="1536" height="1024" alt="" draggable={false} />
      </picture>
      <div className="banker-v3-stage-backdrop-overlay" aria-hidden="true" />
      <style>{`
        .banker-v3-stage-wrap { position:relative; display:flex; min-height:320px; align-items:center; justify-content:center; overflow:hidden; isolation:isolate; border-radius:2rem; background:#050807; animation:bank-section-entry 300ms ease-out both; }
        .banker-v3-stage-backdrop, .banker-v3-stage-backdrop img, .banker-v3-stage-backdrop-overlay { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
        .banker-v3-stage-backdrop { z-index:0; overflow:hidden; }
        .banker-v3-stage-backdrop img { object-fit:cover; opacity:.25; filter:blur(6px); transform:scale(1.1); }
        .banker-v3-stage-backdrop-overlay { z-index:1; background:radial-gradient(ellipse at center, rgba(16,26,22,.48) 0%, rgba(5,9,8,.76) 68%, rgba(3,5,5,.94) 100%); }
        .banker-v3-stage { position:relative; width:256px; height:320px; flex:none; overflow:hidden; border:1px solid rgba(245,158,11,.25); border-radius:1.5rem; background:#09090b; box-shadow:0 18px 48px rgba(0,0,0,.35); image-rendering:pixelated; }
        .banker-v3-stage { z-index:2; }
        .banker-v3-layer { position:absolute; left:0; top:0; width:1536px; height:2880px; max-width:none; image-rendering:pixelated; user-select:none; pointer-events:none; }
        .banker-v3-row-1 .banker-v3-layer-animated { top:-320px; }
        .banker-v3-row-2 .banker-v3-layer-animated { top:-640px; }
        .banker-v3-row-3 .banker-v3-layer-animated { top:-960px; }
        .banker-v3-row-4 .banker-v3-layer-animated { top:-1280px; }
        .banker-v3-row-5 .banker-v3-layer-animated { top:-1600px; }
        .banker-v3-row-6 .banker-v3-layer-animated { top:-1920px; }
        .banker-v3-row-7 .banker-v3-layer-animated { top:-2240px; }
        .banker-v3-row-8 .banker-v3-layer-animated { top:-2560px; }
        .banker-v3-layer-animated { --banker-frame-shift:-1280px; animation:banker-v3-frames ${duration}ms steps(5,end) infinite; animation-play-state:paused; }
        .banker-v3-stage-live .banker-v3-layer-animated { animation-play-state:running; }
        @keyframes banker-v3-frames { from { transform:translate3d(0,0,0); } to { transform:translate3d(var(--banker-frame-shift),0,0); } }
        .banker-v3-stage:focus-visible { outline:2px solid #f6d365; outline-offset:4px; }
        .banker-v3-stage-effect { position:absolute; inset:0; z-index:3; pointer-events:none; overflow:hidden; border-radius:inherit; }
        .banker-v3-stage-effect.rejected { animation:bank-stage-shake 360ms ease-in-out; border:2px solid #c2415a; box-shadow:inset 0 0 22px rgba(194,65,90,.55); }
        .banker-v3-stage-effect.debug.rejected { animation-iteration-count:infinite; }
        .banker-effect-coin { position:absolute; top:var(--coin-start); width:8px; height:8px; border-radius:50%; background:#f6d365; box-shadow:0 0 10px 2px #f6d365; animation-name:bank-coin-fall; animation-duration:var(--coin-duration); animation-timing-function:ease-in; animation-delay:var(--coin-delay); animation-fill-mode:forwards; }
        .banker-v3-stage-effect.debug .banker-effect-coin { animation-iteration-count:infinite; }
        .banker-effect-withdraw { position:absolute; right:18%; top:47%; width:42%; height:18%; border-radius:50%; background:radial-gradient(ellipse, rgba(255,245,180,.95), rgba(246,211,101,.25) 45%, transparent 72%); animation:bank-safe-flash 650ms ease-out forwards; }
        .banker-effect-approved { position:absolute; right:19%; top:25%; width:58px; height:58px; border:4px solid #f6d365; border-radius:50%; color:#f6d365; font-size:36px; font-weight:900; line-height:48px; text-align:center; animation:bank-seal-pop 600ms cubic-bezier(.2,1.4,.4,1) forwards; }
        .banker-effect-payment { position:absolute; left:14%; right:14%; bottom:14%; height:5px; overflow:hidden; border-radius:99px; background:rgba(246,211,101,.2); }
        .banker-effect-payment::after { content:""; display:block; width:100%; height:100%; transform-origin:left; background:#f6d365; animation:bank-progress-fill 600ms ease-out forwards; }
        @keyframes bank-coin-fall { from { opacity:0; transform:translate3d(0,0,0) rotate(0); } 18% { opacity:1; } to { opacity:0; transform:translate3d(var(--coin-drift),var(--coin-drop),0) rotate(var(--coin-rotate)); } }
        @keyframes bank-safe-flash { from { opacity:0; transform:scale(.4); } 35% { opacity:1; } to { opacity:0; transform:scale(1.3); } }
        @keyframes bank-seal-pop { from { opacity:0; transform:scale(.2) rotate(-18deg); } 55% { opacity:1; } to { opacity:0; transform:scale(1.15) rotate(0); } }
        @keyframes bank-progress-fill { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes bank-stage-shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-3px); } 75% { transform:translateX(3px); } }
        .banker-dialogue { position:relative; border:2px solid #d8b45b; box-shadow:4px 0 #d8b45b, -4px 0 #d8b45b, 0 4px #d8b45b, 0 -4px #d8b45b; }
        .banker-dialogue::after { content:""; position:absolute; bottom:-10px; left:50%; width:12px; height:8px; transform:translateX(-50%); background:#0c0a09; border-right:2px solid #d8b45b; border-bottom:2px solid #d8b45b; }
        .banker-dialogue:focus-visible { outline:2px solid #f6d365; outline-offset:4px; }
        .bank-hero-action:focus-visible { outline:2px solid #f6d365; outline-offset:4px; }
        .bank-action-button { position:relative; min-height:48px; overflow:hidden; transform:translateY(0); animation:bank-action-enter 300ms ease-out var(--bank-action-delay) both; }
        .bank-action-button::after { content:""; position:absolute; inset:-30% auto -30% -45%; width:28%; transform:translateX(-220%) skewX(-18deg); background:rgba(255,248,210,.5); opacity:0; pointer-events:none; }
        .bank-action-button:hover, .bank-action-button:focus-visible { transform:translateY(-2px); border-color:#f6d365; box-shadow:0 0 18px rgba(246,211,101,.22); }
        .bank-action-button:hover::after, .bank-action-button:focus-visible::after { opacity:.8; animation:bank-action-sweep 500ms ease-out; }
        .bank-action-button:active { transform:translateY(0) scale(.97); }
        .bank-action-locked-shake { animation:bank-action-shake 300ms ease-in-out; }
        @keyframes bank-action-enter { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bank-action-sweep { to { transform:translateX(650%) skewX(-18deg); } }
        @keyframes bank-action-shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-4px); } 75% { transform:translateX(4px); } }
        .bank-rules-content { display:grid; grid-template-rows:0fr; transition:grid-template-rows 220ms ease, opacity 220ms ease; opacity:.7; }
        .bank-rules[open] .bank-rules-content { grid-template-rows:1fr; opacity:1; }
        .bank-rules-content > div { overflow:hidden; }
        .bank-rules-chevron { display:inline-block; margin-left:.5rem; transition:transform 220ms ease; }
        .bank-rules[open] .bank-rules-chevron { transform:rotate(180deg); }
        .bank-atmosphere-card { background-image:linear-gradient(135deg, rgba(8,15,13,.85), rgba(25,26,18,.85)), url('${import.meta.env.BASE_URL}img/bank-texture.webp'); background-position:center; background-repeat:no-repeat; background-size:cover; }
        @property --bank-count { syntax:"<integer>"; inherits:false; initial-value:0; }
        .bank-count-up { --bank-count:0; counter-reset:bank-count var(--bank-count); }
        .bank-count-up::before { content:counter(bank-count) " oro"; }
        .bank-count-up-fallback { display:none; }
        @keyframes bank-count-up { from { --bank-count:0; } to { --bank-count:var(--bank-count-target); } }
        .bank-count-up { animation:bank-count-up 600ms ease-out both; }
        .bank-main-card { container-type:inline-size; }
        .bank-horizontal-layout { display:flex; flex-direction:column; gap:0; }
        .bank-context-column { min-width:0; }
        .bank-action-grid { width:100%; }
        .banker-v3-stage-wrap { width:100%; }
        @container (min-width:760px) {
          .bank-horizontal-layout { display:grid; grid-template-columns:320px minmax(0,1fr); align-items:center; gap:28px; }
          .bank-horizontal-layout > .banker-v3-stage-wrap { width:320px; min-height:400px; }
          .bank-context-column { display:flex; flex-direction:column; justify-content:center; gap:24px; }
          .bank-context-column > .mt-5 { margin-top:0; }
          .bank-context-column .banker-dialogue { max-width:none; margin:0; }
          .bank-context-column .banker-dialogue::after { bottom:50%; left:-8px; transform:translateY(50%) rotate(45deg); border:0; border-left:2px solid #d8b45b; border-bottom:2px solid #d8b45b; }
        }
        .banker-v3-stage-wrap::before { content:""; position:absolute; inset:5% 10%; z-index:1; border-radius:50%; background:radial-gradient(ellipse at center, rgba(246,211,101,.24) 0%, rgba(75,146,110,.2) 34%, rgba(246,211,101,.06) 52%, transparent 76%); filter:blur(20px); opacity:.62; animation:bank-banker-breathe 6s ease-in-out infinite; pointer-events:none; }
        .banker-v3-stage-wrap::after { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit; background:radial-gradient(ellipse at center, rgba(8,16,13,.04) 0%, rgba(5,9,8,.5) 68%, rgba(0,0,0,.82) 100%); pointer-events:none; }
        @keyframes bank-section-entry { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bank-divider-shine { from { transform:translateX(0); } to { transform:translateX(650%); } }
        @keyframes bank-banker-breathe { 0%,100% { opacity:.4; transform:scale(.94); } 50% { opacity:.8; transform:scale(1.06); } }
        @media (prefers-reduced-motion:reduce) { .bank-action-button, .bank-action-button::after, .bank-rules-content, .bank-rules-chevron, .bank-count-up { animation:none; transition:none; } .bank-count-up::before { content:none; } .bank-count-up-fallback { display:inline; } }
        @media (min-width:768px) {
          .bank-hero { max-height:min(430px, 56.25vw); }
          .banker-v3-layer-animated { --banker-frame-shift:-1600px; }
          .banker-v3-stage-wrap { min-height:400px; }
          .banker-v3-stage { width:320px; height:400px; }
          .banker-v3-layer { width:1920px; height:3600px; }
          .banker-v3-row-1 .banker-v3-layer-animated { top:-400px; }
          .banker-v3-row-2 .banker-v3-layer-animated { top:-800px; }
          .banker-v3-row-3 .banker-v3-layer-animated { top:-1200px; }
          .banker-v3-row-4 .banker-v3-layer-animated { top:-1600px; }
          .banker-v3-row-5 .banker-v3-layer-animated { top:-2000px; }
          .banker-v3-row-6 .banker-v3-layer-animated { top:-2400px; }
          .banker-v3-row-7 .banker-v3-layer-animated { top:-2800px; }
          .banker-v3-row-8 .banker-v3-layer-animated { top:-3200px; }
        }
        @media (min-width:1280px) {
          .banker-v3-stage-wrap { min-height:400px; }
          .banker-v3-stage { width:320px; height:400px; }
          .banker-v3-layer { width:1920px; height:3600px; }
          .banker-v3-row-1 .banker-v3-layer-animated { top:-400px; }
          .banker-v3-row-2 .banker-v3-layer-animated { top:-800px; }
          .banker-v3-row-3 .banker-v3-layer-animated { top:-1200px; }
          .banker-v3-row-4 .banker-v3-layer-animated { top:-1600px; }
          .banker-v3-row-5 .banker-v3-layer-animated { top:-2000px; }
          .banker-v3-row-6 .banker-v3-layer-animated { top:-2400px; }
          .banker-v3-row-7 .banker-v3-layer-animated { top:-2800px; }
          .banker-v3-row-8 .banker-v3-layer-animated { top:-3200px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .banker-v3-layer-animated, .banker-v3-stage-effect, .banker-effect-coin, .banker-effect-withdraw, .banker-effect-approved, .banker-effect-payment { animation:none; }
          .banker-effect-coin, .banker-effect-withdraw, .banker-effect-approved, .banker-effect-payment { display:none; }
          .banker-v3-layer-animated { transform:translate3d(var(--banker-frame-shift),0,0); }
        }
      `}</style>
      <div
        ref={stageRef}
        role="button"
        tabIndex={0}
        aria-label="Banquero del reino. Activar reacción"
        className={`banker-v3-stage banker-v3-row-${row} ${isPlaying ? "banker-v3-stage-live" : ""}`}
        style={{ "--banker-row": 0 } as CSSProperties}
        onClick={handleTap}
        onKeyDown={handleKeyDown}
      >
        <img src={BANKER_FILES.background} alt="" aria-hidden="true" className="banker-v3-layer" draggable={false} />
        <img
          src={BANKER_FILES.character}
          alt=""
          aria-hidden="true"
          className="banker-v3-layer banker-v3-layer-animated"
          style={{ "--banker-row": row, transform: isReducedMotion ? "translate3d(var(--banker-frame-shift),0,0)" : undefined } as CSSProperties}
          data-frame-duration={duration}
          draggable={false}
        />
        <img
          src={BANKER_FILES.props}
          alt=""
          aria-hidden="true"
          className="banker-v3-layer banker-v3-layer-animated"
          style={{ "--banker-row": row, transform: isReducedMotion ? "translate3d(var(--banker-frame-shift),0,0)" : undefined } as CSSProperties}
          data-frame-duration={duration}
          draggable={false}
        />
        {effect !== "none" ? (
          <div className={`banker-v3-stage-effect ${effect === "rejected" ? "rejected" : ""} ${loopEffect ? "debug" : ""}`} aria-hidden="true">
            {effect === "deposit" ? Array.from({ length: 10 }, (_, index) => <i key={index} className="banker-effect-coin" style={{ left: `${6 + ((index * 17) % 86)}%`, "--coin-start": `${-12 - (index % 4) * 4}%`, "--coin-drift": `${(index % 2 ? 1 : -1) * (10 + (index % 5) * 7)}px`, "--coin-drop": `${220 + (index % 4) * 32}px`, "--coin-rotate": `${180 + index * 37}deg`, "--coin-delay": `${(index % 4) * 45}ms`, "--coin-duration": `${650 + (index % 3) * 90}ms` } as CSSProperties} />) : null}
            {effect === "withdraw" ? <i className="banker-effect-withdraw" /> : null}
            {effect === "approved" ? <i className="banker-effect-approved">✓</i> : null}
            {effect === "payment" ? <i className="banker-effect-payment" /> : null}
          </div>
        ) : null}

      </div>
    </div>
  );
}

const BANK_ACTIONS: Array<{ key: BankAction; label: string; icon: typeof Landmark }> = [
  { key: "deposit", label: "Depositar", icon: ArrowDownLeft },
  { key: "withdraw", label: "Retirar", icon: ArrowUpRight },
  { key: "loan", label: "Pedir préstamo", icon: CreditCard },
  { key: "payment", label: "Pagar cuotas", icon: Check },
  { key: "reputation", label: "Reputación", icon: Sparkles },
  { key: "transactions", label: "Movimientos", icon: ReceiptText },
];

function BankActionGrid({
  locked,
  onAction,
}: {
  locked: boolean;
  onAction: (action: BankAction) => void;
}) {
  const [shaking, setShaking] = useState<BankAction | null>(null);
  const shakeTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
  }, []);

  const handleAction = (key: BankAction) => {
    if (locked) {
      setShaking(key);
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = window.setTimeout(() => setShaking(null), 300);
    }
    onAction(key);
  };

  return (
    <div className="bank-action-grid grid grid-cols-2 gap-3" role="group" aria-label="Acciones del Banco">
      {BANK_ACTIONS.map(({ key, label, icon: Icon }, index) => (
        <button
          key={key}
          type="button"
          data-bank-action={key}
          className={`bank-action-button inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-950/70 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-stone-200 transition hover:border-amber-300/60 hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 ${shaking === key ? "bank-action-locked-shake" : ""}`}
          style={{ "--bank-action-delay": `${index * 60}ms` } as CSSProperties}
          aria-disabled={locked}
          onClick={() => handleAction(key)}
        >
          {locked ? <LockKeyhole aria-hidden="true" className="h-4 w-4 text-amber-300" /> : <Icon aria-hidden="true" className="h-4 w-4 text-amber-300" />}
          {label}
        </button>
      ))}
    </div>
  );
}

function BankMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "amber",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Landmark;
  tone?: "amber" | "emerald" | "cyan" | "rose";
}) {
  const toneClasses = {
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  }[tone];
  return (
    <article className="rounded-[1.35rem] border border-stone-800 bg-stone-950/55 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400">{label}</p>
        <span className={`rounded-xl border p-2 ${toneClasses}`}><Icon aria-hidden="true" className="h-4 w-4" /></span>
      </div>
      <p key={value} className="mt-4 bank-count-up text-xl font-black tracking-tight text-stone-100" aria-label={value} style={{ "--bank-count-target": Number(value.replace(/[^0-9]/g, "")) || 0 } as CSSProperties}>
        <span className="bank-count-up-fallback">{value}</span>
      </p>
      <p className="mt-1 text-xs leading-5 text-stone-500">{detail}</p>
    </article>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "quiet" | "danger";
  type?: "button" | "submit";
}) {
  const variants = {
    primary: "border-amber-400/35 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25",
    quiet: "border-stone-700 bg-stone-900/80 text-stone-200 hover:bg-stone-800",
    danger: "border-rose-400/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-50 ${variants}`}
    >
      {children}
    </button>
  );
}

function operationLabel(type: BankSnapshot["transactions"][number]["operationType"]) {
  return {
    deposit: "Depósito protegido",
    withdrawal: "Retiro de depósito",
    interest_credit: "Interés acreditado",
    loan_disbursement: "Préstamo recibido",
    loan_payment: "Cuota pagada",
    loan_early_payment: "Liquidación anticipada",
  }[type];
}

function loanStatusLabel(status: BankLoan["status"]) {
  return {
    active: "Activo",
    in_mora: "En mora",
    paid: "Liquidado",
    cancelled: "Cancelado",
  }[status];
}

function installmentStatusLabel(status: BankInstallment["status"]) {
  return {
    scheduled: "Programada",
    paid: "Pagada",
    in_mora: "En mora",
    cancelled: "Cancelada",
  }[status];
}

function LoanCard({
  loan,
  installments,
  pendingAction,
  onPay,
  onPayEarly,
}: {
  loan: BankLoan;
  installments: BankInstallment[];
  pendingAction: string;
  onPay: (loan: BankLoan, count: number) => void;
  onPayEarly: (loan: BankLoan) => void;
}) {
  const unpaidInstallments = installments.filter((item) => item.status === "scheduled" || item.status === "in_mora");
  const dueInstallments = unpaidInstallments.filter((item) => new Date(item.dueAt).getTime() <= Date.now());
  const nextInstallment = unpaidInstallments[0];
  const isPending = pendingAction.startsWith(`loan:${loan.id}`);

  return (
    <article className="rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard aria-hidden="true" className="h-4 w-4 text-cyan-300" />
            <h3 className="font-bold text-stone-100">Préstamo de {formatGold(loan.principalGold)}</h3>
          </div>
          <p className="mt-2 text-xs text-stone-500">Abierto {formatDate(loan.createdAt)} · {loan.termMonths} meses · APR {(loan.aprBps / 100).toFixed(2)}%</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${loan.status === "in_mora" ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}>
          {loanStatusLabel(loan.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div><p className="text-xs text-stone-500">Saldo pendiente</p><p className="mt-1 font-bold text-stone-100">{formatGold(loan.outstandingDueGold)}</p></div>
        <div><p className="text-xs text-stone-500">Total pactado</p><p className="mt-1 font-bold text-stone-100">{formatGold(loan.totalDueGold)}</p></div>
        <div><p className="text-xs text-stone-500">Cuotas</p><p className="mt-1 font-bold text-stone-100">{loan.paidInstallments}/{loan.termMonths} pagadas</p></div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-800" aria-label={`${loan.paidInstallments} de ${loan.termMonths} cuotas pagadas`} role="progressbar" aria-valuemin={0} aria-valuemax={loan.termMonths} aria-valuenow={loan.paidInstallments}>
        <span className="bank-loan-progress block h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, (loan.paidInstallments / loan.termMonths) * 100)}%`, transition: "width 600ms ease-out" }} />
      </div>

      {nextInstallment ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-stone-800 bg-stone-900/70 p-3">
          <CalendarClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div className="min-w-0 text-xs leading-5">
            <p className="font-bold text-stone-200">Próxima cuota: {formatGold(nextInstallment.amountDueGold)}</p>
            <p className="text-stone-500">{installmentStatusLabel(nextInstallment.status)} · vence {formatDate(nextInstallment.dueAt)}</p>
          </div>
        </div>
      ) : null}

      {loan.status === "active" || loan.status === "in_mora" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {dueInstallments.length > 0 ? (
            <ActionButton
              disabled={Boolean(pendingAction)}
              onClick={() => onPay(loan, 1)}
            >
              {isPending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Check aria-hidden="true" className="h-4 w-4" />}
              Pagar cuota vencida
            </ActionButton>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-stone-800 px-3 py-2 text-xs text-stone-500"><Clock3 aria-hidden="true" className="h-4 w-4" />Sin cuotas vencidas</span>
          )}
          <ActionButton variant="danger" disabled={Boolean(pendingAction)} onClick={() => onPayEarly(loan)}>
            <TrendingUp aria-hidden="true" className="h-4 w-4" /> Liquidar anticipadamente
          </ActionButton>
        </div>
      ) : null}
    </article>
  );
}

function BankLoadingSkeleton() {
  return (
    <section className="space-y-5" aria-busy="true" aria-label="Cargando Banco">
      <SectionHeader eyebrow="Banco de Kingdoom" title="El tesoro bajo sello" description="La bóveda está preparando tu acceso seguro." />
      <div className="bank-atmosphere-card kd-glass rounded-[2rem] border border-amber-500/20 bg-stone-900/75 p-4 sm:p-6">
        <div className="flex min-h-[320px] items-center justify-center md:min-h-[400px]">
          <div className="flex h-[320px] w-64 items-center justify-center rounded-[1.5rem] border border-amber-500/20 bg-stone-950/70 text-center text-sm font-bold text-amber-100 shadow-[0_18px_48px_rgba(0,0,0,.35)] md:h-[400px] md:w-80">
            <span role="status">Abriendo la bóveda...</span>
          </div>
        </div>
        <div className="mx-auto mt-3 h-12 max-w-md rounded-xl border-2 border-amber-500/20 bg-stone-950/60" aria-hidden="true" />
        <div className="mt-5 grid grid-cols-2 gap-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="min-h-12 rounded-xl border border-stone-800 bg-stone-950/50" />)}
        </div>
      </div>
    </section>
  );
}

function BankHero({ description }: { description: string }) {
  const heroRef = useRef<HTMLElement>(null);
  const particles = useMemo(() => Array.from({ length: 20 }, (_, index) => ({
    left: 8 + Math.random() * 84,
    size: 3 + Math.random() * 4,
    delay: Math.random() * -12,
    duration: 6 + Math.random() * 8,
    tone: index % 5 === 0 ? "emerald" : "gold",
  })), []);
  const [isVisible, setIsVisible] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => document.visibilityState === "visible");
  const [heroImageReady, setHeroImageReady] = useState(false);
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    const onVisibility = () => setIsDocumentVisible(document.visibilityState === "visible");
    const onScroll = () => node.style.setProperty("--bank-hero-parallax", `${Math.max(-8, Math.min(8, window.scrollY * -0.04))}px`);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToBanker = () => document.querySelector<HTMLElement>(".banker-v3-stage")?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <header ref={heroRef} className={`bank-hero ${isVisible && isDocumentVisible ? "bank-hero-live" : ""}`}>
      <style>{`
        .bank-hero { position:relative; isolation:isolate; min-height:430px; overflow:hidden; border:1px solid rgba(216,181,91,.42); border-radius:22px; background:#0a1210; }
        .bank-hero { animation:bank-section-entry 300ms ease-out both; }
        .bank-hero picture, .bank-hero-art, .bank-hero-fallback, .bank-hero-overlay { position:absolute; inset:0; width:100%; height:100%; }
        .bank-hero picture { z-index:0; }
        .bank-hero-art { z-index:0; object-fit:cover; object-position:70% center; opacity:0; transform:translate3d(0,var(--bank-hero-parallax,0),0); transition:opacity 180ms ease; }
        .bank-hero-art.is-ready { opacity:1; }
        .bank-hero-fallback { z-index:0; background:radial-gradient(circle at 78% 30%, rgba(246,211,101,.5), transparent 27%), radial-gradient(ellipse at 75% 58%, rgba(42,122,87,.55), transparent 42%), linear-gradient(135deg, #050807 0%, #10231d 58%, #5b431d 100%); transition:opacity 180ms ease, visibility 180ms ease; }
        .bank-hero-fallback.is-hidden { visibility:hidden; opacity:0; }
        .bank-hero-fallback::before { content:""; position:absolute; right:10%; top:15%; width:min(34%, 250px); aspect-ratio:1; border:8px solid rgba(216,181,91,.34); border-radius:50%; background:radial-gradient(circle, rgba(246,211,101,.25) 0 8%, transparent 9% 25%, rgba(12,24,20,.7) 26% 54%, rgba(216,181,91,.28) 55% 58%, transparent 59%); box-shadow:0 0 42px rgba(246,211,101,.28), inset 0 0 24px rgba(0,0,0,.8); opacity:.9; }
        .bank-hero-fallback::after { content:""; position:absolute; inset:0; background:repeating-linear-gradient(90deg, transparent 0 12%, rgba(216,181,91,.12) 12.5% 14%, transparent 14.5% 25%), linear-gradient(0deg, rgba(0,0,0,.4), transparent 50%); mask-image:linear-gradient(90deg, #000 0 62%, transparent 94%); opacity:.42; }
        .bank-hero-overlay { z-index:0; background:linear-gradient(90deg, rgba(5,8,7,.97), rgba(5,8,7,.78) 43%, rgba(5,8,7,.12) 88%), linear-gradient(0deg, rgba(5,8,7,.9), transparent 52%); }
        .bank-section-divider { position:absolute; right:5%; bottom:0; left:5%; height:1px; overflow:hidden; background:linear-gradient(90deg, transparent, rgba(246,211,101,.8), transparent); }
        .bank-section-divider::after { content:""; position:absolute; inset:0 auto 0 -20%; width:20%; background:#fff4c2; box-shadow:0 0 12px 3px #f6d365; animation:bank-divider-shine 900ms ease-out 300ms both; }
        .bank-hero-lights { position:absolute; inset:0; z-index:1; overflow:hidden; pointer-events:none; }
        .bank-hero-particle { position:absolute; left:var(--particle-left); bottom:-8%; width:var(--particle-size); height:var(--particle-size); border-radius:999px; opacity:.45; transform:translate3d(0,0,0); animation-name:bank-hero-particle; animation-duration:var(--particle-duration); animation-timing-function:ease-in-out; animation-delay:var(--particle-delay); animation-iteration-count:infinite; animation-play-state:paused; }
        .bank-hero-particle-gold { background:#ffd27a; box-shadow:0 0 18px 5px rgba(255,210,122,.82); }
        .bank-hero-particle-emerald { background:#78d79c; box-shadow:0 0 18px 5px rgba(93,185,119,.82); }
        .bank-hero-lights-live .bank-hero-particle { animation-play-state:running; }
        @keyframes bank-hero-particle { 0%,100% { opacity:.35; transform:translate3d(0,8px,0) scale(.8); } 45% { opacity:1; transform:translate3d(12px,-110%,0) scale(1.2); } 75% { opacity:.55; transform:translate3d(-8px,-170%,0) scale(.75); } }
        .bank-hero-copy { position:relative; z-index:2; max-width:650px; padding:3rem; color:#f4eee0; }
        .bank-hero-eyebrow { display:flex; align-items:center; gap:.5rem; margin:0 0 1rem; color:#e8d79d; font-size:.75rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
        .bank-hero-eyebrow svg { width:1.1rem; height:1.1rem; color:#f6d365; }
        .bank-hero h1 { margin:0; color:#fff8e8; font-size:clamp(2.4rem,5vw,4.8rem); line-height:1.02; text-shadow:0 3px 20px rgba(0,0,0,.75); }
        .bank-hero-copy > p:not(.bank-hero-eyebrow) { max-width:520px; margin-top:1.25rem; color:#f1ead9; font-size:.95rem; line-height:1.8; text-shadow:0 2px 12px rgba(0,0,0,.85); }
        .bank-hero-action { display:inline-flex; min-height:48px; align-items:center; margin-top:1.5rem; border:1px solid rgba(246,211,101,.7); border-radius:.8rem; background:rgba(14,24,19,.82); padding:.75rem 1rem; color:#fff4ce; font-size:.75rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; transition:transform 180ms, box-shadow 180ms, background 180ms; }
        .bank-hero-action:hover, .bank-hero-action:focus-visible { transform:translateY(-2px); background:rgba(246,211,101,.16); box-shadow:0 0 24px rgba(246,211,101,.25); }
        .bank-hero-action:focus-visible { outline:2px solid #f6d365; outline-offset:4px; }
        @media (min-width:768px) { .bank-hero { min-height:0; height:320px; max-height:min(320px, 56.25vw); } .bank-hero-copy { padding:2rem; } .bank-hero h1 { font-size:clamp(2rem,4vw,3rem); } .bank-hero-copy > p:not(.bank-hero-eyebrow) { margin-top:.8rem; line-height:1.5; } .bank-hero-action { margin-top:1rem; } }
        @media (max-width:767px) { .bank-hero { display:flex; align-items:flex-end; min-height:380px; max-height:380px; border-radius:17px; } .bank-hero-copy { align-self:flex-end; padding:1.2rem 1rem; } .bank-hero h1 { font-size:clamp(2rem,10vw,3rem); } .bank-hero-copy > p:not(.bank-hero-eyebrow) { margin-top:.75rem; font-size:.82rem; line-height:1.55; } .bank-hero-action { margin-top:1rem; } .bank-hero-art { object-position:70% 20%; } .bank-hero-particle:nth-child(n+13) { display:none; } }
        @media (prefers-reduced-motion:reduce) { .bank-hero-action, .bank-hero-particle, .bank-hero, .bank-hero-art, .bank-section-divider, .banker-v3-stage-wrap::before { animation:none; transition:none; } .bank-hero-art { transform:none; } .bank-hero-particle { opacity:.2; } }
        @media (prefers-reduced-motion:reduce) { .bank-hero-action { transition:none; } }
      `}</style>
      <picture>
        <source media="(min-width: 768px)" srcSet={`${import.meta.env.BASE_URL}img/bank-hero-desktop.webp`} />
        <img
          className={`bank-hero-art ${heroImageReady && !heroImageFailed ? "is-ready" : ""}`}
          src={`${import.meta.env.BASE_URL}img/bank-hero-mobile.webp`}
          width="1536"
          height="1024"
          alt="Bóveda-tesoro subterránea de piedra negra con puerta circular dorada entreabierta"
          decoding="async"
          onLoad={() => { setHeroImageReady(true); setHeroImageFailed(false); }}
          onError={() => { setHeroImageReady(false); setHeroImageFailed(true); }}
        />
      </picture>
      <div className={`bank-hero-fallback ${heroImageReady && !heroImageFailed ? "is-hidden" : ""}`} aria-hidden="true" hidden={heroImageReady && !heroImageFailed} />
      <div className={`bank-hero-lights ${isVisible && isDocumentVisible ? "bank-hero-lights-live" : ""}`} aria-hidden="true">
        {particles.map((particle, index) => (
          <i
            key={index}
            className={`bank-hero-particle bank-hero-particle-${particle.tone}`}
            style={{ "--particle-left": `${particle.left}%`, "--particle-size": `${particle.size}px`, "--particle-delay": `${particle.delay}s`, "--particle-duration": `${particle.duration}s` } as CSSProperties}
          />
        ))}
      </div>
      <div className="bank-hero-overlay" aria-hidden="true" />
      <div className="bank-hero-copy">
        <p className="bank-hero-eyebrow"><Landmark aria-hidden="true" /> Banco de Kingdoom</p>
        <h1>El tesoro bajo sello</h1>
        <p>{description}</p>
        <button type="button" className="bank-hero-action" onClick={scrollToBanker}>Conocer la bóveda</button>
      </div>
      <div className="bank-section-divider" aria-hidden="true" />
    </header>
  );
}

export function BankSection() {
  const { player, isHydrating, isSecureSessionReady, isPlayerSecureLinked } = usePlayerSession();
  const [snapshot, setSnapshot] = useState<BankSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const pendingActionRef = useRef(false);
  const [bankerPose, setBankerPose] = useState<BankerPose>("idle");
  const [bankerMessage, setBankerMessage] = useState(BANKER_COPY.idle);
  const [bankerEffect, setBankerEffect] = useState<BankEffect>("none");
  const [visitorNeedsConnect, setVisitorNeedsConnect] = useState(false);
  const [poseQueueVersion, setPoseQueueVersion] = useState(0);
  const poseQueueRef = useRef<Array<{ pose: BankerPose; message: string }>>([]);
  const poseBusyRef = useRef(false);
  const currentPoseRef = useRef<BankerPose>("idle");
  const poseTimerRef = useRef<number | null>(null);
  const effectTimerRef = useRef<number | null>(null);
  const greetedRef = useRef(false);
  const [depositAmount, setDepositAmount] = useState("300");
  const [withdrawAmount, setWithdrawAmount] = useState("300");
  const [loanAmount, setLoanAmount] = useState("250");
  const [loanTerm, setLoanTerm] = useState("3");

  const canOperate = Boolean(
    player &&
      !isHydrating &&
      isSecureSessionReady &&
      isPlayerSecureLinked &&
      UUID_PATTERN.test(player.id),
  );


  const triggerBankerEffect = useCallback((effect: BankEffect) => {
    if (effect === "none") return;
    setBankerEffect(effect);
    if (effectTimerRef.current !== null) window.clearTimeout(effectTimerRef.current);
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(effect === "rejected" ? 60 : 30);
    } catch {
      // Vibration is optional and unavailable in some browsers.
    }
    effectTimerRef.current = window.setTimeout(() => setBankerEffect("none"), 760);
  }, []);

  const enqueueBankerPose = useCallback((pose: BankerPose, message = BANKER_COPY[pose]) => {
    const next = { pose, message };
    if (pose !== "coins" && currentPoseRef.current === "coins") {
      poseQueueRef.current = [next];
      poseBusyRef.current = false;
      setPoseQueueVersion((current) => current + 1);
      return;
    }
    if (pose !== "coins" && poseQueueRef.current[0]?.pose === "coins") {
      poseQueueRef.current[0] = next;
    } else if (!poseBusyRef.current || poseQueueRef.current.length === 0) {
      poseQueueRef.current.push(next);
    } else {
      return;
    }
    setPoseQueueVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (poseBusyRef.current || poseQueueRef.current.length === 0) return;
    const next = poseQueueRef.current.shift();
    if (!next) return;
    poseBusyRef.current = true;
    currentPoseRef.current = next.pose;
    setBankerPose(next.pose);
    setBankerMessage(next.message);
    if (next.pose === "coins") return;
    if (poseTimerRef.current !== null) window.clearTimeout(poseTimerRef.current);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1500
      : BANKER_DURATIONS[next.pose].reduce((total, frame) => total + frame, 0);
    poseTimerRef.current = window.setTimeout(() => {
      poseBusyRef.current = false;
      currentPoseRef.current = "idle";
      setBankerPose("idle");
      setBankerMessage(BANKER_COPY.idle);
      setPoseQueueVersion((current) => current + 1);
    }, duration + 80);
  }, [poseQueueVersion]);

  useEffect(() => () => {
    if (poseTimerRef.current !== null) window.clearTimeout(poseTimerRef.current);
    if (effectTimerRef.current !== null) window.clearTimeout(effectTimerRef.current);
  }, []);

  useEffect(() => {
    if (isHydrating || greetedRef.current || (import.meta.env.DEV && new URLSearchParams(window.location.search).has("bankerDebug"))) return;
    greetedRef.current = true;
    enqueueBankerPose("greeting");
  }, [enqueueBankerPose, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    let timer = 0;
    const scheduleMicroLife = () => {
      timer = window.setTimeout(() => {
        const stage = document.querySelector<HTMLElement>(".banker-v3-stage");
        const rect = stage?.getBoundingClientRect();
        const isCharacterVisible = Boolean(rect && rect.bottom > 0 && rect.top < window.innerHeight);
        if (isCharacterVisible && document.visibilityState === "visible" && !poseBusyRef.current && pendingActionRef.current === false) {
          // ponytail: reuse the existing book pose instead of adding a tenth sprite row.
          enqueueBankerPose("payment", "Hojeo el libro y reviso la bóveda.");
        }
        scheduleMicroLife();
      }, 8000 + Math.random() * 7000);
    };
    scheduleMicroLife();
    return () => window.clearTimeout(timer);
  }, [enqueueBankerPose, isHydrating]);

  const refreshSnapshot = useCallback(async () => {
    if (!canOperate || !player) {
      setSnapshot(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      setSnapshot(await bankGetSnapshot(player.id));
    } catch (loadError) {
      setSnapshot(null);
      setError(getBankErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [canOperate, player]);

  useEffect(() => {
    setFeedback("");
    void refreshSnapshot();
  }, [refreshSnapshot]);

  async function runAction(
    action: string,
    operation: () => Promise<{ message: string }>,
    successPose: BankerPose,
  ) {
    if (pendingActionRef.current) return;
    pendingActionRef.current = true;
    setPendingAction(action);
    setError("");
    setFeedback("");
    enqueueBankerPose("coins");
    try {
      const result = await operation();
      setFeedback(result.message);
      triggerBankerEffect(successPose === "deposit" || successPose === "withdraw" || successPose === "approved" || successPose === "payment" ? successPose : "none");
      enqueueBankerPose(successPose, result.message);
      await refreshSnapshot();
    } catch (operationError) {
      const message = getBankErrorMessage(operationError);
      setError(message);
      triggerBankerEffect("rejected");
      enqueueBankerPose("rejected", message);
    } finally {
      pendingActionRef.current = false;
      setPendingAction("");
    }
  }

  function handleDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!player) return;
    try {
      const amount = parseFormInteger(depositAmount, "El deposito");
      void runAction("deposit", () =>
        bankDeposit(player.id, amount, createBankIdempotencyKey("deposit")),
        "deposit",
      );
    } catch (validationError) {
      const message = getBankErrorMessage(validationError);
      setError(message);
      triggerBankerEffect("rejected");
      enqueueBankerPose("rejected", message);
    }
  }

  function handleWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!player) return;
    try {
      const amount = parseFormInteger(withdrawAmount, "El retiro");
      if (!window.confirm(`Vas a retirar ${formatGold(amount)} del deposito protegido. ¿Confirmas?`)) return;
      void runAction("withdraw", () =>
        bankWithdrawDeposit(player.id, amount, createBankIdempotencyKey("withdraw")),
        "withdraw",
      );
    } catch (validationError) {
      const message = getBankErrorMessage(validationError);
      setError(message);
      triggerBankerEffect("rejected");
      enqueueBankerPose("rejected", message);
    }
  }

  function handleCreateLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!player) return;
    try {
      const amount = parseFormInteger(loanAmount, "El prestamo");
      const term = parseFormInteger(loanTerm, "El plazo");
      if (!window.confirm(`Vas a solicitar ${formatGold(amount)} a ${term} meses. ¿Confirmas la solicitud?`)) return;
      void runAction("create-loan", () =>
        bankCreateLoan(player.id, amount, term, createBankIdempotencyKey("create-loan")),
        "approved",
      );
    } catch (validationError) {
      const message = getBankErrorMessage(validationError);
      setError(message);
      triggerBankerEffect("rejected");
      enqueueBankerPose("rejected", message);
    }
  }

  function handlePayLoan(loan: BankLoan, count: number) {
    if (!player) return;
    void runAction(`loan:${loan.id}:pay`, () =>
      bankPayLoan(player.id, loan.id, count, createBankIdempotencyKey("pay-loan")),
      "payment",
    );
  }

  function handlePayLoanEarly(loan: BankLoan) {
    if (!player) return;
    if (!window.confirm(`La liquidacion anticipada de este prestamo cobrara el saldo calculado hoy y eliminara intereses futuros. ¿Confirmas?`)) return;
    void runAction(`loan:${loan.id}:early`, () =>
      bankPayLoanEarly(player.id, loan.id, createBankIdempotencyKey("pay-loan-early")),
      "payment",
    );
  }

  const nextInstallment = useMemo(() => {
    if (!snapshot) return null;
    return snapshot.installments
      .filter((item) => item.status === "scheduled" || item.status === "in_mora")
      .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())[0] ?? null;
  }, [snapshot]);


  function focusBankPanel(panel: BankAction) {
    if (panel === "reputation" || panel === "transactions") {
      const target = document.querySelector<HTMLElement>(`[data-bank-panel="${panel}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
      return;
    }
    const target = document.querySelector<HTMLElement>(`[data-bank-panel="${panel}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = target?.querySelector<HTMLElement>("input, select, button");
    focusable?.focus({ preventScroll: true });
  }

  function handleBankAction(panel: BankAction) {
    focusBankPanel(panel);
  }

  function handleVisitorAction() {
    setVisitorNeedsConnect(true);
    setBankerMessage("Vincula tu perfil para operar");
    enqueueBankerPose("tap", "Vincula tu perfil para operar");
  }

  function handleConnectClick() {
    const profile = document.querySelector<HTMLElement>("[data-profile-tools]");
    profile?.scrollIntoView({ behavior: "smooth", block: "center" });
    profile?.querySelector<HTMLButtonElement>(".realm-entry-button")?.click();
  }

  const debugPose = import.meta.env.DEV
    ? (() => {
        const requested = new URLSearchParams(window.location.search).get("bankerDebug");
        const aliases: Record<string, BankerPose> = {
          saludo: "greeting",
          contar: "coins",
          deposito: "deposit",
          retiro: "withdraw",
          aprobado: "approved",
          rechazado: "rejected",
          pago: "payment",
          tap: "tap",
        };
        return requested ? aliases[requested] ?? null : null;
      })()
    : null;

  const debugEffect: BankEffect = debugPose === "deposit" || debugPose === "withdraw" || debugPose === "approved" || debugPose === "rejected" || debugPose === "payment" ? debugPose : "none";
  const activeBankerEffect = debugEffect !== "none" ? debugEffect : bankerEffect;
  const bankerDisplayMessage = debugPose ? BANKER_COPY[debugPose] : visitorNeedsConnect ? "Vincula tu perfil para operar" : bankerMessage;

  if (isHydrating) return <BankLoadingSkeleton />;

  if (!player || !canOperate) {
    return (
      <section className="space-y-5">
        <BankHero description="Conoce la bóveda y sus reglas. Vincula un perfil para operar sin exponer saldos en modo visitante." />
        <div className="bank-atmosphere-card bank-main-card kd-glass rounded-[2rem] border border-amber-500/20 bg-stone-900/75 p-4 sm:p-6">
          <div className="bank-horizontal-layout">
            <BankerSprite pose={debugPose ?? bankerPose} effect={activeBankerEffect} loopEffect={debugEffect !== "none"} onTap={handleVisitorAction} />
            <div className="bank-context-column">
              <div className="flex flex-wrap items-center justify-center gap-3 banker-dialogue rounded-xl bg-stone-950/80 px-4 py-3 text-center text-sm text-amber-100" aria-live="polite">
                <span>{bankerDisplayMessage}</span>
                {visitorNeedsConnect ? (
                  <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-amber-300/15 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-amber-100 hover:bg-amber-300/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300" onClick={handleConnectClick}>
                    <LockKeyhole aria-hidden="true" className="h-4 w-4" /> Conectar
                  </button>
                ) : null}
              </div>
              <div className="mt-5"><BankActionGrid locked onAction={handleVisitorAction} /></div>
              <div className="mt-5 rounded-2xl border border-stone-800 bg-stone-950/45 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">Modo lectura</p>
                <p className="mt-2 text-sm leading-6 text-stone-400">Las operaciones requieren un perfil vinculado a una sesión segura. Aquí no se muestran saldos ni datos de cuenta.</p>
              </div>
            </div>
          </div>
        </div>
        <details className="bank-atmosphere-card bank-rules rounded-[2rem] border border-stone-800 bg-stone-900/70 p-5">
          <summary className="cursor-pointer list-none font-black text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">Reglas del Banco <span className="bank-rules-chevron" aria-hidden="true">⌄</span></summary>
          <div className="bank-rules-content"><div><ul className="mt-4 space-y-3 text-sm leading-6 text-stone-400">
            <li>El depósito mínimo es de 300 de oro y su principal protegido llega hasta 25.000.</li>
            <li>El depósito acumula interés; el saldo disponible y el depósito protegido se muestran por separado.</li>
            <li>Los préstamos parten de 250 de oro, con plazos de 3, 6 o 12 meses y límite de exposición.</li>
            <li>La reputación mejora con pagos puntuales y condiciona tu APR futuro.</li>
          </ul></div></div>
        </details>
      </section>
    );
  }

  if (isLoading && !snapshot) {
    return <BankLoadingSkeleton />;
  }

  if (error && !snapshot) {
    return <section className="space-y-5"><SectionHeader eyebrow="Banco de Kingdoom" title="El libro mayor no responde" /><div role="alert" className="rounded-[1.5rem] border border-rose-400/30 bg-rose-400/10 p-5 text-sm leading-6 text-rose-100"><div className="flex items-start gap-3"><CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><div><p>{error}</p><ActionButton variant="quiet" onClick={() => void refreshSnapshot()}><RefreshCw aria-hidden="true" className="h-4 w-4" /> Reintentar</ActionButton></div></div></div></section>;
  }

  if (!snapshot) return null;

  const activeLoans = snapshot.loans.filter((loan) => loan.status === "active" || loan.status === "in_mora");
  const creditTierLabel = ["Iniciado", "Custodio", "Patrono"][snapshot.account.creditTier] ?? "Iniciado";

  return (
    <section className="space-y-5">
      <BankHero description="Tu bóveda, crédito y movimientos en un solo libro mayor. Cada RPC del Banco vuelve a validar la operación en el servidor." />
      <div className="flex justify-end"><ActionButton variant="quiet" disabled={Boolean(pendingAction) || isLoading} onClick={() => void refreshSnapshot()}><RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Actualizar</ActionButton></div>

      <div className="bank-atmosphere-card bank-main-card kd-glass rounded-[2rem] border border-amber-500/20 bg-stone-900/75 p-4 sm:p-6">
        <div className="bank-horizontal-layout">
          <BankerSprite pose={debugPose ?? bankerPose} effect={activeBankerEffect} loopEffect={debugEffect !== "none"} onTap={() => enqueueBankerPose("tap")} />
          <div className="bank-context-column">
            <div className="banker-dialogue rounded-xl bg-stone-950/80 px-4 py-3 text-center text-sm text-amber-100" aria-live="polite">{bankerDisplayMessage}</div>
            <div className="mt-5"><BankActionGrid onAction={handleBankAction} locked={false} /></div>
          </div>
        </div>
      </div>

      <details className="bank-atmosphere-card bank-rules rounded-[2rem] border border-stone-800 bg-stone-900/70 p-5">
        <summary className="cursor-pointer list-none font-black text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">Reglas del Banco <span className="bank-rules-chevron" aria-hidden="true">⌄</span></summary>
        <div className="bank-rules-content"><div><ul className="mt-4 grid gap-3 text-sm leading-6 text-stone-400 sm:grid-cols-2">
          <li>El depósito mínimo es de 300 de oro y su principal protegido llega hasta 25.000.</li>
          <li>El depósito acumula interés y se mantiene separado del saldo disponible.</li>
          <li>Los préstamos parten de 250 de oro, con plazos de 3, 6 o 12 meses.</li>
          <li>La reputación mejora con pagos puntuales y condiciona tu APR futuro.</li>
        </ul></div></div>
      </details>

      {error ? <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"><CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
      {feedback ? <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{feedback}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BankMetric label="Saldo disponible" value={formatGold(snapshot.player.gold)} detail="Oro libre para tus aventuras" icon={WalletCards} tone="amber" />
        <BankMetric label="Depósito protegido" value={formatGold(snapshot.account.depositBalanceGold)} detail={`Principal ${formatGold(snapshot.account.depositPrincipalGold)}`} icon={LockKeyhole} tone="emerald" />
        <BankMetric label="Exposición" value={formatGold(snapshot.credit.exposureGold)} detail={`Límite ${formatGold(snapshot.account.creditLimitGold)}`} icon={CreditCard} tone="cyan" />
        <BankMetric label="Disponible de crédito" value={formatGold(snapshot.credit.availableLimitGold)} detail={`APR actual ${(snapshot.credit.aprBps / 100).toFixed(2)}%`} icon={TrendingUp} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div data-bank-panel="reputation" tabIndex={-1} className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300/80">Reputación</p><h2 className="mt-2 text-xl font-black text-stone-100">{creditTierLabel}</h2></div><Sparkles aria-hidden="true" className="h-6 w-6 text-amber-300" /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-stone-800 bg-stone-950/45 p-3"><p className="text-xs text-stone-500">Racha puntual</p><p className="mt-1 text-lg font-black text-stone-100">{snapshot.account.onTimeStreak}</p></div><div className="rounded-xl border border-stone-800 bg-stone-950/45 p-3"><p className="text-xs text-stone-500">Límite total</p><p className="mt-1 text-lg font-black text-stone-100">{formatGold(snapshot.account.creditLimitGold)}</p></div><div className="rounded-xl border border-stone-800 bg-stone-950/45 p-3"><p className="text-xs text-stone-500">Próxima cuota</p><p className="mt-1 text-lg font-black text-stone-100">{nextInstallment ? formatGold(nextInstallment.amountDueGold) : "Sin cuotas"}</p></div></div>
        </div>
        <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5 sm:p-6"><div className="flex items-start gap-3"><Banknote aria-hidden="true" className="mt-0.5 h-5 w-5 text-amber-200" /><div><h2 className="font-black text-amber-100">Una bóveda con reglas claras</h2><p className="mt-2 text-sm leading-6 text-amber-100/70">El depósito protegido no se mezcla con tu saldo disponible. Cada movimiento deja una huella idempotente en el libro mayor.</p></div></div></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <form data-bank-panel="deposit" onSubmit={handleDeposit} className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-5"><div className="flex items-center gap-2"><ArrowDownLeft aria-hidden="true" className="h-5 w-5 text-emerald-300" /><h2 className="font-black text-stone-100">Proteger oro</h2></div><label className="mt-4 block text-xs font-bold uppercase tracking-[0.14em] text-stone-400" htmlFor="bank-deposit-amount">Cantidad</label><input id="bank-deposit-amount" type="number" min="300" step="1" inputMode="numeric" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-stone-100 outline-none focus:border-emerald-300/60" /><p className="mt-2 text-xs text-stone-500">Mínimo 300 · máximo de principal 25.000.</p><ActionButton type="submit" disabled={Boolean(pendingAction)}>{pendingAction === "deposit" ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowDownLeft aria-hidden="true" className="h-4 w-4" />} Depositar</ActionButton></form>
        <form data-bank-panel="withdraw" onSubmit={handleWithdraw} className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-5"><div className="flex items-center gap-2"><ArrowUpRight aria-hidden="true" className="h-5 w-5 text-amber-300" /><h2 className="font-black text-stone-100">Retirar del depósito</h2></div><label className="mt-4 block text-xs font-bold uppercase tracking-[0.14em] text-stone-400" htmlFor="bank-withdraw-amount">Cantidad</label><input id="bank-withdraw-amount" type="number" min="1" step="1" inputMode="numeric" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-stone-100 outline-none focus:border-amber-300/60" /><p className="mt-2 text-xs text-stone-500">Se confirmará antes de devolver oro a tu saldo.</p><ActionButton type="submit" variant="quiet" disabled={Boolean(pendingAction)}>{pendingAction === "withdraw" ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowUpRight aria-hidden="true" className="h-4 w-4" />} Retirar</ActionButton></form>
        <form data-bank-panel="loan" onSubmit={handleCreateLoan} className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-5"><div className="flex items-center gap-2"><CreditCard aria-hidden="true" className="h-5 w-5 text-cyan-300" /><h2 className="font-black text-stone-100">Solicitar préstamo</h2></div><label className="mt-4 block text-xs font-bold uppercase tracking-[0.14em] text-stone-400" htmlFor="bank-loan-amount">Cantidad</label><input id="bank-loan-amount" type="number" min="250" step="1" inputMode="numeric" value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-stone-100 outline-none focus:border-cyan-300/60" /><label className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] text-stone-400" htmlFor="bank-loan-term">Plazo</label><select id="bank-loan-term" value={loanTerm} onChange={(event) => setLoanTerm(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-stone-100 outline-none focus:border-cyan-300/60"><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select><p className="mt-2 text-xs text-stone-500">APR calculado según tu reputación y exposición disponible.</p><ActionButton type="submit" variant="quiet" disabled={Boolean(pendingAction)}>{pendingAction === "create-loan" ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CreditCard aria-hidden="true" className="h-4 w-4" />} Solicitar</ActionButton></form>
      </div>

      <div data-bank-panel="payment" tabIndex={-1} className="rounded-[2rem] border border-stone-800 bg-stone-900/70 p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300/80">Crédito vivo</p><h2 className="mt-2 text-2xl font-black text-stone-100">Tus préstamos</h2></div><span className="rounded-full border border-stone-700 bg-stone-950/55 px-3 py-1 text-xs font-bold text-stone-400">{activeLoans.length} activos</span></div><div className="mt-5 space-y-4">{snapshot.loans.length ? snapshot.loans.map((loan) => <LoanCard key={loan.id} loan={loan} installments={snapshot.installments.filter((item) => item.loanId === loan.id)} pendingAction={pendingAction} onPay={handlePayLoan} onPayEarly={handlePayLoanEarly} />) : <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-950/35 p-6 text-center text-sm text-stone-500">Todavía no tienes préstamos. Tu límite disponible es {formatGold(snapshot.credit.availableLimitGold)}.</div>}</div></div>

      <div data-bank-panel="transactions" tabIndex={-1} className="rounded-[2rem] border border-stone-800 bg-stone-900/70 p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300/80">Libro mayor</p><h2 className="mt-2 text-2xl font-black text-stone-100">Movimientos recientes</h2></div><ReceiptText aria-hidden="true" className="h-6 w-6 text-amber-300" /></div>{snapshot.transactions.length ? <div className="mt-5 divide-y divide-stone-800">{snapshot.transactions.slice(0, 12).map((transaction) => <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"><div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl p-2 ${transaction.amountGold >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>{transaction.amountGold >= 0 ? <ArrowDownLeft aria-hidden="true" className="h-4 w-4" /> : <ArrowUpRight aria-hidden="true" className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-stone-200">{operationLabel(transaction.operationType)}</p><p className="text-xs text-stone-500">{formatDate(transaction.createdAt)}</p></div></div><p className={`text-sm font-black ${transaction.amountGold >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{transaction.amountGold > 0 ? "+" : ""}{formatGold(transaction.amountGold)}</p></div>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-stone-700 bg-stone-950/35 p-6 text-center text-sm text-stone-500">Aún no hay movimientos. El primer depósito aparecerá aquí.</div>}</div>
    </section>
  );
}
