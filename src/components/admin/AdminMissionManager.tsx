import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BellRing,
  Coins,
  Flame,
  ExternalLink,
  Flag,
  ImageIcon,
  Loader2,
  ScrollText,
  Sparkles,
  Swords,
  Trash2,
  UserPlus,
} from "lucide-react";
import type {
  GmMissionNpc,
  GmNpcMagicSummary,
  GmMissionMode,
  GmNpcRole,
  MissionDifficulty,
  MissionReviewNotification,
  MissionStatus,
  MissionType,
  PlayerAccount,
  RealmMission,
  RealmMissionClaim,
  RealmMissionClaimStatus,
} from "../../types";
import {
  claimRealmMission,
  deleteRealmMission,
  fetchAdminRealmMissions,
  fetchMissionClaims,
  fetchPendingMissionReviews,
  getMissionClaimStatusLabel,
  getMissionDifficultyLabel,
  getMissionStatusLabel,
  getMissionTypeLabel,
  markMissionRewardDelivered,
  updateMissionClaimStatus,
  upsertRealmMission,
} from "../../utils/missions";
import { generateMissionWithAi } from "../../utils/missionAi";
import { fetchAllPlayers, updatePlayerGold } from "../../utils/players";
import { fetchAdminMagicStyles } from "../../utils/grimoireContent";
import {
  ADMIN_LIST_PREVIEW_COUNT,
  AdminAiDebugCard,
  AdminInfoCard,
  AdminModeButton,
  ExpandableListToggle,
  LabeledInput,
  LabeledTextArea,
  NumericInput,
} from "./AdminControlPrimitives";
import type { AiDebugInfo } from "../../utils/aiDebug";

type MissionListFilter = "all" | MissionStatus;
type GmMagicOption = {
  id: string;
  title: string;
  categoryId: string;
  categoryTitle: string;
  description: string;
  abilityNames: string[];
};

const NPC_ROLE_OPTIONS: Array<{ id: GmNpcRole; label: string }> = [
  { id: "boss", label: "Boss" },
  { id: "elite", label: "Elite" },
  { id: "support", label: "Support" },
  { id: "summoner", label: "Summoner" },
  { id: "skirmisher", label: "Skirmisher" },
  { id: "controller", label: "Controller" },
];

const GM_MODE_OPTIONS: Array<{
  id: GmMissionMode;
  label: string;
  hint: string;
}> = [
  {
    id: "combate",
    label: "Combate",
    hint: "El GM puede atacar con NPCs y buscar la victoria enemiga de forma justa.",
  },
  {
    id: "jefe",
    label: "Jefe",
    hint: "Combate de alta presion con boss, fases y resolucion mas dura.",
  },
  {
    id: "investigacion",
    label: "Investigacion",
    hint: "El GM guia, deja pistas y complica la lectura de la verdad.",
  },
  {
    id: "recoleccion",
    label: "Recoleccion",
    hint: "La presion viene del entorno, tiempo, recursos o competencia.",
  },
  {
    id: "escolta",
    label: "Escolta",
    hint: "El GM presiona el trayecto, la carga y la integridad del convoy.",
  },
  {
    id: "social",
    label: "Social",
    hint: "Prima la tension verbal, reputacion, negociacion y lectura del otro.",
  },
  {
    id: "exploracion",
    label: "Exploracion",
    hint: "Se priorizan descubrimiento, ruta, ambiente y peligros del lugar.",
  },
];

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getDefaultGmModeFromMissionType(nextType: MissionType): GmMissionMode {
  switch (nextType) {
    case "hunt":
      return "combate";
    case "escort":
      return "escolta";
    case "investigation":
      return "investigacion";
    case "event":
      return "social";
    case "story":
    default:
      return "exploracion";
  }
}

function createEmptyNpc(): GmMissionNpc {
  return {
    id: crypto.randomUUID(),
    name: "",
    role: "elite",
    stats: {},
    allowedMagic: [],
    behaviorNotes: "",
  };
}

function normalizeGmNpcsForSave(npcs: GmMissionNpc[]) {
  return npcs
    .map((npc) => ({
      ...npc,
      name: npc.name.trim(),
      behaviorNotes: npc.behaviorNotes?.trim() || "",
      allowedMagic: npc.allowedMagic.filter((magic) => magic.id && magic.title),
    }))
    .filter((npc) => npc.name);
}

export function AdminMissionManager() {
  const [missions, setMissions] = useState<RealmMission[]>([]);
  const [players, setPlayers] = useState<PlayerAccount[]>([]);
  const [claims, setClaims] = useState<RealmMissionClaim[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [isClaimingPlayer, setIsClaimingPlayer] = useState(false);
  const [isRewardingClaimId, setIsRewardingClaimId] = useState("");
  const [highlightedClaimId, setHighlightedClaimId] = useState("");
  const [pendingReviews, setPendingReviews] = useState<
    MissionReviewNotification[]
  >([]);
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MissionListFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [claimPlayerId, setClaimPlayerId] = useState("");
  const [missionId, setMissionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState(
    "Resolver por rol en WhatsApp. Un admin valida el cierre."
  );
  const [rewardGold, setRewardGold] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState(1);
  const [difficulty, setDifficulty] = useState<MissionDifficulty>("easy");
  const [type, setType] = useState<MissionType>("story");
  const [status, setStatus] = useState<MissionStatus>("available");
  const [visible, setVisible] = useState(true);
  const [isGeneratingAiMission, setIsGeneratingAiMission] = useState(false);
  const [aiDebug, setAiDebug] = useState<AiDebugInfo | null>(null);
  const [gmMissionMode, setGmMissionMode] = useState<GmMissionMode>("exploracion");
  const [gmPlayerObjectivesText, setGmPlayerObjectivesText] = useState("");
  const [gmObjectivesText, setGmObjectivesText] = useState("");
  const [gmVictoryText, setGmVictoryText] = useState("");
  const [gmFailureText, setGmFailureText] = useState("");
  const [gmCanUseHostileNpcs, setGmCanUseHostileNpcs] = useState(false);
  const [gmCanEscalateToCombat, setGmCanEscalateToCombat] = useState(false);
  const [gmNpcs, setGmNpcs] = useState<GmMissionNpc[]>([]);
  const [magicOptions, setMagicOptions] = useState<GmMagicOption[]>([]);
  const [pendingMagicByNpcId, setPendingMagicByNpcId] = useState<
    Record<string, string>
  >({});
  const [aiZone, setAiZone] = useState("");
  const [aiFaction, setAiFaction] = useState("");
  const [aiTone, setAiTone] = useState("fantasia oscura politica");
  const [aiRestriction, setAiRestriction] = useState(
    "Debe poder resolverse por rol en WhatsApp y ser verificable por staff."
  );
  const [aiTheme, setAiTheme] = useState("");
  const [aiCombatStyle, setAiCombatStyle] = useState<"yes" | "no" | "optional">(
    "optional"
  );

  useEffect(() => {
    void loadBaseData();
  }, []);

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === missionId) ?? null,
    [missionId, missions]
  );
  const selectedMissionIsFull = useMemo(
    () =>
      selectedMission
        ? claims.length >= Math.max(1, selectedMission.maxParticipants)
        : false,
    [claims.length, selectedMission]
  );
  async function loadBaseData() {
    setIsLoading(true);
    const [missionsResult, playersResult, pendingResult, magicResult] = await Promise.all([
      fetchAdminRealmMissions(),
      fetchAllPlayers(),
      fetchPendingMissionReviews(),
      fetchAdminMagicStyles(),
    ]);
    setMissions(missionsResult.missions);
    setPlayers(playersResult);
    setPendingReviews(pendingResult.notifications);
    setMagicOptions(
      magicResult.styles.map((style) => ({
        id: style.id,
        title: style.title,
        categoryId: style.categoryId,
        categoryTitle: style.categoryTitle,
        description: style.description,
        abilityNames: Object.values(style.levels)
          .flat()
          .map((ability) => ability.name.trim())
          .filter(Boolean),
      }))
    );
    setFeedback(missionsResult.message);
    setIsLoading(false);
  }

  async function refreshPendingReviews() {
    const pendingResult = await fetchPendingMissionReviews();
    setPendingReviews(pendingResult.notifications);
  }

  async function loadClaimsForMission(nextMissionId: string) {
    if (!nextMissionId.trim()) {
      setClaims([]);
      return;
    }

    setIsLoadingClaims(true);
    const result = await fetchMissionClaims(nextMissionId);
    setClaims(result.claims);
    if (highlightedClaimId) {
      const stillExists = result.claims.some(
        (entry) => entry.id === highlightedClaimId
      );
      if (!stillExists) {
        setHighlightedClaimId("");
      }
    }
    if (result.status === "error") {
      setFeedback(result.message);
    }
    setIsLoadingClaims(false);
  }

  const filteredMissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return missions.filter((mission) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : mission.title.toLowerCase().includes(normalizedSearch);
      const matchesFilter = filter === "all" ? true : mission.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [filter, missions, search]);

  const visibleMissions = useMemo(
    () =>
      showAll
        ? filteredMissions
        : filteredMissions.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredMissions, showAll]
  );

  useEffect(() => {
    setShowAll(false);
  }, [filter, search]);

  function resetForm() {
    setMissionId("");
    setTitle("");
    setDescription("");
    setInstructions("Resolver por rol en WhatsApp. Un admin valida el cierre.");
    setRewardGold(0);
    setMaxParticipants(1);
    setDifficulty("easy");
    setType("story");
    setGmMissionMode("exploracion");
    setGmPlayerObjectivesText("");
    setGmObjectivesText("");
    setGmVictoryText("");
    setGmFailureText("");
    setGmCanUseHostileNpcs(false);
    setGmCanEscalateToCombat(false);
    setStatus("available");
    setVisible(true);
    setGmNpcs([]);
    setPendingMagicByNpcId({});
    setClaimPlayerId("");
    setClaims([]);
    setFeedback("");
    setHighlightedClaimId("");
    setAiDebug(null);
  }

  function preloadMission(mission: RealmMission) {
    setMissionId(mission.id ?? "");
    setTitle(mission.title);
    setDescription(mission.description);
    setInstructions(mission.instructions);
    setRewardGold(mission.rewardGold);
    setMaxParticipants(mission.maxParticipants);
    setDifficulty(mission.difficulty);
    setType(mission.type);
    setGmMissionMode(mission.gmConfig?.modoMision ?? "exploracion");
    setGmPlayerObjectivesText(
      linesToText(mission.gmConfig?.objetivosJugadores ?? [])
    );
    setGmObjectivesText(linesToText(mission.gmConfig?.objetivosGM ?? []));
    setGmVictoryText(linesToText(mission.gmConfig?.condicionesVictoria ?? []));
    setGmFailureText(linesToText(mission.gmConfig?.condicionesDerrota ?? []));
    setGmCanUseHostileNpcs(
      mission.gmConfig?.escalada?.puedeUsarNpcHostil ?? false
    );
    setGmCanEscalateToCombat(
      mission.gmConfig?.escalada?.puedeEscalarACombate ?? false
    );
    setStatus(mission.status);
    setVisible(mission.visible);
    setGmNpcs(mission.gmConfig?.npcs ?? []);
    setPendingMagicByNpcId({});
    setClaimPlayerId("");
    setFeedback("");
    setHighlightedClaimId("");
    setAiDebug(null);

    if (mission.id) {
      void loadClaimsForMission(mission.id);
    } else {
      setClaims([]);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    const result = await upsertRealmMission({
      id: missionId || undefined,
      title,
      description,
      instructions,
      gmConfig: {
        modoMision: gmMissionMode,
        objetivosJugadores: textToLines(gmPlayerObjectivesText),
        objetivosGM: textToLines(gmObjectivesText),
        condicionesVictoria: textToLines(gmVictoryText),
        condicionesDerrota: textToLines(gmFailureText),
        escalada: {
          puedeUsarNpcHostil: gmCanUseHostileNpcs,
          puedeEscalarACombate: gmCanEscalateToCombat,
        },
        npcs: normalizeGmNpcsForSave(gmNpcs),
      },
      rewardGold,
      maxParticipants: Math.max(1, maxParticipants),
      difficulty,
      type,
      status,
      visible,
    });

    setIsSaving(false);
    setFeedback(result.message);

    if (result.status === "saved") {
      const previouslySelectedMissionId = missionId;
      resetForm();
      await loadBaseData();

      if (previouslySelectedMissionId) {
        const reselected = (await fetchAdminRealmMissions()).missions.find(
          (mission) => mission.id === previouslySelectedMissionId
        );

        if (reselected) {
          preloadMission(reselected);
        }
      }
    }
  }

  async function handleDelete() {
    if (!missionId) {
      setFeedback("Selecciona una mision antes de intentar borrarla.");
      return;
    }

    const shouldDelete = window.confirm(
      `Seguro que quieres borrar "${title}"? Esta accion no se puede deshacer.`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setFeedback("");

    const result = await deleteRealmMission(missionId);

    setIsDeleting(false);
    setFeedback(result.message);

    if (result.status === "deleted") {
      resetForm();
      await loadBaseData();
    }
  }

  async function handleGenerateMissionWithAi() {
    setIsGeneratingAiMission(true);
    setFeedback("");
    setAiDebug(null);

    const result = await generateMissionWithAi({
      type,
      difficulty,
      recommendedPlayers: Math.max(1, Math.min(4, maxParticipants)),
      maxParticipants,
      rewardGold,
      zone: aiZone,
      faction: aiFaction,
      tone: aiTone,
      restriction: aiRestriction,
      combatStyle: aiCombatStyle,
      theme: aiTheme,
      includeDebug: true,
    });

    setIsGeneratingAiMission(false);
    setAiDebug(result.debug ?? null);

    if (result.status === "error" || !result.mission) {
      setFeedback(result.message);
      return;
    }

    setMissionId("");
    setTitle(result.mission.title);
    setDescription(result.mission.description);
    setInstructions(result.mission.instructions);
    setGmMissionMode(
      result.mission.gmConfig?.modoMision ??
        getDefaultGmModeFromMissionType(result.mission.type)
    );
    setGmPlayerObjectivesText(
      linesToText(result.mission.gmConfig?.objetivosJugadores ?? [])
    );
    setGmObjectivesText(linesToText(result.mission.gmConfig?.objetivosGM ?? []));
    setGmVictoryText(
      linesToText(result.mission.gmConfig?.condicionesVictoria ?? [])
    );
    setGmFailureText(
      linesToText(result.mission.gmConfig?.condicionesDerrota ?? [])
    );
    setGmCanUseHostileNpcs(
      result.mission.gmConfig?.escalada?.puedeUsarNpcHostil ?? false
    );
    setGmCanEscalateToCombat(
      result.mission.gmConfig?.escalada?.puedeEscalarACombate ?? false
    );
    setGmNpcs(result.mission.gmConfig?.npcs ?? []);
    setPendingMagicByNpcId({});
    setRewardGold(result.mission.rewardGold);
    setMaxParticipants(Math.max(1, result.mission.maxParticipants));
    setDifficulty(result.mission.difficulty);
    setType(result.mission.type);
    setStatus("available");
    setVisible(true);
    setClaims([]);
    setHighlightedClaimId("");

    const nextFeedbackParts = [result.message];

    if (result.publicBrief?.subtitle) {
      nextFeedbackParts.push(`Subtitulo sugerido: ${result.publicBrief.subtitle}`);
    }

    if (result.promptSummary) {
      nextFeedbackParts.push(`Resumen IA: ${result.promptSummary}`);
    }

    setFeedback(nextFeedbackParts.join(" "));
  }

  async function handleAddParticipant() {
    if (!missionId) {
      setFeedback("Guarda primero la mision antes de agregar participantes.");
      return;
    }

    if (!claimPlayerId) {
      setFeedback("Selecciona un jugador para asignarlo a la mision.");
      return;
    }

    setIsClaimingPlayer(true);
    setFeedback("");

    const result = await claimRealmMission(missionId, claimPlayerId);

    setIsClaimingPlayer(false);
    setFeedback(result.message);

    if (result.status === "claimed" || result.status === "exists") {
      setClaimPlayerId("");
      await loadClaimsForMission(missionId);
      await refreshPendingReviews();
      await loadBaseData();
    }
  }

  async function handleSetClaimStatus(
    claim: RealmMissionClaim,
    nextStatus: RealmMissionClaimStatus
  ) {
    if (claim.status === nextStatus) {
      return;
    }

    const result = await updateMissionClaimStatus(claim.id, nextStatus);
    setFeedback(result.message);

    if (result.status === "saved") {
      await loadClaimsForMission(claim.missionId);
      await refreshPendingReviews();
    }
  }

  async function handleDeliverReward(claim: RealmMissionClaim) {
    if (!selectedMission) {
      setFeedback("Selecciona la mision antes de entregar recompensa.");
      return;
    }

    if (claim.rewardDelivered) {
      setFeedback("La recompensa de este participante ya fue entregada.");
      return;
    }

    if (claim.status !== "completed") {
      setFeedback(
        "Primero valida la entrega (estado pendiente) antes de pagar recompensa."
      );
      return;
    }

    const shouldDeliver = window.confirm(
      `Entregar ${selectedMission.rewardGold} de oro a ${claim.playerName}?`
    );

    if (!shouldDeliver) {
      return;
    }

    setIsRewardingClaimId(claim.id);
    setFeedback("");

    const refreshedPlayers = await fetchAllPlayers();
    setPlayers(refreshedPlayers);
    const currentPlayer = refreshedPlayers.find(
      (player) => player.id === claim.playerId
    );

    if (!currentPlayer) {
      setIsRewardingClaimId("");
      setFeedback("No se encontro al jugador para entregar la recompensa.");
      return;
    }

    const updated = await updatePlayerGold(
      currentPlayer.id,
      currentPlayer.gold + selectedMission.rewardGold
    );

    if (!updated) {
      setIsRewardingClaimId("");
      setFeedback("No se pudo actualizar el oro del jugador.");
      return;
    }

    const markResult = await markMissionRewardDelivered(claim.id);
    setIsRewardingClaimId("");
    setFeedback(markResult.message);

    await loadClaimsForMission(claim.missionId);
    await refreshPendingReviews();
    setPlayers(await fetchAllPlayers());
  }

  async function focusPendingReview(notification: MissionReviewNotification) {
    const targetMission = missions.find(
      (entry) => entry.id === notification.missionId
    );

    if (!targetMission) {
      setFeedback("No se encontro la mision relacionada con esa notificacion.");
      return;
    }

    preloadMission(targetMission);
    setShowPendingPanel(false);
    await loadClaimsForMission(notification.missionId);
    setHighlightedClaimId(notification.claimId);
  }

  function updateNpc(npcId: string, updater: (npc: GmMissionNpc) => GmMissionNpc) {
    setGmNpcs((current) =>
      current.map((npc) => (npc.id === npcId ? updater(npc) : npc))
    );
  }

  function addNpc() {
    const nextNpc = createEmptyNpc();
    setGmNpcs((current) => [...current, nextNpc]);
    setPendingMagicByNpcId((current) => ({ ...current, [nextNpc.id]: "" }));
  }

  function removeNpc(npcId: string) {
    setGmNpcs((current) => current.filter((npc) => npc.id !== npcId));
    setPendingMagicByNpcId((current) => {
      const next = { ...current };
      delete next[npcId];
      return next;
    });
  }

  function addMagicToNpc(npcId: string) {
    const selectedMagicId = pendingMagicByNpcId[npcId];
    if (!selectedMagicId) {
      return;
    }

    const selectedMagic = magicOptions.find((entry) => entry.id === selectedMagicId);
    if (!selectedMagic) {
      return;
    }

    updateNpc(npcId, (npc) => {
      if (npc.allowedMagic.some((entry) => entry.id === selectedMagic.id)) {
        return npc;
      }

      const nextMagic: GmNpcMagicSummary = {
        id: selectedMagic.id,
        title: selectedMagic.title,
        categoryId: selectedMagic.categoryId,
        categoryTitle: selectedMagic.categoryTitle,
        description: selectedMagic.description,
        abilityNames: selectedMagic.abilityNames,
      };

      return {
        ...npc,
        allowedMagic: [...npc.allowedMagic, nextMagic],
      };
    });

    setPendingMagicByNpcId((current) => ({ ...current, [npcId]: "" }));
  }

  function removeMagicFromNpc(npcId: string, magicId: string) {
    updateNpc(npcId, (npc) => ({
      ...npc,
      allowedMagic: npc.allowedMagic.filter((entry) => entry.id !== magicId),
    }));
  }

  if (isLoading) {
    return (
      <AdminInfoCard
        title="Cargando misiones"
        message="Leyendo encargos del reino."
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Rol por WhatsApp
            </p>
            <h4 className="mt-1 text-xl font-black text-stone-100">
              Crear o editar mision
            </h4>
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSave}>
          <div className="rounded-[1.4rem] border border-cyan-500/20 bg-cyan-500/8 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                  Asistente IA
                </p>
                <h5 className="mt-1 text-sm font-black text-stone-100">
                  Generador de misiones
                </h5>
              </div>
              <button
                type="button"
                onClick={() => void handleGenerateMissionWithAi()}
                disabled={isGeneratingAiMission || isSaving || isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/12 px-4 py-3 text-sm font-extrabold text-cyan-100 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingAiMission ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <ScrollText className="h-4 w-4" />
                    Generar con IA
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="Zona o escenario"
                value={aiZone}
                onChange={setAiZone}
                placeholder="Frontera helada, barrio noble, ruinas bajo niebla..."
              />
              <LabeledInput
                label="Faccion implicada"
                value={aiFaction}
                onChange={setAiFaction}
                placeholder="Casa Vhalor, Guardia del Umbral..."
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="Tono narrativo"
                value={aiTone}
                onChange={setAiTone}
                placeholder="Intriga politica, horror ritual, caceria sucia..."
              />
              <LabeledInput
                label="Tema central"
                value={aiTheme}
                onChange={setAiTheme}
                placeholder="Traicion, contrabando, reliquia, bestia..."
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_0.8fr]">
              <LabeledTextArea
                label="Restriccion especial"
                value={aiRestriction}
                onChange={setAiRestriction}
                placeholder="Debe evitar combate directo, debe permitir varios jugadores..."
                rows={3}
              />
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-200">
                  Combate
                </span>
                <select
                  value={aiCombatStyle}
                  onChange={(event) =>
                    setAiCombatStyle(
                      event.target.value as "yes" | "no" | "optional"
                    )
                  }
                  className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-cyan-400/40"
                >
                  <option value="optional">Opcional</option>
                  <option value="yes">Si</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
            <div className="mt-4">
              <AdminAiDebugCard debug={aiDebug} />
            </div>
          </div>

          <LabeledInput
            label="Titulo"
            value={title}
            onChange={setTitle}
            placeholder="Caza en la frontera"
          />
          <LabeledTextArea
            label="Descripcion"
            value={description}
            onChange={setDescription}
            placeholder="Que debe resolver el jugador"
          />
          <LabeledTextArea
            label="Indicaciones"
            value={instructions}
            onChange={setInstructions}
            placeholder="Como se valida por WhatsApp"
          />

          <div className="rounded-[1.4rem] border border-cyan-500/20 bg-cyan-500/8 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                Modo del GM
              </p>
              <h5 className="mt-1 text-sm font-black text-stone-100">
                Conducta, objetivos y resolucion
              </h5>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
                Aqui defines cuando el GM puede atacar, si solo debe guiar, y
                que condiciones vuelven obvia una victoria o derrota dentro de
                la narrativa.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-200">
                  Modo de mision
                </span>
                <select
                  value={gmMissionMode}
                  onChange={(event) =>
                    setGmMissionMode(event.target.value as GmMissionMode)
                  }
                  className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-cyan-400/40"
                >
                  {GM_MODE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-5 text-stone-500">
                  {GM_MODE_OPTIONS.find((option) => option.id === gmMissionMode)
                    ?.hint ?? ""}
                </p>
              </label>

              <div className="grid gap-3 rounded-2xl border border-stone-800 bg-stone-950/45 p-4 md:grid-cols-2">
                <label className="flex items-start gap-3 text-sm text-stone-200">
                  <input
                    type="checkbox"
                    checked={gmCanUseHostileNpcs}
                    onChange={(event) =>
                      setGmCanUseHostileNpcs(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-stone-600 bg-stone-900 text-cyan-300"
                  />
                  <span>
                    Puede usar NPCs hostiles
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-stone-200">
                  <input
                    type="checkbox"
                    checked={gmCanEscalateToCombat}
                    onChange={(event) =>
                      setGmCanEscalateToCombat(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-stone-600 bg-stone-900 text-cyan-300"
                  />
                  <span>
                    Puede escalar a combate
                  </span>
                </label>
                <p className="text-xs leading-5 text-stone-500 md:col-span-2">
                  Si ambas casillas estan apagadas, el GM debe presionar con
                  ambiente, pistas, tiempo, desgaste o tension social, no con
                  atacantes inventados.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <LabeledTextArea
                label="Objetivos de los jugadores"
                value={gmPlayerObjectivesText}
                onChange={setGmPlayerObjectivesText}
                placeholder={"Una linea por objetivo.\nProteger la reliquia\nSalir del bosque con 3 muestras"}
                rows={4}
              />
              <LabeledTextArea
                label="Objetivos del GM"
                value={gmObjectivesText}
                onChange={setGmObjectivesText}
                placeholder={"Una linea por objetivo.\nRobar la carga\nSeparar al grupo\nAgotar sus recursos"}
                rows={4}
              />
              <LabeledTextArea
                label="Condiciones de victoria"
                value={gmVictoryText}
                onChange={setGmVictoryText}
                placeholder={"Una linea por condicion.\nLa carga queda asegurada\nEl objetivo es escoltado hasta la salida"}
                rows={4}
              />
              <LabeledTextArea
                label="Condiciones de derrota"
                value={gmFailureText}
                onChange={setGmFailureText}
                placeholder={"Una linea por condicion.\nLa reliquia es robada\nEl grupo abandona la mision\nEl convoy colapsa"}
                rows={4}
              />
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-violet-500/20 bg-violet-500/8 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300/80">
                  Canon del GM
                </p>
                <h5 className="mt-1 text-sm font-black text-stone-100">
                  NPCs y magias permitidas
                </h5>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
                  Estas referencias se incrustan en la mision para que el GM-bot
                  use solo magias del grimorio en los NPCs seleccionados.
                </p>
              </div>
              <button
                type="button"
                onClick={addNpc}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/12 px-4 py-3 text-sm font-extrabold text-violet-100 transition hover:bg-violet-500/18"
              >
                <Sparkles className="h-4 w-4" />
                Agregar NPC
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {gmNpcs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-950/35 px-4 py-4 text-sm text-stone-400">
                  Sin NPCs tacticos todavia. Si no agregas ninguno, el GM seguira
                  funcionando solo con ambientacion e instrucciones libres.
                </div>
              ) : null}

              {gmNpcs.map((npc, index) => (
                <div
                  key={npc.id}
                  className="rounded-[1.3rem] border border-stone-800 bg-stone-950/45 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-violet-500/10 p-2 text-violet-200">
                        <Swords className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-stone-100">
                          NPC {index + 1}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                          Ficha canonica para encounter
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNpc(npc.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/16"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Borrar
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <LabeledInput
                      label="Nombre del NPC"
                      value={npc.name}
                      onChange={(value) =>
                        updateNpc(npc.id, (current) => ({ ...current, name: value }))
                      }
                      placeholder="Lyra, Capitan Vael, Ent de Combate..."
                    />
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">
                        Rol tactico
                      </span>
                      <select
                        value={npc.role}
                        onChange={(event) =>
                          updateNpc(npc.id, (current) => ({
                            ...current,
                            role: event.target.value as GmNpcRole,
                          }))
                        }
                        className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-violet-400/40"
                      >
                        {NPC_ROLE_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-5">
                    <NumericInput
                      label="Lv"
                      value={npc.stats.level ?? 0}
                      onChange={(value) =>
                        updateNpc(npc.id, (current) => ({
                          ...current,
                          stats: { ...current.stats, level: value || undefined },
                        }))
                      }
                    />
                    <NumericInput
                      label="HP"
                      value={npc.stats.hp ?? 0}
                      onChange={(value) =>
                        updateNpc(npc.id, (current) => ({
                          ...current,
                          stats: { ...current.stats, hp: value || undefined },
                        }))
                      }
                    />
                    <NumericInput
                      label="ATK"
                      value={npc.stats.attack ?? 0}
                      onChange={(value) =>
                        updateNpc(npc.id, (current) => ({
                          ...current,
                          stats: { ...current.stats, attack: value || undefined },
                        }))
                      }
                    />
                    <NumericInput
                      label="DEF"
                      value={npc.stats.defense ?? 0}
                      onChange={(value) =>
                        updateNpc(npc.id, (current) => ({
                          ...current,
                          stats: { ...current.stats, defense: value || undefined },
                        }))
                      }
                    />
                    <NumericInput
                      label="SPD"
                      value={npc.stats.speed ?? 0}
                      onChange={(value) =>
                        updateNpc(npc.id, (current) => ({
                          ...current,
                          stats: { ...current.stats, speed: value || undefined },
                        }))
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-stone-800 bg-stone-950/45 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-100">
                      <Flame className="h-4 w-4 text-violet-200" />
                      Magias permitidas del grimorio
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {npc.allowedMagic.length === 0 ? (
                        <span className="text-sm text-stone-500">
                          Sin magias asignadas. El GM no deberia inventarle una escuela nueva.
                        </span>
                      ) : null}
                      {npc.allowedMagic.map((magic) => (
                        <div
                          key={magic.id}
                          className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-3 py-2"
                        >
                          <div className="flex items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-violet-100">
                                {magic.title}
                              </p>
                              <p className="text-xs uppercase tracking-[0.14em] text-violet-200/70">
                                {magic.categoryTitle}
                              </p>
                              {magic.abilityNames.length > 0 ? (
                                <p className="mt-1 text-xs leading-5 text-stone-400">
                                  {magic.abilityNames.slice(0, 4).join(", ")}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMagicFromNpc(npc.id, magic.id)}
                              className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-200"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-stone-200">
                          Vincular magia canonica
                        </span>
                        <select
                          value={pendingMagicByNpcId[npc.id] ?? ""}
                          onChange={(event) =>
                            setPendingMagicByNpcId((current) => ({
                              ...current,
                              [npc.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-violet-400/40"
                        >
                          <option value="">Selecciona una magia del grimorio</option>
                          {magicOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.categoryTitle} - {option.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => addMagicToNpc(npc.id)}
                        className="self-end rounded-2xl border border-violet-400/30 bg-violet-500/12 px-4 py-3 text-sm font-extrabold text-violet-100 transition hover:bg-violet-500/18"
                      >
                        Agregar magia
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <LabeledTextArea
                      label="Comportamiento / notas tacticas"
                      value={npc.behaviorNotes ?? ""}
                      onChange={(value) =>
                        updateNpc(npc.id, (current) => ({
                          ...current,
                          behaviorNotes: value,
                        }))
                      }
                      placeholder="Prefiere hostigar desde retaguardia, protege al boss, usa control antes que dano..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">Tipo</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as MissionType)}
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                <option value="story">Historia</option>
                <option value="hunt">Caceria</option>
                <option value="escort">Escolta</option>
                <option value="investigation">Investigacion</option>
                <option value="event">Evento</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">
                Dificultad
              </span>
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as MissionDifficulty)
                }
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                <option value="easy">Facil</option>
                <option value="medium">Media</option>
                <option value="hard">Dificil</option>
                <option value="elite">Elite</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">Estado</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as MissionStatus)
                }
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40"
              >
                <option value="available">Disponible</option>
                <option value="in-progress">En curso</option>
                <option value="closed">Cerrada</option>
              </select>
            </label>
            <NumericInput
              label="Recompensa (oro)"
              value={rewardGold}
              onChange={setRewardGold}
            />
            <NumericInput
              label="Cupos maximos"
              value={maxParticipants}
              onChange={setMaxParticipants}
            />
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-200">Visible</p>
            </div>
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
              className="h-4 w-4 rounded border-stone-600 bg-stone-950 text-amber-400"
            />
          </label>

          <div className="sticky bottom-0 z-10 -mx-1 mt-4 grid gap-3 rounded-[1.3rem] border border-stone-800 bg-stone-950/90 p-2 shadow-2xl shadow-black/40 backdrop-blur sm:flex sm:flex-wrap sm:items-center">
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  {missionId ? "Actualizar mision" : "Crear mision"}
                </>
              )}
            </button>
            {missionId ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={isDeleting}
                className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
              >
                Cancelar
              </button>
            ) : null}
            {missionId ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSaving || isDeleting}
                className="w-full rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isDeleting ? "Borrando..." : "Borrar"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetForm}
              disabled={isDeleting}
              className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 sm:w-auto"
            >
              Limpiar
            </button>
          </div>

          {feedback ? (
            <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
              {feedback}
            </p>
          ) : null}
        </form>
      </section>

      <section className="rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                Tablero publico
              </p>
              <h4 className="mt-1 text-xl font-black text-stone-100">
                Misiones del reino
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPendingPanel((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/12 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-500/20"
          >
            <BellRing className="h-4 w-4" />
            Pendientes
            <span className="rounded-full border border-cyan-400/35 bg-cyan-500/20 px-2 py-0.5 text-[10px]">
              {pendingReviews.length}
            </span>
          </button>
        </div>

        {showPendingPanel ? (
          <div className="mt-4 rounded-[1.2rem] border border-cyan-500/25 bg-cyan-500/10 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              Avisos de validacion
            </p>
            <div className="mt-3 space-y-2">
              {pendingReviews.length > 0 ? (
                pendingReviews.slice(0, 6).map((notification) => (
                  <button
                    key={notification.claimId}
                    type="button"
                    onClick={() => void focusPendingReview(notification)}
                    className="w-full rounded-xl border border-cyan-500/25 bg-stone-950/65 px-3 py-2 text-left text-xs text-stone-200 transition hover:border-cyan-400/45"
                  >
                    <span className="font-semibold text-cyan-200">
                      {notification.playerName}
                    </span>{" "}
                    entrego evidencia en{" "}
                    <span className="font-semibold text-stone-100">
                      {notification.missionTitle}
                    </span>
                    . Clica para verificar.
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2 text-xs text-stone-400">
                  No hay entregas pendientes.
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <LabeledInput
            label="Buscar mision"
            value={search}
            onChange={setSearch}
            placeholder="Filtra por titulo"
          />
          <div className="space-y-2 min-w-0 max-w-full">
            <span className="text-sm font-semibold text-stone-200">Estado</span>
            <div className="flex w-full max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex-shrink-0">
                <AdminModeButton
                  label="Todas"
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                />
              </div>
              <div className="flex-shrink-0">
                <AdminModeButton
                  label="Disponibles"
                  active={filter === "available"}
                  onClick={() => setFilter("available")}
                />
              </div>
              <div className="flex-shrink-0">
                <AdminModeButton
                  label="En curso"
                  active={filter === "in-progress"}
                  onClick={() => setFilter("in-progress")}
                />
              </div>
              <div className="flex-shrink-0">
                <AdminModeButton
                  label="Cerradas"
                  active={filter === "closed"}
                  onClick={() => setFilter("closed")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredMissions.length > 0 ? (
            visibleMissions.map((mission) => (
              <button
                key={mission.id ?? mission.title}
                type="button"
                onClick={() => preloadMission(mission)}
                className={`w-full rounded-[1.2rem] border px-4 py-3 text-left transition ${
                  mission.id === missionId
                    ? "border-amber-500/35 bg-stone-900"
                    : "border-stone-800 bg-stone-950/50 hover:border-amber-500/20 hover:bg-stone-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-100">
                      {mission.title}
                    </p>
                    <span className="text-xs text-gray-500 font-mono">
                      ID: {mission.id?.substring(0, 6).toUpperCase()}
                    </span>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                      {getMissionTypeLabel(mission.type)} -{" "}
                      {getMissionDifficultyLabel(mission.difficulty)}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                      Cupos: {Math.max(0, mission.maxParticipants - (mission.activeClaims || 0))} restantes
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-amber-300">
                      {mission.rewardGold}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                      oro
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300">
                    {getMissionStatusLabel(mission.status)}
                  </span>
                  {!mission.visible ? (
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-200">
                      Oculta
                    </span>
                  ) : null}
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
              No se encontraron misiones para ese filtro.
            </div>
          )}
          <ExpandableListToggle
            shownCount={visibleMissions.length}
            totalCount={filteredMissions.length}
            expanded={showAll}
            onToggle={() => setShowAll((current) => !current)}
            itemLabel="misiones"
          />
        </div>

        {selectedMission ? (
          <div className="mt-5 rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                  Participantes
                </p>
                <p className="mt-1 text-sm font-bold text-stone-100">
                  {selectedMission.title}
                </p>
              </div>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-200">
                Premio {selectedMission.rewardGold} - Cupos {claims.length}/
                {selectedMission.maxParticipants}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-200">
                  Agregar jugador
                </span>
                <select
                  value={claimPlayerId}
                  onChange={(event) => setClaimPlayerId(event.target.value)}
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
                onClick={() => void handleAddParticipant()}
                disabled={isClaimingPlayer || !claimPlayerId || selectedMissionIsFull}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
              >
                {isClaimingPlayer ? (
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

            {selectedMissionIsFull ? (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                Esta mision ya alcanzo el cupo maximo de participantes.
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {isLoadingClaims ? (
                <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950/45 px-4 py-3 text-sm text-stone-400">
                  Cargando participantes...
                </div>
              ) : claims.length === 0 ? (
                <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
                  Aun no hay jugadores asignados a esta mision.
                </div>
              ) : (
                claims.map((claim) => (
                  <div
                    key={claim.id}
                    className={`rounded-[1.2rem] border bg-stone-900/55 p-3 transition ${
                      highlightedClaimId === claim.id
                        ? "border-cyan-400/60 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                        : "border-stone-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-stone-100">
                          {claim.playerName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                          Oro actual: {claim.playerGold}
                        </p>
                      </div>
                      <span className="rounded-full border border-stone-700 bg-stone-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300">
                        {getMissionClaimStatusLabel(claim.status)}
                      </span>
                    </div>

                    {claim.proofText || claim.proofLink || claim.proofImageUrl ? (
                      <div className="mt-3 space-y-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                          Evidencia enviada
                        </p>
                        {claim.proofText ? (
                          <p className="text-xs leading-5 text-stone-200">
                            {claim.proofText}
                          </p>
                        ) : null}
                        {claim.submittedAt ? (
                          <p className="text-[11px] text-stone-400">
                            Entregado:{" "}
                            {new Date(claim.submittedAt).toLocaleString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        ) : null}
                        {claim.proofLink ? (
                          <a
                            href={claim.proofLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-200 underline underline-offset-2"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Abrir enlace
                          </a>
                        ) : null}
                        {claim.proofImageUrl ? (
                          <a
                            href={claim.proofImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-200"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            Ver imagen
                          </a>
                        ) : null}
                        {claim.proofImageUrl ? (
                          <img
                            src={claim.proofImageUrl}
                            alt={`Evidencia de ${claim.playerName}`}
                            loading="lazy"
                            decoding="async"
                            className="mt-1 h-20 w-20 rounded-lg border border-cyan-500/25 object-cover"
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-stone-800 bg-stone-950/45 px-3 py-2 text-xs text-stone-400">
                        Sin evidencia todavia.
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSetClaimStatus(claim, "claimed")}
                        className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                          claim.status === "claimed"
                            ? "border border-stone-600 bg-stone-800 text-stone-100"
                            : "border border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-500"
                        }`}
                      >
                        Postulado
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSetClaimStatus(claim, "completed")}
                        className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                          claim.status === "completed"
                            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                            : "border border-stone-700 bg-stone-900 text-stone-300 hover:border-emerald-500/30"
                        }`}
                      >
                        Pendiente
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeliverReward(claim)}
                        disabled={
                          claim.rewardDelivered || isRewardingClaimId === claim.id
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/12 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {isRewardingClaimId === claim.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Pagando...
                          </>
                        ) : (
                          <>
                            <Coins className="h-3.5 w-3.5" />
                            {claim.rewardDelivered ? "Pagada" : "Entregar"}
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
  );
}

