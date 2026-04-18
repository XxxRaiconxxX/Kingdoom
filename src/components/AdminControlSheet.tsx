import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Crown,
  Flag,
  Loader2,
  ScrollText,
  ShieldCheck,
  Store,
  Swords,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { deleteRealmEvent, fetchRealmEvents, upsertRealmEvent } from "../utils/events";
import {
  createPlayerAccount,
  fetchAllPlayers,
  updatePlayerGold,
} from "../utils/players";
import {
  fetchAdminWeeklyRankingRows,
  seedCurrentWeeklyRanking,
  upsertAdminWeeklyRankingEntry,
} from "../utils/adminRanking";
import { formatRankingWindow } from "../utils/weeklyRanking";
import {
  deleteMarketItem,
  fetchMarketItems,
  slugifyMarketItem,
  upsertMarketItem,
} from "../utils/market";
import type { EventStatus, MarketCategoryId, MarketItem, PlayerAccount, RankingPlayer, Rarity, RealmEvent, StockStatus } from "../types";

type AdminTab = "overview" | "activity" | "players" | "events" | "market";
type GoldAdjustmentMode = "add" | "subtract" | "set";
type EventListFilter = "all" | EventStatus;
const ADMIN_LIST_PREVIEW_COUNT = 4;

export function AdminControlSheet({ onClose }: { onClose: () => void }) {
  const { player, refreshPlayer } = usePlayerSession();
  const [activeTab, setActiveTab] = useState<AdminTab>("activity");
  const [players, setPlayers] = useState<PlayerAccount[]>([]);
  const [rankingRows, setRankingRows] = useState<RankingPlayer[]>([]);
  const [rankingMessage, setRankingMessage] = useState("");
  const [windowLabel, setWindowLabel] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );
  const [formPlayerId, setFormPlayerId] = useState("");
  const [formFaction, setFormFaction] = useState("");
  const [formStatus, setFormStatus] = useState<RankingPlayer["status"]>("alive");
  const [formPoints, setFormPoints] = useState(0);
  const [formMissions, setFormMissions] = useState(0);
  const [formEvents, setFormEvents] = useState(0);
  const [formStreak, setFormStreak] = useState(0);
  const [isActivityEditMode, setIsActivityEditMode] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSeedingWeek, setIsSeedingWeek] = useState(false);
  const [playerFeedback, setPlayerFeedback] = useState("");
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [isUpdatingGold, setIsUpdatingGold] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newGold, setNewGold] = useState(0);
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [goldPlayerId, setGoldPlayerId] = useState("");
  const [goldMode, setGoldMode] = useState<GoldAdjustmentMode>("add");
  const [goldAmount, setGoldAmount] = useState(0);
  const [events, setEvents] = useState<RealmEvent[]>([]);
  const [eventFeedback, setEventFeedback] = useState("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [eventListFilter, setEventListFilter] = useState<EventListFilter>("all");
  const [eventId, setEventId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLongDescription, setEventLongDescription] = useState("");
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventStatus, setEventStatus] = useState<EventStatus>("in-production");
  const [eventFactions, setEventFactions] = useState("");
  const [eventRewards, setEventRewards] = useState("");
  const [eventRequirements, setEventRequirements] = useState("");
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [marketFeedback, setMarketFeedback] = useState("");
  const [isSavingMarketItem, setIsSavingMarketItem] = useState(false);
  const [isDeletingMarketItem, setIsDeletingMarketItem] = useState(false);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<MarketCategoryId | "all">("all");
  const [marketItemId, setMarketItemId] = useState("");
  const [marketItemName, setMarketItemName] = useState("");
  const [marketItemDescription, setMarketItemDescription] = useState("");
  const [marketItemAbility, setMarketItemAbility] = useState("");
  const [marketItemPrice, setMarketItemPrice] = useState(0);
  const [marketItemRarity, setMarketItemRarity] = useState<Rarity>("common");
  const [marketItemImageUrl, setMarketItemImageUrl] = useState("");
  const [marketItemImageFit, setMarketItemImageFit] = useState<"cover" | "contain" | "">("contain");
  const [marketItemImagePosition, setMarketItemImagePosition] = useState("center");
  const [marketItemCategory, setMarketItemCategory] = useState<MarketCategoryId>("swords");
  const [marketItemStockStatus, setMarketItemStockStatus] = useState<StockStatus>("available");
  const [marketItemFeatured, setMarketItemFeatured] = useState(false);
  const [showAllRankingRows, setShowAllRankingRows] = useState(false);
  const [showAllPlayersList, setShowAllPlayersList] = useState(false);
  const [showAllEventsList, setShowAllEventsList] = useState(false);
  const [showAllMarketItemsList, setShowAllMarketItemsList] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      setStatus("loading");
      const [playersList, rankingResult] = await Promise.all([
        fetchAllPlayers(),
        fetchAdminWeeklyRankingRows(),
      ]);
      const eventsResult = await fetchRealmEvents();
      const marketResult = await fetchMarketItems();

      if (cancelled) {
        return;
      }

      setPlayers(playersList);
      setRankingRows(rankingResult.rows);
      setRankingMessage(rankingResult.message);
      setWindowLabel(formatRankingWindow(rankingResult.window));
      setEvents(eventsResult.events);
      setMarketItems(marketResult.items);
      setStatus(rankingResult.status === "ready" ? "ready" : "unavailable");
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadAdminData() {
    setStatus("loading");
    const [playersList, rankingResult] = await Promise.all([
      fetchAllPlayers(),
      fetchAdminWeeklyRankingRows(),
    ]);
    const eventsResult = await fetchRealmEvents();
    const marketResult = await fetchMarketItems();

    setPlayers(playersList);
    setRankingRows(rankingResult.rows);
    setRankingMessage(rankingResult.message);
    setWindowLabel(formatRankingWindow(rankingResult.window));
    setEvents(eventsResult.events);
    setMarketItems(marketResult.items);
    setStatus(rankingResult.status === "ready" ? "ready" : "unavailable");
  }

  const selectedPlayer = useMemo(
    () => players.find((entry) => entry.id === formPlayerId) ?? null,
    [formPlayerId, players]
  );
  const selectedGoldPlayer = useMemo(
    () => players.find((entry) => entry.id === goldPlayerId) ?? null,
    [goldPlayerId, players]
  );
  const filteredPlayers = useMemo(() => {
    const normalizedSearch = playerSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return players;
    }

    return players.filter((entry) =>
      entry.username.toLowerCase().includes(normalizedSearch)
    );
  }, [playerSearch, players]);
  const filteredEvents = useMemo(() => {
    const normalizedSearch = eventSearch.trim().toLowerCase();

    return events.filter((entry) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : entry.title.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        eventListFilter === "all" ? true : entry.status === eventListFilter;

      return matchesSearch && matchesStatus;
    });
  }, [eventListFilter, eventSearch, events]);

  const filteredMarketItems = useMemo(() => {
    const normalizedSearch = marketSearch.trim().toLowerCase();

    return marketItems.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : item.name.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        marketCategoryFilter === "all" ? true : item.category === marketCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [marketSearch, marketCategoryFilter, marketItems]);
  const visibleRankingRows = useMemo(
    () =>
      showAllRankingRows
        ? rankingRows
        : rankingRows.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [rankingRows, showAllRankingRows]
  );
  const visiblePlayers = useMemo(
    () =>
      showAllPlayersList
        ? filteredPlayers
        : filteredPlayers.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredPlayers, showAllPlayersList]
  );
  const visibleEvents = useMemo(
    () =>
      showAllEventsList
        ? filteredEvents
        : filteredEvents.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredEvents, showAllEventsList]
  );
  const visibleMarketItems = useMemo(
    () =>
      showAllMarketItemsList
        ? filteredMarketItems
        : filteredMarketItems.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredMarketItems, showAllMarketItemsList]
  );

  useEffect(() => {
    setShowAllPlayersList(false);
  }, [playerSearch]);

  useEffect(() => {
    setShowAllRankingRows(false);
  }, [rankingRows.length]);

  useEffect(() => {
    setShowAllEventsList(false);
  }, [eventSearch, eventListFilter]);

  useEffect(() => {
    setShowAllMarketItemsList(false);
  }, [marketSearch, marketCategoryFilter]);

  function resetActivityForm() {
    setFormPlayerId("");
    setFormFaction("");
    setFormStatus("alive");
    setFormPoints(0);
    setFormMissions(0);
    setFormEvents(0);
    setFormStreak(0);
    setIsActivityEditMode(false);
    setFeedback("");
  }

  function preloadFromExisting(row: RankingPlayer) {
    const matchingPlayer =
      players.find((entry) => entry.username === row.name) ?? null;

    if (matchingPlayer) {
      setFormPlayerId(matchingPlayer.id);
    }

    setFormFaction(row.faction);
    setFormStatus(row.status);
    setFormPoints(row.activityPoints);
    setFormMissions(row.missionsCompleted);
    setFormEvents(row.eventsJoined);
    setFormStreak(row.streakDays ?? 0);
    setIsActivityEditMode(true);
    setFeedback("");
    setActiveTab("activity");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPlayer) {
      setFeedback("Selecciona un jugador para cargar o actualizar su semana.");
      return;
    }

    setIsSaving(true);
    setFeedback("");

    const result = await upsertAdminWeeklyRankingEntry({
      player: selectedPlayer,
      faction: formFaction.trim() || "Sin faccion",
      status: formStatus,
      activityPoints: formPoints,
      missionsCompleted: formMissions,
      eventsJoined: formEvents,
      streakDays: formStreak,
    });

    setIsSaving(false);
    setFeedback(result.message);

    if (result.status === "saved") {
      setIsActivityEditMode(false);
      await reloadAdminData();
    }
  }

  async function handleSeedWeek() {
    setIsSeedingWeek(true);
    setFeedback("");
    const result = await seedCurrentWeeklyRanking();
    setIsSeedingWeek(false);
    setFeedback(result.message);
    await reloadAdminData();
  }

  async function handleCreatePlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingPlayer(true);
    setPlayerFeedback("");

    const result = await createPlayerAccount({
      username: newUsername,
      gold: newGold,
      isAdmin: newIsAdmin,
    });

    setIsCreatingPlayer(false);
    setPlayerFeedback(result.message);

    if (result.status === "created") {
      setNewUsername("");
      setNewGold(0);
      setNewIsAdmin(false);
      await reloadAdminData();
    }
  }

  async function handleUpdateGold(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedGoldPlayer) {
      setPlayerFeedback("Selecciona un jugador para editar su oro.");
      return;
    }

    const sanitizedAmount = Math.max(0, goldAmount);
    const nextGold =
      goldMode === "set"
        ? sanitizedAmount
        : goldMode === "add"
          ? selectedGoldPlayer.gold + sanitizedAmount
          : Math.max(0, selectedGoldPlayer.gold - sanitizedAmount);

    setIsUpdatingGold(true);
    setPlayerFeedback("");

    const updated = await updatePlayerGold(selectedGoldPlayer.id, nextGold);

    setIsUpdatingGold(false);

    if (!updated) {
      setPlayerFeedback("No se pudo actualizar el oro del jugador.");
      return;
    }

    setPlayerFeedback("Oro actualizado correctamente.");
    await reloadAdminData();

    if (player?.id === selectedGoldPlayer.id) {
      await refreshPlayer();
    }
  }

  function preloadEvent(event: RealmEvent) {
    setEventId(event.id ?? "");
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEventLongDescription(event.longDescription);
    setEventImageUrl(event.imageUrl);
    setEventStartDate(event.startDate);
    setEventEndDate(event.endDate);
    setEventStatus(event.status);
    setEventFactions(event.factions.join(", "));
    setEventRewards(event.rewards);
    setEventRequirements(event.requirements);
    setEventFeedback("");
    setActiveTab("events");
  }

  function resetEventForm() {
    setEventId("");
    setEventTitle("");
    setEventDescription("");
    setEventLongDescription("");
    setEventImageUrl("");
    setEventStartDate("");
    setEventEndDate("");
    setEventStatus("in-production");
    setEventFactions("");
    setEventRewards("");
    setEventRequirements("");
    setEventFeedback("");
  }

  function resetMarketForm() {
    setMarketItemId("");
    setMarketItemName("");
    setMarketItemDescription("");
    setMarketItemAbility("");
    setMarketItemPrice(0);
    setMarketItemRarity("common");
    setMarketItemImageUrl("");
    setMarketItemImageFit("contain");
    setMarketItemImagePosition("center");
    setMarketItemCategory("swords");
    setMarketItemStockStatus("available");
    setMarketItemFeatured(false);
    setMarketFeedback("");
  }

  function preloadMarketItem(item: MarketItem) {
    setMarketItemId(item.id);
    setMarketItemName(item.name);
    setMarketItemDescription(item.description);
    setMarketItemAbility(item.ability ?? "");
    setMarketItemPrice(item.price);
    setMarketItemRarity(item.rarity);
    setMarketItemImageUrl(item.imageUrl);
    setMarketItemImageFit(item.imageFit ?? "contain");
    setMarketItemImagePosition(item.imagePosition ?? "center");
    setMarketItemCategory(item.category);
    setMarketItemStockStatus(item.stockStatus);
    setMarketItemFeatured(item.featured ?? false);
    setMarketFeedback("");
    setActiveTab("market");
  }

  async function handleSaveMarketItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!marketItemName.trim()) {
      setMarketFeedback("El nombre del item es obligatorio.");
      return;
    }

    const id = marketItemId || slugifyMarketItem(marketItemName, marketItemCategory);
    setIsSavingMarketItem(true);
    setMarketFeedback("");

    const result = await upsertMarketItem({
      id,
      name: marketItemName,
      description: marketItemDescription,
      ability: marketItemAbility,
      price: marketItemPrice,
      rarity: marketItemRarity,
      imageUrl: marketItemImageUrl,
      imageFit: marketItemImageFit,
      imagePosition: marketItemImagePosition,
      category: marketItemCategory,
      stockStatus: marketItemStockStatus,
      featured: marketItemFeatured,
    });

    setIsSavingMarketItem(false);
    setMarketFeedback(result.message);

    if (result.status === "saved") {
      resetMarketForm();
      await reloadAdminData();
    }
  }

  async function handleDeleteMarketItem() {
    if (!marketItemId) {
      setMarketFeedback("Selecciona un item antes de intentar borrarlo.");
      return;
    }

    const shouldDelete = window.confirm(
      `¿Seguro que quieres borrar "${marketItemName}"? Esta accion no se puede deshacer.`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingMarketItem(true);
    setMarketFeedback("");

    const result = await deleteMarketItem(marketItemId);

    setIsDeletingMarketItem(false);
    setMarketFeedback(result.message);

    if (result.status === "deleted") {
      resetMarketForm();
      await reloadAdminData();
    }
  }

  async function handleSaveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingEvent(true);
    setEventFeedback("");

    const result = await upsertRealmEvent({
      id: eventId || undefined,
      title: eventTitle,
      description: eventDescription,
      longDescription: eventLongDescription,
      imageUrl: eventImageUrl,
      startDate: eventStartDate,
      endDate: eventEndDate,
      status: eventStatus,
      factions: eventFactions.split(","),
      rewards: eventRewards,
      requirements: eventRequirements,
    });

    setIsSavingEvent(false);
    setEventFeedback(result.message);

    if (result.status === "saved") {
      resetEventForm();
      await reloadAdminData();
    }
  }

  async function handleDeleteEvent() {
    if (!eventId) {
      setEventFeedback("Selecciona un evento antes de intentar borrarlo.");
      return;
    }

    const shouldDelete = window.confirm(
      "¿Seguro que quieres borrar este evento? Esta accion no se puede deshacer."
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingEvent(true);
    setEventFeedback("");

    const result = await deleteRealmEvent(eventId);

    setIsDeletingEvent(false);
    setEventFeedback(result.message);

    if (result.status === "deleted") {
      resetEventForm();
      await reloadAdminData();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/70 px-4 py-4 backdrop-blur-md md:px-6 md:py-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4 md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/75">
              Modo administrador
            </p>
            <h3 className="mt-2 text-2xl font-black text-stone-100 md:text-3xl">
              Centro de control del reino
            </h3>
            <p className="mt-2 text-sm text-stone-400">
              Acceso activo para {player?.username ?? "admin"}.
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

        <div className="border-b border-stone-800 px-0 py-4 md:px-6">
          <div className="flex w-full max-w-[100vw] items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:max-w-full md:px-0 [&::-webkit-scrollbar]:hidden">
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Actividad"
                active={activeTab === "activity"}
                onClick={() => setActiveTab("activity")}
              />
            </div>
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Jugadores"
                active={activeTab === "players"}
                onClick={() => setActiveTab("players")}
              />
            </div>
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Eventos"
                active={activeTab === "events"}
                onClick={() => setActiveTab("events")}
              />
            </div>
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Mercado"
                active={activeTab === "market"}
                onClick={() => setActiveTab("market")}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {status === "loading" ? (
            <AdminInfoCard
              title="Cargando modo admin"
              message="Leyendo jugadores y temporada semanal actual..."
            />
          ) : null}

          {activeTab === "overview" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Semana activa
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      {windowLabel || "Semana actual"}
                    </h4>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-stone-400">
                  Este panel administra la tabla `weekly_activity_rankings`. Si el
                  jugador conectado tiene `is_admin = true`, vera este acceso.
                </p>
                {rankingMessage ? (
                  <p className="mt-4 rounded-[1.2rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
                    {rankingMessage}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => void handleSeedWeek()}
                    disabled={isSeedingWeek}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isSeedingWeek ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creando semana...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        Nueva semana
                      </>
                    )}
                  </button>
                  <p className="max-w-md text-sm leading-6 text-stone-400">
                    Clona la ultima temporada con puntos reiniciados. Si no hay
                    historial previo, usa la tabla `players` como base inicial.
                  </p>
                </div>
                <div className="mt-4 rounded-[1.3rem] border border-stone-800 bg-stone-950/50 p-4">
                  <p className="text-sm font-bold text-stone-100">
                    Recomendacion tecnica
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    Mantén el acceso administrativo ligado solo a `players.is_admin`
                    y evita usar nombres especiales como llave de privilegios.
                  </p>
                </div>
              </section>

              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Podio administrable
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Temporada en curso
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {rankingRows.slice(0, 5).map((row, index) => (
                    <button
                      key={`${row.id}-${index}`}
                      type="button"
                      onClick={() => preloadFromExisting(row)}
                      className="flex w-full items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
                    >
                      <div>
                        <p className="text-sm font-bold text-stone-100">
                          #{index + 1} {row.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                          {row.faction}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-300">
                          {row.activityPoints}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                          puntos
                        </p>
                      </div>
                    </button>
                  ))}

                  {rankingRows.length === 0 ? (
                    <AdminInfoCard
                      title="Sin filas semanales"
                      message="Todavia no cargaste jugadores en la tabla semanal actual. Usa la pestana Actividad para crear los primeros registros."
                    />
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "activity" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Swords className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Carga manual
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Subir o ajustar ranking
                    </h4>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleSave}>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-stone-200">
                      Jugador
                    </span>
                    <select
                      value={formPlayerId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        setFormPlayerId(nextId);
                        if (nextId && !formFaction) {
                          setFormFaction("Sin faccion");
                        }
                      }}
                      className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                    >
                      <option value="">Selecciona un jugador</option>
                      {players.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.username}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput
                      label="Faccion"
                      value={formFaction}
                      onChange={setFormFaction}
                      placeholder="Cuervos del Norte"
                    />
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">
                        Estado
                      </span>
                      <select
                        value={formStatus}
                        onChange={(event) =>
                          setFormStatus(event.target.value as RankingPlayer["status"])
                        }
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                      >
                        <option value="alive">Vivo</option>
                        <option value="dead">Muerto</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <NumericInput label="Puntos" value={formPoints} onChange={setFormPoints} />
                    <NumericInput
                      label="Misiones validadas"
                      value={formMissions}
                      onChange={setFormMissions}
                    />
                    <NumericInput
                      label="Eventos validados"
                      value={formEvents}
                      onChange={setFormEvents}
                    />
                    <NumericInput label="Racha" value={formStreak} onChange={setFormStreak} />
                  </div>

                  <p className="mt-4 rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-400">
                    Usa estos contadores para cargar manualmente el rol validado
                    por WhatsApp. La app no intenta verificar por si sola si una
                    misión o evento de texto realmente se completó.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4" />
                          Guardar semana
                        </>
                      )}
                    </button>
                    {isActivityEditMode ? (
                      <button
                        type="button"
                        onClick={resetActivityForm}
                        className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
                      >
                        Cancelar edicion
                      </button>
                    ) : null}
                  </div>

                  {feedback ? (
                    <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                      {feedback}
                    </p>
                  ) : null}
                </form>
              </section>

              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <ScrollText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Temporada actual
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      {windowLabel || "Semana actual"}
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {rankingRows.length > 0 ? (
                    visibleRankingRows.map((row, index) => (
                      <button
                        key={`${row.id}-${row.name}`}
                        type="button"
                        onClick={() => preloadFromExisting(row)}
                        className="flex w-full items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
                      >
                        <div>
                          <p className="text-sm font-bold text-stone-100">
                            #{index + 1} {row.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                            {row.missionsCompleted} misiones / {row.eventsJoined} eventos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-300">
                            {row.activityPoints}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                            puntos
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <AdminInfoCard
                      title="Semana vacia"
                      message="Aun no hay registros semanales. Puedes crear el primero desde el formulario."
                    />
                  )}
                  <ExpandableListToggle
                    shownCount={visibleRankingRows.length}
                    totalCount={rankingRows.length}
                    expanded={showAllRankingRows}
                    onToggle={() => setShowAllRankingRows((current) => !current)}
                    itemLabel="registros"
                  />
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "players" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Formulario de alta
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Crear jugador
                    </h4>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleCreatePlayer}>
                  <LabeledInput
                    label="Buscar jugador registrado"
                    value={playerSearch}
                    onChange={setPlayerSearch}
                    placeholder="Filtra por nombre"
                  />
                  <LabeledInput
                    label="Nombre del jugador"
                    value={newUsername}
                    onChange={setNewUsername}
                    placeholder="Nombre exacto del personaje o usuario"
                  />

                  <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                    <NumericInput
                      label="Oro inicial"
                      value={newGold}
                      onChange={setNewGold}
                    />
                    <label className="flex items-end">
                      <div className="flex w-full items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-200">
                            Crear como admin
                          </p>
                          <p className="mt-1 text-xs leading-5 text-stone-500">
                            Solo si quieres que este jugador vea el panel de administracion.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newIsAdmin}
                          onChange={(event) => setNewIsAdmin(event.target.checked)}
                          className="h-4 w-4 rounded border-stone-600 bg-stone-950 text-amber-400"
                        />
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingPlayer}
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingPlayer ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Crear jugador
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 border-t border-stone-800 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        Correcciones y premios
                      </p>
                      <h4 className="mt-1 text-xl font-black text-stone-100">
                        Editar oro
                      </h4>
                    </div>
                  </div>

                  <form className="mt-5 space-y-5" onSubmit={handleUpdateGold}>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">
                        Jugador
                      </span>
                      <select
                        value={goldPlayerId}
                        onChange={(event) => setGoldPlayerId(event.target.value)}
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                      >
                        <option value="">Selecciona un jugador</option>
                        {filteredPlayers.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.username}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="space-y-3 rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Modo
                        </p>
                        <div className="flex w-full max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          <div className="flex-shrink-0">
                            <AdminModeButton
                              label="Sumar"
                              active={goldMode === "add"}
                              onClick={() => setGoldMode("add")}
                            />
                          </div>
                          <div className="flex-shrink-0">
                            <AdminModeButton
                              label="Restar"
                              active={goldMode === "subtract"}
                              onClick={() => setGoldMode("subtract")}
                            />
                          </div>
                          <div className="flex-shrink-0">
                            <AdminModeButton
                              label="Fijar"
                              active={goldMode === "set"}
                              onClick={() => setGoldMode("set")}
                            />
                          </div>
                        </div>
                      </div>

                      <NumericInput
                        label={
                          goldMode === "set"
                            ? "Nuevo total de oro"
                            : goldMode === "add"
                              ? "Oro a sumar"
                              : "Oro a restar"
                        }
                        value={goldAmount}
                        onChange={setGoldAmount}
                      />
                    </div>

                    {selectedGoldPlayer ? (
                      <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                        Oro actual de <span className="font-bold text-stone-100">{selectedGoldPlayer.username}</span>:{" "}
                        <span className="font-black text-amber-300">{selectedGoldPlayer.gold}</span>
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isUpdatingGold}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:justify-start"
                    >
                      {isUpdatingGold ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Coins className="h-4 w-4" />
                          Actualizar oro
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {playerFeedback ? (
                  <p className="mt-5 rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                    {playerFeedback}
                  </p>
                ) : null}
              </section>

              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Base actual
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Jugadores registrados
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {filteredPlayers.length > 0 ? (
                    visiblePlayers.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-stone-100">
                            {entry.username}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                            {entry.isAdmin ? "Admin" : "Jugador"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-300">{entry.gold}</p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                            oro
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400"
                    >
                      No se encontraron jugadores con ese nombre.
                    </div>
                  )}
                  <ExpandableListToggle
                    shownCount={visiblePlayers.length}
                    totalCount={filteredPlayers.length}
                    expanded={showAllPlayersList}
                    onToggle={() => setShowAllPlayersList((current) => !current)}
                    itemLabel="jugadores"
                  />
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "events" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Flag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Gestor del inicio
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Crear o editar eventos
                    </h4>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleSaveEvent}>
                  <LabeledInput
                    label="Titulo"
                    value={eventTitle}
                    onChange={setEventTitle}
                    placeholder="Nombre del evento"
                  />
                  <LabeledTextArea
                    label="Descripcion corta"
                    value={eventDescription}
                    onChange={setEventDescription}
                    placeholder="Resumen visible en la tarjeta"
                  />
                  <LabeledTextArea
                    label="Cronica o descripcion larga"
                    value={eventLongDescription}
                    onChange={setEventLongDescription}
                    placeholder="Detalle desplegable del evento"
                    rows={4}
                  />
                  <LabeledInput
                    label="URL de imagen"
                    value={eventImageUrl}
                    onChange={setEventImageUrl}
                    placeholder="https://..."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput
                      label="Fecha de inicio"
                      value={eventStartDate}
                      onChange={setEventStartDate}
                      placeholder="18 de abril"
                    />
                    <LabeledInput
                      label="Fecha de cierre"
                      value={eventEndDate}
                      onChange={setEventEndDate}
                      placeholder="21 de abril"
                    />
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-stone-200">
                      Estado
                    </span>
                    <select
                      value={eventStatus}
                      onChange={(event) =>
                        setEventStatus(event.target.value as EventStatus)
                      }
                      className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                    >
                      <option value="active">Activo</option>
                      <option value="in-production">En produccion</option>
                      <option value="finished">Finalizado</option>
                    </select>
                  </label>

                  <LabeledInput
                    label="Facciones (separadas por coma)"
                    value={eventFactions}
                    onChange={setEventFactions}
                    placeholder="Cuervos del Norte, Guardianes del Umbral"
                  />
                  <LabeledTextArea
                    label="Recompensas"
                    value={eventRewards}
                    onChange={setEventRewards}
                    placeholder="Prestigio, oro, reliquias..."
                  />
                  <LabeledTextArea
                    label="Requisitos"
                    value={eventRequirements}
                    onChange={setEventRequirements}
                    placeholder="Personaje activo, inscripcion previa..."
                  />

                  <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                    <button
                      type="submit"
                      disabled={isSavingEvent || isDeletingEvent}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isSavingEvent ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Flag className="h-4 w-4" />
                          {eventId ? "Actualizar evento" : "Crear evento"}
                        </>
                      )}
                    </button>
                    {eventId ? (
                      <button
                        type="button"
                        onClick={resetEventForm}
                        disabled={isDeletingEvent}
                        className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
                      >
                        Cancelar
                      </button>
                    ) : null}
                    {eventId ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteEvent()}
                        disabled={isSavingEvent || isDeletingEvent}
                        className="w-full rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {isDeletingEvent ? "Borrando..." : "Borrar"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={resetEventForm}
                      disabled={isDeletingEvent}
                      className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
                    >
                      Limpiar
                    </button>
                  </div>

                  {eventFeedback ? (
                    <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                      {eventFeedback}
                    </p>
                  ) : null}
                </form>
              </section>

              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <ScrollText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Agenda visible
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Eventos del inicio
                    </h4>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <LabeledInput
                    label="Buscar evento"
                    value={eventSearch}
                    onChange={setEventSearch}
                    placeholder="Filtra por titulo"
                  />
                  <div className="space-y-2 min-w-0 max-w-full">
                    <span className="text-sm font-semibold text-stone-200">
                      Estado
                    </span>
                    <div className="flex w-full max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex-shrink-0">
                        <AdminModeButton
                          label="Todos"
                          active={eventListFilter === "all"}
                          onClick={() => setEventListFilter("all")}
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <AdminModeButton
                          label="Activo"
                          active={eventListFilter === "active"}
                          onClick={() => setEventListFilter("active")}
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <AdminModeButton
                          label="Produccion"
                          active={eventListFilter === "in-production"}
                          onClick={() => setEventListFilter("in-production")}
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <AdminModeButton
                          label="Finalizado"
                          active={eventListFilter === "finished"}
                          onClick={() => setEventListFilter("finished")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {filteredEvents.length > 0 ? (
                    visibleEvents.map((entry) => (
                      <button
                        key={entry.id ?? entry.title}
                        type="button"
                        onClick={() => preloadEvent(entry)}
                        className="flex w-full items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
                      >
                        <div>
                          <p className="text-sm font-bold text-stone-100">
                            {entry.title}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                            {entry.startDate} / {entry.endDate}
                          </p>
                        </div>
                        <div className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300">
                          {entry.status}
                        </div>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-left text-sm leading-6 text-stone-400"
                    >
                      No se encontraron eventos para ese filtro.
                    </button>
                  )}
                  <ExpandableListToggle
                    shownCount={visibleEvents.length}
                    totalCount={filteredEvents.length}
                    expanded={showAllEventsList}
                    onToggle={() => setShowAllEventsList((current) => !current)}
                    itemLabel="eventos"
                  />
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "market" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Gestor del catalogo
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Crear o editar item
                    </h4>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleSaveMarketItem}>
                  <LabeledInput
                    label="Nombre del item"
                    value={marketItemName}
                    onChange={setMarketItemName}
                    placeholder="Espada del Umbral"
                  />
                  <LabeledTextArea
                    label="Descripcion"
                    value={marketItemDescription}
                    onChange={setMarketItemDescription}
                    placeholder="Descripcion visible en la tarjeta del mercado"
                  />
                  <LabeledTextArea
                    label="Habilidad (opcional)"
                    value={marketItemAbility}
                    onChange={setMarketItemAbility}
                    placeholder="Nombre: efecto en combate o narrativa"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">Categoria</span>
                      <select
                        value={marketItemCategory}
                        onChange={(e) => setMarketItemCategory(e.target.value as MarketCategoryId)}
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
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
                        value={marketItemRarity}
                        onChange={(e) => setMarketItemRarity(e.target.value as Rarity)}
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                      >
                        <option value="legendary">Legendario</option>
                        <option value="epic">Epico</option>
                        <option value="rare">Raro</option>
                        <option value="common">Comun</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">Stock</span>
                      <select
                        value={marketItemStockStatus}
                        onChange={(e) => setMarketItemStockStatus(e.target.value as StockStatus)}
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                      >
                        <option value="available">Disponible</option>
                        <option value="limited">Limitado</option>
                        <option value="sold-out">Agotado</option>
                      </select>
                    </label>
                    <NumericInput
                      label="Precio (oro)"
                      value={marketItemPrice}
                      onChange={setMarketItemPrice}
                    />
                  </div>

                  <LabeledInput
                    label="URL de imagen"
                    value={marketItemImageUrl}
                    onChange={setMarketItemImageUrl}
                    placeholder="https://..."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">Ajuste de imagen</span>
                      <select
                        value={marketItemImageFit}
                        onChange={(e) => setMarketItemImageFit(e.target.value as "cover" | "contain" | "")}
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                      >
                        <option value="contain">Contener (contain)</option>
                        <option value="cover">Cubrir (cover)</option>
                        <option value="">Sin ajuste</option>
                      </select>
                    </label>
                    <LabeledInput
                      label="Posicion de imagen"
                      value={marketItemImagePosition}
                      onChange={setMarketItemImagePosition}
                      placeholder="center top"
                    />
                  </div>

                  <label className="flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-200">Destacado</p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        Aparece en la seccion de objetos destacados del mercado.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={marketItemFeatured}
                      onChange={(e) => setMarketItemFeatured(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-600 bg-stone-950 text-amber-400"
                    />
                  </label>

                  {marketItemId ? (
                    <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-xs text-stone-400">
                      ID actual:{" "}
                      <span className="font-mono text-stone-300">{marketItemId}</span>
                    </div>
                  ) : (
                    <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-xs text-stone-400">
                      El ID se genera como slug del nombre y la categoria al guardar.
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                    <button
                      type="submit"
                      disabled={isSavingMarketItem || isDeletingMarketItem}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isSavingMarketItem ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Store className="h-4 w-4" />
                          {marketItemId ? "Actualizar item" : "Crear item"}
                        </>
                      )}
                    </button>
                    {marketItemId ? (
                      <button
                        type="button"
                        onClick={resetMarketForm}
                        disabled={isDeletingMarketItem}
                        className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
                      >
                        Cancelar
                      </button>
                    ) : null}
                    {marketItemId ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteMarketItem()}
                        disabled={isSavingMarketItem || isDeletingMarketItem}
                        className="w-full rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {isDeletingMarketItem ? "Borrando..." : "Borrar"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={resetMarketForm}
                      disabled={isDeletingMarketItem}
                      className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
                    >
                      Limpiar
                    </button>
                  </div>

                  {marketFeedback ? (
                    <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                      {marketFeedback}
                    </p>
                  ) : null}
                </form>
              </section>

              <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <ScrollText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Lista compacta
                    </p>
                    <h4 className="mt-1 text-xl font-black text-stone-100">
                      Items del mercado
                    </h4>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <LabeledInput
                    label="Buscar item"
                    value={marketSearch}
                    onChange={setMarketSearch}
                    placeholder="Filtra por nombre"
                  />
                  <div className="space-y-2 min-w-0 max-w-full">
                    <span className="text-sm font-semibold text-stone-200">Categoria</span>
                    <div className="flex w-full max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex-shrink-0">
                        <AdminModeButton label="Todos" active={marketCategoryFilter === "all"} onClick={() => setMarketCategoryFilter("all")} />
                      </div>
                      <div className="flex-shrink-0">
                        <AdminModeButton label="Pociones" active={marketCategoryFilter === "potions"} onClick={() => setMarketCategoryFilter("potions")} />
                      </div>
                      <div className="flex-shrink-0">
                        <AdminModeButton label="Armaduras" active={marketCategoryFilter === "armors"} onClick={() => setMarketCategoryFilter("armors")} />
                      </div>
                      <div className="flex-shrink-0">
                        <AdminModeButton label="Espadas" active={marketCategoryFilter === "swords"} onClick={() => setMarketCategoryFilter("swords")} />
                      </div>
                      <div className="flex-shrink-0">
                        <AdminModeButton label="Otros" active={marketCategoryFilter === "others"} onClick={() => setMarketCategoryFilter("others")} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {filteredMarketItems.length > 0 ? (
                    visibleMarketItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => preloadMarketItem(item)}
                        className="flex w-full items-center justify-between rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
                      >
                        <div>
                          <p className="text-sm font-bold text-stone-100">{item.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                            {item.category} &middot; {item.rarity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-300">{item.price}</p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                            oro &middot; {item.stockStatus}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
                      No se encontraron items para ese filtro.
                    </div>
                  )}
                  <ExpandableListToggle
                    shownCount={visibleMarketItems.length}
                    totalCount={filteredMarketItems.length}
                    expanded={showAllMarketItemsList}
                    onToggle={() => setShowAllMarketItemsList((current) => !current)}
                    itemLabel="items"
                  />
                </div>
              </section>
            </div>
          ) : null}

        </div>
      </motion.div>
    </motion.div>
  );
}

function AdminTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
          : "border-stone-700 bg-stone-900/70 text-stone-400"
      }`}
    >
      {label}
    </button>
  );
}

function AdminModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
          : "border-stone-700 bg-stone-900/70 text-stone-400"
      }`}
    >
      {label}
    </button>
  );
}

function AdminInfoCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5">
      <p className="text-sm font-bold text-stone-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-400">{message}</p>
    </div>
  );
}

function ExpandableListToggle({
  shownCount,
  totalCount,
  expanded,
  onToggle,
  itemLabel,
}: {
  shownCount: number;
  totalCount: number;
  expanded: boolean;
  onToggle: () => void;
  itemLabel: string;
}) {
  if (totalCount <= ADMIN_LIST_PREVIEW_COUNT || shownCount === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-[1.1rem] border border-stone-700 bg-stone-950/35 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
    >
      {expanded
        ? `Ver menos ${itemLabel}`
        : `Ver mas ${itemLabel} (${shownCount}/${totalCount})`}
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
      />
    </label>
  );
}

function LabeledTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
      />
    </label>
  );
}

function NumericInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
      />
    </label>
  );
}
