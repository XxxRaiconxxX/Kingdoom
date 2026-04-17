import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Target, X, Shield, Sword, Gem, AlertCircle, CheckCircle2, UserRound, PackageCheck } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { fetchPlayerInventory } from "../utils/inventory";
import { transferGold, transferItem } from "../utils/trade";
import type { InventoryCategoryId, InventoryEntry } from "../types";

const CATEGORY_LABELS: Record<InventoryCategoryId, string> = {
  armors: "Armaduras",
  swords: "Espadas",
  others: "Otros",
};

const CATEGORY_ICONS = {
  armors: Shield,
  swords: Sword,
  others: Gem,
} satisfies Record<InventoryCategoryId, typeof Shield>;

type TradeMode = "gold" | "item";

export function PlayerTradeSheet({ onClose }: { onClose: () => void }) {
  const { player, inventoryRefreshToken, notifyInventoryChanged, refreshPlayer, setPlayerGold } = usePlayerSession();
  
  const [items, setItems] = useState<InventoryEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [mode, setMode] = useState<TradeMode>("gold");
  const [targetUsername, setTargetUsername] = useState("");
  
  // Gold state
  const [goldAmount, setGoldAmount] = useState<string>("");
  
  // Item state
  const [selectedItem, setSelectedItem] = useState<InventoryEntry | null>(null);
  const [itemQuantity, setItemQuantity] = useState<string>("1");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadInventory() {
      if (!player) return;
      setStatus("loading");
      const result = await fetchPlayerInventory(player.id);
      
      if (isCancelled) return;
      
      if (result.status === "unavailable") {
        setItems([]);
        setStatus("unavailable");
        return;
      }

      // Filter out items that are not transferable (like admin rank maybe, but we allow all now)
      setItems(result.items);
      setStatus("ready");
    }

    void loadInventory();
    return () => { isCancelled = true; };
  }, [inventoryRefreshToken, player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;
    
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      if (mode === "gold") {
        const amount = parseInt(goldAmount, 10);
        if (isNaN(amount) || amount <= 0) {
          setFeedback({ type: "error", message: "Cantidad de oro no válida." });
          return;
        }
        
        const result = await transferGold(player, targetUsername, amount);
        if (result.success) {
          setFeedback({ type: "success", message: result.message });
          if (result.newGold !== undefined) {
             void setPlayerGold(result.newGold);
          }
          setGoldAmount("");
        } else {
          setFeedback({ type: "error", message: result.message });
        }
      } else {
        if (!selectedItem) {
          setFeedback({ type: "error", message: "Selecciona un objeto para intercambiar." });
          return;
        }
        const quantity = parseInt(itemQuantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
          setFeedback({ type: "error", message: "Cantidad de objetos no válida." });
          return;
        }
        
        const result = await transferItem(player, targetUsername, selectedItem, quantity);
        if (result.success) {
          setFeedback({ type: "success", message: result.message });
          setSelectedItem(null);
          setItemQuantity("1");
          notifyInventoryChanged();
        } else {
          setFeedback({ type: "error", message: result.message });
        }
      }
    } catch (error) {
       setFeedback({ type: "error", message: "Ocurrió un error inesperado al realizar el intercambio." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] bg-black/70 px-4 py-4 backdrop-blur-md md:px-6 md:py-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto flex h-full max-h-[85vh] w-full max-w-2xl flex-col flex-1 overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4 md:px-6 bg-stone-900/50">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/75 flex items-center gap-2">
              <Send className="h-3 w-3" />
              Centro de Intercambios
            </p>
            <h3 className="mt-2 text-xl font-black text-stone-100 md:text-2xl">
              Enviar al Reino
            </h3>
            <p className="mt-1 text-xs text-stone-400">
              Transfiere oro o artículos a otros jugadores
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Target User */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-300">
                Destinatario
              </label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                <input
                  type="text"
                  required
                  value={targetUsername}
                  onChange={(e) => {
                    setTargetUsername(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  className="w-full rounded-2xl border border-stone-700 bg-stone-900 py-3 pl-10 pr-4 text-sm text-stone-100 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Nombre exacto del jugador..."
                />
              </div>
            </div>

            {/* Mode Selection */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900 pb-2">
               <div className="flex border-b border-stone-800 rounded-t-2xl overflow-hidden">
                 <button
                   type="button"
                   onClick={() => setMode("gold")}
                   className={`flex-1 py-3 text-sm font-semibold transition ${
                     mode === "gold" ? "bg-amber-500/10 text-amber-400 border-b-2 border-amber-500" : "text-stone-500 hover:bg-stone-800/50"
                   }`}
                 >
                   Enviar Oro
                 </button>
                 <button
                   type="button"
                   onClick={() => setMode("item")}
                   className={`flex-1 py-3 text-sm font-semibold transition ${
                     mode === "item" ? "bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500" : "text-stone-500 hover:bg-stone-800/50"
                   }`}
                 >
                   Enviar Objeto
                 </button>
               </div>

               <div className="p-4">
                 {mode === "gold" ? (
                   <div className="space-y-4">
                     <div className="flex justify-between text-sm text-stone-400">
                       <span>Mi balance actual:</span>
                       <span className="font-bold text-amber-300">{player?.gold} de oro</span>
                     </div>
                     <input
                       type="number"
                       required
                       min="1"
                       max={player?.gold ?? 0}
                       value={goldAmount}
                       onChange={(e) => {
                         setGoldAmount(e.target.value);
                         if (feedback) setFeedback(null);
                       }}
                       className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-lg font-bold text-amber-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center"
                       placeholder="Cantidad a enviar..."
                     />
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {status === "loading" ? (
                       <p className="text-sm text-stone-500 text-center py-4 text-xs uppercase tracking-[0.2em] font-semibold animate-pulse">Cargando inventario...</p>
                     ) : status === "unavailable" || items.length === 0 ? (
                       <p className="text-sm text-stone-500 text-center py-4">No tienes objetos que enviar.</p>
                     ) : (
                       <>
                         {!selectedItem ? (
                           <div className="space-y-2">
                             <p className="text-sm font-semibold text-stone-300">Selecciona un objeto:</p>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto max-h-48 custom-scrollbar pr-1">
                               {items.map(item => (
                                 <button
                                   key={item.id}
                                   type="button"
                                   onClick={() => {
                                     setSelectedItem(item);
                                     setItemQuantity("1");
                                     if (feedback) setFeedback(null);
                                   }}
                                   className="relative flex flex-col items-center gap-1 rounded-xl border border-stone-800 bg-stone-950 p-2 transition hover:border-cyan-500/50"
                                 >
                                   {item.itemImageUrl ? (
                                     <img src={item.itemImageUrl} loading="lazy" decoding="async" className="h-10 w-10 object-contain drop-shadow-lg" alt={item.itemName} />
                                   ) : (
                                       <PackageCheck className="h-8 w-8 text-stone-500" />
                                   )}
                                   <span className="text-[10px] text-stone-300 text-center line-clamp-1 w-full">{item.itemName}</span>
                                   <span className="absolute top-1 right-1 bg-stone-800 text-[9px] px-1.5 rounded-full text-stone-400">x{item.quantity}</span>
                                 </button>
                               ))}
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-4">
                             <div className="flex items-center justify-between rounded-xl border border-stone-700 bg-stone-950 p-3">
                               <div className="flex items-center gap-3">
                                  {selectedItem.itemImageUrl ? (
                                     <img src={selectedItem.itemImageUrl} loading="lazy" decoding="async" className="h-12 w-12 object-contain drop-shadow-md" alt={selectedItem.itemName} />
                                  ) : (
                                      <PackageCheck className="h-10 w-10 text-stone-500" />
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-stone-100">{selectedItem.itemName}</p>
                                    <p className="text-xs text-stone-500">Posees {selectedItem.quantity} unidades</p>
                                  </div>
                               </div>
                               <button
                                 type="button"
                                 onClick={() => setSelectedItem(null)}
                                 className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                               >
                                 Cambiar
                               </button>
                             </div>
                             
                             <div className="space-y-2">
                               <label className="text-sm font-semibold text-stone-300">
                                 Cantidad a enviar:
                               </label>
                               <input
                                 type="number"
                                 required
                                 min="1"
                                 max={selectedItem.quantity}
                                 value={itemQuantity}
                                 onChange={(e) => setItemQuantity(e.target.value)}
                                 className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-lg font-bold text-cyan-400 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-center"
                                 placeholder="1"
                               />
                             </div>
                           </div>
                         )}
                       </>
                     )}
                   </div>
                 )}
               </div>
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-center gap-3 rounded-2xl p-4 text-sm ${
                    feedback.type === "success" 
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border border-rose-500/20 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting || (mode === "item" && !selectedItem)}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-4 text-sm font-extrabold text-white transition hover:from-cyan-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
              <Send className="h-4 w-4" />
              {isSubmitting ? "Procesando..." : "Confirmar Envío"}
            </button>

          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
