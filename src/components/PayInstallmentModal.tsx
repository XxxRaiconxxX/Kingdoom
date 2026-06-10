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
  ) => Promise<{ status: "success" | "error"; message?: string; amountPaid?: number; newPlayerGold?: number; planCompleted?: boolean }>;
}

const fmt = (n: number) => n.toLocaleString("es-AR");

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
  const modalRef = useRef<HTMLDivElement>(null);

  const remaining = plan.totalInstallments - plan.paidInstallments;
  const canAdvance = remaining > 1;

  const calcAmount = () => {
    if (mode === "total") return plan.remainingBalance;
    if (mode === "advance") return Math.min(plan.installmentAmount * advanceCount, plan.remainingBalance);
    return Math.min(plan.installmentAmount, plan.remainingBalance);
  };

  const amountDue = calcAmount();
  const hasEnoughGold = playerGold >= amountDue;

  // Animar entrada
  useEffect(() => {
    requestAnimationFrame(() => {
      if (overlayRef.current) overlayRef.current.style.opacity = "1";
      if (modalRef.current) {
        modalRef.current.style.opacity = "1";
        modalRef.current.style.transform = "translateY(0) scale(1)";
      }
    });
  }, []);

  const handleClose = () => {
    if (overlayRef.current) overlayRef.current.style.opacity = "0";
    if (modalRef.current) {
      modalRef.current.style.opacity = "0";
      modalRef.current.style.transform = "translateY(20px) scale(0.97)";
    }
    setTimeout(onClose, 200);
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
        ? `✅ ¡Deuda liquidada! El artículo ya es tuyo libremente.`
        : `✅ Pagaste ${fmt(res.amountPaid ?? 0)} 🪙 correctamente.`
    );
    setTimeout(() => {
      onSuccess({
        amountPaid: res.amountPaid ?? 0,
        newPlayerGold: res.newPlayerGold ?? 0,
        planCompleted: res.planCompleted ?? false,
        planId: plan.id,
      });
    }, 1800);
  };

  const itemLabel = plan.itemId
    .replace(/^armor-|^weapon-|^consumable-|^misc-/i, "")
    .replace(/-/g, " ")
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const progressPct = Math.round((plan.paidInstallments / plan.totalInstallments) * 100);

  return (
    <>
      <style>{`
        .pim-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .pim-modal {
          background: linear-gradient(160deg, #1a1510 0%, #12100d 60%, #0e0c09 100%);
          border: 1px solid rgba(212,175,55,0.25);
          border-radius: 16px;
          box-shadow:
            0 0 0 1px rgba(212,175,55,0.08),
            0 32px 64px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(212,175,55,0.15);
          width: 100%;
          max-width: 460px;
          max-height: 90dvh;
          overflow-y: auto;
          opacity: 0;
          transform: translateY(20px) scale(0.97);
          transition: opacity 0.22s ease, transform 0.22s cubic-bezier(.34,1.56,.64,1);
          scrollbar-width: none;
        }
        .pim-modal::-webkit-scrollbar { display: none; }

        /* Header */
        .pim-header {
          padding: 1.4rem 1.5rem 1rem;
          border-bottom: 1px solid rgba(212,175,55,0.12);
          position: relative;
        }
        .pim-header-label {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          color: #a07c30;
          text-transform: uppercase;
          margin-bottom: 0.3rem;
        }
        .pim-header-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #f0e6c8;
          margin: 0;
          line-height: 1.2;
        }
        .pim-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #8a7a6a;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.15s, color 0.15s;
        }
        .pim-close-btn:hover { background: rgba(255,255,255,0.12); color: #f0e6c8; }

        /* Progress bar */
        .pim-progress-wrap {
          padding: 1rem 1.5rem 0;
        }
        .pim-progress-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.4rem;
        }
        .pim-progress-label { font-size: 0.72rem; color: #7a6a5a; }
        .pim-progress-pct { font-size: 0.72rem; color: #d4af37; font-weight: 600; }
        .pim-progress-bar {
          height: 5px;
          background: rgba(255,255,255,0.06);
          border-radius: 99px;
          overflow: hidden;
        }
        .pim-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a07c30, #d4af37, #f5d76e);
          border-radius: 99px;
          transition: width 0.6s cubic-bezier(.4,0,.2,1);
        }

        /* Gold row */
        .pim-gold-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          margin: 0.75rem 1.5rem;
          background: rgba(212,175,55,0.06);
          border: 1px solid rgba(212,175,55,0.14);
          border-radius: 10px;
        }
        .pim-gold-icon { font-size: 1.1rem; }
        .pim-gold-label { font-size: 0.7rem; color: #7a6a5a; letter-spacing: 0.06em; text-transform: uppercase; }
        .pim-gold-value { font-size: 1.05rem; font-weight: 700; color: #d4af37; margin-left: auto; }

        /* Options */
        .pim-options {
          padding: 0 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .pim-option {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0.9rem 1rem;
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
          background: rgba(255,255,255,0.03);
          position: relative;
          overflow: hidden;
        }
        .pim-option::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 60%, rgba(212,175,55,0.04));
          opacity: 0;
          transition: opacity 0.2s;
        }
        .pim-option:hover { border-color: rgba(212,175,55,0.3); background: rgba(212,175,55,0.04); }
        .pim-option:hover::before { opacity: 1; }
        .pim-option.active {
          border-color: rgba(212,175,55,0.55);
          background: rgba(212,175,55,0.07);
          box-shadow: 0 0 0 1px rgba(212,175,55,0.18), inset 0 1px 0 rgba(212,175,55,0.1);
        }
        .pim-option.active::before { opacity: 1; }
        .pim-option-top {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .pim-option-radio {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(212,175,55,0.3);
          flex-shrink: 0;
          position: relative;
          transition: border-color 0.15s;
        }
        .pim-option.active .pim-option-radio {
          border-color: #d4af37;
        }
        .pim-option.active .pim-option-radio::after {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: #d4af37;
        }
        .pim-option-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #d4c9a8;
          flex: 1;
        }
        .pim-option-badge {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.2em 0.6em;
          border-radius: 99px;
          background: rgba(212,175,55,0.15);
          color: #d4af37;
          border: 1px solid rgba(212,175,55,0.25);
        }
        .pim-option-badge.recommended {
          background: linear-gradient(90deg, rgba(212,175,55,0.22), rgba(245,215,110,0.18));
          color: #f5d76e;
          border-color: rgba(245,215,110,0.4);
          box-shadow: 0 0 8px rgba(212,175,55,0.2);
        }
        .pim-option-desc {
          font-size: 0.75rem;
          color: #6a5a4a;
          margin-top: 0.3rem;
          padding-left: 1.5rem;
        }
        .pim-option-amount {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f5d76e;
          padding-left: 1.5rem;
          margin-top: 0.25rem;
        }

        /* Advance stepper */
        .pim-stepper {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
        }
        .pim-stepper-label { font-size: 0.72rem; color: #7a6a5a; }
        .pim-stepper-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid rgba(212,175,55,0.25);
          background: rgba(212,175,55,0.08);
          color: #d4af37;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          line-height: 1;
        }
        .pim-stepper-btn:hover:not(:disabled) { background: rgba(212,175,55,0.18); border-color: rgba(212,175,55,0.45); }
        .pim-stepper-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pim-stepper-val {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f0e6c8;
          min-width: 24px;
          text-align: center;
        }

        /* Footer */
        .pim-footer {
          padding: 1rem 1.5rem 1.4rem;
          margin-top: 0.75rem;
        }
        .pim-error {
          background: rgba(220,50,50,0.1);
          border: 1px solid rgba(220,50,50,0.25);
          border-radius: 8px;
          padding: 0.6rem 0.8rem;
          font-size: 0.78rem;
          color: #f08080;
          margin-bottom: 0.75rem;
        }
        .pim-success {
          background: rgba(80,180,100,0.1);
          border: 1px solid rgba(80,180,100,0.3);
          border-radius: 8px;
          padding: 0.6rem 0.8rem;
          font-size: 0.78rem;
          color: #80e090;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .pim-pay-btn {
          width: 100%;
          padding: 0.9rem;
          border-radius: 10px;
          border: none;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .pim-pay-btn:not(:disabled) {
          background: linear-gradient(135deg, #a07c30 0%, #d4af37 50%, #f5d76e 100%);
          color: #1a1000;
          box-shadow: 0 4px 20px rgba(212,175,55,0.3);
        }
        .pim-pay-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(212,175,55,0.4);
        }
        .pim-pay-btn:not(:disabled):active { transform: translateY(0); }
        .pim-pay-btn:disabled {
          background: rgba(255,255,255,0.06);
          color: #5a4a3a;
          cursor: not-allowed;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .pim-pay-btn-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%);
          transform: translateX(-100%);
          animation: pim-shimmer 2.2s infinite;
        }
        @keyframes pim-shimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(200%); }
        }
        .pim-insufficient {
          font-size: 0.72rem;
          color: #c06040;
          text-align: center;
          margin-top: 0.5rem;
        }
        .pim-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(26,16,0,0.3);
          border-top-color: #1a1000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 0.4rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pim-divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.05);
          margin: 0.75rem 1.5rem;
        }
      `}</style>

      <div
        ref={overlayRef}
        className="pim-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div ref={modalRef} className="pim-modal" role="dialog" aria-modal="true">

          {/* Header */}
          <div className="pim-header">
            <div className="pim-header-label">💳 Pagar Cuota</div>
            <h2 className="pim-header-title">{itemLabel}</h2>
            <button className="pim-close-btn" onClick={handleClose} aria-label="Cerrar">✕</button>
          </div>

          {/* Progress */}
          <div className="pim-progress-wrap">
            <div className="pim-progress-row">
              <span className="pim-progress-label">
                Cuotas: {plan.paidInstallments}/{plan.totalInstallments} pagadas
              </span>
              <span className="pim-progress-pct">{progressPct}%</span>
            </div>
            <div className="pim-progress-bar">
              <div className="pim-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Gold balance */}
          <div className="pim-gold-row">
            <span className="pim-gold-icon">🪙</span>
            <div>
              <div className="pim-gold-label">Tu oro disponible</div>
            </div>
            <div className="pim-gold-value">{fmt(playerGold)} 🪙</div>
          </div>

          <hr className="pim-divider" />

          {/* Options */}
          <div className="pim-options">

            {/* Opción 1: Pagar 1 cuota */}
            <div
              className={`pim-option ${mode === "one" ? "active" : ""}`}
              onClick={() => !success && setMode("one")}
            >
              <div className="pim-option-top">
                <div className="pim-option-radio" />
                <span className="pim-option-name">Pagar 1 cuota</span>
              </div>
              <div className="pim-option-desc">
                Cubre el próximo vencimiento regular.
              </div>
              <div className="pim-option-amount">
                {fmt(Math.min(plan.installmentAmount, plan.remainingBalance))} 🪙
              </div>
            </div>

            {/* Opción 2: Adelantar cuotas */}
            {canAdvance && (
              <div
                className={`pim-option ${mode === "advance" ? "active" : ""}`}
                onClick={() => !success && setMode("advance")}
              >
                <div className="pim-option-top">
                  <div className="pim-option-radio" />
                  <span className="pim-option-name">Adelantar cuotas</span>
                </div>
                <div className="pim-option-desc">
                  Paga más de una cuota ahora y reduce tu deuda.
                </div>
                {mode === "advance" && (
                  <>
                    <div className="pim-stepper">
                      <span className="pim-stepper-label">Cuotas:</span>
                      <button
                        className="pim-stepper-btn"
                        disabled={advanceCount <= 1}
                        onClick={(e) => { e.stopPropagation(); setAdvanceCount((c) => Math.max(1, c - 1)); }}
                      >−</button>
                      <span className="pim-stepper-val">{advanceCount}</span>
                      <button
                        className="pim-stepper-btn"
                        disabled={advanceCount >= remaining - 1}
                        onClick={(e) => { e.stopPropagation(); setAdvanceCount((c) => Math.min(remaining - 1, c + 1)); }}
                      >+</button>
                    </div>
                    <div className="pim-option-amount">
                      {fmt(Math.min(plan.installmentAmount * advanceCount, plan.remainingBalance))} 🪙
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Opción 3: Liquidar total */}
            <div
              className={`pim-option ${mode === "total" ? "active" : ""}`}
              onClick={() => !success && setMode("total")}
            >
              <div className="pim-option-top">
                <div className="pim-option-radio" />
                <span className="pim-option-name">Liquidar deuda total</span>
                <span className="pim-option-badge recommended">✦ Libera ítem</span>
              </div>
              <div className="pim-option-desc">
                Paga el saldo restante completo y desbloquea el artículo definitivamente.
              </div>
              <div className="pim-option-amount">
                {fmt(plan.remainingBalance)} 🪙
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="pim-footer">
            {error && <div className="pim-error">⚠ {error}</div>}
            {success && <div className="pim-success">{success}</div>}

            <button
              className="pim-pay-btn"
              disabled={loading || !hasEnoughGold || !!success}
              onClick={handlePay}
            >
              {loading ? (
                <><span className="pim-spinner" />Procesando...</>
              ) : success ? (
                "✓ Pagado"
              ) : (
                <>
                  {!success && <span className="pim-pay-btn-shimmer" />}
                  Confirmar pago — {fmt(amountDue)} 🪙
                </>
              )}
            </button>

            {!hasEnoughGold && !success && (
              <div className="pim-insufficient">
                ⚠ Te faltan {fmt(amountDue - playerGold)} 🪙 para esta opción.
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
