import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Gavel, Clock, Coins, MessageSquare, Loader2, Play, CheckCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import type { MarketAuction, MarketAuctionBid, MarketItem, Rarity, AuctionStatus } from "../../types";
import {
  createMarketAuction,
  fetchAuctions,
  fetchAuctionBids,
  resolveMarketAuction,
} from "../../utils/auctions";
import { fetchMarketItems } from "../../utils/market";
import {
  ADMIN_LIST_PREVIEW_COUNT,
  AdminInfoCard,
  ExpandableListToggle,
  LabeledInput,
  LabeledTextArea,
  NumericInput,
  adminCategoryLabel,
  adminRarityLabel,
} from "./AdminControlPrimitives";

const rarityColors: Record<Rarity, string> = {
  mythic: "border-red-500/60 bg-red-950/20 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.25)]",
  legendary: "border-amber-500/60 bg-amber-950/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
  epic: "border-fuchsia-500/60 bg-fuchsia-950/20 text-fuchsia-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
  rare: "border-sky-500/60 bg-sky-950/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]",
  common: "border-stone-700 bg-stone-900/40 text-stone-300",
};

export function AdminAuctionManager() {
  const [auctions, setAuctions] = useState<MarketAuction[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [selectedMarketItem, setSelectedMarketItem] = useState<string>("custom");

  // Form states
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("others");
  const [itemRarity, setItemRarity] = useState<Rarity>("common");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [startPrice, setStartPrice] = useState(100);
  const [minIncrement, setMinIncrement] = useState(50);
  const [durationMinutes, setDurationMinutes] = useState(1440); // 24h default
  const [whatsappChatId, setWhatsappChatId] = useState("");

  // UI States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AuctionStatus | "all">("active");
  const [showAllAuctions, setShowAllAuctions] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Bids cache per auction
  const [bidsMap, setBidsMap] = useState<Record<string, MarketAuctionBid[]>>({});
  const [expandedBidsId, setExpandedBidsId] = useState<string | null>(null);
  const [loadingBidsId, setLoadingBidsId] = useState<string | null>(null);

  async function loadAuctions() {
    setIsLoading(true);
    const result = await fetchAuctions();
    if (result.status === "ready") {
      setAuctions(result.auctions);
    } else {
      setFeedback(result.message || "Error al cargar subastas.");
    }
    setIsLoading(false);
  }

  async function loadMarketItems() {
    const result = await fetchMarketItems();
    if (result.status === "ready") {
      setMarketItems(result.items);
    }
  }

  useEffect(() => {
    void loadAuctions();
    void loadMarketItems();
  }, []);

  // Autofill form when choosing a store item
  function handleMarketItemChange(itemId: string) {
    setSelectedMarketItem(itemId);
    if (itemId === "custom") {
      setItemName("");
      setItemDescription("");
      setItemCategory("others");
      setItemRarity("common");
      setItemImageUrl("");
      setStartPrice(100);
      return;
    }

    const item = marketItems.find((m) => m.id === itemId);
    if (item) {
      setItemName(item.name);
      setItemDescription(item.description);
      setItemCategory(item.category);
      setItemRarity(item.rarity);
      setItemImageUrl(item.imageUrl || "");
      setStartPrice(item.price);
    }
  }

  function resetForm() {
    setSelectedMarketItem("custom");
    setItemName("");
    setItemDescription("");
    setItemCategory("others");
    setItemRarity("common");
    setItemImageUrl("");
    setStartPrice(100);
    setMinIncrement(50);
    setDurationMinutes(1440);
    setWhatsappChatId("");
    setFeedback("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!itemName.trim()) {
      setFeedback("El nombre del ítem es obligatorio.");
      return;
    }

    setIsSaving(true);
    setFeedback("");

    const linkedItemId = selectedMarketItem === "custom" ? null : selectedMarketItem;

    const result = await createMarketAuction({
      itemId: linkedItemId,
      itemName,
      itemDescription: itemDescription.trim() || null,
      itemCategory,
      itemRarity,
      itemImageUrl: itemImageUrl.trim() || null,
      startPrice,
      minIncrement,
      durationMinutes,
      whatsappChatId: whatsappChatId.trim() || null,
    });

    setIsSaving(false);

    if (result.status === "success") {
      setFeedback("¡Subasta creada exitosamente!");
      resetForm();
      await loadAuctions();
    } else {
      setFeedback(result.message || "Error al crear la subasta.");
    }
  }

  async function handleResolveAuction(auctionId: string) {
    if (!window.confirm("¿Seguro que deseas resolver y cerrar esta subasta ahora mismo?")) {
      return;
    }

    setResolvingId(auctionId);
    setFeedback("");

    const result = await resolveMarketAuction(auctionId);
    setResolvingId(null);

    if (result.status === "success") {
      if (result.winnerId) {
        setFeedback(`Subasta resuelta. ¡El ítem "${result.itemName}" ha sido entregado al ganador!`);
      } else {
        setFeedback(`Subasta cerrada sin ganadores para el ítem "${result.itemName}".`);
      }
      await loadAuctions();
    } else {
      setFeedback(result.message || "Error al resolver la subasta.");
    }
  }

  async function toggleBids(auctionId: string) {
    if (expandedBidsId === auctionId) {
      setExpandedBidsId(null);
      return;
    }

    setExpandedBidsId(auctionId);
    setLoadingBidsId(auctionId);

    const result = await fetchAuctionBids(auctionId);
    setLoadingBidsId(null);

    if (result.status === "ready") {
      setBidsMap((prev) => ({ ...prev, [auctionId]: result.bids }));
    }
  }

  const filteredAuctions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return auctions.filter((auc) => {
      const matchesSearch =
        auc.itemName.toLowerCase().includes(query) ||
        (auc.itemDescription && auc.itemDescription.toLowerCase().includes(query)) ||
        (auc.highestBidderUsername && auc.highestBidderUsername.toLowerCase().includes(query));

      const matchesFilter = statusFilter === "all" ? true : auc.status === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [auctions, search, statusFilter]);

  const visibleAuctions = useMemo(() => {
    return showAllAuctions
      ? filteredAuctions
      : filteredAuctions.slice(0, ADMIN_LIST_PREVIEW_COUNT);
  }, [filteredAuctions, showAllAuctions]);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      {/* Columna Izquierda: Crear Subasta */}
      <section
        data-gsap-admin
        className="rounded-[1.5rem] sm:rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-4 sm:p-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
            <Gavel className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Economía del Reino
            </p>
            <h4 className="mt-1 text-xl font-black text-stone-100">
              Crear Subasta
            </h4>
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {/* Autocompletar */}
          <label className="space-y-2 block">
            <span className="text-sm font-semibold text-stone-200">
              Pre-llenar desde ítem de mercado
            </span>
            <select
              value={selectedMarketItem}
              onChange={(e) => handleMarketItemChange(e.target.value)}
              className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
            >
              <option value="custom">Personalizado (Ítem al vuelo)</option>
              {marketItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({adminRarityLabel(item.rarity)} - {item.price}g)
                </option>
              ))}
            </select>
          </label>

          <LabeledInput
            label="Nombre del Ítem"
            value={itemName}
            onChange={setItemName}
            placeholder="Espada Rúnica del Alba"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">Categoría</span>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                <option value="potions">Pociones</option>
                <option value="armors">Armaduras</option>
                <option value="swords">Espadas</option>
                <option value="others">Otros</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">Rareza</span>
              <select
                value={itemRarity}
                onChange={(e) => setItemRarity(e.target.value as Rarity)}
                className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                <option value="common">Común</option>
                <option value="rare">Raro</option>
                <option value="epic">Épico</option>
                <option value="legendary">Legendario</option>
                <option value="mythic">Mítico</option>
              </select>
            </label>
          </div>

          <LabeledInput
            label="URL de la Imagen"
            value={itemImageUrl}
            onChange={setItemImageUrl}
            placeholder="https://imgur.com/example.png"
          />

          <LabeledTextArea
            label="Descripción del Ítem"
            value={itemDescription}
            onChange={setItemDescription}
            placeholder="Una hoja grabada con runas antiguas..."
            rows={3}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <NumericInput
              label="Precio Inicial (Oro)"
              value={startPrice}
              onChange={setStartPrice}
            />

            <NumericInput
              label="Incremento Mínimo (+)"
              value={minIncrement}
              onChange={setMinIncrement}
            />

            <NumericInput
              label="Duración (Minutos)"
              value={durationMinutes}
              onChange={setDurationMinutes}
            />
          </div>

          <LabeledInput
            label="WhatsApp Chat ID (Opcional)"
            value={whatsappChatId}
            onChange={setWhatsappChatId}
            placeholder="120363148509123456@g.us"
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Crear Subasta
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-stone-700 px-5 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
            >
              Limpiar
            </button>
          </div>

          {feedback ? (
            <AdminInfoCard title="Notificación" message={feedback} tone={feedback.includes("Error") ? "warning" : "default"} />
          ) : null}
        </form>
      </section>

      {/* Columna Derecha: Listado y Resoluciones */}
      <section
        data-gsap-admin
        className="rounded-[1.5rem] sm:rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-4 sm:p-5 flex flex-col"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                Pujas y Cierres
              </p>
              <h4 className="mt-1 text-xl font-black text-stone-100">
                Panel de Monitoreo
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadAuctions()}
            disabled={isLoading}
            className="rounded-full border border-stone-700 p-2 text-stone-400 hover:border-stone-500 hover:text-stone-200 transition disabled:opacity-50"
            title="Refrescar Subastas"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Filtros */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 block">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Filtrar Estado</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AuctionStatus | "all")}
              className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
            >
              <option value="active">Subastas Activas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="all">Todas</option>
            </select>
          </label>

          <LabeledInput
            label="Buscar por Ítem / Postor"
            value={search}
            onChange={setSearch}
            placeholder="Buscar..."
          />
        </div>

        {/* Lista */}
        <div className="mt-5 space-y-4 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            </div>
          ) : visibleAuctions.length > 0 ? (
            visibleAuctions.map((auc) => {
              const rarityStyle = rarityColors[auc.itemRarity] || rarityColors.common;
              const hasHighestBid = auc.highestBidderId !== null;
              const expiryDate = new Date(auc.expiresAt);
              const isExpired = expiryDate <= new Date() && auc.status === "active";

              return (
                <div
                  key={auc.id}
                  className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-3.5 sm:p-4 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      {auc.itemImageUrl ? (
                        <img
                          src={auc.itemImageUrl}
                          alt={auc.itemName}
                          className="h-12 w-12 rounded-xl object-contain border border-stone-800 bg-stone-900 shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl border border-stone-800 bg-stone-900 flex items-center justify-center shrink-0 text-stone-500">
                          <Gavel className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <h5 className="font-extrabold text-sm text-stone-100 leading-tight">
                          {auc.itemName}
                        </h5>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={`text-[9px] font-black uppercase tracking-[0.14em] rounded px-1.5 py-0.5 border ${rarityStyle}`}>
                            {adminRarityLabel(auc.itemRarity)}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.14em] rounded bg-stone-900 text-stone-400 px-1.5 py-0.5 border border-stone-800">
                            {adminCategoryLabel(auc.itemCategory as any) || auc.itemCategory}
                          </span>
                          {auc.whatsappChatId ? (
                            <span className="text-[9px] font-bold rounded bg-emerald-950/20 text-emerald-400 px-1.5 py-0.5 border border-emerald-900/30 flex items-center gap-1">
                              <MessageSquare className="h-2.5 w-2.5" /> WhatsApp
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${
                          auc.status === "active"
                            ? isExpired
                              ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : auc.status === "completed"
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                              : "border-stone-700 bg-stone-900 text-stone-500"
                        }`}
                      >
                        {auc.status === "active"
                          ? isExpired
                            ? "Expirada (Pendiente Cierre)"
                            : "Activa"
                          : auc.status === "completed"
                            ? "Completada"
                            : "Cancelada"}
                      </span>
                    </div>
                  </div>

                  {auc.itemDescription ? (
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                      {auc.itemDescription}
                    </p>
                  ) : null}

                  {/* Estado de Pujas */}
                  <div className="grid gap-2 grid-cols-2 rounded-2xl bg-stone-950/60 border border-stone-900 p-3 text-xs">
                    <div>
                      <span className="text-stone-500 block uppercase tracking-wider text-[9px] font-bold">Puja Mayor</span>
                      <span className="font-extrabold text-stone-200 inline-flex items-center gap-1 mt-0.5">
                        <Coins className="h-3.5 w-3.5 text-amber-400" />
                        {hasHighestBid ? `${auc.highestBid} g` : "Sin pujas"}
                      </span>
                      {hasHighestBid ? (
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          Por: <strong className="text-amber-300 font-bold">{auc.highestBidderUsername || "Desconocido"}</strong>
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-500 block mt-0.5">
                          Mínimo: {auc.startPrice} g
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-stone-500 block uppercase tracking-wider text-[9px] font-bold">Expiración</span>
                      <span className="font-semibold text-stone-200 block mt-0.5">
                        {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {auc.status === "active" && (
                        <span className={`text-[10px] block mt-0.5 font-bold ${isExpired ? "text-rose-400" : "text-amber-400/80"}`}>
                          {isExpired ? "Expirada" : "En curso"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => void toggleBids(auc.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 font-semibold px-2.5 py-1.5 rounded-xl border border-stone-800 bg-stone-900/30 transition"
                    >
                      {expandedBidsId === auc.id ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Ocultar Pujas
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Ver Pujas ({loadingBidsId === auc.id ? "..." : (bidsMap[auc.id]?.length ?? "?")})
                        </>
                      )}
                    </button>

                    {auc.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => void handleResolveAuction(auc.id)}
                        disabled={resolvingId === auc.id}
                        className="inline-flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-xl transition disabled:opacity-50"
                      >
                        {resolvingId === auc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Resolver Subasta
                      </button>
                    ) : null}
                  </div>

                  {/* Bids History Dropdown */}
                  {expandedBidsId === auc.id ? (
                    <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3 space-y-2 mt-2">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Historial de Pujas</p>
                      {loadingBidsId === auc.id ? (
                        <div className="flex justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                        </div>
                      ) : bidsMap[auc.id] && bidsMap[auc.id].length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {bidsMap[auc.id].map((bid) => (
                            <div key={bid.id} className="flex justify-between items-center text-xs py-1 border-b border-stone-900 last:border-0">
                              <span className="font-semibold text-stone-300">{bid.playerUsername}</span>
                              <span className="font-bold text-amber-300 inline-flex items-center gap-1">
                                {bid.amount} <Coins className="h-3 w-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 py-1">No hay pujas registradas para esta subasta.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-6 text-sm text-center text-stone-400">
              No se encontraron subastas con el filtro actual.
            </div>
          )}

          <ExpandableListToggle
            shownCount={visibleAuctions.length}
            totalCount={filteredAuctions.length}
            expanded={showAllAuctions}
            onToggle={() => setShowAllAuctions((prev) => !prev)}
            itemLabel="subastas"
          />
        </div>
      </section>
    </div>
  );
}
