import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { PackageCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import type { MarketCategory, MarketItem, PurchaseFormValues } from "../types";
import { createOrderId } from "../utils/orders";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xkopndnl";
const MIN_PURCHASE_DELAY_MS = 3000;

export function PurchaseModal({
  item,
  category,
  onClose,
}: {
  item: MarketItem;
  category: MarketCategory | undefined;
  onClose: () => void;
}) {
  const [formValues, setFormValues] = useState<PurchaseFormValues>({
    buyerName: "",
    whatsapp: "",
    quantity: 1,
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

  const totalPrice = useMemo(
    () => item.price * Math.max(1, formValues.quantity),
    [item.price, formValues.quantity]
  );
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
      setFeedbackMessage("Pedido enviado.");
      return;
    }

    if (isDelayActive) {
      setSubmitState("error");
      setFeedbackMessage(
        "Espera unos segundos antes de enviar el pedido para validar el formulario."
      );
      return;
    }

    setSubmitState("submitting");
    setFeedbackMessage("");

    const nextOrderId = createOrderId();
    const data = new FormData();
    data.append("nombre", formValues.buyerName);
    data.append("whatsapp", formValues.whatsapp);
    data.append("producto", item.name);
    data.append("categoria", category?.title ?? item.category);
    data.append("precio", `${item.price}`);
    data.append("cantidad", `${formValues.quantity}`);
    data.append("total", `${totalPrice}`);
    data.append("pedido_id", nextOrderId);
    data.append("_subject", `Nuevo pedido ${nextOrderId} - ${item.name}`);
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
          "Pedido enviado con exito. Te llegara al correo configurado en Formspree."
        );
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { errors?: Array<{ message?: string }> }
        | null;
      const apiMessage =
        payload?.errors?.map((entry) => entry.message).filter(Boolean).join(", ") ??
        "";

      setSubmitState("error");
      setFeedbackMessage(
        apiMessage || "No se pudo enviar el pedido. Intentalo otra vez."
      );
    } catch {
      setSubmitState("error");
      setFeedbackMessage(
        "No se pudo conectar con el sistema de pedidos. Intenta nuevamente."
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/70 px-4 py-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
              Pedido del mercado
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-100">
              Confirmar compra
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

        <div className="overflow-y-auto px-5 py-5">
          <div className="mb-5 overflow-hidden rounded-[1.6rem] border border-stone-800 bg-stone-900/80">
            <div className="aspect-[16/10] bg-stone-950">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2 p-4">
              <h4 className="text-lg font-bold text-stone-100">{item.name}</h4>
              <p className="text-sm leading-6 text-stone-400">
                {item.description}
              </p>
            </div>
          </div>

          {submitState === "success" ? (
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-bold text-emerald-300">
                  Compra enviada
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {feedbackMessage}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <PurchaseReadonlyField label="Pedido" value={orderId} />
                  <PurchaseReadonlyField
                    label="Total"
                    value={`${totalPrice} de oro`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    Nombre
                  </span>
                  <input
                    required
                    type="text"
                    value={formValues.buyerName}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        buyerName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
                    placeholder="Tu nombre"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    WhatsApp
                  </span>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    value={formValues.whatsapp}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        whatsapp: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
                    placeholder="+595 9xx xxx xxx"
                  />
                </label>

                <PurchaseReadonlyField label="Producto" value={item.name} />
                <PurchaseReadonlyField
                  label="Categoria"
                  value={category?.title ?? item.category}
                />
                <PurchaseReadonlyField
                  label="Precio unitario"
                  value={`${item.price} de oro`}
                />

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    Cantidad
                  </span>
                  <input
                    required
                    min={1}
                    max={99}
                    type="number"
                    value={formValues.quantity}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        quantity: Math.max(1, Number(event.target.value || 1)),
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                  />
                </label>

                <PurchaseReadonlyField
                  label="Total"
                  value={`${totalPrice} de oro`}
                />

                <div className="hidden">
                  <label>
                    No completar
                    <input
                      type="text"
                      name="_gotcha"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formValues.gotcha}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          gotcha: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-stone-800 bg-stone-900/70 p-4 text-sm leading-6 text-stone-400">
                <p className="font-semibold text-amber-300">Proteccion anti-spam</p>
                <p className="mt-2">
                  El formulario usa filtro honeypot, un retraso breve antes del
                  envio y bloqueo mientras procesa. Si el proyecto crece, puedes
                  activar captcha desde Formspree.
                </p>
              </div>

              {feedbackMessage && submitState === "error" ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {feedbackMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitState === "submitting" || isDelayActive}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                  submitState === "submitting" || isDelayActive
                    ? "cursor-not-allowed bg-stone-800 text-stone-500"
                    : "bg-amber-500 text-stone-950 hover:bg-amber-400"
                }`}
              >
                <PackageCheck className="h-4 w-4" />
                {submitState === "submitting"
                  ? "Enviando pedido..."
                  : isDelayActive
                    ? `Preparando formulario... ${remainingDelaySeconds}s`
                    : "Enviar pedido"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PurchaseReadonlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <div className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3 text-sm text-stone-300">
        {value}
      </div>
    </div>
  );
}
