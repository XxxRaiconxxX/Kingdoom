import { lazy, Suspense, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Backpack,
  Coins,
  Crown,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Tag,
  UserRound,
  WalletCards,
  Send,
  ScrollText,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  Store,
  type LucideIcon,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import type {
  BusinessCollectionLogEntry,
  CharacterSheet,
  PlayerBusiness,
  PlayerBusinessProposal,
} from "../types";
import { PlayerNotificationBell } from "./PlayerNotificationBell";
import {
  collectBusinessGold,
  fetchPlayerBusinessCollectionLog,
  fetchPlayerBusinesses,
  fetchPlayerBusinessProposals,
  projectBusinessStorage,
  respondBusinessProposal,
} from "../utils/businesses";
import {
  MAX_PLAYER_CHARACTER_SHEETS,
  getPlayerSheets,
  saveCharacterSheet,
  deleteCharacterSheet,
} from "../utils/characterSheets";
import { buyCharacterSlot } from "../utils/players";
import {
  deleteCharacterPortraitByUrl,
  uploadCharacterPortrait,
} from "../utils/characterPortraits";
import {
  resolveActivePveSheetId,
  setActivePveSheetId,
} from "../utils/pveProgress";

const CharImportModal = lazy(() =>
  import("./CharImportModal").then((module) => ({
    default: module.CharImportModal,
  }))
);
const CharSheetModal = lazy(() =>
  import("./CharSheetModal").then((module) => ({
    default: module.CharSheetModal,
  }))
);
const RealmRegistry = lazy(() =>
  import("./RealmRegistry").then((module) => ({
    default: module.RealmRegistry,
  }))
);
const AdminControlSheet = lazy(() =>
  import("./AdminControlSheet").then((module) => ({
    default: module.AdminControlSheet,
  }))
);
const PlayerInventorySheet = lazy(() =>
  import("./PlayerInventorySheet").then((module) => ({
    default: module.PlayerInventorySheet,
  }))
);
const PlayerTradeSheet = lazy(() =>
  import("./PlayerTradeSheet").then((module) => ({
    default: module.PlayerTradeSheet,
  }))
);

export function PlayerProfilePanel({
  collapsed,
  onCollapsedChange,
  showAnimeShortcut = false,
  onOpenAnime,
}: {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  showAnimeShortcut?: boolean;
  onOpenAnime?: () => void;
}) {
  const {
    player,
    isAdmin,
    isHydrating,
    isSecureSessionReady,
    secureSessionError,
    isPlayerSecureLinked,
    isLinkingSecureAccount,
    isSubmittingProfile,
    profileError,
    connectPlayer,
    clearPlayer,
    linkCurrentPlayerToSecureSession,
    refreshPlayer,
    setProfileError,
  } = usePlayerSession();
  const [usernameInput, setUsernameInput] = useState("");
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<CharacterSheet | null>(null);
  const [sheetToEdit, setSheetToEdit] = useState<CharacterSheet | null>(null);
  const [playerSheets, setPlayerSheets] = useState<CharacterSheet[]>([]);
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);
  const [sheetFeedback, setSheetFeedback] = useState("");
  const [activeExpeditionSheetId, setActiveExpeditionSheetId] = useState<string | null>(null);
  const [businessProposals, setBusinessProposals] = useState<
    PlayerBusinessProposal[]
  >([]);
  const [businesses, setBusinesses] = useState<PlayerBusiness[]>([]);
  const [businessLogs, setBusinessLogs] = useState<BusinessCollectionLogEntry[]>([]);
  const [businessFeedback, setBusinessFeedback] = useState("");
  const [isBusinessBusy, setIsBusinessBusy] = useState(false);
  const [isBusinessesExpanded, setIsBusinessesExpanded] = useState(false);
  const [secureLinkFeedback, setSecureLinkFeedback] = useState("");
  const [isPlayingAvatarGif, setIsPlayingAvatarGif] = useState(false);
  const [connectedGifUrl, setConnectedGifUrl] = useState<string | null>(null);
  const [isMinimumHydrationTimeMet, setIsMinimumHydrationTimeMet] = useState(false);

  useEffect(() => {
    const cachedGif = window.localStorage.getItem("kingdoom.active-player-gif");
    let durationMs = 0;
    if (cachedGif) {
      try {
        const urlParams = new URL(cachedGif).searchParams;
        const parsedDuration = parseInt(urlParams.get("duration") || "0", 10);
        if (parsedDuration > 0) {
          durationMs = parsedDuration + 3000;
        }
      } catch (e) {
        durationMs = 3000;
      }
    }
    
    if (durationMs > 0) {
      const timer = setTimeout(() => {
        setIsMinimumHydrationTimeMet(true);
      }, durationMs);
      return () => clearTimeout(timer);
    } else {
      setIsMinimumHydrationTimeMet(true);
    }
  }, []);

  const isCollapsed = Boolean(collapsed && player);

  useEffect(() => {
    if (player) {
      getPlayerSheets(player.id).then((sheets) => {
        setPlayerSheets(sheets);
        setActiveExpeditionSheetId(
          resolveActivePveSheetId(
            player.id,
            sheets.map((sheet) => sheet.id)
          )
        );
      });
    } else {
      setPlayerSheets([]);
      setActiveExpeditionSheetId(null);
      setBusinessProposals([]);
      setBusinesses([]);
      setBusinessLogs([]);
    }
    setSecureLinkFeedback("");
  }, [player]);

  useEffect(() => {
    let cancelled = false;

    async function loadBusinesses() {
      if (!player) {
        return;
      }

      const [nextProposals, nextBusinesses, nextLogs] = await Promise.all([
        fetchPlayerBusinessProposals(player.id),
        fetchPlayerBusinesses(player.id),
        fetchPlayerBusinessCollectionLog(player.id),
      ]);

      if (cancelled) {
        return;
      }

      setBusinessProposals(nextProposals);
      setBusinesses(nextBusinesses);
      setBusinessLogs(nextLogs);
    }

    void loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, [player]);

  async function refreshPlayerSheetsForProfile() {
    if (!player) {
      return [] as CharacterSheet[];
    }

    const sheets = await getPlayerSheets(player.id);
    setPlayerSheets(sheets);
    const nextActiveSheetId = resolveActivePveSheetId(
      player.id,
      sheets.map((sheet) => sheet.id)
    );
    setActiveExpeditionSheetId(nextActiveSheetId);
    return sheets;
  }

  async function handleOpenSheet(sheet: CharacterSheet) {
    const sheets = await refreshPlayerSheetsForProfile();
    setSelectedSheet(sheets.find((freshSheet) => freshSheet.id === sheet.id) ?? sheet);
  }

  async function handleEditSheet(sheet: CharacterSheet) {
    const sheets = await refreshPlayerSheetsForProfile();
    setSheetToEdit(sheets.find((freshSheet) => freshSheet.id === sheet.id) ?? sheet);
  }

  const handleSaveSheet = async (
    partialSheet: Partial<CharacterSheet>,
    portraitFile?: File | null,
    existingSheet?: CharacterSheet | null
  ) => {
    if (!player) return;
    const isEditing = Boolean(existingSheet);

    const maxSheets = player.maxCharacterSheets ?? MAX_PLAYER_CHARACTER_SHEETS;
    if (!isEditing && playerSheets.length >= maxSheets) {
      setSheetFeedback(
        `Cada cuenta puede tener hasta ${maxSheets} fichas. Elimina una o compra más espacios antes de importar otra.`
      );
      return;
    }

    const stats = partialSheet.stats ?? {
      strength: 0,
      agility: 0,
      intelligence: 0,
      defense: 0,
      magicDefense: 0,
    };

    const sheetId = existingSheet?.id ?? crypto.randomUUID();
    let portraitUrl: string | undefined = existingSheet?.portraitUrl;

    if (portraitFile) {
      if (existingSheet?.portraitUrl) {
        await deleteCharacterPortraitByUrl(existingSheet.portraitUrl);
      }

      portraitUrl = await uploadCharacterPortrait({
        file: portraitFile,
        playerId: player.id,
        sheetId,
      });
    }

    const savedSheet: CharacterSheet = {
      id: sheetId,
      playerId: player.id,
      playerUsername: player.username,
      portraitUrl,
      name: partialSheet.name ?? "",
      age: partialSheet.age ?? "",
      gender: partialSheet.gender ?? "",
      height: partialSheet.height ?? "",
      race: partialSheet.race ?? "",
      powers: partialSheet.powers ?? "",
      stats: {
        strength: Number(stats.strength ?? 0) || 0,
        agility: Number(stats.agility ?? 0) || 0,
        intelligence: Number(stats.intelligence ?? 0) || 0,
        defense: Number(stats.defense ?? 0) || 0,
        magicDefense: Number(stats.magicDefense ?? 0) || 0,
      },
      weapon: partialSheet.weapon ?? "",
      combatStyle: partialSheet.combatStyle ?? "",
      birthRealm: partialSheet.birthRealm ?? "",
      socialClass: partialSheet.socialClass ?? "",
      nobleTitle: partialSheet.nobleTitle ?? "",
      profession: partialSheet.profession ?? "",
      nonMagicSkills: partialSheet.nonMagicSkills ?? "",
      personality: partialSheet.personality ?? "",
      history: partialSheet.history ?? "",
      extras: partialSheet.extras ?? "",
      weaknesses: partialSheet.weaknesses ?? "",
      inventory: partialSheet.inventory ?? "",
      createdAt: existingSheet?.createdAt ?? new Date().toISOString(),
    };

    await saveCharacterSheet(savedSheet);
    const updatedSheets = await getPlayerSheets(player.id);
    setPlayerSheets(updatedSheets);
    const updatedSelectedSheet = updatedSheets.find((sheet) => sheet.id === savedSheet.id);
    setSelectedSheet((current) =>
      current?.id === savedSheet.id ? updatedSelectedSheet ?? savedSheet : current
    );
    const nextActiveSheetId =
      activeExpeditionSheetId &&
      updatedSheets.some((sheet) => sheet.id === activeExpeditionSheetId)
        ? activeExpeditionSheetId
        : savedSheet.id;
    setActivePveSheetId(player.id, nextActiveSheetId);
    setActiveExpeditionSheetId(nextActiveSheetId);
    setSheetFeedback(
      isEditing
        ? `Ficha actualizada. ${savedSheet.name || "Personaje"} ya refleja los cambios.`
        : `Ficha importada. ${savedSheet.name || "Personaje"} ya puede usarse en Expedicion.`
    );
  };

  const confirmDeleteSheet = async () => {
    if (sheetToDelete) {
      await deleteCharacterSheet(sheetToDelete);
      if (player) {
        const updatedSheets = await getPlayerSheets(player.id);
        setPlayerSheets(updatedSheets);
        const nextActiveSheetId = updatedSheets.some(
          (sheet) => sheet.id === activeExpeditionSheetId
        )
          ? activeExpeditionSheetId
          : updatedSheets[0]?.id ?? null;
        setActivePveSheetId(player.id, nextActiveSheetId);
        setActiveExpeditionSheetId(nextActiveSheetId);
        setSheetFeedback(
          updatedSheets.length > 0
            ? "Ficha eliminada. Se reajusto la seleccion activa de Expedicion."
            : "Ficha eliminada. Ya no tienes un cazador activo para Expedicion."
        );
      }
      setSheetToDelete(null);
    }
  };

  const handleDeleteSheet = (id: string) => {
    setSheetToDelete(id);
  };

  const handleSelectExpeditionSheet = (sheetId: string) => {
    if (!player) {
      return;
    }

    setActivePveSheetId(player.id, sheetId);
    setActiveExpeditionSheetId(sheetId);
    const selected = playerSheets.find((sheet) => sheet.id === sheetId);
    setSheetFeedback(
      selected
        ? `${selected.name || "La ficha"} ahora es tu cazador activo en Expedicion.`
        : "Se actualizo la ficha activa de Expedicion."
    );
  };

  const [isBuyingSlot, setIsBuyingSlot] = useState(false);
  const currentSlots = player?.maxCharacterSheets ?? 2;
  const maxSlotsLimit = 10;

  const getNextSlotCost = (slots: number) => {
    return 1000000;
  };

  const nextSlotCost = getNextSlotCost(currentSlots);

  const handleBuySlot = async () => {
    if (!player) return;
    if (currentSlots >= maxSlotsLimit) {
      setSheetFeedback("Ya has alcanzado el límite máximo de 10 fichas.");
      return;
    }
    if (player.gold < nextSlotCost) {
      setSheetFeedback("No tienes suficiente oro para comprar un espacio adicional.");
      return;
    }

    const confirmBuy = window.confirm(
      `¿Deseas comprar un espacio de ficha adicional por ${nextSlotCost.toLocaleString("es-PY")} de oro?`
    );
    if (!confirmBuy) return;

    setIsBuyingSlot(true);
    setSheetFeedback("");

    const result = await buyCharacterSlot(player.id);
    setIsBuyingSlot(false);

    if (result.status === "success") {
      setSheetFeedback(result.message);
      await refreshPlayer();
    } else {
      setSheetFeedback(result.message);
    }
  };

  async function reloadBusinessState() {
    if (!player) {
      return;
    }

    const [nextProposals, nextBusinesses, nextLogs] = await Promise.all([
      fetchPlayerBusinessProposals(player.id),
      fetchPlayerBusinesses(player.id),
      fetchPlayerBusinessCollectionLog(player.id),
    ]);

    setBusinessProposals(nextProposals);
    setBusinesses(nextBusinesses);
    setBusinessLogs(nextLogs);
  }

  async function handleBusinessProposalAction(
    proposalId: string,
    action: "accept" | "reject"
  ) {
    if (!player) {
      return;
    }

    setIsBusinessBusy(true);
    setBusinessFeedback("");

    const result = await respondBusinessProposal({
      proposalId,
      playerId: player.id,
      action,
    });

    setIsBusinessBusy(false);
    setBusinessFeedback(result.message);

    if (result.status === "success") {
      await Promise.all([refreshPlayer(), reloadBusinessState()]);
    }
  }

  async function handleCollectBusiness(businessId: string) {
    if (!player) {
      return;
    }

    setIsBusinessBusy(true);
    setBusinessFeedback("");

    const result = await collectBusinessGold({
      businessId,
      playerId: player.id,
    });

    setIsBusinessBusy(false);
    setBusinessFeedback(result.message);

    if (result.status === "success") {
      await Promise.all([refreshPlayer(), reloadBusinessState()]);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const connectedPlayer = await connectPlayer(usernameInput);

    if (connectedPlayer) {
      setUsernameInput("");
      if (connectedPlayer.avatar_gif_url) {
        setIsPlayingAvatarGif(true);
        setConnectedGifUrl(connectedPlayer.avatar_gif_url);
        
        // Extraer la duración si está presente en la URL (ej: ?duration=4500)
        let durationMs = 3000;
        try {
          const urlParams = new URL(connectedPlayer.avatar_gif_url).searchParams;
          const parsedDuration = parseInt(urlParams.get("duration") || "0", 10);
          if (parsedDuration > 0) {
            // Añadimos 3000ms extra para dar tiempo a que cargue la imagen
            // y hacer una leve pausa final
            durationMs = parsedDuration + 3000;
          }
        } catch (e) {
          // Ignorar error y usar fallback 3000ms
        }

        setTimeout(() => {
          setIsPlayingAvatarGif(false);
        }, durationMs);
      }
    }
  }

  const activeSheet = playerSheets.find(
    (sheet) => sheet.id === activeExpeditionSheetId
  );

  return (
    <section className="kd-glass relative overflow-hidden rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-4 sm:p-5 shadow-2xl shadow-black/20 md:p-6">
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full border border-amber-400/10 bg-[radial-gradient(circle,rgba(245,158,11,0.18),transparent_62%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      {player || showAnimeShortcut ? (
        <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
          {showAnimeShortcut ? (
            <button
              type="button"
              onClick={onOpenAnime}
              className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/35 bg-white/95 p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-rose-300/70 hover:shadow-[0_18px_38px_rgba(127,29,29,0.4)]"
              title="Abrir portal anime"
            >
              <img loading="lazy" decoding="async" 
                src={`${import.meta.env.BASE_URL}icons/anime-torii.png`}
                alt="Portal anime"
                className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]"
              />
            </button>
          ) : null}
          {player ? (
            <PlayerNotificationBell playerId={player.id} className="relative" />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pr-28 md:pr-32">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
            <span className="h-2 w-2 rounded-full bg-amber-400/80 shadow-[0_0_14px_rgba(251,191,36,0.45)]" />
            Perfil del reino
          </p>
          <h2 className="text-2xl font-black text-stone-100 md:text-3xl">
            Tu sesion de jugador
          </h2>
        </div>
      </div>

      <div className="mt-5">
        {(isHydrating || (!isMinimumHydrationTimeMet && window.localStorage.getItem("kingdoom.active-player-gif"))) ? (
          (() => {
            const cachedGif = window.localStorage.getItem("kingdoom.active-player-gif");
            if (cachedGif) {
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center justify-center space-y-4 rounded-[2rem] border border-amber-500/20 bg-stone-950 p-6 shadow-2xl md:p-10"
                >
                  <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl border-2 border-amber-500/30">
                    <img loading="lazy" decoding="async"  
                      src={cachedGif}
                      alt="Restaurando avatar..."
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                      Despertando jugador...
                    </p>
                  </div>
                </motion.div>
              );
            }
            return (
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-stone-800 bg-stone-950/45 px-4 py-4 text-sm text-stone-300">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                Restaurando tu sesion guardada...
              </div>
            );
          })()
        ) : isPlayingAvatarGif && connectedGifUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center space-y-4 rounded-[2rem] border border-amber-500/20 bg-stone-950 p-6 shadow-2xl md:p-10"
          >
            <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl border-2 border-amber-500/30">
              <img loading="lazy" decoding="async"  
                src={connectedGifUrl}
                alt="Despertando..."
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 sm:text-xs">
                Despertando jugador...
              </div>
            </div>
          </motion.div>
        ) : player ? (
          isCollapsed ? (
            <div className="space-y-3">
              <div className="rounded-[1.6rem] border border-stone-800 bg-[linear-gradient(135deg,rgba(24,24,20,0.94),rgba(12,10,9,0.8))] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
                        Jugador conectado
                      </p>
                      <p className="truncate text-lg font-black text-stone-100">
                        {player.username}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-amber-500/80">
                        ID: {player.id.slice(0, 8)}
                      </p>
                      <p className="mt-1 text-xs text-stone-400">
                        {activeSheet?.name
                          ? `Activo: ${activeSheet.name}`
                          : "Sin cazador activo"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCollapsedChange?.(!isCollapsed)}
                    className="rounded-xl border border-stone-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
                    title="Ver panel completo"
                  >
                    Panel
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <ProfileQuickAction
                    icon={WalletCards}
                    label="Oro"
                    value={String(player.gold)}
                    tone="gold"
                    onClick={() => setIsInventoryOpen(true)}
                  />
                  <ProfileQuickAction
                    icon={Search}
                    label="Registro"
                    value="Ver fichas"
                    tone="violet"
                    onClick={() => setIsRegistryOpen(true)}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {isAdmin ? (
                    <ProfileMiniButton
                      icon={ShieldCheck}
                      label="Admin"
                      tone="gold"
                      onClick={() => setIsAdminOpen(true)}
                    />
                  ) : null}
                  <ProfileMiniButton
                    icon={Backpack}
                    label="Inventario"
                    onClick={() => setIsInventoryOpen(true)}
                  />
                  <ProfileMiniButton
                    icon={Send}
                    label="Enviar"
                    tone="cyan"
                    onClick={() => setIsTradeOpen(true)}
                  />
                  <ProfileMiniButton
                    icon={RefreshCw}
                    label="Cambiar"
                    onClick={() => {
                      clearPlayer();
                      setUsernameInput(player.username);
                      onCollapsedChange?.(false);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[1.75rem] border border-stone-800 bg-[linear-gradient(135deg,rgba(24,24,20,0.96),rgba(12,10,9,0.82))] p-4 sm:p-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)]">
                  <div className="flex flex-col gap-4 sm:gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-[1.15rem] border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                            Jugador conectado
                          </p>
                          <p className="truncate text-xl font-black text-stone-100">
                            {player.username}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-stone-400">
                            <span className="font-mono text-amber-500/90 font-bold">{player.id.slice(0, 8)}</span>
                            <span className="text-stone-600">•</span>
                            <span className={player.phone ? "text-emerald-400/90 font-medium" : "text-stone-400"}>
                              WhatsApp: {player.phone ? "Vinculado ✅" : "No vinculado ❌"}
                            </span>
                            <span className="text-stone-600">•</span>
                            <span
                              className={
                                isPlayerSecureLinked
                                  ? "text-cyan-300/90 font-medium"
                                  : "text-stone-400"
                              }
                            >
                              Cuenta segura:{" "}
                              {isPlayerSecureLinked
                                ? "Activa ✅"
                                : isSecureSessionReady
                                  ? "Pendiente"
                                  : "Preparando"}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
                                <Crown className="h-3 w-3" />
                                Admin
                              </span>
                            ) : null}
                            {activeSheet?.name ? (
                              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                {activeSheet.name}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          clearPlayer();
                          setUsernameInput(player.username);
                          onCollapsedChange?.(false);
                        }}
                        className="rounded-xl border border-stone-700 p-2 text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
                        title="Cambiar usuario"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {isAdmin ? (
                        <ProfileMiniButton
                          icon={ShieldCheck}
                          label="Admin"
                          tone="gold"
                          onClick={() => setIsAdminOpen(true)}
                        />
                      ) : null}
                      <ProfileMiniButton
                        icon={Backpack}
                        label="Inventario"
                        onClick={() => setIsInventoryOpen(true)}
                      />
                      <ProfileMiniButton
                        icon={Send}
                        label="Enviar"
                        tone="cyan"
                        onClick={() => setIsTradeOpen(true)}
                      />
                      <ProfileMiniButton
                        icon={Search}
                        label="Buscar fichas"
                        tone="violet"
                        onClick={() => setIsRegistryOpen(true)}
                      />
                      <ProfileMiniButton
                        icon={ScrollText}
                        label="Compactar"
                        onClick={() => onCollapsedChange?.(!isCollapsed)}
                      />
                    </div>
                    {isAdmin && !isPlayerSecureLinked ? (
                      <div className="rounded-[1.25rem] border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">
                              Cuenta segura requerida
                            </p>
                            <p className="mt-1 leading-6 text-cyan-50/90">
                              Este perfil admin aun no esta enlazado a la sesión segura de Supabase.
                              Vincúlala una vez y las acciones del staff quedarán habilitadas en este navegador.
                            </p>
                            {secureSessionError ? (
                              <p className="mt-2 text-xs text-rose-200">{secureSessionError}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            disabled={!isSecureSessionReady || isLinkingSecureAccount}
                            onClick={async () => {
                              const result = await linkCurrentPlayerToSecureSession();
                              setSecureLinkFeedback(result.message);
                            }}
                            className="inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/15 px-4 py-3 text-sm font-extrabold text-cyan-50 transition hover:border-cyan-300/45 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isLinkingSecureAccount ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Vinculando...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4" />
                                Vincular cuenta segura
                              </>
                            )}
                          </button>
                        </div>
                        {secureLinkFeedback ? (
                          <p className="mt-3 text-xs text-cyan-100/90">{secureLinkFeedback}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-stone-800 bg-[linear-gradient(180deg,rgba(31,24,18,0.94),rgba(12,10,9,0.82))] p-4 sm:p-5 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-[1.15rem] border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
                      <WalletCards className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Oro disponible
                      </p>
                      <p className="mt-1 text-3xl font-black text-amber-300">
                        {player.gold}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ProfileInfoStat
                      label="Fichas"
                      value={`${playerSheets.length}/${player.maxCharacterSheets ?? MAX_PLAYER_CHARACTER_SHEETS}`}
                    />
                    <ProfileInfoStat
                      label="PvE"
                      value={activeSheet?.name ? "Lista" : "Pendiente"}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-stone-800 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Cazador activo
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-100">
                      {activeSheet?.name ?? "Selecciona una ficha"}
                    </p>
                  </div>
                </div>
              </div>

              {businessProposals.some(p => p.status === "pending") || businesses.length > 0 ? (
                <div className="rounded-[1.75rem] border border-stone-800 bg-stone-950/45 p-4 sm:p-5">
                  <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-300">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold uppercase tracking-wider text-stone-100">
                          Tus negocios
                        </h3>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
                          Propuestas del staff y produccion pasiva del reino
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone-500">
                      <span className="rounded-full border border-stone-700 px-3 py-1">
                        Propuestas {businessProposals.filter(p => p.status === "pending").length}
                      </span>
                      <span className="rounded-full border border-stone-700 px-3 py-1">
                        Activos {businesses.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBusinessesExpanded(!isBusinessesExpanded)}
                        className="rounded-full border border-stone-700 px-3 py-1 font-bold transition hover:border-stone-500 hover:text-stone-300"
                      >
                        {isBusinessesExpanded ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>

                  {isBusinessesExpanded ? (
                    <>
                      {businessFeedback ? (
                    <div className="mb-4 rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
                      {businessFeedback}
                    </div>
                  ) : null}

                  {businessProposals.filter(p => p.status === "pending").length > 0 ? (
                    <div className="mb-5">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                        Propuestas pendientes
                      </p>
                      <div className="space-y-3">
                        {businessProposals.filter(p => p.status === "pending").map((proposal) => {
                          const affordable = player.gold >= proposal.openingCost;
                          return (
                            <div
                              key={proposal.id}
                              className="rounded-[1.4rem] border border-amber-500/18 bg-[linear-gradient(135deg,rgba(36,26,10,0.72),rgba(20,12,7,0.9))] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/70">
                                    {proposal.businessType}
                                  </p>
                                  <p className="mt-1 text-lg font-black text-stone-100">
                                    {proposal.icon} {proposal.name}
                                  </p>
                                </div>
                                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
                                  {proposal.goldPerHour}/h
                                </span>
                              </div>

                              <p className="mt-3 text-sm leading-6 text-stone-300">
                                {proposal.description}
                              </p>

                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <BusinessMetric
                                  label="Produce"
                                  value={proposal.productionLabel}
                                />
                                <BusinessMetric
                                  label="Tope"
                                  value={`${proposal.maxStorage} oro`}
                                />
                                <BusinessMetric
                                  label="Costo"
                                  value={`${proposal.openingCost.toLocaleString("es-PY")} oro`}
                                />
                              </div>

                              {proposal.notes ? (
                                <div className="mt-3 rounded-2xl border border-stone-800 bg-black/20 px-4 py-3 text-sm text-stone-300">
                                  {proposal.notes}
                                </div>
                              ) : null}

                              {!affordable ? (
                                <p className="mt-3 text-sm text-red-300">
                                  Necesitas{" "}
                                  {(proposal.openingCost - player.gold).toLocaleString("es-PY")} oro
                                  más para abrir este negocio.
                                </p>
                              ) : null}

                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleBusinessProposalAction(
                                      proposal.id,
                                      "accept"
                                    )
                                  }
                                  disabled={isBusinessBusy || !affordable}
                                  className="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Aceptar propuesta
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleBusinessProposalAction(
                                      proposal.id,
                                      "reject"
                                    )
                                  }
                                  disabled={isBusinessBusy}
                                  className="rounded-2xl border border-stone-700 px-4 py-2.5 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {businesses.length > 0 ? (
                    <div>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                        Negocios activos
                      </p>
                      <div className="space-y-3">
                        {businesses.map((business) => {
                          const projection = projectBusinessStorage(business);

                          return (
                            <div
                              key={business.id}
                              className="rounded-[1.4rem] border border-emerald-500/18 bg-[linear-gradient(135deg,rgba(8,33,25,0.65),rgba(12,12,10,0.9))] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
                                    {business.businessType}
                                  </p>
                                  <p className="mt-1 text-lg font-black text-stone-100">
                                    {business.icon} {business.name}
                                  </p>
                                </div>
                                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                                  {projection.storedGold}/{business.maxStorage}
                                </span>
                              </div>

                              <p className="mt-3 text-sm leading-6 text-stone-300">
                                {business.description}
                              </p>

                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-800">
                                <div
                                  className="h-full rounded-full bg-emerald-400 transition-[width]"
                                  style={{ width: `${projection.fillRatio * 100}%` }}
                                />
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                <BusinessMetric label="Produce" value={`${business.goldPerHour}/h`} />
                                <BusinessMetric label="Actividad" value={business.productionLabel} />
                                <BusinessMetric
                                  label="Estado"
                                  value={projection.capped ? "Lleno" : "Generando"}
                                />
                                <BusinessMetric
                                  label="Tope"
                                  value={`${business.maxStorage} oro`}
                                />
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs text-stone-400">
                                  {projection.capped
                                    ? "Tu negocio ya alcanzo el tope y dejo de producir hasta que recolectes."
                                    : "Sigue generando oro mientras haya espacio de almacenamiento."}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => void handleCollectBusiness(business.id)}
                                  disabled={isBusinessBusy || projection.storedGold <= 0}
                                  className="rounded-2xl bg-emerald-500/85 px-4 py-2.5 text-sm font-extrabold text-stone-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Recolectar {projection.storedGold.toLocaleString("es-PY")} oro
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {businessLogs.length > 0 ? (
                    <div className="mt-5 rounded-[1.3rem] border border-stone-800 bg-stone-950/35 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
                        Historial reciente
                      </p>
                      <div className="mt-3 space-y-2">
                        {businessLogs.slice(0, 5).map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-black/20 px-3 py-2 text-sm"
                          >
                            <span className="text-stone-300">
                              +{entry.collectedGold.toLocaleString("es-PY")} oro
                            </span>
                            <span className="text-stone-500">
                              {new Date(entry.collectedAt).toLocaleString("es-PY")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-[1.75rem] border border-stone-800 bg-stone-950/45 p-4 sm:p-5">
                <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
                      <ScrollText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-wider text-stone-100">
                        Mis personajes
                      </h3>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
                        Máximo {player?.maxCharacterSheets ?? MAX_PLAYER_CHARACTER_SHEETS} fichas por cuenta
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      disabled={playerSheets.length >= currentSlots}
                      className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/14 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/22 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      {playerSheets.length >= currentSlots
                        ? "Límite alcanzado"
                        : "Importar ficha"}
                    </button>
                    {currentSlots < maxSlotsLimit ? (
                      <button
                        onClick={handleBuySlot}
                        disabled={isBuyingSlot || player.gold < nextSlotCost}
                        className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/14 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/22 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                        title={`Desbloquear espacio de ficha por ${nextSlotCost.toLocaleString("es-PY")} de oro`}
                      >
                        {isBuyingSlot ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Tag className="h-4 w-4" />
                        )}
                        Slot {currentSlots + 1}: {nextSlotCost >= 1000000 ? `${(nextSlotCost / 1000000).toFixed(0)}M` : nextSlotCost.toLocaleString("es-PY")} oro
                      </button>
                    ) : (
                      <span className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-2.5 text-sm font-semibold text-stone-500 select-none">
                        Límite máximo (10)
                      </span>
                    )}
                  </div>
                </div>

                {sheetFeedback ? (
                  <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-100">
                    {sheetFeedback}
                  </div>
                ) : null}

                {playerSheets.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-stone-800 py-8 text-center">
                    <p className="text-sm text-stone-500">
                      Aun no has importado ninguna ficha de personaje.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {playerSheets.map((sheet) => {
                      return (
                      <div
                        key={sheet.id}
                        className="kd-hover-lift flex flex-col gap-3 rounded-[1.35rem] border border-stone-800 bg-[linear-gradient(180deg,rgba(26,23,20,0.94),rgba(12,10,9,0.88))] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-800 bg-stone-950">
                            {sheet.portraitUrl ? (
                              <img loading="lazy" decoding="async" 
                                src={sheet.portraitUrl}
                                alt={`Retrato de ${sheet.name || "personaje"}`}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                Sin foto
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="truncate font-bold uppercase tracking-wider text-amber-300">
                                {sheet.name || "Personaje sin nombre"}
                              </h4>
                              {activeExpeditionSheetId === sheet.id ? (
                                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
                                  Activa PvE
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-xs text-stone-400">
                              {sheet.race || "Raza desconocida"}
                              {sheet.profession ? ` - ${sheet.profession}` : ""}
                            </p>
                            {sheet.powers ? (
                              <p className="mt-1 truncate text-xs text-stone-500">
                                Poder: {sheet.powers.replace(/\*/g, "")}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectExpeditionSheet(sheet.id)}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                            activeExpeditionSheetId === sheet.id
                              ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                              : "border-stone-700 bg-stone-950 text-stone-300 hover:border-amber-400/25 hover:text-stone-100"
                          }`}
                        >
                          {activeExpeditionSheetId === sheet.id
                            ? "Cazador activo"
                            : "Usar en Expedicion"}
                        </button>

                        <div className="mt-auto flex items-center gap-2">
                          <button
                            onClick={() => void handleOpenSheet(sheet)}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-stone-800 py-2 text-xs font-semibold text-stone-200 transition-colors hover:bg-stone-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver ficha
                          </button>
                          <button
                            onClick={() => void handleEditSheet(sheet)}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-500/10 p-2 text-emerald-300 transition-colors hover:bg-emerald-500/20"
                            title="Editar ficha"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSheet(sheet.id)}
                            className="rounded-lg bg-rose-500/10 p-2 text-rose-400 transition-colors hover:bg-rose-500/20"
                            title="Eliminar ficha"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.75rem] border border-stone-800 bg-[linear-gradient(135deg,rgba(24,24,20,0.96),rgba(12,10,9,0.82))] p-4 sm:p-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-[1.15rem] border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                    Acceso al reino
                  </p>
                  <p className="text-lg font-black text-stone-100">
                    Conecta tu perfil
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-4 md:grid-cols-[1fr_auto]"
              >
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-200">
                    Nombre del jugador registrado
                  </span>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(event) => {
                      setUsernameInput(event.target.value);
                      if (profileError) {
                        setProfileError("");
                      }
                    }}
                    className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
                    placeholder="Tu nombre exacto registrado en el reino"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
                >
                  {isSubmittingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      Conectar perfil
                    </>
                  )}
                </button>

                {profileError ? (
                  <div className="md:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {profileError}
                  </div>
                ) : null}
              </form>
            </div>

            <div className="rounded-[1.75rem] border border-purple-500/15 bg-[linear-gradient(180deg,rgba(30,22,35,0.92),rgba(12,10,9,0.82))] p-4 sm:p-5 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300/80">
                Registro publico
              </p>
              <h3 className="mt-2 text-xl font-black text-stone-100">
                Explora fichas del reino
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Consulta personajes cargados sin conectarte.
              </p>
              <button
                type="button"
                onClick={() => setIsRegistryOpen(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-3 py-3 text-sm font-semibold text-purple-300 transition hover:border-purple-400/35 hover:bg-purple-500/14"
              >
                <Search className="h-4 w-4" />
                Explorar fichas
              </button>
            </div>
          </div>
        )}
      </div>

      <>
        {isAdminOpen && player && isAdmin
          ? createPortal(
              <Suspense
                key="admin-sheet"
                fallback={
                  <ProfileSheetFallback message="Abriendo el centro de control del reino..." />
                }
              >
                <AdminControlSheet onClose={() => setIsAdminOpen(false)} />
              </Suspense>,
              document.body,
            )
          : null}
        {isInventoryOpen && player ? (
          <Suspense
            key="inventory-sheet"
            fallback={
              <ProfileSheetFallback message="Abriendo el inventario del jugador..." />
            }
          >
            <PlayerInventorySheet onClose={() => setIsInventoryOpen(false)} />
          </Suspense>
        ) : null}
        {isTradeOpen && player ? (
          <Suspense
            key="trade-sheet"
            fallback={
              <ProfileSheetFallback message="Abriendo el centro de intercambios..." />
            }
          >
            <PlayerTradeSheet onClose={() => setIsTradeOpen(false)} />
          </Suspense>
        ) : null}
      </>

      {/* Character Sheet Modals */}
      {isImportModalOpen ? (
        <Suspense fallback={<ProfileSheetFallback message="Preparando el importador de fichas..." />}>
          <CharImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onSave={handleSaveSheet}
          />
        </Suspense>
      ) : null}
      {sheetToEdit ? (
        <Suspense fallback={<ProfileSheetFallback message="Preparando la edicion de ficha..." />}>
          <CharImportModal
            isOpen={!!sheetToEdit}
            mode="edit"
            initialSheet={sheetToEdit}
            onClose={() => setSheetToEdit(null)}
            onSave={(partialSheet, portraitFile) =>
              handleSaveSheet(partialSheet, portraitFile, sheetToEdit)
            }
          />
        </Suspense>
      ) : null}
      {selectedSheet ? (
        <Suspense fallback={<ProfileSheetFallback message="Abriendo la hoja del personaje..." />}>
          <CharSheetModal
            isOpen={!!selectedSheet}
            onClose={() => setSelectedSheet(null)}
            character={selectedSheet}
          />
        </Suspense>
      ) : null}

      {isRegistryOpen
        ? createPortal(
            <Suspense
              fallback={
                <ProfileSheetFallback message="Abriendo el registro publico de fichas..." />
              }
            >
              <RealmRegistry onClose={() => setIsRegistryOpen(false)} />
            </Suspense>,
            document.body,
          )
        : null}

      {/* Delete Confirmation Modal */}
      {sheetToDelete ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-900 p-6 shadow-2xl">
            <h3 className="mb-2 font-serif text-xl font-bold text-amber-500">Eliminar ficha?</h3>
            <p className="mb-6 text-sm text-stone-300">
              Esta accion no se puede deshacer. Seguro que deseas eliminar esta ficha de personaje?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSheetToDelete(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteSheet}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500 hover:text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ProfileInfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-100">{value}</p>
    </div>
  );
}

function ProfileQuickAction({
  icon: Icon,
  label,
  value,
  tone = "default",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "gold" | "cyan" | "violet";
  onClick: () => void;
}) {
  const toneStyles: Record<string, string> = {
    default: "border-stone-800 bg-stone-950/50 text-stone-200",
    gold: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    violet: "border-purple-500/20 bg-purple-500/10 text-purple-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`kd-touch flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:brightness-110 ${toneStyles[tone]}`}
    >
      <div className="rounded-xl bg-black/20 p-2.5">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-75">
          {label}
        </p>
        <p className="truncate text-sm font-bold">{value}</p>
      </div>
    </button>
  );
}

function ProfileMiniButton({
  icon: Icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "gold" | "cyan" | "violet";
  onClick: () => void;
}) {
  const toneStyles: Record<string, string> = {
    default:
      "border-stone-700 bg-stone-950/55 text-stone-300 hover:border-stone-500 hover:text-stone-100",
    gold:
      "border-amber-500/25 bg-amber-500/10 text-amber-300 hover:border-amber-400/35 hover:bg-amber-500/14",
    cyan:
      "border-cyan-500/25 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400/35 hover:bg-cyan-500/14",
    violet:
      "border-purple-500/25 bg-purple-500/10 text-purple-300 hover:border-purple-400/35 hover:bg-purple-500/14",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition md:py-2 ${toneStyles[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function BusinessMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-black/20 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-100">{value}</p>
    </div>
  );
}

function ProfileSheetFallback({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-md md:px-6 md:py-6">
      <div className="w-full max-w-sm rounded-[2rem] border border-stone-800 bg-stone-950 px-5 py-6 text-center shadow-2xl shadow-black/40">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
          Cargando
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-300">{message}</p>
      </div>
    </div>
  );
}
