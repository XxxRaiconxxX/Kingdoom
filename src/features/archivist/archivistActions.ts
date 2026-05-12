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
import { createPlayerAccount, updatePlayerGold } from "../../utils/players";
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
      username: ensureString(payload.username || payload.playerName),
      gold: Math.max(0, Math.floor(toNumber(payload.gold, 0))),
      isAdmin: toBoolean(payload.isAdmin, false),
    });

    return {
      status: result.status === "created" ? "success" : "error",
      message: result.message,
    };
  }

  const player = findPlayer(context.players, payload.playerId || payload.username || payload.playerName);
  if (!player) {
    return {
      status: "error",
      message: "No pude ubicar al jugador solicitado para esa operacion.",
    };
  }

  const amount = Math.max(0, Math.floor(toNumber(payload.amount ?? payload.gold, 0)));
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
  const current = findByName(context.missions, payload.id || payload.title);

  if (draft.kind === "delete_mission") {
    if (!current?.id) {
      return { status: "error", message: "No encontre la mision que querias borrar." };
    }
    const result = await deleteRealmMission(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const result = await upsertRealmMission({
    id: current?.id,
    title: ensureString(payload.title, current?.title ?? ""),
    description: ensureString(payload.description, current?.description ?? ""),
    instructions: ensureString(
      payload.instructions,
      current?.instructions ?? "Resolver por rol en WhatsApp. Un admin valida el cierre."
    ),
    rewardGold: Math.max(0, Math.floor(toNumber(payload.rewardGold, current?.rewardGold ?? 0))),
    maxParticipants: Math.max(1, Math.floor(toNumber(payload.maxParticipants, current?.maxParticipants ?? 1))),
    difficulty: (ensureString(payload.difficulty, current?.difficulty ?? "easy") as RealmMission["difficulty"]),
    type: (ensureString(payload.type, current?.type ?? "story") as RealmMission["type"]),
    status: (ensureString(payload.status, current?.status ?? "available") as RealmMission["status"]),
    visible: toBoolean(payload.visible, current?.visible ?? true),
  });

  return { status: result.status === "saved" ? "success" : "error", message: result.message };
}

async function executeEventAction(
  draft: ArchivistActionDraft,
  context: ArchivistLiveContext
): Promise<ExecutionResult> {
  const payload = draft.payload;
  const current = findByName(context.events, payload.id || payload.title);

  if (draft.kind === "delete_event") {
    if (!current?.id) {
      return { status: "error", message: "No encontre el evento que querias borrar." };
    }
    const result = await deleteRealmEvent(current.id);
    return { status: result.status === "deleted" ? "success" : "error", message: result.message };
  }

  const result = await upsertRealmEvent({
    id: current?.id,
    title: ensureString(payload.title, current?.title ?? ""),
    description: ensureString(payload.description, current?.description ?? ""),
    longDescription: ensureString(
      payload.longDescription,
      current?.longDescription ?? ensureString(payload.description, current?.description ?? "")
    ),
    imageUrl: ensureString(payload.imageUrl, current?.imageUrl ?? ""),
    startDate: ensureString(payload.startDate, current?.startDate ?? ""),
    endDate: ensureString(payload.endDate, current?.endDate ?? ""),
    status: (ensureString(payload.status, current?.status ?? "in-production") as RealmEvent["status"]),
    factions: ensureArray(payload.factions).length > 0 ? ensureArray(payload.factions) : current?.factions ?? [],
    rewards: ensureString(payload.rewards, current?.rewards ?? ""),
    requirements: ensureString(payload.requirements, current?.requirements ?? ""),
    participationRewardGold: Math.max(
      0,
      Math.floor(toNumber(payload.participationRewardGold, current?.participationRewardGold ?? 0))
    ),
    maxParticipants: Math.max(0, Math.floor(toNumber(payload.maxParticipants, current?.maxParticipants ?? 0))),
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
