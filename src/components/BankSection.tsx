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
  X,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { usePlayerSession } from "../context/PlayerSessionContext";
import type {
  BankInstallment,
  BankLoan,
  BankSnapshot,
} from "../types";
import {
  bankCreateWeeklyLoan,
  bankDeposit,
  bankGetSnapshot,
  bankPayLoan,
  bankPayLoanEarly,
  bankPayWeeklyLoanEarly,
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
type BankTabId = "overview" | "loans" | "transactions" | "reputation";

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

const BANKER_MOCK_PLAYER_ID = "00000000-0000-4000-8000-000000000001";

function createBankerMockSnapshot(): BankSnapshot {
  const now = "2026-10-18T12:00:00.000Z";
  const activeLoanId = "00000000-0000-4000-8000-000000000002";
  const paidLoanId = "00000000-0000-4000-8000-000000000003";
  return {
    player: { id: BANKER_MOCK_PLAYER_ID, gold: 94190 },
    account: {
      playerId: BANKER_MOCK_PLAYER_ID,
      depositPrincipalGold: 4025,
      depositInterestResidue: 12,
      depositBalanceGold: 4025,
      depositLastAccruedAt: now,
      creditLimitGold: 5000,
      onTimeStreak: 4,
      creditTier: 1,
      lastDelinquencyAt: null,
    },
    credit: { exposureGold: 1000, availableLimitGold: 4000, aprBps: 480 },
    loans: [
      {
        id: activeLoanId,
        playerId: BANKER_MOCK_PLAYER_ID,
        principalGold: 1000,
        aprBps: 480,
        termMonths: 3,
        termWeeks: null,
        cadenceDays: 30,
        totalDueGold: 1040,
        outstandingDueGold: 700,
        paidInstallments: 1,
        status: "active",
        createdAt: "2026-09-18T12:00:00.000Z",
        updatedAt: now,
        closedAt: null,
      },
      {
        id: paidLoanId,
        playerId: BANKER_MOCK_PLAYER_ID,
        principalGold: 4025,
        aprBps: 520,
        termMonths: 3,
        termWeeks: null,
        cadenceDays: 30,
        totalDueGold: 4080,
        outstandingDueGold: 0,
        paidInstallments: 3,
        status: "paid",
        createdAt: "2026-06-18T12:00:00.000Z",
        updatedAt: "2026-09-18T12:00:00.000Z",
        closedAt: "2026-09-18T12:00:00.000Z",
      },
    ],
    installments: [
      {
        id: "00000000-0000-4000-8000-000000000012",
        loanId: activeLoanId,
        installmentNumber: 1,
        dueAt: "2026-10-01T12:00:00.000Z",
        principalDueGold: 330,
        interestDueGold: 16,
        amountDueGold: 346,
        status: "paid",
        paidAt: "2026-09-30T12:00:00.000Z",
        attemptCount: 1,
        createdAt: "2026-09-18T12:00:00.000Z",
      },
      {
        id: "00000000-0000-4000-8000-000000000013",
        loanId: activeLoanId,
        installmentNumber: 2,
        dueAt: "2026-11-01T12:00:00.000Z",
        principalDueGold: 340,
        interestDueGold: 16,
        amountDueGold: 356,
        status: "scheduled",
        paidAt: null,
        attemptCount: 0,
        createdAt: "2026-09-18T12:00:00.000Z",
      },
      {
        id: "00000000-0000-4000-8000-000000000014",
        loanId: activeLoanId,
        installmentNumber: 3,
        dueAt: "2026-12-01T12:00:00.000Z",
        principalDueGold: 330,
        interestDueGold: 8,
        amountDueGold: 338,
        status: "scheduled",
        paidAt: null,
        attemptCount: 0,
        createdAt: "2026-09-18T12:00:00.000Z",
      },
      ...[1, 2, 3].map((installmentNumber) => ({
        id: `00000000-0000-4000-8000-00000000001${installmentNumber}`,
        loanId: paidLoanId,
        installmentNumber,
        dueAt: `2026-0${installmentNumber + 6}-18T12:00:00.000Z`,
        principalDueGold: 1300,
        interestDueGold: 60,
        amountDueGold: 1360,
        status: "paid" as const,
        paidAt: `2026-0${installmentNumber + 6}-17T12:00:00.000Z`,
        attemptCount: 1,
        createdAt: "2026-06-18T12:00:00.000Z",
      })),
    ],
    transactions: [
      { id: "00000000-0000-4000-8000-000000000021", playerId: BANKER_MOCK_PLAYER_ID, operationType: "loan_payment", amountGold: -346, playerGoldAfter: 94190, referenceType: "bank_loan", referenceId: activeLoanId, idempotencyKey: "mock-payment-1", metadata: {}, createdAt: "2026-09-30T12:00:00.000Z" },
      { id: "00000000-0000-4000-8000-000000000022", playerId: BANKER_MOCK_PLAYER_ID, operationType: "deposit", amountGold: -4025, playerGoldAfter: 94536, referenceType: "bank_account", referenceId: null, idempotencyKey: "mock-deposit-1", metadata: {}, createdAt: "2026-09-20T12:00:00.000Z" },
      { id: "00000000-0000-4000-8000-000000000023", playerId: BANKER_MOCK_PLAYER_ID, operationType: "loan_disbursement", amountGold: 1000, playerGoldAfter: 98561, referenceType: "bank_loan", referenceId: activeLoanId, idempotencyKey: "mock-loan-1", metadata: {}, createdAt: "2026-09-18T12:00:00.000Z" },
    ],
  };
}

function isBankerMockEnabled() {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).get("bankerMock") === "1";
}

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
        .banker-v3-stage { position:relative; width:var(--banker-frame-width); height:var(--banker-frame-height); flex:none; overflow:hidden; border:1px solid rgba(245,158,11,.25); border-radius:1.5rem; background:#09090b; box-shadow:0 18px 48px rgba(0,0,0,.35); image-rendering:pixelated; }
        .banker-v3-stage { --banker-frame-width:256px; --banker-frame-height:320px; --banker-frame-scale:4; --banker-frame-shift:-1280px; z-index:2; }
        .banker-v3-layer { position:absolute; left:0; top:0; width:calc(384px * var(--banker-frame-scale)); height:calc(720px * var(--banker-frame-scale)); max-width:none; image-rendering:pixelated; user-select:none; pointer-events:none; }
        .banker-v3-row-1 .banker-v3-layer-animated { top:-320px; }
        .banker-v3-row-2 .banker-v3-layer-animated { top:-640px; }
        .banker-v3-row-3 .banker-v3-layer-animated { top:-960px; }
        .banker-v3-row-4 .banker-v3-layer-animated { top:-1280px; }
        .banker-v3-row-5 .banker-v3-layer-animated { top:-1600px; }
        .banker-v3-row-6 .banker-v3-layer-animated { top:-1920px; }
        .banker-v3-row-7 .banker-v3-layer-animated { top:-2240px; }
        .banker-v3-row-8 .banker-v3-layer-animated { top:-2560px; }
        .banker-v3-layer-animated { animation:banker-v3-frames ${duration}ms steps(5,end) infinite; animation-play-state:paused; }
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
        .kd-ambient:has(.bank-main-card), #root:has(.bank-main-card), body:has(.bank-main-card), html:has(.bank-main-card) { overflow-x:clip !important; overflow-y:visible !important; }
        .bank-desktop-grid { display:block; }
        .bank-left-column, .bank-workspace { min-width:0; }
        .banker-stage-ribbon { position:relative; z-index:4; display:inline-flex; align-items:center; gap:.4rem; margin:.7rem auto 0; white-space:nowrap; border:1px solid rgba(246,211,101,.55); border-radius:999px; background:rgba(8,15,13,.88); padding:.45rem .75rem; color:#fff0b0; font-size:.68rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; box-shadow:0 6px 18px rgba(0,0,0,.35); }
        .banker-stage-ribbon svg { width:1rem; height:1rem; }
        .banker-scene-shell { display:flex; flex-direction:column; align-items:stretch; }
        .banker-scene-shell .banker-v3-stage-wrap { flex-shrink:0; }
        .banker-stage-ribbon { align-self:center; }
        .bank-hud { margin-top:1rem; }
        .bank-hud-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.6rem; }
        .bank-hud-chip { min-width:0; border:1px solid rgba(216,181,91,.2); border-radius:.9rem; background:rgba(5,9,8,.62); padding:.65rem .7rem; }
        .bank-hud-chip p { margin:0; }
        .bank-hud-chip-label { color:#918b80; font-size:.62rem; font-weight:800; letter-spacing:.09em; text-transform:uppercase; }
        .bank-hud-chip-value { margin-top:.25rem !important; color:#fff8e8; font-size:.9rem; font-weight:900; }
        .banker-dialogue { margin-top:1rem; }
        .bank-operation-panel { border:1px solid rgba(216,181,91,.22); border-radius:1.25rem; background:rgba(5,9,8,.48); padding:1rem; }
        .bank-operation-header { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; color:#fff0b0; font-size:.68rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
        .bank-operation-close { display:inline-flex; min-height:2rem; min-width:2rem; align-items:center; justify-content:center; border:1px solid rgba(216,181,91,.3); border-radius:.65rem; color:#d6d3d1; }
        .bank-operation-close:hover, .bank-operation-close:focus-visible { border-color:#f6d365; color:#fff0b0; }
        .bank-tabs-header { display:flex; align-items:center; gap:.65rem; }
        .bank-tabs-header .bank-tab-list { flex:1; }
        .bank-operation-panel form { display:grid; gap:.7rem; }
        .bank-operation-panel form > button { min-height:48px; }
        .bank-operation-panel .bank-operation-fields { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:.7rem; }
        .bank-mobile-sheet-root { display:none; }
        .bank-mobile-sheet { --bank-sheet-drag:0px; }
        @keyframes bank-sheet-up { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(var(--bank-sheet-drag)); } }
        .bank-tab-list { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.35rem; border:1px solid rgba(120,113,108,.45); border-radius:1rem; background:rgba(5,9,8,.7); padding:.35rem; }
        .bank-tab { min-height:2.6rem; border-radius:.7rem; color:#a8a29e; font-size:.68rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; transition:background 180ms,color 180ms; }
        .bank-tab[aria-selected="true"] { background:rgba(246,211,101,.15); color:#fff0b0; box-shadow:inset 0 0 0 1px rgba(246,211,101,.28); }
        .bank-tab:focus-visible { outline:2px solid #f6d365; outline-offset:2px; }
        .bank-tab-panel { margin-top:1rem; }
        .bank-summary-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; }
        .bank-summary-card { border:1px solid rgba(120,113,108,.45); border-radius:1rem; background:rgba(5,9,8,.48); padding:1rem; }
        .bank-summary-progress { height:.55rem; overflow:hidden; border-radius:999px; background:#292524; }
        .bank-summary-progress > span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#2dd4bf,#f6d365); }
        .bank-loan-group + .bank-loan-group { margin-top:1.25rem; }
        .bank-loan-group-title { color:#e7e5e4; font-size:.72rem; font-weight:900; letter-spacing:.13em; text-transform:uppercase; }
        .bank-loan-history .bank-loan-progress { background:#34d399 !important; }
        @container (min-width:900px) {
          .bank-desktop-grid { display:grid; grid-template-columns:minmax(320px,360px) minmax(0,1fr); align-items:start; gap:16px; }
          .bank-left-column { position:sticky; top:92px; align-self:start; }
          .bank-left-column .banker-v3-stage-wrap { width:100%; min-height:400px; }
          .bank-left-column .banker-dialogue { margin-top:.35rem; }
          .bank-left-column .banker-dialogue::after { top:-10px; bottom:auto; left:50%; transform:translateX(-50%) rotate(225deg); border:0; border-right:2px solid #d8b45b; border-bottom:2px solid #d8b45b; }
          .bank-left-column .bank-hud { margin-top:.65rem; }
          .bank-left-column .bank-hud-grid { gap:.4rem; }
          .bank-left-column .bank-hud-chip { padding:.45rem .5rem; }
          .bank-left-column .bank-hud-chip-value { font-size:.78rem; }
          .bank-left-column .banker-stage-ribbon { margin-top:.4rem; }
          .bank-workspace { display:flex; min-width:0; flex-direction:column; gap:.65rem; }
          .bank-action-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .bank-main-card { margin-top:-1rem; padding:.25rem 1rem; }
        }
        @media (min-width:1100px) {
          .bank-left-column { top:76px; }
        }
        .bank-mobile-sheet-root { display:none; }
        @media (max-width:899px) {
          .bank-hero { min-height:180px; height:180px; max-height:180px; }
          .bank-hero-copy { padding:.85rem .75rem; }
          .bank-hero h1 { font-size:clamp(1.7rem,8vw,2.2rem); line-height:1.05; }
          .bank-hero-copy > p:not(.bank-hero-eyebrow) { display:none; }
          .bank-hero-action { min-height:48px; margin-top:.7rem; padding:.7rem .85rem; }
          .bank-main-card { padding:.75rem; }
          .bank-left-column { display:flex; flex-direction:column; }
          .banker-scene-shell { order:1; position:relative; }
          .banker-stage-ribbon { position:absolute; top:.7rem; right:.7rem; z-index:4; margin:0; padding:.3rem .45rem; font-size:.56rem; }
          .banker-dialogue { order:2; z-index:3; margin-top:.75rem; }
                    .banker-dialogue::after { top:-9px; bottom:auto; left:50%; width:14px; height:14px; transform:translateX(-50%) rotate(45deg); background:#0c0a09; border:0; border-left:2px solid #d8b45b; border-top:2px solid #d8b45b; z-index:2; }
          .bank-hud { order:3; margin-top:.75rem; }
          .bank-hud-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.35rem; overflow:visible; padding-bottom:0; }
          .bank-hud-chip { padding:.38rem .35rem; border-radius:.7rem; }
          .bank-hud-chip-label { font-size:.53rem; letter-spacing:.03em; white-space:nowrap; }
          .bank-hud-chip-value { margin-top:.15rem !important; font-size:.72rem; white-space:nowrap; }
          .bank-hud-chip-apr { margin-top:.1rem; font-size:.55rem; white-space:nowrap; }
          .bank-action-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:.5rem; }
          .bank-action-button { min-height:64px; flex-direction:column; gap:.35rem; padding:.55rem .3rem; text-align:center; line-height:1.1; }
          .bank-tabs-header { display:block; }
          .bank-tabs-header > .bank-tab-list { display:flex; gap:.35rem; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:thin; }
          .bank-tab { flex:0 0 7.5rem; min-width:0; min-height:2.8rem; scroll-snap-align:start; }
          .bank-tabs-header > button { width:100%; min-height:44px; margin-top:.5rem; }
          .bank-tab-panel { margin-top:.75rem; padding:.75rem; }
          .bank-summary-grid { grid-template-columns:1fr; }
          .bank-operation-panel { display:none; }
          .bank-mobile-sheet-root { position:fixed; z-index:100; inset:0; display:block; pointer-events:auto; }
          .bank-mobile-sheet-backdrop { position:absolute; inset:0; width:100%; height:100%; border:0; background:transparent; }
          .bank-mobile-sheet { position:absolute; right:0; bottom:calc(76px + env(safe-area-inset-bottom)); left:0; max-height:min(60dvh,calc(100dvh - 120px)); overflow-y:auto; transform:translateY(var(--bank-sheet-drag)); border-top:2px solid #d8b45b; border-radius:1.25rem 1.25rem 0 0; background:#080d0b; box-shadow:0 -18px 48px rgba(0,0,0,.48); padding:.55rem .85rem calc(16px + env(safe-area-inset-bottom)); animation:bank-sheet-up 220ms ease-out both; transition:transform 220ms ease-out; touch-action:pan-y; }
          .bank-mobile-sheet-handle { width:3rem; height:.3rem; margin:0 auto .7rem; border-radius:99px; background:#d8b45b; touch-action:none; }
          .bank-mobile-sheet-header { display:flex; justify-content:flex-end; min-height:2rem; margin-bottom:.35rem; }
          .bank-mobile-sheet-body { max-height:none; overflow:visible; }
          .bank-mobile-sheet .bank-operation-panel { display:block; border:0; background:transparent; padding:0; }
          .bank-mobile-sheet .bank-operation-fields { grid-template-columns:1fr; gap:.7rem; }
          .bank-mobile-sheet form > button, .bank-mobile-sheet .bank-operation-panel > div > button { position:sticky; bottom:0; z-index:2; width:100%; min-height:48px; margin-top:.35rem; background:#172018; box-shadow:0 -8px 12px rgba(8,13,11,.94); }
          .bank-mobile-sheet form > p { margin-top:.1rem; margin-bottom:.35rem; }
        }
        @media (max-width:339px) {
          .bank-hud-grid { display:flex; gap:.4rem; overflow-x:auto; padding-bottom:.25rem; scroll-snap-type:x mandatory; }
          .bank-hud-chip { flex:0 0 8.4rem; scroll-snap-align:start; }
        }
        .banker-v3-stage-wrap::before { content:""; position:absolute; inset:5% 10%; z-index:1; border-radius:50%; background:radial-gradient(ellipse at center, rgba(246,211,101,.24) 0%, rgba(75,146,110,.2) 34%, rgba(246,211,101,.06) 52%, transparent 76%); filter:blur(20px); opacity:.62; animation:bank-banker-breathe 6s ease-in-out infinite; pointer-events:none; }
        .banker-v3-stage-wrap::after { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit; background:radial-gradient(ellipse at center, rgba(8,16,13,.04) 0%, rgba(5,9,8,.5) 68%, rgba(0,0,0,.82) 100%); pointer-events:none; }
        @keyframes bank-section-entry { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bank-divider-shine { from { transform:translateX(0); } to { transform:translateX(650%); } }
        @keyframes bank-banker-breathe { 0%,100% { opacity:.4; transform:scale(.94); } 50% { opacity:.8; transform:scale(1.06); } }
        @media (prefers-reduced-motion:reduce) { .bank-action-button, .bank-action-button::after, .bank-rules-content, .bank-rules-chevron, .bank-count-up, .bank-mobile-sheet, .banker-v3-stage-wrap, .bank-hero, .banker-v3-stage-wrap::before { animation:none !important; transition:none !important; } .bank-count-up::before { content:none; } .bank-count-up-fallback { display:inline; } }
        @media (min-width:768px) {
          .bank-hero { max-height:min(160px, 56.25vw); }
          .banker-v3-stage { --banker-frame-width:320px; --banker-frame-height:400px; --banker-frame-scale:5; --banker-frame-shift:-1600px; }
          .banker-v3-stage-wrap { min-height:400px; }
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
  selectedAction = null,
  onAction,
}: {
  locked: boolean;
  selectedAction?: BankAction | null;
  onAction: (action: BankAction, trigger: HTMLButtonElement) => void;
}) {
  const [shaking, setShaking] = useState<BankAction | null>(null);
  const shakeTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
  }, []);

  const handleAction = (key: BankAction, trigger: HTMLButtonElement) => {
    if (locked) {
      setShaking(key);
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = window.setTimeout(() => setShaking(null), 300);
    }
    onAction(key, trigger);
  };

  return (
    <div className="bank-action-grid grid grid-cols-2 gap-3" role="group" aria-label="Acciones del Banco">
      {BANK_ACTIONS.map(({ key, label, icon: Icon }, index) => (
        <button
          key={key}
          type="button"
          data-bank-action={key}
          data-selected={selectedAction === key}
          className={`bank-action-button inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-950/70 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-stone-200 transition hover:border-amber-300/60 hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 ${selectedAction === key ? "border-amber-300 bg-amber-300/15 text-amber-100" : ""} ${shaking === key ? "bank-action-locked-shake" : ""}`}
          style={{ "--bank-action-delay": `${index * 60}ms` } as CSSProperties}
          aria-disabled={locked}
          aria-pressed={selectedAction === key}
          onClick={(event) => handleAction(key, event.currentTarget)}
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
  const isSettled = loan.status === "paid";
  const installmentTotal = (loan.termWeeks ?? loan.termMonths ?? installments.length) || 1;
  const termLabel = loan.termWeeks ? `${loan.termWeeks} semanas · semanal` : `${loan.termMonths ?? installmentTotal} meses`;
  const progressPercent = isSettled ? 100 : Math.min(100, (loan.paidInstallments / installmentTotal) * 100);

  return (
    <article className="rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard aria-hidden="true" className="h-4 w-4 text-cyan-300" />
            <h3 className="font-bold text-stone-100">Préstamo de {formatGold(loan.principalGold)}</h3>
          </div>
          <p className="mt-2 text-xs text-stone-500">Abierto {formatDate(loan.createdAt)} · {termLabel} · APR {(loan.aprBps / 100).toFixed(2)}%</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${loan.status === "in_mora" ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}>
          {loanStatusLabel(loan.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div><p className="text-xs text-stone-500">Saldo pendiente</p><p className="mt-1 font-bold text-stone-100">{formatGold(loan.outstandingDueGold)}</p></div>
        <div><p className="text-xs text-stone-500">Total pactado</p><p className="mt-1 font-bold text-stone-100">{formatGold(loan.totalDueGold)}</p></div>
        <div><p className="text-xs text-stone-500">Cuotas</p><p className="mt-1 font-bold text-stone-100">{loan.paidInstallments}/{installmentTotal} pagadas</p></div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-800" aria-label={`${loan.paidInstallments} de ${installmentTotal} cuotas pagadas`} role="progressbar" aria-valuemin={0} aria-valuemax={installmentTotal} aria-valuenow={isSettled ? installmentTotal : loan.paidInstallments}>
        <span className={`bank-loan-progress block h-full rounded-full ${isSettled ? "bg-emerald-400" : "bg-amber-300"}`} style={{ width: `${progressPercent}%`, transition: "width 600ms ease-out" }} />
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
        @media (min-width:768px) { .bank-hero { min-height:0; height:150px; max-height:min(150px, 56.25vw); } .bank-hero-copy { padding:1rem 1.5rem; } .bank-hero h1 { font-size:clamp(1.65rem,3vw,2.4rem); white-space:nowrap; } .bank-hero-copy > p:not(.bank-hero-eyebrow) { margin-top:.45rem; line-height:1.35; } .bank-hero-action { margin-top:.55rem; min-height:40px; } }
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
  const bankMockEnabled = isBankerMockEnabled();
  const mockSnapshot = useMemo(() => createBankerMockSnapshot(), []);
  const [snapshot, setSnapshot] = useState<BankSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [selectedAction, setSelectedAction] = useState<BankAction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetRef = useRef<HTMLElement | null>(null);
  const sheetTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetDragStartYRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<BankTabId>("overview");
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
  const [loanTerm, setLoanTerm] = useState("4");

  const canOperate = bankMockEnabled || Boolean(
    player &&
      !isHydrating &&
      isSecureSessionReady &&
      isPlayerSecureLinked &&
      UUID_PATTERN.test(player.id),
  );

  const closeOperationSheet = useCallback(() => {
    setSheetOpen(false);
    setSheetDragY(0);
    setSelectedAction(null);
    window.setTimeout(() => sheetTriggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const getFocusable = () => Array.from(sheet.querySelectorAll<HTMLElement>("button, input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter((node) => !node.hasAttribute("disabled"));
    const focusFirst = () => getFocusable()[0]?.focus();
    const focusAndReveal = () => {
      if (window.matchMedia("(max-width: 899px)").matches) {
        const stage = document.querySelector<HTMLElement>(".banker-v3-stage");
        if (stage) window.scrollTo({ top: Math.max(0, stage.getBoundingClientRect().top + window.scrollY - 40), behavior: "auto" });
      }
      focusFirst();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOperationSheet();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.setTimeout(focusAndReveal, 0);
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOperationSheet, sheetOpen]);

  const handleSheetPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    sheetDragStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (sheetDragStartYRef.current === null) return;
    setSheetDragY(Math.max(0, event.clientY - sheetDragStartYRef.current));
  };

  const handleSheetPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (sheetDragStartYRef.current !== null && event.clientY - sheetDragStartYRef.current > 80) closeOperationSheet();
    else setSheetDragY(0);
    sheetDragStartYRef.current = null;
  };


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
    if (bankMockEnabled) {
      setError("");
      setSnapshot(mockSnapshot);
      setIsLoading(false);
      return;
    }
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
  }, [bankMockEnabled, canOperate, mockSnapshot, player]);

  useEffect(() => {
    setFeedback("");
    void refreshSnapshot();
  }, [refreshSnapshot]);

  async function runAction(
    action: string,
    operation: () => Promise<{ message: string }>,
    successPose: BankerPose,
  ) {
    if (bankMockEnabled) {
      setFeedback("Vista de demostración: la operación está deshabilitada.");
      return;
    }
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
      if (!window.confirm(`Vas a solicitar ${formatGold(amount)} a ${term} semanas. La cuota vencerá semanalmente. ¿Confirmas la solicitud?`)) return;
      void runAction("create-loan", () =>
        bankCreateWeeklyLoan(player.id, amount, term, createBankIdempotencyKey("create-weekly-loan")),
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
      loan.cadenceDays === 7
        ? bankPayWeeklyLoanEarly(player.id, loan.id, createBankIdempotencyKey("pay-weekly-loan-early"))
        : bankPayLoanEarly(player.id, loan.id, createBankIdempotencyKey("pay-loan-early")),
      "payment",
    );
  }

  const nextInstallment = useMemo(() => {
    if (!snapshot) return null;
    return snapshot.installments
      .filter((item) => item.status === "scheduled" || item.status === "in_mora")
      .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())[0] ?? null;
  }, [snapshot]);


  function handleBankAction(panel: BankAction, trigger: HTMLButtonElement) {
    if (panel === "reputation") {
      setSheetOpen(false);
      setSelectedAction(null);
      setActiveTab("reputation");
      return;
    }
    if (panel === "transactions") {
      setSheetOpen(false);
      setSelectedAction(null);
      setActiveTab("transactions");
      return;
    }
    sheetTriggerRef.current = trigger;
    setSelectedAction(panel);
    setSheetDragY(0);
    setSheetOpen(true);
    if (panel === "payment") setActiveTab("loans");
    window.setTimeout(() => {
      if (!window.matchMedia("(max-width: 899px)").matches) return;
      const stage = document.querySelector<HTMLElement>(".banker-v3-stage");
      if (!stage) return;
      window.scrollTo({ top: Math.max(0, stage.getBoundingClientRect().top + window.scrollY - 40), behavior: "auto" });
    }, 50);
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

  if ((!player && !bankMockEnabled) || !canOperate) {
    return (
      <section className="space-y-3">
        <BankHero description="Conoce la bóveda y sus reglas. Vincula un perfil para operar sin exponer saldos en modo visitante." />
        <div className="bank-atmosphere-card bank-main-card kd-glass rounded-[2rem] border border-amber-500/20 bg-stone-900/75 p-4 sm:p-6">
          <div className="bank-desktop-grid">
            <div className="bank-left-column">
              <div className="banker-scene-shell"><BankerSprite pose={debugPose ?? bankerPose} effect={activeBankerEffect} loopEffect={debugEffect !== "none"} onTap={handleVisitorAction} /><span className="banker-stage-ribbon"><LockKeyhole aria-hidden="true" /> Vincula tu perfil</span></div>
              <div className="banker-dialogue rounded-xl bg-stone-950/80 px-3 py-2 text-center text-sm text-amber-100" aria-live="polite"><span>{bankerDisplayMessage}</span>{visitorNeedsConnect ? <button type="button" className="ml-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-amber-300/15 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-amber-100 hover:bg-amber-300/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300" onClick={handleConnectClick}><LockKeyhole aria-hidden="true" className="h-4 w-4" /> Conectar</button> : null}</div>
            </div>
            <div className="bank-workspace"><BankActionGrid locked onAction={handleVisitorAction} /><div className="rounded-2xl border border-stone-800 bg-stone-950/45 p-4"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">Modo lectura</p><p className="mt-2 text-sm leading-6 text-stone-400">Las operaciones requieren un perfil vinculado. Aquí no se muestran saldos ni datos de cuenta.</p></div></div>
          </div>
          <details className="bank-atmosphere-card bank-rules mt-5 rounded-[2rem] border border-stone-800 bg-stone-900/70 p-5">
            <summary className="cursor-pointer list-none font-black text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">Reglas del Banco <span className="bank-rules-chevron" aria-hidden="true">⌄</span></summary>
            <div className="bank-rules-content"><div><ul className="mt-4 grid gap-3 text-sm leading-6 text-stone-400 sm:grid-cols-2"><li>El depósito mínimo es de 300 de oro y su principal protegido llega hasta 25.000.</li><li>El depósito acumula interés; el saldo disponible y el depósito protegido se muestran por separado.</li><li>Los préstamos semanales parten de un importe positivo, con plazos de 4, 8 o 12 semanas y APR calculado por tier.</li><li>La reputación mejora con pagos puntuales y condiciona tu APR futuro.</li></ul></div></div>
          </details>
        </div>
      </section>
    );
  }

  if (isLoading && !snapshot) {
    return <BankLoadingSkeleton />;
  }

  if (error && !snapshot) {
    return <section className="space-y-3"><SectionHeader eyebrow="Banco de Kingdoom" title="El libro mayor no responde" /><div role="alert" className="rounded-[1.5rem] border border-rose-400/30 bg-rose-400/10 p-5 text-sm leading-6 text-rose-100"><div className="flex items-start gap-3"><CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><div><p>{error}</p><ActionButton variant="quiet" onClick={() => void refreshSnapshot()}><RefreshCw aria-hidden="true" className="h-4 w-4" /> Reintentar</ActionButton></div></div></div></section>;
  }

  if (!snapshot) return null;

  const activeLoans = snapshot.loans.filter((loan) => loan.status === "active" || loan.status === "in_mora");
  const historyLoans = snapshot.loans.filter((loan) => loan.status === "paid" || loan.status === "cancelled");
  const creditTierLabel = ["Iniciado", "Custodio", "Patrono"][snapshot.account.creditTier] ?? "Iniciado";
  const operationDisabled = Boolean(pendingAction) || bankMockEnabled;

  const renderOperationPanel = () => {
    if (!selectedAction) return null;
    if (selectedAction === "deposit") {
      return <form onSubmit={handleDeposit}>
        <div className="flex items-center gap-2"><ArrowDownLeft aria-hidden="true" className="h-5 w-5 text-emerald-300" /><h2 className="font-black text-stone-100">Proteger oro</h2></div>
        <div className="bank-operation-fields"><label className="block text-xs font-bold uppercase tracking-[0.14em] text-stone-400" htmlFor="bank-deposit-amount">Cantidad<input id="bank-deposit-amount" type="number" min="300" step="1" inputMode="numeric" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} disabled={bankMockEnabled} className="mt-2 min-h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-stone-100 outline-none focus:border-emerald-300/60" /></label><div className="self-end text-xs leading-5 text-stone-500">Mínimo 300 · máximo de principal 25.000.</div></div>
        <ActionButton type="submit" disabled={operationDisabled}>{pendingAction === "deposit" ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowDownLeft aria-hidden="true" className="h-4 w-4" />} Depositar</ActionButton>
      </form>;
    }
    if (selectedAction === "withdraw") {
      return <form onSubmit={handleWithdraw}>
        <div className="flex items-center gap-2"><ArrowUpRight aria-hidden="true" className="h-5 w-5 text-amber-300" /><h2 className="font-black text-stone-100">Retirar del depósito</h2></div>
        <div className="bank-operation-fields"><label className="block text-xs font-bold uppercase tracking-[0.14em] text-stone-400" htmlFor="bank-withdraw-amount">Cantidad<input id="bank-withdraw-amount" type="number" min="1" step="1" inputMode="numeric" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} disabled={bankMockEnabled} className="mt-2 min-h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-stone-100 outline-none focus:border-amber-300/60" /></label><div className="self-end text-xs leading-5 text-stone-500">Se confirmará antes de devolver oro a tu saldo.</div></div>
        <ActionButton type="submit" variant="quiet" disabled={operationDisabled}>{pendingAction === "withdraw" ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowUpRight aria-hidden="true" className="h-4 w-4" />} Retirar</ActionButton>
      </form>;
    }
    if (selectedAction === "loan") {
      return <form onSubmit={handleCreateLoan}>
        <div className="flex items-center gap-2"><CreditCard aria-hidden="true" className="h-5 w-5 text-cyan-300" /><h2 className="font-black text-stone-100">Solicitar préstamo</h2></div>
        <div className="bank-operation-fields"><label className="block text-xs font-bold uppercase tracking-[0.14em] text-stone-400" htmlFor="bank-loan-amount">Cantidad<input id="bank-loan-amount" type="number" min="1" step="1" inputMode="numeric" value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} disabled={bankMockEnabled} className="mt-2 min-h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-stone-100 outline-none focus:border-cyan-300/60" /></label><label className="block text-xs font-bold uppercase tracking-[0.14em] text-stone-400" htmlFor="bank-loan-term">Plazo semanal<select id="bank-loan-term" value={loanTerm} onChange={(event) => setLoanTerm(event.target.value)} disabled={bankMockEnabled} className="mt-2 min-h-11 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 text-stone-100 outline-none focus:border-cyan-300/60"><option value="4">4 semanas</option><option value="8">8 semanas</option><option value="12">12 semanas</option></select></label></div>
        <p className="text-xs text-stone-500">APR calculado según tu reputación y exposición disponible.</p><ActionButton type="submit" variant="quiet" disabled={operationDisabled}>{pendingAction === "create-loan" ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CreditCard aria-hidden="true" className="h-4 w-4" />} Solicitar</ActionButton>
      </form>;
    }
    if (selectedAction === "payment") {
      return <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-stone-100">Pagar cuota</p><p className="mt-1 text-sm text-stone-500">{nextInstallment ? `Próxima cuota: ${formatGold(nextInstallment.amountDueGold)} · ${formatDate(nextInstallment.dueAt)}` : "No tienes cuotas pendientes."}</p></div><ActionButton variant="quiet" onClick={() => setActiveTab("loans")}>{nextInstallment ? "Pagar cuota" : "Ver préstamos"}</ActionButton></div>;
    }
    if (selectedAction === "reputation") {
      return <div className="flex items-center gap-3"><Sparkles aria-hidden="true" className="h-5 w-5 text-amber-300" /><div><p className="font-black text-stone-100">Tu reputación es {creditTierLabel}</p><p className="mt-1 text-sm text-stone-500">La racha puntual ajusta tu APR futuro.</p></div></div>;
    }
    return <div className="flex items-center gap-3"><ReceiptText aria-hidden="true" className="h-5 w-5 text-amber-300" /><div><p className="font-black text-stone-100">Movimientos recientes</p><p className="mt-1 text-sm text-stone-500">Consulta el libro mayor en la pestaña Movimientos.</p></div></div>;
  };

  const renderTabPanel = () => {
    if (activeTab === "overview") {
      const exposurePercent = snapshot.account.creditLimitGold > 0 ? Math.min(100, (snapshot.credit.exposureGold / snapshot.account.creditLimitGold) * 100) : 0;
      return <div className="bank-summary-grid"><div className="bank-summary-card"><p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300/80">Exposición</p><p className="mt-2 text-2xl font-black text-stone-100">{formatGold(snapshot.credit.exposureGold)}</p><div className="bank-summary-progress mt-4" role="progressbar" aria-label="Exposición frente al límite" aria-valuemin={0} aria-valuemax={snapshot.account.creditLimitGold} aria-valuenow={snapshot.credit.exposureGold}><span style={{ width: `${exposurePercent}%` }} /></div><p className="mt-2 text-xs text-stone-500">Usado sobre tu capacidad actual.</p></div><div className="bank-summary-card"><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300/80">Disponible ahora</p><p className="mt-2 text-2xl font-black text-stone-100">{formatGold(snapshot.credit.availableLimitGold)}</p><p className="mt-3 text-sm leading-6 text-stone-500">Puedes solicitar crédito sin superar la exposición permitida.</p></div></div>;
    }
    if (activeTab === "loans") {
      return <div><section className="bank-loan-group"><div className="flex items-center justify-between gap-3"><h3 className="bank-loan-group-title">Activos</h3><span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{activeLoans.length} activos</span></div><div className="mt-4 space-y-4">{activeLoans.length ? activeLoans.map((loan) => <LoanCard key={loan.id} loan={loan} installments={snapshot.installments.filter((item) => item.loanId === loan.id)} pendingAction={pendingAction} onPay={handlePayLoan} onPayEarly={handlePayLoanEarly} />) : <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-950/35 p-6 text-center text-sm text-stone-500">No tienes préstamos activos.</div>}</div></section><section className="bank-loan-group bank-loan-history"><h3 className="bank-loan-group-title">Historial</h3><div className="mt-4 space-y-4">{historyLoans.length ? historyLoans.map((loan) => <LoanCard key={loan.id} loan={loan} installments={snapshot.installments.filter((item) => item.loanId === loan.id)} pendingAction={pendingAction} onPay={handlePayLoan} onPayEarly={handlePayLoanEarly} />) : <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-950/35 p-6 text-center text-sm text-stone-500">Todavía no hay préstamos liquidados.</div>}</div></section></div>;
    }
    if (activeTab === "reputation") {
      return <div className="rounded-2xl border border-stone-800 bg-stone-950/35 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300/80">Reputación</p><h3 className="mt-2 text-2xl font-black text-stone-100">{creditTierLabel}</h3></div><Sparkles aria-hidden="true" className="h-6 w-6 text-amber-300" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-stone-500">Racha puntual</p><p className="mt-1 text-lg font-black text-stone-100">{snapshot.account.onTimeStreak}</p></div><div><p className="text-xs text-stone-500">Límite total</p><p className="mt-1 text-lg font-black text-stone-100">{formatGold(snapshot.account.creditLimitGold)}</p></div><div><p className="text-xs text-stone-500">APR actual</p><p className="mt-1 text-lg font-black text-stone-100">{(snapshot.credit.aprBps / 100).toFixed(2)}%</p></div></div></div>;
    }
    return snapshot.transactions.length ? <div className="divide-y divide-stone-800">{snapshot.transactions.slice(0, 12).map((transaction) => <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"><div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl p-2 ${transaction.amountGold >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>{transaction.amountGold >= 0 ? <ArrowDownLeft aria-hidden="true" className="h-4 w-4" /> : <ArrowUpRight aria-hidden="true" className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-stone-200">{operationLabel(transaction.operationType)}</p><p className="text-xs text-stone-500">{formatDate(transaction.createdAt)}</p></div></div><p className={`text-sm font-black ${transaction.amountGold >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{transaction.amountGold > 0 ? "+" : ""}{formatGold(transaction.amountGold)}</p></div>)}</div> : <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-950/35 p-6 text-center text-sm text-stone-500">Aún no hay movimientos.</div>;
  };

  return (
    <section className="space-y-3">
          <BankHero description="Tu bóveda, tu crédito y tus movimientos, guardados en un solo libro mayor." />


          <div className="bank-atmosphere-card bank-main-card kd-glass rounded-[2rem] border border-amber-500/20 bg-stone-900/75 p-4 sm:p-6">
            <div className="bank-desktop-grid">
              <div className="bank-left-column">
                <div className="banker-scene-shell"><BankerSprite pose={debugPose ?? bankerPose} effect={activeBankerEffect} loopEffect={debugEffect !== "none"} onTap={() => enqueueBankerPose("tap")} /><span className="banker-stage-ribbon"><Sparkles aria-hidden="true" /> {creditTierLabel}</span></div>
                <div className="banker-dialogue rounded-xl bg-stone-950/80 px-3 py-2 text-center text-sm text-amber-100" aria-live="polite">{bankerDisplayMessage}</div>
                <div className="bank-hud" aria-label="Resumen de cuenta"><div className="bank-hud-grid"><div className="bank-hud-chip"><WalletCards aria-hidden="true" className="h-4 w-4 text-amber-300" /><p className="bank-hud-chip-label">Saldo</p><p className="bank-hud-chip-value">{formatGold(snapshot.player.gold)}</p></div><div className="bank-hud-chip"><LockKeyhole aria-hidden="true" className="h-4 w-4 text-emerald-300" /><p className="bank-hud-chip-label">Protegido</p><p className="bank-hud-chip-value">{formatGold(snapshot.account.depositBalanceGold)}</p></div><div className="bank-hud-chip"><CreditCard aria-hidden="true" className="h-4 w-4 text-cyan-300" /><p className="bank-hud-chip-label">Crédito</p><p className="bank-hud-chip-value">{formatGold(snapshot.credit.availableLimitGold)}</p><p className="bank-hud-chip-apr text-[.65rem] text-stone-500">APR {(snapshot.credit.aprBps / 100).toFixed(2)}%</p></div></div></div>
              </div>
              <div className="bank-workspace">
                {bankMockEnabled ? <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100" role="status">Vista de demostración · operaciones deshabilitadas</div> : null}
                <BankActionGrid onAction={handleBankAction} locked={false} selectedAction={selectedAction} />
                {selectedAction ? <div className="bank-operation-panel" aria-label="Operación del Banco"><div className="bank-operation-header"><button type="button" className="bank-operation-close" aria-label="Cerrar operación" onClick={closeOperationSheet}><X aria-hidden="true" className="h-4 w-4" /></button></div>{renderOperationPanel()}</div> : null}
                <div className="bank-tabs">
                  <div className="bank-tabs-header"><div className="bank-tab-list" role="tablist" aria-label="Secciones del Banco">
                    {([ ["overview", "Resumen"], ["loans", "Préstamos"], ["transactions", "Movimientos"], ["reputation", "Reputación"] ] as Array<[BankTabId, string]>).map(([tab, label]) => <button key={tab} type="button" role="tab" className="bank-tab" aria-selected={activeTab === tab} aria-controls={`bank-tabpanel-${tab}`} id={`bank-tab-${tab}`} onClick={() => setActiveTab(tab)}>{label}</button>)}
                  </div><ActionButton variant="quiet" disabled={Boolean(pendingAction) || isLoading || bankMockEnabled} onClick={() => void refreshSnapshot()}><RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Actualizar</ActionButton></div>
                  <div className="bank-tab-panel rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-4 sm:p-5" role="tabpanel" tabIndex={0} id={`bank-tabpanel-${activeTab}`} aria-labelledby={`bank-tab-${activeTab}`}>{renderTabPanel()}</div>
                </div>
              </div>
            </div>
            {error ? <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"><CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
            {feedback ? <div role="status" aria-live="polite" className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{feedback}</div> : null}
            <details className="bank-atmosphere-card bank-rules mt-5 rounded-[2rem] border border-stone-800 bg-stone-900/70 p-5">
              <summary className="cursor-pointer list-none font-black text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">Reglas del Banco <span className="bank-rules-chevron" aria-hidden="true">⌄</span></summary>
              <div className="bank-rules-content"><div><ul className="mt-4 grid gap-3 text-sm leading-6 text-stone-400 sm:grid-cols-2"><li>El depósito mínimo es de 300 de oro y su principal protegido llega hasta 25.000.</li><li>El depósito acumula interés y se mantiene separado del saldo disponible.</li><li>Los préstamos semanales parten de un importe positivo, con plazos de 4, 8 o 12 semanas y APR calculado por tier.</li><li>La reputación mejora con pagos puntuales y condiciona tu APR futuro.</li></ul></div></div>
            </details>

          </div>
          {sheetOpen ? <div className="bank-mobile-sheet-root" onClick={(event) => { if (event.target === event.currentTarget) closeOperationSheet(); }}>
            <button type="button" className="bank-mobile-sheet-backdrop" aria-label="Cerrar operación" onClick={closeOperationSheet} />
            <section ref={sheetRef} className="bank-mobile-sheet" role="dialog" aria-modal="true" aria-label="Operación del Banco" style={{ "--bank-sheet-drag": `${sheetDragY}px` } as CSSProperties}>
              <div className="bank-mobile-sheet-handle" aria-hidden="true" onPointerDown={handleSheetPointerDown} onPointerMove={handleSheetPointerMove} onPointerUp={handleSheetPointerUp} onPointerCancel={handleSheetPointerUp} />
              <div className="bank-mobile-sheet-header"><button type="button" className="bank-operation-close" aria-label="Cerrar operación" onClick={closeOperationSheet}><X aria-hidden="true" className="h-5 w-5" /></button></div>
              <div className="bank-mobile-sheet-body"><div className="bank-operation-panel">{renderOperationPanel()}</div></div>
            </section>
          </div> : null}
        </section>
      );
    }
