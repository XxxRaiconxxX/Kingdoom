import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { PackageCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import type { MarketCategory, MarketItem, PurchaseFormValues } from "../types";
import { createOrderId } from "../utils/orders";
import { supabase } from "../utils/supabaseClient";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xkopndnl";
const MIN_PURCHASE_DELAY_MS = 3000;

type PlayerRecord = {
  id: string;
  username: string;
  gold: number;
};

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
  const [remainingGold, setRemainingGold] = useState<number | null>(null);

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

  async function restoreGold(player: PlayerRecord | null) {
    if (!player) {
      return;
    }

    await supabase.from("players").update({ gold: player.gold }).eq("id", player.id);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formValues.gotcha.trim() !== "") {
      setSubmitState("success");
      setOrderId(createOrderId());
      setFeedbackMessage("Pedido registrado.");
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
    setRemainingGold(null);

    const normalizedBuyerName = formValues.buyerName.trim();
    let playerSnapshot: PlayerRecord | null = null;
    let goldWasDeducted = false;

    try {
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("id, username, gold")
        .ilike("username", normalizedBuyerName)
        .single();

      if (playerError || !player) {
        setSubmitState("error");
        setFeedbackMessage(
          "Jugador no encontrado. Verifica que el nombre sea exactamente el que esta registrado."
        );
        return;
      }

      playerSnapshot = player as PlayerRecord;

      if (playerSnapshot.gold < totalPrice) {
        setSubmitState("error");
        setFeedbackMessage(
          `No tienes suficiente oro. Necesitas ${totalPrice} de oro y tienes ${playerSnapshot.gold} de oro.`
        );
        return;
      }

      const newGold = playerSnapshot.gold - totalPrice;
      const { error: updateError } = await supabase
        .from("players")
        .update({ gold: newGold })
        .eq("id", playerSnapshot.id);

      if (updateError) {
        setSubmitState("error");
        setFeedbackMessage(
          "Hubo un error al procesar el pago en la base de datos. Intenta nuevamente."
        );
        return;
      }

      goldWasDeducted = true;

      const nextOrderId = createOrderId();
      const data = new FormData();
      data.append("nombre", normalizedBuyerName);
      data.append("whatsapp", formValues.whatsapp);
      data.append("producto", item.name);
      data.append("categoria", category?.title ?? item.category);
      data.append("precio", `${item.price}`);
      data.append("cantidad", `${formValues.quantity}`);
      data.append("total", `${totalPrice}`);
      data.append("pedido_id", nextOrderId);
      data.append("_subject", `Nuevo pedido ${nextOrderId} - ${item.name}`);
      data.append("_gotcha", formValues.gotcha);

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setOrderId(nextOrderId);
        setRemainingGold(newGold);
        setSubmitState("success");
        setFeedbackMessage(
          `Pedido enviado con exito. Se descontaron ${totalPrice} de oro de tu cuenta.`
        );
        return;
      }

      if (goldWasDeducted) {
        await restoreGold(playerSnapshot);
      }

      const payload = (await response.json().catch(() => null)) as
        | { errors?: Array<{ message?: string }> }
        | null;
      const apiMessage =
        payload?.errors
          ?.map((entry) => entry.message)
          .filter(Boolean)
          .join(", ") ?? "";

      setSubmitState("error");
      setFeedbackMessage(
        apiMessage ||
          "No se pudo enviar el pedido. El oro fue restaurado en tu cuenta."
      );
    } catch {
      if (goldWasDeducted) {
        await restoreGold(playerSnapshot);
      }

      setSubmitState("error");
      setFeedbackMessage(
        "No se pudo conectar con el sistema. Si el oro ya se habia descontado, se intento restaurar automaticamente."
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/70 px-4 py-6 backdrop-blur-sm md:px-6 md:py-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/40 md:max-w-3xl"
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

        <div className="overflow-y-auto px-5 py-5 md:px-6">
          <div className="mb-5 overflow-hidden rounded-[1.6rem] border border-stone-800 bg-stone-900/80">
            <div className="aspect-[16/10] bg-stone-950">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  style={{
                    objectFit: item.imageFit ?? "cover",
                    objectPosition: item.imagePosition ?? "center",
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PackageCheck className="h-10 w-10 text-amber-400" />
                </div>
              )}
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
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <PurchaseReadonlyField label="Pedido" value={orderId} />
                  <PurchaseReadonlyField
                    label="Total"
                    value={`${totalPrice} de oro`}
                  />
                  {remainingGold !== null ? (
                    <PurchaseReadonlyField
                      label="Oro restante"
                      value={`${remainingGold} de oro`}
                    />
                  ) : null}
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
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    Nombre del jugador registrado
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
                    placeholder="Tu nombre en la base de datos"
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
                <p className="font-semibold text-amber-300">Validacion del pago</p>
                <p className="mt-2">
                  Antes de enviar el pedido, el sistema comprueba que el jugador
                  exista en la base de datos y que tenga suficiente oro. Si
                  Formspree falla, se intenta restaurar el saldo automaticamente.
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
