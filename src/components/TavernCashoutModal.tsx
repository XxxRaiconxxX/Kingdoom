import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { PackageCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import { createOrderId } from "../utils/orders";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xvzvavvd";
const MIN_PURCHASE_DELAY_MS = 3000;

export function TavernCashoutModal({
  balance,
  onClose,
  onSuccess,
}: {
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formValues, setFormValues] = useState({
    buyerName: "",
    whatsapp: "",
    gotcha: "",
  });
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(timer);
  }, []);

  const remainingDelayMs = Math.max(
    0,
    MIN_PURCHASE_DELAY_MS - (now - openedAt)
  );
  const remainingDelaySeconds = Math.ceil(remainingDelayMs / 1000);
  const isDelayActive = remainingDelayMs > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formValues.gotcha.trim() !== "") {
      setSubmitState("success");
      setOrderId(createOrderId());
      setFeedbackMessage("Retiro enviado.");
      return;
    }

    if (isDelayActive) {
      setSubmitState("error");
      setFeedbackMessage(
        "Espera unos segundos antes de retirar para validar el formulario."
      );
      return;
    }

    setSubmitState("submitting");
    setFeedbackMessage("");

    const nextOrderId = createOrderId();
    const data = new FormData();
    data.append("nombre", formValues.buyerName);
    data.append("whatsapp", formValues.whatsapp);
    data.append("producto", "Retiro de Taberna");
    data.append("categoria", "Apuestas / Doble o Nada");
    data.append("cantidad_retirada", `${balance}`);
    data.append("pedido_id", nextOrderId);
    data.append("_subject", `Retiro ${nextOrderId} - Taberna: ${balance} oro`);
    data.append("_gotcha", formValues.gotcha);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setOrderId(nextOrderId);
        setSubmitState("success");
        setFeedbackMessage(
          "Tu solicitud de retiro fue enviada al consejo. Contacta a un administrador en WhatsApp con tu código de retiro."
        );
        onSuccess();
        return;
      }

      setSubmitState("error");
      setFeedbackMessage("No se pudo enviar el retiro. Intentalo otra vez.");
    } catch {
      setSubmitState("error");
      setFeedbackMessage(
        "No se pudo conectar con el sistema. Intenta nuevamente."
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/80 px-4 py-6 backdrop-blur-md md:px-6 md:py-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-amber-900/10 md:max-w-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 bg-gradient-to-r from-stone-900 to-stone-950 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
              Corredor de apuestas
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-100">
              Retirar Ganancias
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 md:px-6">
          {submitState === "success" ? (
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-amber-500/30 bg-amber-500/10 p-5 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                <p className="text-lg font-black text-amber-400">
                  Retiro Confirmado
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {feedbackMessage}
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <ReadonlyField label="Código de retiro" value={orderId} />
                  <ReadonlyField label="Oro cobrado" value={`${balance} 🪙`} />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-bold text-stone-200 transition hover:bg-stone-800 hover:text-white"
              >
                Cerrar y salir de la mesa
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 pb-6 text-center">
                <p className="text-sm text-stone-400">Estas a punto de retirar</p>
                <p className="mt-2 text-4xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  {balance} 🪙
                </p>
              </div>

              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    Tu Nombre / Personaje
                  </span>
                  <input
                    required
                    type="text"
                    value={formValues.buyerName}
                    onChange={(e) =>
                      setFormValues({ ...formValues, buyerName: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/40"
                    placeholder="Ej. Kaelen D'Aris"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    WhatsApp (Para verificar el retiro)
                  </span>
                  <input
                    required
                    type="tel"
                    value={formValues.whatsapp}
                    onChange={(e) =>
                      setFormValues({ ...formValues, whatsapp: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/40"
                    placeholder="+595 9xx xxx xxx"
                  />
                </label>
                <div className="hidden">
                  <input
                    type="text"
                    name="_gotcha"
                    tabIndex={-1}
                    value={formValues.gotcha}
                    onChange={(e) =>
                      setFormValues({ ...formValues, gotcha: e.target.value })
                    }
                  />
                </div>
              </div>

              {feedbackMessage && submitState === "error" && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {feedbackMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submitState === "submitting" || isDelayActive}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition ${
                  submitState === "submitting" || isDelayActive
                    ? "cursor-not-allowed bg-stone-800 text-stone-500"
                    : "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:from-amber-400 hover:to-amber-300 hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
                }`}
              >
                <PackageCheck className="h-5 w-5" />
                {submitState === "submitting"
                  ? "Procesando el retiro..."
                  : isDelayActive
                    ? `Verificando firma en ${remainingDelaySeconds}s`
                    : "Cobrar mi oro"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-stone-400">{label}</span>
      <div className="rounded-2xl bg-stone-950/40 px-3 py-2 text-sm font-medium text-stone-200">
        {value}
      </div>
    </div>
  );
}
