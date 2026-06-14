import type { BestiaryEntry, FloraEntry, KnowledgeDocument, MarketItem, PlayerAccount, RealmEvent, RealmMission } from "../../types";
import { deleteRealmEvent, upsertRealmEvent } from "../../utils/events";
import {
  deleteBestiaryEntry,
  deleteFloraEntry,
  deleteMagicStyle,
  slugifyGrimoireId,
  upsertBestiaryEntry,
  upsertFloraEntry,
  upsertMagicStyle,
} from "../../utils/grimoireContent";
import { deleteKnowledgeDocument, slugifyKnowledgeId, upsertKnowledgeDocument } from "../../utils/knowledge";
import { deleteMarketItem, slugifyMarketItem, upsertMarketItem } from "../../utils/market";
import { deleteRealmMission, upsertRealmMission } from "../../utils/missions";
import { createPlayerAccount, updatePlayerGold, bulkIncrementPlayersGold } from "../../utils/players";
import type { ArchivistActionDraft, ArchivistLiveContext } from "./archivist.types";

type ExecutionResult = {
  status: "success" | "error";
  message: string;
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findByName<T extends { id?: string; title?: string; name?: string }>(
  items: T[],
  value: unknown
) {
  const target = normalizeText(value);
  if (!target) return null;

  return (
    items.find((item) => normalizeText(item.id) === target) ??
    items.find((item) => normalizeText(item.title) === target) ??
    items.find((item) => normalizeText(item.name) === target) ??
    null
  );
}

function findPlayer(players: PlayerAccount[], value: unknown) {
  const target = normalizeText(value);
  if (!target) return null;

  return (
    players.find((player) => normalizeText(player.id) === target) ??
    players.find((player) => normalizeText(player.username) === target) ??
    null
  );
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = normalizeText(value);
    if (normalized === "true" || normalized === "si" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "no") {
      return false;
    }
  }
  return fallback;
}

function ensureString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const clean = ensureString(value);
    if (clean) return clean;
  }

  return "";
}

function payloadString(
  payload: Record<string, unknown>,
  keys: string[],
  fallback = ""
) {
  return firstString(...keys.map((key) => payload[key]), fallback);
}

function payloadNumber(
  payload: Record<string, unknown>,
  keys: string[],
  fallback = 0
) {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && value !== "") {
      return toNumber(value, fallback);
    }
  }

  return fallback;
}

function ensureArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [] as string[];
}

function inferTitleFromDraft(draft: ArchivistActionDraft, noun: string) {
  const candidates = [
    draft.label,
    draft.confirmationPrompt,
    ensureString(draft.payload.title),
    ensureString(draft.payload.name),
  ].filter(Boolean);

  const nounPattern = noun === "mision" ? "misi[oó]n" : noun;

  for (const candidate of candidates) {
    const direct = candidate.match(new RegExp(`${nounPattern}\\s*[:\\-]\\s*["“”']?([^"“”'?]+)`, "i"));
    if (direct?.[1]?.trim()) return direct[1].trim();

    const quoted = candidate.match(new RegExp(`${nounPattern}\\s+["“”']([^"“”']+)["“”']`, "i"));
    if (quoted?.[1]?.trim()) return quoted[1].trim();
  }

  return "";
}

function normalizeMissionDifficulty(value: unknown, fallback: RealmMission["difficulty"]) {
  const normalized = normalizeText(value || fallback);
  if (["facil", "easy", "baja"].includes(normalized)) return "easy";
  if (["media", "medio", "medium", "normal"].includes(normalized)) return "medium";
  if (["dificil", "hard", "alta"].includes(normalized)) return "hard";
  if (["elite", "epica", "legendaria"].includes(normalized)) return "elite";
  return fallback;
}

function normalizeMissionType(value: unknown, fallback: RealmMission["type"]) {
  const normalized = normalizeText(value || fallback);
  if (["caceria", "hunt", "caza"].includes(normalized)) return "hunt";
  if (["escolta", "escort"].includes(normalized)) return "escort";
  if (["investigacion", "investigation", "misterio"].includes(normalized)) return "investigation";
  if (["evento", "event"].includes(normalized)) return "event";
  if (["historia", "story", "narrativa"].includes(normalized)) return "story";
  return fallback;
}

function normalizeMissionStatus(value: unknown, fallback: RealmMission["status"]) {
  const normalized = normalizeText(value || fallback);
  if (["available", "disponible", "abierta", "open"].includes(normalized)) return "available";
  if (["in-progress", "progreso", "curso", "activa"].includes(normalized)) return "in-progress";
  if (["closed", "cerrada", "finalizada"].includes(normalized)) return "closed";
  return fallback;
}

function normalizeEventStatus(value: unknown, fallback: RealmEvent["status"]) {
  const normalized = normalizeText(value || fallback);
  if (["active", "activo", "activa"].includes(normalized)) return "active";
  if (["finished", "finalizado", "cerrado", "cerrada"].includes(normalized)) return "finished";
  return "in-production";
}

function normalizeDateText(value: unknown, fallback = "") {
  const clean = ensureString(value, fallback);
  if (!clean) return "";

  const timestamp = Date.parse(clean);
  if (Number.isFinite(timestamp)) {
    return new Date(timestamp).toISOString().slice(0, 10);
  }

  return clean.slice(0, 80);
}

function flattenMagicStyles(context: ArchivistLiveContext) {
  return context.grimoireCategories.flatMap((category) =>
    category.styles.map((style) => ({
      ...style,
      categoryId: category.id,
      categoryTitle: category.title,
    }))
  );
}

async function executePlayerAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;

  if (draft.kind === "create_player") {
    const result = await createPlayerAccount({
      username: payloadString(payload, ["username", "playerName", "usuario", "jugador", "name"]),
      gold: Math.max(0, Math.floor(payloadNumber(payload, ["gold", "oro", "amount", "cantidad"], 0))),
      isAdmin: toBoolean(payload.isAdmin, false),
    });

    return {
      status: result.status === "created" ? "success" : "error",
      message: result.message,
    };
  }

  const amount = Math.max(0, Math.floor(payloadNumber(payload, ["amount", "gold", "oro", "cantidad"], 0)));

  if (draft.kind === "add_all_players_gold") {
    if (amount <= 0) {
      return { status: "error", message: "La cantidad a dar debe ser mayor a 0." };
    }
    await bulkIncrementPlayersGold(
      context.players.map((p) => p.id),
      amount
    );
    return {
      status: "success",
      message: `Se entregaron ${amount.toLocaleString("es-PY")} de oro a todos los jugadores del reino (${context.players.length} jugadores en total).`,
    };
  }

  if (draft.kind === "add_multiple_players_gold") {
    if (amount <= 0) {
      return { status: "error", message: "La cantidad a dar debe ser mayor a 0." };
    }
    const usernames = payload.usernames;
    if (!Array.isArray(usernames) || usernames.length === 0) {
      return { status: "error", message: "Debe proveer una lista de nombres de usuario." };
    }
    
    // Find matching players (case insensitive substring match, same as player fuzzy search)
    const foundPlayers = context.players.filter(p => 
      usernames.some(u => p.username.toLowerCase().includes(String(u).toLowerCase()))
    );

    if (foundPlayers.length === 0) {
      return { status: "error", message: "No se encontro a ninguno de los jugadores solicitados." };
    }

    await bulkIncrementPlayersGold(
      foundPlayers.map((p) => p.id),
      amount
    );
    
    const names = foundPlayers.map(p => p.username).join(", ");
    return {
      status: "success",
      message: `Se entregaron ${amount.toLocaleString("es-PY")} de oro a ${foundPlayers.length} jugadores (${names}).`,
    };
  }

  const player = findPlayer(
    context.players,
    payloadString(payload, ["playerId", "username", "playerName", "usuario", "jugador", "target", "name"])
  );
  if (!player) {
    return {
      status: "error",
      message: "No pude ubicar al jugador solicitado para esa operacion.",
    };
  }

  const nextGold =
    draft.kind === "set_player_gold"
      ? amount
      : draft.kind === "subtract_player_gold"
        ? Math.max(0, player.gold - amount)
        : player.gold + amount;

  const updated = await updatePlayerGold(player.id, nextGold);

  return updated
    ? {
        status: "success",
        message: `Oro actualizado para ${player.username}. Nuevo total: ${nextGold.toLocaleString("es-PY")}.`,
      }
    : {
        status: "error",
        message: `No se pudo actualizar el oro de ${player.username}.`,
      };
}

async function executeMissionAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;
  const title = firstString(
    payloadString(payload, ["title", "missionTitle", "titulo", "nombre", "name"]),
    inferTitleFromDraft(draft, "mision")
  );
  const current = findByName(context.missions, payload.id || title);

  if (draft.kind === "delete_mission") {
    if (!current?.id) {
      return { status: "error", message: "No encontre la mision que querias borrar." };
    }
    const result = await deleteRealmMission(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const result = await upsertRealmMission({
    id: current?.id,
    title: firstString(title, current?.title),
    description: payloadString(payload, ["description", "summary", "descripcion", "resumen"], current?.description ?? ""),
    instructions: payloadString(
      payload,
      ["instructions", "instruction", "instrucciones", "objective", "objetivo", "conditions", "condiciones"],
      current?.instructions ?? "Resolver por rol en WhatsApp. Un admin valida el cierre."
    ),
    rewardGold: Math.max(
      0,
      Math.floor(payloadNumber(payload, ["rewardGold", "reward_gold", "recompensaOro", "reward", "gold", "oro"], current?.rewardGold ?? 0))
    ),
    maxParticipants: Math.max(
      1,
      Math.floor(payloadNumber(payload, ["maxParticipants", "max_participants", "participantesMaximos", "participants"], current?.maxParticipants ?? 1))
    ),
    difficulty: normalizeMissionDifficulty(payload.difficulty ?? payload.categoria, current?.difficulty ?? "easy"),
    type: normalizeMissionType(payload.type ?? payload.tipo, current?.type ?? "story"),
    status: normalizeMissionStatus(payload.status ?? payload.estado, current?.status ?? "available"),
    visible: toBoolean(payload.visible, current?.visible ?? true),
  });

  return { status: result.status === "saved" ? "success" : "error", message: result.message };
}

async function executeEventAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;
  const title = firstString(
    payloadString(payload, ["title", "eventTitle", "titulo", "nombre", "name"]),
    inferTitleFromDraft(draft, "evento")
  );
  const current = findByName(context.events, payload.id || title);

  if (draft.kind === "delete_event") {
    if (!current?.id) {
      return { status: "error", message: "No encontre el evento que querias borrar." };
    }
    const result = await deleteRealmEvent(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const result = await upsertRealmEvent({
    id: current?.id,
    title: firstString(title, current?.title),
    description: payloadString(payload, ["description", "summary", "descripcion", "resumen"], current?.description ?? ""),
    longDescription: payloadString(
      payload,
      ["longDescription", "long_description", "descripcionLarga", "cronica", "details"],
      current?.longDescription ?? payloadString(payload, ["description", "summary", "descripcion", "resumen"], current?.description ?? "")
    ),
    imageUrl: payloadString(payload, ["imageUrl", "image_url", "imagen", "image"], current?.imageUrl ?? ""),
    startDate: normalizeDateText(payloadString(payload, ["startDate", "start_date", "inicio", "fechaInicio"], current?.startDate ?? "")),
    endDate: normalizeDateText(payloadString(payload, ["endDate", "end_date", "cierre", "fechaCierre", "final"], current?.endDate ?? "")),
    status: normalizeEventStatus(payload.status ?? payload.estado, current?.status ?? "in-production"),
    factions: ensureArray(payload.factions ?? payload.facciones).length > 0
      ? ensureArray(payload.factions ?? payload.facciones)
      : current?.factions ?? [],
    rewards: payloadString(payload, ["rewards", "reward", "recompensas", "recompensa"], current?.rewards ?? ""),
    requirements: payloadString(payload, ["requirements", "requirement", "requisitos", "condiciones"], current?.requirements ?? ""),
    participationRewardGold: Math.max(
      0,
      Math.floor(payloadNumber(payload, ["participationRewardGold", "participation_reward_gold", "rewardGold", "recompensaOro", "oro"], current?.participationRewardGold ?? 0))
    ),
    maxParticipants: Math.max(0, Math.floor(payloadNumber(payload, ["maxParticipants", "max_participants", "participantesMaximos", "participants"], current?.maxParticipants ?? 0))),
  });

  return { status: result.status === "saved" ? "success" : "error", message: result.message };
}

async function executeMarketAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;
  const current = findByName(context.marketItems as Array<MarketItem & { title?: string }>, payload.id || payload.name);

  if (draft.kind === "delete_market_item") {
    if (!current?.id) {
      return { status: "error", message: "No encontre el item del mercado que querias borrar." };
    }
    const result = await deleteMarketItem(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const name = ensureString(payload.name, current?.name ?? "");
  const result = await upsertMarketItem({
    id:
      current?.id ??
      slugifyMarketItem(
        name,
        ensureString(payload.category, current?.category ?? "others") as MarketItem["category"]
      ),
    name,
    description: ensureString(payload.description, current?.description ?? ""),
    ability: ensureString(payload.ability, current?.ability ?? ""),
    price: Math.max(0, Math.floor(toNumber(payload.price, current?.price ?? 0))),
    rarity: ensureString(payload.rarity, current?.rarity ?? "common") as MarketItem["rarity"],
    imageUrl: ensureString(payload.imageUrl, current?.imageUrl ?? ""),
    imageFit: (ensureString(payload.imageFit, current?.imageFit ?? "cover") as "cover" | "contain" | ""),
    imagePosition: ensureString(payload.imagePosition, current?.imagePosition ?? "center"),
    category: ensureString(payload.category, current?.category ?? "others") as MarketItem["category"],
    stockStatus: ensureString(payload.stockStatus, current?.stockStatus ?? "available") as MarketItem["stockStatus"],
    stockLimit: Math.max(0, Math.floor(toNumber(payload.stockLimit, current?.stockLimit ?? 0))),
    stockSold: Math.max(0, Math.floor(toNumber(payload.stockSold, current?.stockSold ?? 0))),
    featured: toBoolean(payload.featured, current?.featured ?? false),
  });

  return { status: result.status === "saved" ? "success" : "error", message: result.message };
}

async function executeMagicAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;
  const styles = flattenMagicStyles(context);
  const current = findByName(styles, payload.id || payload.title);

  if (draft.kind === "delete_magic") {
    if (!current?.id) {
      return { status: "error", message: "No encontre la magia solicitada." };
    }
    const result = await deleteMagicStyle(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const title = ensureString(payload.title, current?.title ?? "");
  const categoryTitle = ensureString(payload.categoryTitle, current?.categoryTitle ?? "Sin categoria");
  const categoryId = ensureString(payload.categoryId, current?.categoryId ?? slugifyGrimoireId(categoryTitle, "categoria"));
  const result = await upsertMagicStyle({
    id: current?.id ?? slugifyGrimoireId(title, "magia"),
    categoryId,
    categoryTitle,
    title,
    description: ensureString(payload.description, current?.description ?? ""),
    levels:
      payload.levels && typeof payload.levels === "object"
        ? (payload.levels as Record<number, any[]>)
        : current?.levels ?? {},
    sortOrder: Math.max(0, Math.floor(toNumber(payload.sortOrder, 0))),
  });

  return { status: result.status === "saved" ? "success" : "error", message: result.message };
}

async function executeBestiaryAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;
  const current = findByName(context.bestiary as Array<BestiaryEntry & { title?: string }>, payload.id || payload.name);

  if (draft.kind === "delete_bestiary") {
    if (!current?.id) {
      return { status: "error", message: "No encontre la bestia solicitada." };
    }
    const result = await deleteBestiaryEntry(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const name = ensureString(payload.name, current?.name ?? "");
  const result = await upsertBestiaryEntry({
    id: current?.id ?? slugifyGrimoireId(name, "bestia"),
    name,
    category: ensureString(payload.category, current?.category ?? ""),
    type: ensureString(payload.type, current?.type ?? ""),
    generalData: ensureString(payload.generalData, current?.generalData ?? ""),
    threatLevel: ensureString(payload.threatLevel, current?.threatLevel ?? ""),
    domestication: ensureString(payload.domestication, current?.domestication ?? ""),
    usage: ensureString(payload.usage, current?.usage ?? ""),
    originPlace: ensureString(payload.originPlace, current?.originPlace ?? ""),
    foundAt: ensureString(payload.foundAt, current?.foundAt ?? ""),
    description: ensureString(payload.description, current?.description ?? ""),
    ability: ensureString(payload.ability, current?.ability ?? ""),
    rarity: ensureString(payload.rarity, current?.rarity ?? "common") as BestiaryEntry["rarity"],
    imageUrl: ensureString(payload.imageUrl, current?.imageUrl ?? ""),
  });

  return { status: result.status === "saved" ? "success" : "error", message: result.message };
}

async function executeFloraAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;
  const current = findByName(context.flora as Array<FloraEntry & { title?: string }>, payload.id || payload.name);

  if (draft.kind === "delete_flora") {
    if (!current?.id) {
      return { status: "error", message: "No encontre la flora solicitada." };
    }
    const result = await deleteFloraEntry(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const name = ensureString(payload.name, current?.name ?? "");
  const result = await upsertFloraEntry({
    id: current?.id ?? slugifyGrimoireId(name, "flora"),
    name,
    category: ensureString(payload.category, current?.category ?? ""),
    type: ensureString(payload.type, current?.type ?? ""),
    generalData: ensureString(payload.generalData, current?.generalData ?? ""),
    properties: ensureString(payload.properties, current?.properties ?? ""),
    usage: ensureString(payload.usage, current?.usage ?? ""),
    originPlace: ensureString(payload.originPlace, current?.originPlace ?? ""),
    foundAt: ensureString(payload.foundAt, current?.foundAt ?? ""),
    description: ensureString(payload.description, current?.description ?? ""),
    rarity: ensureString(payload.rarity, current?.rarity ?? "common") as FloraEntry["rarity"],
    imageUrl: ensureString(payload.imageUrl, current?.imageUrl ?? ""),
  });

  return { status: result.status === "saved" ? "success" : "error", message: result.message };
}

async function executeDocumentAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;
  const current = findByName(context.documents as Array<KnowledgeDocument & { name?: string }>, payload.id || payload.title);

  if (draft.kind === "delete_document") {
    if (!current?.id) {
      return { status: "error", message: "No encontre el documento solicitado." };
    }
    const result = await deleteKnowledgeDocument(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const title = ensureString(payload.title, current?.title ?? "");
  const result = await upsertKnowledgeDocument({
    id: current?.id ?? slugifyKnowledgeId(title, "documento"),
    title,
    type: ensureString(payload.type, current?.type ?? "other") as KnowledgeDocument["type"],
    category: ensureString(payload.category, current?.category ?? ""),
    tags: ensureArray(payload.tags).length > 0 ? ensureArray(payload.tags) : current?.tags ?? [],
    source: ensureString(payload.source, current?.source ?? "Archivista"),
    summary: ensureString(payload.summary, current?.summary ?? ""),
    content: ensureString(payload.content, current?.content ?? ""),
    visible: toBoolean(payload.visible, current?.visible ?? true),
  });

  return { status: result.status === "saved" ? "success" : "error", message: result.message };
}

export async function executeArchivistAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  if (draft.kind === "create_player" || draft.kind.includes("player_gold")) {
    return executePlayerAction(draft, context);
  }

  if (draft.kind.includes("mission")) {
    return executeMissionAction(draft, context);
  }

  if (draft.kind.includes("event")) {
    return executeEventAction(draft, context);
  }

  if (draft.kind.includes("market")) {
    return executeMarketAction(draft, context);
  }

  if (draft.kind.includes("magic")) {
    return executeMagicAction(draft, context);
  }

  if (draft.kind.includes("bestiary")) {
    return executeBestiaryAction(draft, context);
  }

  if (draft.kind.includes("flora")) {
    return executeFloraAction(draft, context);
  }

  if (draft.kind.includes("document")) {
    return executeDocumentAction(draft, context);
  }

  return {
    status: "error",
    message: "Esa accion aun no esta soportada por el Archivista.",
  };
}
