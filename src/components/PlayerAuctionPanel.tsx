import { useEffect, useState } from "react";
import { Gavel, Clock, Coins, CheckCircle, HelpCircle, AlertTriangle } from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { fetchAuctions, placeAuctionBid, withdrawFromAuction } from "../utils/auctions";
import { supabase } from "../utils/supabaseClient";
import type { MarketAuction, Rarity } from "../types";

const rarityColors: Record<Rarity, string> = {
  mythic: "border-red-500/60 bg-red-950/20 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.25)]",
  legendary: "border-amber-500/60 bg-amber-950/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
  epic: "border-fuchsia-500/60 bg-fuchsia-950/20 text-fuchsia-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
  rare: "border-sky-500/60 bg-sky-950/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]",
  common: "border-stone-700 bg-stone-900/40 text-stone-300",
};

function AuctionCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const diffMs = new Date(expiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeLeft("Finalizada");
        onExpire?.();
        return;
      }
      const totalSecs = Math.floor(diffMs / 1000);
      const secs = totalSecs % 60;
      const totalMins = Math.floor(totalSecs / 60);
      const mins = totalMins % 60;
      const totalHours = Math.floor(totalMins / 60);
      const hours = totalHours % 24;
      const days = Math.floor(totalHours / 24);

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0) parts.push(`${mins}m`);
      if (days === 0 && hours === 0) parts.push(`${secs}s`);
      setTimeLeft(parts.join(" "));
    }

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  return <span>{timeLeft}</span>;
}

export function PlayerAuctionPanel() {
  const { player, refreshPlayer, isPlayerSecureLinked } = usePlayerSession();
  const [auctions, setAuctions] = useState<MarketAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { text: string; tone: "success" | "error" }>>({});
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [isSubmittingMap, setIsSubmittingMap] = useState<Record<string, boolean>>({});

  async function loadAuctions() {
    const result = await fetchAuctions(player?.id);
    if (result.status === "ready") {
      // Filter to only active ones for players
      const activeAuctions = result.auctions.filter((a) => a.status === "active");
      setAuctions(activeAuctions);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    void loadAuctions();

    // Subscribe to realtime updates on auctions, bids and participants
    const channel = supabase
      .channel("realtime-player-auctions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_auctions" },
        () => {
          void loadAuctions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_auction_bids" },
        () => {
          void loadAuctions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_auction_participants" },
        () => {
          void loadAuctions();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [player?.id]);

  const handleBidSubmit = async (auction: MarketAuction) => {
    if (!player) return;

    const minBid = auction.highestBid > 0 ? auction.highestBid + auction.minIncrement : auction.startPrice;
    const rawVal = bidAmounts[auction.id];
    const bidAmount = rawVal !== undefined && rawVal !== "" ? parseInt(rawVal, 10) : minBid;

    if (bidAmount < minBid) {
      setFeedbackMap((prev) => ({
        ...prev,
        [auction.id]: { text: `La oferta mínima requerida es de ${minBid.toLocaleString("es-PY")} oro.`, tone: "error" },
      }));
      return;
    }

    if (player.gold < bidAmount) {
      setFeedbackMap((prev) => ({
        ...prev,
        [auction.id]: { text: "No tienes suficiente oro para esta puja.", tone: "error" },
      }));
      return;
    }

    setIsSubmittingMap((prev) => ({ ...prev, [auction.id]: true }));
    setFeedbackMap((prev) => ({ ...prev, [auction.id]: { text: "", tone: "success" } }));

    const result = await placeAuctionBid({
      playerId: player.id,
      auctionId: auction.id,
      amount: bidAmount,
    });

    setIsSubmittingMap((prev) => ({ ...prev, [auction.id]: false }));

    if (result.status === "success") {
      setFeedbackMap((prev) => ({
        ...prev,
        [auction.id]: { text: "¡Puja registrada con éxito!", tone: "success" },
      }));
      void refreshPlayer();
      void loadAuctions();
    } else {
      setFeedbackMap((prev) => ({
        ...prev,
        [auction.id]: { text: result.message || "Error al realizar puja.", tone: "error" },
      }));
    }
  };

  const handleWithdrawClick = async (auction: MarketAuction) => {
    if (!player) return;

    const confirm = window.confirm(
      `¿Seguro que deseas retirarte de la subasta de "${auction.itemName}"?\n\n¡ATENCIÓN! Ya no podrás volver a pujar en este artículo. Si eres el líder actual, tu puja seguirá activa y bloqueada hasta que ganes o seas superado.`
    );
    if (!confirm) return;

    setIsSubmittingMap((prev) => ({ ...prev, [auction.id]: true }));

    const result = await withdrawFromAuction({
      playerId: player.id,
      auctionId: auction.id,
    });

    setIsSubmittingMap((prev) => ({ ...prev, [auction.id]: false }));

    if (result.status === "success") {
      setFeedbackMap((prev) => ({
        ...prev,
        [auction.id]: { text: "Te has retirado de la subasta.", tone: "success" },
      }));
      void loadAuctions();
    } else {
      setFeedbackMap((prev) => ({
        ...prev,
        [auction.id]: { text: result.message || "Error al retirarse.", tone: "error" },
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-stone-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500" />
        <p className="mt-3 text-sm">Consultando subastas en curso...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso general de Reglas de Subasta */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
        <div className="text-xs leading-5 text-amber-200">
          <p className="font-extrabold uppercase tracking-wide">Reglas de Subastas en Vyralis</p>
          <p className="mt-1 opacity-90 font-medium">
            El oro de tu puja se bloqueará temporalmente mientras seas el líder. Si otro aventurero supera tu oferta, tu oro te será **reembolsado de inmediato**. Se descuenta una única **comisión del 25% del valor base del ítem** no reembolsable al ingresar a la subasta.
          </p>
        </div>
      </div>

      {auctions.length === 0 ? (
        <div className="rounded-2xl border border-stone-850 bg-stone-950/20 py-8 text-center text-sm text-stone-500">
          No hay subastas del reino activas en este momento. Vuelve más tarde.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {auctions.map((auction) => {
            const minBid = auction.highestBid > 0 ? auction.highestBid + auction.minIncrement : auction.startPrice;
            const isSubmitting = isSubmittingMap[auction.id] || false;
            const feedback = feedbackMap[auction.id];
            const isHighestBidder = player?.id === auction.highestBidderId;
            const hasWithdrawn = auction.hasWithdrawn;

            return (
              <div
                key={auction.id}
                className={`flex flex-col overflow-hidden rounded-[1.8rem] border p-5 transition-all ${
                  rarityColors[auction.itemRarity] || rarityColors.common
                }`}
              >
                {/* Header: Item & Rarity Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-stone-950/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]">
                      {auction.itemCategory}
                    </span>
                    <h4 className="mt-1 text-lg font-black text-stone-100">{auction.itemName}</h4>
                  </div>
                  <span className="rounded-full border border-stone-700/60 bg-stone-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                    {auction.itemRarity}
                  </span>
                </div>

                {/* Description */}
                {auction.itemDescription ? (
                  <p className="mt-3 text-sm leading-6 text-stone-400 line-clamp-3">
                    {auction.itemDescription}
                  </p>
                ) : (
                  <p className="mt-3 text-sm italic text-stone-500">Sin descripción adicional.</p>
                )}

                {/* Auction Info Summary */}
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-stone-950/40 p-3.5 border border-stone-900">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-stone-500">Líder Actual</p>
                    <p className="text-sm font-bold text-stone-200">
                      {auction.highestBidderUsername || "Nadie aún"}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-stone-500">Puja Acumulada</p>
                    <p className="text-sm font-extrabold text-amber-300">
                      🪙 {auction.highestBid.toLocaleString("es-PY")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-stone-500">Precio Inicial</p>
                    <p className="text-xs text-stone-300">🪙 {auction.startPrice.toLocaleString("es-PY")}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-stone-500">Min. Incremento</p>
                    <p className="text-xs text-stone-400">🪙 {auction.minIncrement.toLocaleString("es-PY")}</p>
                  </div>
                  <div className="col-span-2 border-t border-stone-900/60 pt-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500">Tiempo restante</span>
                    <div className="flex items-center gap-1 text-xs text-stone-200">
                      <Clock className="h-3 w-3 text-stone-400" />
                      <AuctionCountdown expiresAt={auction.expiresAt} onExpire={loadAuctions} />
                    </div>
                  </div>
                </div>

                {/* Action Area */}
                <div className="mt-5 flex-1 flex flex-col justify-end">
                  {!player ? (
                    <div className="rounded-xl bg-stone-950/60 border border-stone-850/60 p-3 text-center text-xs text-stone-500">
                      Vincúlate al bot para pujar en este artículo.
                    </div>
                  ) : hasWithdrawn ? (
                    <div className="rounded-xl bg-red-950/30 border border-red-500/20 p-3 text-center text-xs text-red-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <HelpCircle className="h-4 w-4" />
                      Te has retirado de esta subasta
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isHighestBidder && (
                        <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-2.5 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ¡Eres el líder de la subasta!
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Bid input */}
                        <div className="relative flex-1">
                          <Coins className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={bidAmounts[auction.id] !== undefined ? bidAmounts[auction.id] : minBid.toString()}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, "");
                              setBidAmounts((prev) => ({ ...prev, [auction.id]: cleaned }));
                            }}
                            className="w-full rounded-2xl border border-stone-800 bg-stone-950/50 py-2.5 pl-10 pr-4 text-sm font-extrabold text-stone-200 outline-none focus:border-amber-400/40"
                          />
                        </div>

                        {/* Bid button */}
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleBidSubmit(auction)}
                          className="kd-touch rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-stone-950 hover:bg-amber-400 transition disabled:opacity-50 flex items-center gap-1"
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          Pujar
                        </button>
                      </div>

                      {/* Withdraw action link */}
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-stone-500 font-semibold">
                          Oferta mínima: 🪙 {minBid.toLocaleString("es-PY")}
                        </span>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleWithdrawClick(auction)}
                          className="text-stone-500 font-bold uppercase tracking-wider hover:text-red-400 transition"
                        >
                          Retirarse de la subasta
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Message */}
                  {feedback && feedback.text && (
                    <p
                      className={`mt-3 text-center text-xs font-bold ${
                        feedback.tone === "success" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {feedback.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
