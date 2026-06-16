import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { PackageCheck, UserRound, WalletCards, X } from "lucide-react";
import { motion } from "framer-motion";
import type { MarketCategory, MarketItem, PurchaseFormValues } from "../types";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { createOrderId } from "../utils/orders";
import { purchaseMarketItemSecure } from "../utils/purchases";

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
  const { player, refreshPlayer, notifyInventoryChanged } = usePlayerSession();
  const [formValues, setFormValues] = useState<PurchaseFormValues & { installments: number }>({
    whatsapp: "",
    quantity: 1,
    installments: 1,
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

  const baseTotal = item.price * Math.max(1, formValues.quantity);
  const interestRate = formValues.installments === 3 ? 0.10 : formValues.installments === 6 ? 0.18 : 0;
  const totalPrice = Math.ceil(baseTotal * (1 + interestRate));
  const installmentAmount = formValues.installments > 1 ? Math.ceil(totalPrice / formValues.installments) : totalPrice;
  const paidNow = installmentAmount;
  const remainingDelayMs = Math.max(
    0,
    MIN_PURCHASE_DELAY_MS - (now - openedAt)
  );
  const remainingDelaySeconds = Math.ceil(remainingDelayMs / 1000);
  const isDelayActive = remainingDelayMs > 0;
  const stockLimit = Math.max(0, Math.floor(item.stockLimit ?? 0));
  const stockSold = Math.max(0, Math.floor(item.stockSold ?? 0));
  const remainingStock = stockLimit > 0 ? Math.max(0, stockLimit - stockSold) : null;
  const isSoldOut = item.stockStatus === "sold-out" || remainingStock === 0;
  const maxPurchaseQuantity = remainingStock ?? 99;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formValues.gotcha.trim() !== "") {
      setSubmitState("success");
      setOrderId(createOrderId());
      setFeedbackMessage("Pedido registrado.");
      return;
    }

    if (!player) {
      setSubmitState("error");
      setFeedbackMessage(
        "Conecta primero tu perfil del reino para poder comprar en el mercado."
      );
      return;
    }

    if (isSoldOut) {
      setSubmitState("error");
      setFeedbackMessage("Ese item esta agotado.");
      return;
    }

    if (formValues.quantity > maxPurchaseQuantity) {
      setSubmitState("error");
      setFeedbackMessage(`Solo quedan ${maxPurchaseQuantity} unidades disponibles.`);
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

    const latestPlayer = await refreshPlayer();

    if (!latestPlayer) {
      setSubmitState("error");
      setFeedbackMessage(
        "No se pudo refrescar tu perfil. Reconectalo y prueba nuevamente."
      );
      return;
    }

    if (latestPlayer.gold < paidNow) {
      setSubmitState("error");
      setFeedbackMessage(
        `No tienes suficiente oro. Necesitas ${paidNow} de oro para esta compra y tu perfil solo tiene ${latestPlayer.gold}.`
      );
      return;
    }

    const nextOrderId = createOrderId();
const purchaseResult = await purchaseMarketItemSecure({
  playerId: latestPlayer.id,
  itemId: item.id,
  quantity: formValues.quantity,
  whatsapp: formValues.whatsapp,
  orderRef: nextOrderId,
  installments: formValues.installments,
});


    if (purchaseResult.status === "error") {
      setSubmitState("error");
      setFeedbackMessage(purchaseResult.message);
      return;
    }

    try {
      const data = new FormData();
      data.append("nombre", latestPlayer.username);
      data.append("whatsapp", formValues.whatsapp);
      data.append("producto", item.name);
      data.append("categoria", category?.title ?? item.category);
      data.append("precio", `${item.price}`);
      data.append("cantidad", `${formValues.quantity}`);
      data.append("total", `${purchaseResult.totalPrice}`);
      data.append("pedido_id", purchaseResult.orderRef);
      data.append("_subject", `Nuevo pedido ${purchaseResult.orderRef} - ${item.name}`);
      data.append("_gotcha", formValues.gotcha);

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      });
      const formspreeFailed = !response.ok;
      const formspreeWarning = formspreeFailed
        ? " El pedido quedo guardado, pero el aviso externo debe revisarse manualmente."
        : "";

      setOrderId(purchaseResult.orderRef);
      setRemainingGold(purchaseResult.remainingGold);
      setSubmitState("success");

      void refreshPlayer();
      notifyInventoryChanged();

      const inventoryMessage = purchaseResult.inventorySynced
        ? " El objeto ya aparece en tu inventario."
        : " Las pociones no se guardan en el inventario persistente.";

      setFeedbackMessage(
        `Compra segura confirmada. Se descontaron ${purchaseResult.totalPrice} de oro de tu perfil activo.${inventoryMessage}${formspreeWarning}`
      );
    } catch {
      setOrderId(purchaseResult.orderRef);
      setRemainingGold(purchaseResult.remainingGold);
      setSubmitState("success");
      void refreshPlayer();
      notifyInventoryChanged();
      setFeedbackMessage(
        `Compra confirmada. Se descontaron ${purchaseResult.totalPrice} de oro y el pedido quedo registrado. Revisa el aviso externo manualmente.`
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm md:items-center md:px-6 md:py-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="my-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/40 md:max-w-3xl"
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
            aria-label="Cerrar compra"
            className="rounded-full border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 md:px-6">
          <div className="mb-5 overflow-hidden rounded-[1.6rem] border border-stone-800 bg-stone-900/80">
            <div className="aspect-[16/10] bg-stone-950">
              {item.imageUrl ? (
                <img loading="lazy" decoding="async" 
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
                    value={formValues.installments > 1 ? `${totalPrice} (${formValues.installments} cuotas)` : `${totalPrice} de oro`}
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
              {player ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.35rem] border border-stone-800 bg-stone-900/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                          Perfil activo
                        </p>
                        <p className="mt-1 text-sm font-bold text-stone-100">
                          {player.username}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-stone-800 bg-stone-900/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                        <WalletCards className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                          Oro actual
                        </p>
                        <p className="mt-1 text-sm font-bold text-amber-300">
                          {player.gold} de oro
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  Conecta tu perfil del reino antes de comprar.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
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
                    max={maxPurchaseQuantity}
                    type="text"
                    inputMode="numeric"
                    value={formValues.quantity === 0 ? "" : formValues.quantity}
                    onChange={(event) => {
                      const val = event.target.value;
                      const num = parseInt(val, 10);
                      setFormValues((current) => ({
                        ...current,
                        quantity: isNaN(num) ? 0 : Math.min(maxPurchaseQuantity, num),
                      }));
                    }}
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                  />
                </label>

                <div className="md:col-span-2 space-y-3">
                  <span className="text-sm font-semibold text-stone-200">
                    Plan de Pago
                  </span>
                  <div className="space-y-5 px-1 py-2">
                    <div className="relative flex items-center">
                      {/* Track background */}
                      <div className="h-2 w-full rounded-full bg-stone-800" />
                      {/* Active track highlight */}
                      <div 
                        className="absolute top-0 h-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-300"
                        style={{ 
                          width: `${(([1, 3, 6].indexOf(formValues.installments)) / 2) * 100}%` 
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        value={[1, 3, 6].indexOf(formValues.installments)}
                        onChange={(e) => {
                          const idx = parseInt(e.target.value, 10);
                          const installmentOptions = [1, 3, 6];
                          setFormValues(curr => ({ ...curr, installments: installmentOptions[idx] }));
                        }}
                        className="absolute inset-x-0 h-4 w-full cursor-pointer appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-stone-950 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(245,158,11,0.8)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                      />
                    </div>
                    
                    <div className="flex justify-between px-1">
                      {[1, 3, 6].map((cuota) => {
                        const isSelected = formValues.installments === cuota;
                        return (
                          <button
                            key={cuota}
                            type="button"
                            onClick={() => setFormValues(curr => ({ ...curr, installments: cuota }))}
                            className={`flex flex-col items-center gap-2 transition duration-200 ${
                              isSelected ? 'text-amber-400 scale-105' : 'text-stone-500 hover:text-stone-300'
                            }`}
                          >
                            <span className="text-xs font-black uppercase tracking-wider">
                              {cuota === 1 ? 'Al contado' : `${cuota} Cuotas`}
                            </span>
                            <div className={`h-2 w-2 rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-amber-400 scale-125 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-stone-700'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {formValues.installments > 1 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200/90 leading-relaxed shadow-inner"
                    >
                      Este ítem quedará <strong>bloqueado</strong> y no podrá ser transferido hasta cancelar la deuda. <br/>
                      <span className="text-amber-400 font-semibold">Interés aplicado: {formValues.installments === 3 ? '10%' : '18%'}.</span><br/>
                      Total con interés: <strong>{totalPrice} de oro</strong>.<br/>
                      Primera cuota a pagar ahora: <strong>{installmentAmount} de oro</strong>.
                    </motion.div>
                  )}
                </div>

                <PurchaseReadonlyField label="Total (o Primera Cuota)" value={`${paidNow} de oro`} />
                {remainingStock !== null ? (
                  <PurchaseReadonlyField
                    label="Disponibles"
                    value={`${remainingStock} de ${stockLimit}`}
                  />
                ) : null}

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

              {feedbackMessage && submitState === "error" ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {feedbackMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!player || submitState === "submitting" || isDelayActive || isSoldOut}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                  !player || submitState === "submitting" || isDelayActive || isSoldOut
                    ? "cursor-not-allowed bg-stone-800 text-stone-500"
                    : "bg-amber-500 text-stone-950 hover:bg-amber-400"
                }`}
              >
                <PackageCheck className="h-4 w-4" />
                {submitState === "submitting"
                  ? "Enviando pedido..."
                  : isSoldOut
                    ? "Agotado"
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
