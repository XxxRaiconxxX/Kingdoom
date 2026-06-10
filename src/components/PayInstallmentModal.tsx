import { useEffect, useRef, useState } from "react";
import type { PayInstallmentMode } from "../utils/purchases";
import type { PaymentPlan } from "../types";

interface Props {
  plan: PaymentPlan;
  playerGold: number;
  playerId: string;
  onClose: () => void;
  onSuccess: (result: {
    amountPaid: number;
    newPlayerGold: number;
    planCompleted: boolean;
    planId: string;
  }) => void;
  onPay: (
    playerId: string,
    planId: string,
    mode: PayInstallmentMode,
    advanceCount: number
  ) => Promise<{
    status: "success" | "error";
    message?: string;
    amountPaid?: number;
    newPlayerGold?: number;
    planCompleted?: boolean;
  }>;
}

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { maximumFractionDigits: 0 });

export default function PayInstallmentModal({
  plan,
  playerGold,
  playerId,
  onClose,
  onSuccess,
  onPay,
}: Props) {
  const [mode, setMode] = useState<PayInstallmentMode>("one");
  const [advanceCount, setAdvanceCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const remaining = plan.totalInstallments - plan.paidInstallments;
  const canAdvance = remaining > 1;

  const calcAmount = (): number => {
    if (mode === "total") return plan.remainingBalance;
    if (mode === "advance")
      return Math.min(
        plan.installmentAmount * advanceCount,
        plan.remainingBalance
      );
    return Math.min(plan.installmentAmount, plan.remainingBalance);
  };

  const amountDue = calcAmount();
  const hasEnoughGold = playerGold >= amountDue;
  const progressPct = Math.round(
    (plan.paidInstallments / plan.totalInstallments) * 100
  );

  const itemLabel = plan.itemId
    .replace(/^(armor|weapon|consumable|misc)-/i, "")
    .replace(/-/g, " ")
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Animate in
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (overlayRef.current) overlayRef.current.style.opacity = "1";
      if (sheetRef.current) {
        sheetRef.current.style.opacity = "1";
        sheetRef.current.style.transform = "translateY(0) scale(1)";
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    if (overlayRef.current) overlayRef.current.style.opacity = "0";
    if (sheetRef.current) {
      sheetRef.current.style.opacity = "0";
      sheetRef.current.style.transform = "translateY(16px) scale(0.98)";
    }
    setTimeout(onClose, 180);
  };

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    const res = await onPay(playerId, plan.id, mode, advanceCount);
    setLoading(false);
    if (res.status === "error") {
      setError(res.message ?? "Error desconocido.");
      return;
    }
    setSuccess(
      res.planCompleted
        ? "¡Deuda liquidada! El artículo es tuyo."
        : `Pagaste ${fmt(res.amountPaid ?? 0)} monedas.`
    );
    setTimeout(() => {
      onSuccess({
        amountPaid: res.amountPaid ?? 0,
        newPlayerGold: res.newPlayerGold ?? 0,
        planCompleted: res.planCompleted ?? false,
        planId: plan.id,
      });
    }, 1600);
  };

  return (
    <>
      <style>{`
        /* ── Overlay ── */
        .pim-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
          opacity: 0;
          transition: opacity 0.18s ease;
        }
        @media (min-width: 480px) {
          .pim-overlay {
            align-items: center;
            padding: 1rem;
          }
        }

        /* ── Sheet / Modal ── */
        .pim-sheet {
          background: linear-gradient(170deg, #1c1710 0%, #111008 100%);
          border: 1px solid rgba(212,175,55,0.2);
          border-bottom: none;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.12);
          width: 100%;
          max-width: 100%;
          /* Mobile: max 92dvh so it never overflows */
          max-height: 92dvh;
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(16px) scale(0.98);
          transition: opacity 0.2s ease, transform 0.22s cubic-bezier(.34,1.4,.64,1);
        }
        @media (min-width: 480px) {
          .pim-sheet {
            border: 1px solid rgba(212,175,55,0.22);
            border-radius: 18px;
            max-width: 440px;
            max-height: 88dvh;
            box-shadow: 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,175,55,0.12);
          }
        }

        /* ── Drag handle (mobile only) ── */
        .pim-handle {
          width: 36px;
          height: 4px;
          background: rgba(255,255,255,0.12);
          border-radius: 99px;
          margin: 10px auto 0;
          flex-shrink: 0;
        }
        @media (min-width: 480px) { .pim-handle { display: none; } }

        /* ── Header ── */
        .pim-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.9rem 1.1rem 0.75rem;
          border-bottom: 1px solid rgba(212,175,55,0.1);
          flex-shrink: 0;
        }
        @media (min-width: 480px) {
          .pim-header { padding: 1.1rem 1.3rem 0.9rem; }
        }
        .pim-header-inner { min-width: 0; }
        .pim-header-label {
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          color: #a07c30;
          text-transform: uppercase;
          margin-bottom: 0.2rem;
        }
        .pim-header-title {
          font-size: 1rem;
          font-weight: 800;
          color: #f0e6c8;
          margin: 0;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
        @media (min-width: 480px) {
          .pim-header-title { font-size: 1.1rem; max-width: 320px; }
        }
        .pim-close-btn {
          flex-shrink: 0;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #8a7a6a;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.14s, color 0.14s;
          touch-action: manipulation;
        }
        .pim-close-btn:hover { background: rgba(255,255,255,0.12); color: #f0e6c8; }

        /* ── Scrollable body ── */
        .pim-body {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 0.85rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .pim-body::-webkit-scrollbar { display: none; }
        @media (min-width: 480px) {
          .pim-body { padding: 1rem 1.3rem; gap: 0.85rem; }
        }

        /* ── Progress ── */
        .pim-progress-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        .pim-progress-label { font-size: 0.7rem; color: #7a6a5a; }
        .pim-progress-pct { font-size: 0.7rem; color: #d4af37; font-weight: 700; }
        .pim-bar-track {
          height: 5px;
          background: rgba(255,255,255,0.07);
          border-radius: 99px;
          overflow: hidden;
        }
        .pim-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #a07c30, #d4af37, #f5d76e);
          border-radius: 99px;
          transition: width 0.5s ease;
        }

        /* ── Gold chip ── */
        .pim-gold-chip {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(212,175,55,0.07);
          border: 1px solid rgba(212,175,55,0.16);
          border-radius: 10px;
          padding: 0.55rem 0.85rem;
        }
        .pim-gold-chip-left { flex: 1; min-width: 0; }
        .pim-gold-chip-label {
          font-size: 0.6rem;
          color: #6a5a4a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .pim-gold-chip-value {
          font-size: 1rem;
          font-weight: 800;
          color: #d4af37;
          white-space: nowrap;
        }
        @media (min-width: 480px) {
          .pim-gold-chip-value { font-size: 1.05rem; }
        }

        /* ── Options ── */
        .pim-options { display: flex; flex-direction: column; gap: 0.5rem; }

        .pim-option {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0.75rem 0.9rem;
          cursor: pointer;
          background: rgba(255,255,255,0.025);
          position: relative;
          overflow: hidden;
          transition: border-color 0.15s, background 0.15s;
          /* min touch target */
          min-height: 52px;
          touch-action: manipulation;
        }
        .pim-option:hover { border-color: rgba(212,175,55,0.28); background: rgba(212,175,55,0.04); }
        .pim-option.active {
          border-color: rgba(212,175,55,0.5);
          background: rgba(212,175,55,0.07);
          box-shadow: 0 0 0 1px rgba(212,175,55,0.15);
        }
        .pim-option-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .pim-radio {
          width: 16px;
          height: 16px;
          min-width: 16px;
          border-radius: 50%;
          border: 2px solid rgba(212,175,55,0.3);
          position: relative;
          transition: border-color 0.14s;
          flex-shrink: 0;
        }
        .pim-option.active .pim-radio { border-color: #d4af37; }
        .pim-option.active .pim-radio::after {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: #d4af37;
        }
        .pim-option-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #d4c9a8;
          flex: 1;
        }
        .pim-badge {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          padding: 0.18em 0.55em;
          border-radius: 99px;
          background: linear-gradient(90deg, rgba(212,175,55,0.2), rgba(245,215,110,0.15));
          color: #f5d76e;
          border: 1px solid rgba(245,215,110,0.35);
          white-space: nowrap;
        }
        .pim-option-meta {
          padding-left: 1.6rem;
          margin-top: 0.2rem;
        }
        .pim-option-desc {
          font-size: 0.7rem;
          color: #5a4a3a;
          line-height: 1.4;
        }
        .pim-option-amount {
          font-size: 0.9rem;
          font-weight: 800;
          color: #f5d76e;
          margin-top: 0.15rem;
        }

        /* ── Advance stepper ── */
        .pim-stepper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding-left: 1.6rem;
        }
        .pim-stepper-label { font-size: 0.7rem; color: #6a5a4a; }
        .pim-stepper-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 8px;
          border: 1px solid rgba(212,175,55,0.25);
          background: rgba(212,175,55,0.08);
          color: #d4af37;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.14s;
          touch-action: manipulation;
          line-height: 1;
        }
        .pim-stepper-btn:hover:not(:disabled) { background: rgba(212,175,55,0.18); }
        .pim-stepper-btn:disabled { opacity: 0.28; cursor: not-allowed; }
        .pim-stepper-val {
          font-size: 0.95rem;
          font-weight: 800;
          color: #f0e6c8;
          min-width: 22px;
          text-align: center;
        }

        /* ── Sticky footer ── */
        .pim-footer {
          flex-shrink: 0;
          padding: 0.75rem 1.1rem calc(0.75rem + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        @media (min-width: 480px) {
          .pim-footer { padding: 0.9rem 1.3rem 1.1rem; }
        }

        .pim-alert {
          border-radius: 8px;
          padding: 0.55rem 0.75rem;
          font-size: 0.73rem;
          line-height: 1.4;
        }
        .pim-alert-error {
          background: rgba(220,50,50,0.1);
          border: 1px solid rgba(220,50,50,0.22);
          color: #f08080;
        }
        .pim-alert-success {
          background: rgba(72,180,100,0.1);
          border: 1px solid rgba(72,180,100,0.28);
          color: #7de09a;
        }
        .pim-alert-warn {
          font-size: 0.68rem;
          color: #b06040;
          text-align: center;
          padding: 0.1rem 0;
        }

        .pim-confirm-btn {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.14s, box-shadow 0.18s, opacity 0.15s;
          touch-action: manipulation;
        }
        .pim-confirm-btn:not(:disabled) {
          background: linear-gradient(135deg, #9a7228 0%, #d4af37 55%, #f5d76e 100%);
          color: #150e00;
          box-shadow: 0 4px 18px rgba(212,175,55,0.28);
        }
        .pim-confirm-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 7px 24px rgba(212,175,55,0.38);
        }
        .pim-confirm-btn:not(:disabled):active { transform: translateY(0); }
        .pim-confirm-btn:disabled {
          background: rgba(255,255,255,0.05);
          color: #4a3a2a;
          cursor: not-allowed;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .pim-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 35%,
            rgba(255,255,255,0.22) 50%,
            transparent 65%
          );
          transform: translateX(-100%);
          animation: pim-sh 2.4s infinite;
        }
        @keyframes pim-sh {
          0%   { transform: translateX(-100%); }
          55%, 100% { transform: translateX(210%); }
        }
        .pim-spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(20,12,0,0.3);
          border-top-color: #150e00;
          border-radius: 50%;
          animation: pim-spin 0.65s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }
        @keyframes pim-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Overlay */}
      <div
        ref={overlayRef}
        className="pim-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        {/* Sheet */}
        <div ref={sheetRef} className="pim-sheet" role="dialog" aria-modal="true">

          {/* Mobile drag handle */}
          <div className="pim-handle" />

          {/* ── Header ── */}
          <div className="pim-header">
            <div className="pim-header-inner">
              <div className="pim-header-label">💳 Pagar cuota</div>
              <h2 className="pim-header-title">{itemLabel}</h2>
            </div>
            <button
              className="pim-close-btn"
              onClick={handleClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="pim-body">

            {/* Progress */}
            <div>
              <div className="pim-progress-row">
                <span className="pim-progress-label">
                  Cuotas {plan.paidInstallments}/{plan.totalInstallments} pagadas
                </span>
                <span className="pim-progress-pct">{progressPct}%</span>
              </div>
              <div className="pim-bar-track">
                <div className="pim-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Gold chip */}
            <div className="pim-gold-chip">
              <div className="pim-gold-chip-left">
                <div className="pim-gold-chip-label">Tu oro disponible</div>
              </div>
              <div className="pim-gold-chip-value">{fmt(playerGold)} 🪙</div>
            </div>

            {/* ── Options ── */}
            <div className="pim-options">

              {/* Opción 1 — Pagar 1 cuota */}
              <div
                className={`pim-option${mode === "one" ? " active" : ""}`}
                onClick={() => !success && setMode("one")}
              >
                <div className="pim-option-row">
                  <div className="pim-radio" />
                  <span className="pim-option-name">Pagar 1 cuota</span>
                </div>
                <div className="pim-option-meta">
                  <div className="pim-option-desc">
                    Cubre el próximo vencimiento regular.
                  </div>
                  <div className="pim-option-amount">
                    {fmt(Math.min(plan.installmentAmount, plan.remainingBalance))} 🪙
                  </div>
                </div>
              </div>

              {/* Opción 2 — Adelantar cuotas */}
              {canAdvance && (
                <div
                  className={`pim-option${mode === "advance" ? " active" : ""}`}
                  onClick={() => !success && setMode("advance")}
                >
                  <div className="pim-option-row">
                    <div className="pim-radio" />
                    <span className="pim-option-name">Adelantar cuotas</span>
                  </div>
                  <div className="pim-option-meta">
                    <div className="pim-option-desc">
                      Paga más de una cuota ahora y reduce tu deuda.
                    </div>
                  </div>
                  {mode === "advance" && (
                    <>
                      <div className="pim-stepper">
                        <span className="pim-stepper-label">Cuotas:</span>
                        <button
                          className="pim-stepper-btn"
                          disabled={advanceCount <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdvanceCount((c) => Math.max(1, c - 1));
                          }}
                        >
                          −
                        </button>
                        <span className="pim-stepper-val">{advanceCount}</span>
                        <button
                          className="pim-stepper-btn"
                          disabled={advanceCount >= remaining - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdvanceCount((c) => Math.min(remaining - 1, c + 1));
                          }}
                        >
                          +
                        </button>
                      </div>
                      <div className="pim-option-meta">
                        <div className="pim-option-amount">
                          {fmt(
                            Math.min(
                              plan.installmentAmount * advanceCount,
                              plan.remainingBalance
                            )
                          )}{" "}
                          🪙
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Opción 3 — Liquidar total */}
              <div
                className={`pim-option${mode === "total" ? " active" : ""}`}
                onClick={() => !success && setMode("total")}
              >
                <div className="pim-option-row">
                  <div className="pim-radio" />
                  <span className="pim-option-name">Liquidar deuda total</span>
                  <span className="pim-badge">✦ Libera ítem</span>
                </div>
                <div className="pim-option-meta">
                  <div className="pim-option-desc">
                    Paga el saldo completo y desbloquea el artículo.
                  </div>
                  <div className="pim-option-amount">
                    {fmt(plan.remainingBalance)} 🪙
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Sticky footer ── */}
          <div className="pim-footer">
            {error && (
              <div className="pim-alert pim-alert-error">⚠ {error}</div>
            )}
            {success && (
              <div className="pim-alert pim-alert-success">✅ {success}</div>
            )}

            <button
              className="pim-confirm-btn"
              disabled={loading || !hasEnoughGold || !!success}
              onClick={handlePay}
            >
              {loading ? (
                <>
                  <span className="pim-spinner" />
                  Procesando...
                </>
              ) : success ? (
                "✓ Pagado"
              ) : (
                <>
                  {!success && <span className="pim-shimmer" />}
                  Confirmar — {fmt(amountDue)} 🪙
                </>
              )}
            </button>

            {!hasEnoughGold && !success && (
              <div className="pim-alert pim-alert-warn">
                Te faltan {fmt(amountDue - playerGold)} 🪙 para esta opción
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
