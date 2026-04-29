import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BellRing,
  Coins,
  FileText,
  Flag,
  ScrollText,
  Store,
  UserPlus,
  Users,
  X,
  Loader2,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { useGsapStaggerReveal } from "../hooks/useGsapStaggerReveal";
import {
  deleteRealmEvent,
  fetchPendingEventRewards,
  fetchRealmEventParticipants,
  fetchRealmEvents,
  getEventParticipationStatusLabel,
  isSupabaseEventId,
  joinRealmEvent,
  markEventRewardDelivered,
  upsertRealmEvent,
} from "../utils/events";
import {
  createPlayerAccount,
  fetchAllPlayers,
  updatePlayerGold,
} from "../utils/players";
import {
  deleteMarketItem,
  fetchMarketItems,
  slugifyMarketItem,
  upsertMarketItem,
} from "../utils/market";
import { fetchPinterestReference } from "../utils/pinterestPicker";
import type {
  EventRewardNotification,
  EventStatus,
  MarketCategoryId,
  MarketItem,
  PlayerAccount,
  Rarity,
  RealmEvent,
  RealmEventParticipant,
  StockStatus,
} from "../types";
import {
  ADMIN_LIST_PREVIEW_COUNT,
  AdminInfoCard,
  AdminModeButton,
  AdminTabButton,
  ExpandableListToggle,
  LabeledInput,
  LabeledTextArea,
  MarketAdminPreview,
  NumericInput,
  adminCategoryLabel,
  adminRarityLabel,
  adminStockLabel,
} from "./admin/AdminControlPrimitives";

type AdminTab =
  | "players"
  | "missions"
  | "events"
  | "market"
  | "staff"
  | "magic"
  | "bestiary"
  | "flora"
  | "knowledge";
type GoldAdjustmentMode = "add" | "subtract" | "set";
type EventListFilter = "all" | EventStatus;

const AdminMagicManager = lazy(() =>
  import("./AdminGrimoireManagers").then((module) => ({
    default: module.AdminMagicManager,
  }))
);
const AdminBestiaryManager = lazy(() =>
  import("./AdminGrimoireManagers").then((module) => ({
    default: module.AdminBestiaryManager,
  }))
);
const AdminFloraManager = lazy(() =>
  import("./AdminGrimoireManagers").then((module) => ({
    default: module.AdminFloraManager,
  }))
);
const AdminMissionManager = lazy(() =>
  import("./admin/AdminMissionManager").then((module) => ({
    default: module.AdminMissionManager,
  }))
);
const AdminStaffAssistant = lazy(() => import("./admin/AdminStaffAssistant"));
const AdminKnowledgeManager = lazy(() =>
  import("./admin/AdminKnowledgeManager").then((module) => ({
    default: module.AdminKnowledgeManager,
  }))
);

export function AdminControlSheet({ onClose }: { onClose: () => void }) {
  const adminRevealRef = useRef<HTMLDivElement | null>(null);
  const { player, refreshPlayer } = usePlayerSession();
  const [activeTab, setActiveTab] = useState<AdminTab>("players");
  const [players, setPlayers] = useState<PlayerAccount[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );
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
  const [isClaimingEventPlayer, setIsClaimingEventPlayer] = useState(false);
  const [isLoadingEventParticipants, setIsLoadingEventParticipants] = useState(false);
  const [isRewardingEventParticipantId, setIsRewardingEventParticipantId] = useState("");
  const [eventParticipants, setEventParticipants] = useState<RealmEventParticipant[]>([]);
  const [eventPendingRewards, setEventPendingRewards] = useState<EventRewardNotification[]>([]);
  const [showEventPendingPanel, setShowEventPendingPanel] = useState(false);
  const [eventParticipantPlayerId, setEventParticipantPlayerId] = useState("");
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
  const [eventParticipationRewardGold, setEventParticipationRewardGold] = useState(0);
  const [eventMaxParticipants, setEventMaxParticipants] = useState(0);
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
  const [marketPinterestUrl, setMarketPinterestUrl] = useState("");
  const [marketPinterestFeedback, setMarketPinterestFeedback] = useState("");
  const [marketPinterestPreview, setMarketPinterestPreview] = useState<{
    imageUrl: string;
    title: string;
    description: string;
    sourceUrl: string;
  } | null>(null);
  const [isLoadingPinterestReference, setIsLoadingPinterestReference] =
    useState(false);
  const [showAllPlayersList, setShowAllPlayersList] = useState(false);
  const [showAllEventsList, setShowAllEventsList] = useState(false);
  const [showAllMarketItemsList, setShowAllMarketItemsList] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      setStatus("loading");
      const [playersList, eventsResult, marketResult, pendingRewardsResult] =
        await Promise.all([
          fetchAllPlayers(),
          fetchRealmEvents(),
          fetchMarketItems(),
          fetchPendingEventRewards(),
        ]);

      if (cancelled) {
        return;
      }

      setPlayers(playersList);
      setEvents(eventsResult.events);
      setMarketItems(marketResult.items);
      setEventPendingRewards(pendingRewardsResult.notifications);
      setStatus("ready");
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadAdminData() {
    setStatus("loading");
    const [playersList, eventsResult, marketResult, pendingRewardsResult] =
      await Promise.all([
        fetchAllPlayers(),
        fetchRealmEvents(),
        fetchMarketItems(),
        fetchPendingEventRewards(),
      ]);

    setPlayers(playersList);
    setEvents(eventsResult.events);
    setMarketItems(marketResult.items);
    setEventPendingRewards(pendingRewardsResult.notifications);
    setStatus("ready");
  }

  const selectedGoldPlayer = useMemo(
    () => players.find((entry) => entry.id === goldPlayerId) ?? null,
    [goldPlayerId, players]
  );
  const selectedEvent = useMemo(
    () => events.find((entry) => entry.id === eventId) ?? null,
    [eventId, events]
  );
  const selectedEventIsFinished = useMemo(
    () => Boolean(selectedEvent && selectedEvent.status === "finished"),
    [selectedEvent]
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
  const marketPreviewItem = useMemo<MarketItem>(
    () => ({
      id: marketItemId || slugifyMarketItem(marketItemName || "item-preview", marketItemCategory),
      name: marketItemName.trim() || "Item del mercado",
      description: marketItemDescription.trim() || "La descripcion aparecera aqui.",
      ability: marketItemAbility.trim() || undefined,
      price: marketItemPrice,
      rarity: marketItemRarity,
      imageUrl: marketItemImageUrl.trim(),
      imageFit: marketItemImageFit || undefined,
      imagePosition: marketItemImagePosition.trim() || "center",
      category: marketItemCategory,
      stockStatus: marketItemStockStatus,
      featured: marketItemFeatured,
    }),
    [
      marketItemAbility,
      marketItemCategory,
      marketItemDescription,
      marketItemFeatured,
      marketItemId,
      marketItemImageFit,
      marketItemImagePosition,
      marketItemImageUrl,
      marketItemName,
      marketItemPrice,
      marketItemRarity,
      marketItemStockStatus,
    ]
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
    setShowAllEventsList(false);
  }, [eventSearch, eventListFilter]);

  useEffect(() => {
    setShowAllMarketItemsList(false);
  }, [marketSearch, marketCategoryFilter]);

  useGsapStaggerReveal(adminRevealRef, {
    selector: "[data-gsap-admin]",
    duration: 0.52,
    stagger: 0.06,
    y: 14,
    delay: 0.02,
    dependencies: [
      activeTab,
      status,
      visiblePlayers.length,
      visibleEvents.length,
      visibleMarketItems.length,
      eventParticipants.length,
      eventPendingRewards.length,
    ],
  });

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
    setEventParticipationRewardGold(event.participationRewardGold ?? 0);
    setEventMaxParticipants(event.maxParticipants ?? 0);
    setEventParticipantPlayerId("");
    setShowEventPendingPanel(false);
    setEventFeedback("");
    setActiveTab("events");

    if (event.id && isSupabaseEventId(event.id)) {
      void loadEventParticipants(event.id);
    } else {
      setEventParticipants([]);
    }
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
    setEventParticipationRewardGold(0);
    setEventMaxParticipants(0);
    setEventParticipantPlayerId("");
    setEventParticipants([]);
    setShowEventPendingPanel(false);
    setEventFeedback("");
  }

  async function loadEventParticipants(nextEventId: string) {
    if (!nextEventId.trim() || !isSupabaseEventId(nextEventId)) {
      setEventParticipants([]);
      return;
    }

    setIsLoadingEventParticipants(true);
    const result = await fetchRealmEventParticipants(nextEventId);
    setEventParticipants(result.participants);
    if (result.status === "error") {
      setEventFeedback(result.message);
    }
    setIsLoadingEventParticipants(false);
  }

  async function handleAddEventParticipant() {
    if (!eventId || !selectedEvent) {
      setEventFeedback("Guarda o selecciona un evento antes de anadir participantes.");
      return;
    }

    if (!eventParticipantPlayerId) {
      setEventFeedback("Selecciona un jugador para unirlo al evento.");
      return;
    }

    const maxParticipants = Math.max(0, selectedEvent.maxParticipants ?? 0);
    if (maxParticipants > 0 && eventParticipants.length >= maxParticipants) {
      setEventFeedback("Ese evento ya completo su cupo.");
      return;
    }

    setIsClaimingEventPlayer(true);
    setEventFeedback("");

    const result = await joinRealmEvent(eventId, eventParticipantPlayerId);

    setIsClaimingEventPlayer(false);
    setEventFeedback(result.message);

    if (result.status === "joined" || result.status === "exists") {
      setEventParticipantPlayerId("");
      await loadEventParticipants(eventId);
      await reloadAdminData();
    }
  }

  async function handleDeliverEventReward(participant: RealmEventParticipant) {
    if (!selectedEvent) {
      setEventFeedback("Selecciona un evento antes de entregar recompensa.");
      return;
    }

    if (!selectedEventIsFinished) {
      setEventFeedback("Primero finaliza el evento para habilitar la recompensa grupal.");
      return;
    }

    const rewardGold = Math.max(0, selectedEvent.participationRewardGold ?? 0);

    if (rewardGold <= 0) {
      setEventFeedback("Configura una recompensa grupal mayor a 0 para este evento.");
      return;
    }

    if (participant.rewardDelivered) {
      setEventFeedback("La recompensa de este participante ya fue entregada.");
      return;
    }

    const shouldDeliver = window.confirm(
      `Entregar ${rewardGold} de oro a ${participant.playerName} por participar en ${selectedEvent.title}?`
    );

    if (!shouldDeliver) {
      return;
    }

    setIsRewardingEventParticipantId(participant.id);
    setEventFeedback("");

    const refreshedPlayers = await fetchAllPlayers();
    setPlayers(refreshedPlayers);
    const currentPlayer = refreshedPlayers.find(
      (entry) => entry.id === participant.playerId
    );

    if (!currentPlayer) {
      setIsRewardingEventParticipantId("");
      setEventFeedback("No se encontro el jugador para entregar la recompensa.");
      return;
    }

    const updated = await updatePlayerGold(
      currentPlayer.id,
      currentPlayer.gold + rewardGold
    );

    if (!updated) {
      setIsRewardingEventParticipantId("");
      setEventFeedback("No se pudo actualizar el oro del jugador.");
      return;
    }

    const markResult = await markEventRewardDelivered(participant.id);
    setIsRewardingEventParticipantId("");
    setEventFeedback(markResult.message);

    await loadEventParticipants(selectedEvent.id ?? "");
    await reloadAdminData();
  }

  async function focusPendingEventReward(notification: EventRewardNotification) {
    const targetEvent = events.find((entry) => entry.id === notification.eventId);

    if (!targetEvent) {
      setEventFeedback("No se encontro el evento relacionado con ese aviso.");
      return;
    }

    preloadEvent(targetEvent);
    setShowEventPendingPanel(false);
    await loadEventParticipants(notification.eventId);
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
    setMarketPinterestUrl("");
    setMarketPinterestFeedback("");
    setMarketPinterestPreview(null);
  }

  async function handleLoadPinterestReference() {
    const cleanUrl = marketPinterestUrl.trim();

    if (!cleanUrl) {
      setMarketPinterestFeedback("Pega primero una URL de Pinterest.");
      return;
    }

    setIsLoadingPinterestReference(true);
    setMarketPinterestFeedback("");

    const result = await fetchPinterestReference(cleanUrl);

    setIsLoadingPinterestReference(false);

    if (result.status === "error") {
      setMarketPinterestPreview(null);
      setMarketPinterestFeedback(result.message);
      return;
    }

    setMarketPinterestPreview(result.reference);
    setMarketItemImageUrl(result.reference.imageUrl);
    setMarketItemImageFit("cover");
    setMarketItemImagePosition("center");
    setMarketItemName((current) =>
      current.trim() ? current : result.reference.title || current
    );
    setMarketItemDescription((current) =>
      current.trim() ? current : result.reference.description || current
    );
    setMarketPinterestFeedback(
      result.reference.title || result.reference.description
        ? "Referencia cargada. Se aplico la imagen y tambien se aprovecharon los textos utiles del pin."
        : "Referencia cargada. Se aplico solo la imagen porque Pinterest no devolvio texto util para el item."
    );
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
    setMarketPinterestFeedback("");
    setMarketPinterestPreview(null);
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
      participationRewardGold: eventParticipationRewardGold,
      maxParticipants: eventMaxParticipants,
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
      className="fixed inset-0 z-[80] bg-black/70 px-2 py-2 backdrop-blur-md sm:px-4 sm:py-4 md:px-6 md:py-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="kd-glass kd-admin-shell mx-auto flex h-full max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-6xl flex-col overflow-hidden rounded-[1.35rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-black/50 sm:rounded-[2rem]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-amber-500/10 px-4 py-4 sm:gap-4 sm:px-5 md:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/75">
              Modo administrador
            </p>
            <h3 className="mt-2 max-w-[15rem] text-xl font-black leading-tight text-stone-100 sm:max-w-none sm:text-2xl md:text-3xl">
              Centro de control del reino
            </h3>
            <p className="mt-2 text-sm text-stone-400">
              Acceso activo para {player?.username ?? "admin"}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="kd-touch rounded-full border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          data-gsap-admin
          className="border-b border-amber-500/10 px-0 py-3 sm:py-4 md:px-6"
        >
          <div className="flex w-full max-w-full min-w-0 items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-5 md:px-0 [&::-webkit-scrollbar]:hidden">
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Jugadores"
                active={activeTab === "players"}
                onClick={() => setActiveTab("players")}
              />
            </div>
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Misiones"
                active={activeTab === "missions"}
                onClick={() => setActiveTab("missions")}
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
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Staff IA"
                active={activeTab === "staff"}
                onClick={() => setActiveTab("staff")}
              />
            </div>
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Magias"
                active={activeTab === "magic"}
                onClick={() => setActiveTab("magic")}
              />
            </div>
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Bestiario"
                active={activeTab === "bestiary"}
                onClick={() => setActiveTab("bestiary")}
              />
            </div>
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Flora"
                active={activeTab === "flora"}
                onClick={() => setActiveTab("flora")}
              />
            </div>
            <div className="flex-shrink-0">
              <AdminTabButton
                label="Archivo IA"
                active={activeTab === "knowledge"}
                onClick={() => setActiveTab("knowledge")}
              />
            </div>
          </div>
        </div>

        <div
          ref={adminRevealRef}
          className="kd-admin-content flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-5 md:px-6"
        >
          {status === "loading" ? (
            <div data-gsap-admin>
              <AdminInfoCard
                title="Cargando modo admin"
                message="Leyendo jugadores y temporada semanal actual..."
              />
            </div>
          ) : null}

          {activeTab === "players" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section
                data-gsap-admin
                className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
              >
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

              <section
                data-gsap-admin
                className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
              >
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

          {activeTab === "missions" ? (
            <div data-gsap-admin>
              <Suspense
                fallback={
                  <AdminInfoCard
                    title="Cargando misiones"
                    message="Preparando tablero del reino."
                  />
                }
              >
                <AdminMissionManager />
              </Suspense>
            </div>
          ) : null}

          {activeTab === "events" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section
                data-gsap-admin
                className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
              >
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
                    placeholder="Detalle del evento"
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

                  <NumericInput
                    label="Recompensa grupal (oro)"
                    value={eventParticipationRewardGold}
                    onChange={setEventParticipationRewardGold}
                  />
                  <NumericInput
                    label="Cupo maximo (0 = sin limite)"
                    value={eventMaxParticipants}
                    onChange={setEventMaxParticipants}
                  />

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

              <section
                data-gsap-admin
                className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
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

                  <button
                    type="button"
                    onClick={() => setShowEventPendingPanel((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/12 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-500/20"
                  >
                    <BellRing className="h-4 w-4" />
                    Pagos pendientes
                    <span className="rounded-full border border-cyan-400/35 bg-cyan-500/20 px-2 py-0.5 text-[10px]">
                      {eventPendingRewards.length}
                    </span>
                  </button>
                </div>

                {showEventPendingPanel ? (
                  <div className="mt-4 rounded-[1.2rem] border border-cyan-500/25 bg-cyan-500/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                      Avisos de cierre
                    </p>
                    <div className="mt-3 space-y-2">
                      {eventPendingRewards.length > 0 ? (
                        eventPendingRewards.slice(0, 6).map((notification) => (
                          <button
                            key={notification.participationId}
                            type="button"
                            onClick={() => void focusPendingEventReward(notification)}
                            className="w-full rounded-xl border border-cyan-500/25 bg-stone-950/65 px-3 py-2 text-left text-xs text-stone-200 transition hover:border-cyan-400/45"
                          >
                            <span className="font-semibold text-cyan-200">
                              {notification.playerName}
                            </span>{" "}
                            espera recompensa en{" "}
                            <span className="font-semibold text-stone-100">
                              {notification.eventTitle}
                            </span>
                            .
                          </button>
                        ))
                      ) : (
                        <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2 text-xs text-stone-400">
                          No hay pagos pendientes en eventos finalizados.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

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
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                            Recompensa grupal: {entry.participationRewardGold ?? 0} oro
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                            Cupo: {(entry.maxParticipants ?? 0) > 0 ? entry.maxParticipants : "sin limite"}
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

                {selectedEvent ? (
                  <div className="mt-5 rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                          Participantes
                        </p>
                        <p className="mt-1 text-sm font-bold text-stone-100">
                          {selectedEvent.title}
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-200">
                        Premio {selectedEvent.participationRewardGold ?? 0}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-500">
                      Cupo actual:{" "}
                      {(selectedEvent.maxParticipants ?? 0) > 0
                        ? `${eventParticipants.length}/${selectedEvent.maxParticipants}`
                        : `${eventParticipants.length}/∞`}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-stone-200">
                          Agregar jugador
                        </span>
                        <select
                          value={eventParticipantPlayerId}
                          onChange={(event) => setEventParticipantPlayerId(event.target.value)}
                          className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
                        >
                          <option value="">Selecciona jugador</option>
                          {players.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.username}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => void handleAddEventParticipant()}
                        disabled={
                          isClaimingEventPlayer ||
                          !eventParticipantPlayerId ||
                          !eventId ||
                          !isSupabaseEventId(eventId) ||
                          selectedEventIsFinished ||
                          ((selectedEvent.maxParticipants ?? 0) > 0 &&
                            eventParticipants.length >= (selectedEvent.maxParticipants ?? 0))
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
                      >
                        {isClaimingEventPlayer ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Agregando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Anadir
                          </>
                        )}
                      </button>
                    </div>

                    {selectedEventIsFinished ? (
                      <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        El evento ya termino. Ya no se aceptan altas y solo queda pagar recompensas.
                      </div>
                    ) : null}
                    {!selectedEventIsFinished &&
                    (selectedEvent.maxParticipants ?? 0) > 0 &&
                    eventParticipants.length >= (selectedEvent.maxParticipants ?? 0) ? (
                      <div className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                        El evento alcanzo su cupo maximo. No se pueden anadir mas participantes.
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      {isLoadingEventParticipants ? (
                        <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950/45 px-4 py-3 text-sm text-stone-400">
                          Cargando participantes...
                        </div>
                      ) : eventParticipants.length === 0 ? (
                        <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
                          Aun no hay jugadores apuntados a este evento.
                        </div>
                      ) : (
                        eventParticipants.map((participant) => (
                          <div
                            key={participant.id}
                            className="rounded-[1.2rem] border border-stone-800 bg-stone-900/55 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-stone-100">
                                  {participant.playerName}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                                  Participacion registrada
                                </p>
                              </div>
                              <span className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300">
                                {getEventParticipationStatusLabel(participant.status)}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void handleDeliverEventReward(participant)}
                                disabled={
                                  participant.rewardDelivered ||
                                  isRewardingEventParticipantId === participant.id ||
                                  !selectedEventIsFinished
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/12 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-55"
                              >
                                {isRewardingEventParticipantId === participant.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Pagando...
                                  </>
                                ) : (
                                  <>
                                    <Coins className="h-3.5 w-3.5" />
                                    {participant.rewardDelivered ? "Pagada" : "Entregar"}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}

          {activeTab === "market" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <section
                data-gsap-admin
                className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
              >
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

                  <div className="rounded-[1.35rem] border border-cyan-500/15 bg-cyan-500/6 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                          Picker experimental de Pinterest
                        </p>
                        <p className="mt-1 text-xs leading-5 text-stone-400">
                          Pega una URL de pin y probamos si Pinterest deja extraer la imagen de referencia.
                        </p>
                      </div>
                      <span className="rounded-full border border-cyan-400/20 bg-stone-950/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                        Test
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={marketPinterestUrl}
                        onChange={(event) => setMarketPinterestUrl(event.target.value)}
                        placeholder="https://www.pinterest.com/pin/..."
                        className="min-w-0 flex-1 rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-cyan-300/35"
                      />
                      <button
                        type="button"
                        onClick={() => void handleLoadPinterestReference()}
                        disabled={isLoadingPinterestReference}
                        className="kd-touch inline-flex min-w-[11rem] items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-500/12 px-4 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoadingPinterestReference ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Probando...
                          </>
                        ) : (
                          "Probar pin"
                        )}
                      </button>
                    </div>

                    {marketPinterestPreview ? (
                      <div className="mt-3 flex gap-3 rounded-[1.2rem] border border-stone-800 bg-stone-950/45 p-3">
                        <img
                          src={marketPinterestPreview.imageUrl}
                          alt={marketPinterestPreview.title || "Referencia de Pinterest"}
                          className="h-20 w-20 shrink-0 rounded-2xl border border-stone-800 bg-stone-900 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-stone-100">
                            {marketPinterestPreview.title || "Referencia cargada"}
                          </p>
                          {marketPinterestPreview.description ? (
                            <p className="mt-1 line-clamp-3 text-xs leading-5 text-stone-400">
                              {marketPinterestPreview.description}
                            </p>
                          ) : null}
                          <a
                            href={marketPinterestPreview.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200 hover:text-cyan-100"
                          >
                            Abrir pin
                          </a>
                        </div>
                      </div>
                    ) : null}

                    {marketPinterestFeedback ? (
                      <p className="mt-3 rounded-[1rem] border border-stone-800 bg-stone-950/45 px-3 py-2 text-xs leading-5 text-stone-300">
                        {marketPinterestFeedback}
                      </p>
                    ) : null}
                  </div>

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
                  ) : null}

                  <MarketAdminPreview item={marketPreviewItem} />

                  <div className="sticky bottom-0 z-10 -mx-1 mt-4 grid gap-3 rounded-[1.3rem] border border-stone-800 bg-stone-950/90 p-2 shadow-2xl shadow-black/40 backdrop-blur sm:flex sm:flex-wrap sm:items-center">
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

              <section
                data-gsap-admin
                className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5"
              >
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
                            {adminCategoryLabel(item.category)} &middot; {adminRarityLabel(item.rarity)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-300">{item.price}</p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                            oro &middot; {adminStockLabel(item.stockStatus)}
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

          {activeTab === "staff" ? (
            <div data-gsap-admin>
              <Suspense
                fallback={
                  <AdminInfoCard
                    title="Cargando Staff IA"
                    message="Preparando asistente operativo."
                  />
                }
              >
                <AdminStaffAssistant />
              </Suspense>
            </div>
          ) : null}

          {activeTab === "magic" ? (
            <div data-gsap-admin>
              <Suspense
                fallback={
                  <AdminInfoCard
                    title="Cargando magias"
                    message="Preparando editor del grimorio."
                  />
                }
              >
                <AdminMagicManager />
              </Suspense>
            </div>
          ) : null}

          {activeTab === "bestiary" ? (
            <div data-gsap-admin>
              <Suspense
                fallback={
                  <AdminInfoCard
                    title="Cargando bestiario"
                    message="Preparando editor de criaturas."
                  />
                }
              >
                <AdminBestiaryManager />
              </Suspense>
            </div>
          ) : null}

          {activeTab === "flora" ? (
            <div data-gsap-admin>
              <Suspense
                fallback={
                  <AdminInfoCard
                    title="Cargando flora"
                    message="Preparando editor de naturaleza del mundo."
                  />
                }
              >
                <AdminFloraManager />
              </Suspense>
            </div>
          ) : null}

          {activeTab === "knowledge" ? (
            <div data-gsap-admin>
              <Suspense
                fallback={
                  <AdminInfoCard
                    title="Cargando Archivo IA"
                    message="Preparando base documental del Archivista."
                  />
                }
              >
                <AdminKnowledgeManager />
              </Suspense>
            </div>
          ) : null}

        </div>
      </motion.div>
    </motion.div>
  );
}
