import type {
  BestiaryEntry,
  FloraEntry,
  GrimoireCategory,
  MarketItem,
  RealmEvent,
  RealmMission,
} from "../../types";
import { fetchRealmEvents } from "../../utils/events";
import { fetchMarketItems } from "../../utils/market";
import { fetchAllPlayers } from "../../utils/players";
import { fetchGrimoireContent } from "../../utils/grimoireContent";
import { fetchKnowledgeDocuments } from "../../utils/knowledge";
import { fetchAdminRealmMissions, fetchPublicRealmMissions } from "../../utils/missions";
import type {
  ArchivistCard,
  ArchivistCardKind,
  ArchivistLiveContext,
  ArchivistLiveState,
} from "./archivist.types";

const CARD_STOPWORDS = new Set([
  "accion",
  "admin",
  "ahora",
  "algo",
  "ante",
  "aqui",
  "cada",
  "como",
  "con",
  "crear",
  "cuando",
  "dar",
  "dame",
  "del",
  "desde",
  "dice",
  "dime",
  "esa",
  "ese",
  "esta",
  "este",
  "esto",
  "genera",
  "generar",
  "hay",
  "las",
  "los",
  "mas",
  "me",
  "mision",
  "misiones",
  "necesito",
  "no",
  "para",
  "parece",
  "pasame",
  "pasamela",
  "puede",
  "puedes",
  "que",
  "reino",
  "si",
  "sistema",
  "subimos",
  "una",
  "uno",
  "usuario",
]);

const CARD_KIND_KEYWORDS: Record<ArchivistCardKind, string[]> = {
  market: ["arma", "armadura", "comprar", "espada", "item", "mercado", "objeto", "pocion", "tienda"],
  event: ["agenda", "evento", "eventos"],
  mission: ["contrato", "mision", "misiones"],
  magic: ["grimorio", "hechizo", "magia", "magias", "runa"],
  bestiary: ["bestia", "bestiario", "criatura"],
  flora: ["flora", "hierba", "planta"],
  document: ["archivo", "canon", "historia", "lore"],
  player: ["jugador", "jugadores", "oro", "ranking", "ricos", "riqueza", "usuario", "usuarios"],
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !CARD_STOPWORDS.has(token));
}

function scoreMatch(tokens: string[], values: Array<string | number | undefined>) {
  const haystack = normalizeText(
    values
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value))
      .join(" ")
  );

  return tokens.reduce((total, token) => {
    if (!token) return total;
    if (haystack.includes(token)) {
      return total + (token.length > 5 ? 4 : 2);
    }
    return total;
  }, 0);
}

function marketDetail(item: MarketItem) {
  const stock =
    item.stockStatus === "sold-out"
      ? "Agotado"
      : item.stockStatus === "limited"
        ? `Limitado ${Math.max(0, (item.stockLimit ?? 0) - (item.stockSold ?? 0))}`
        : "Disponible";

  return `${item.price.toLocaleString("es-PY")} oro | ${stock}`;
}

function toMarketCard(item: MarketItem): ArchivistCard {
  return {
    id: `market-${item.id}`,
    kind: "market",
    title: item.name,
    eyebrow: "Mercado",
    description: item.description,
    detail: marketDetail(item),
    accent:
      item.rarity === "mythic"
        ? "rose"
        : item.rarity === "legendary"
          ? "amber"
          : item.rarity === "epic"
            ? "violet"
            : "cyan",
    imageUrl: item.imageUrl,
  };
}

function toEventCard(entry: RealmEvent): ArchivistCard {
  return {
    id: `event-${entry.id ?? entry.title}`,
    kind: "event",
    title: entry.title,
    eyebrow: "Evento",
    description: entry.description,
    detail: `${entry.status} | ${entry.startDate} -> ${entry.endDate}`,
    accent: entry.status === "active" ? "emerald" : entry.status === "finished" ? "rose" : "amber",
    imageUrl: entry.imageUrl,
  };
}

function toMissionCard(entry: RealmMission): ArchivistCard {
  return {
    id: `mission-${entry.id ?? entry.title}`,
    kind: "mission",
    title: entry.title,
    eyebrow: "Mision",
    description: entry.description,
    detail: `${entry.difficulty} | ${entry.rewardGold.toLocaleString("es-PY")} oro`,
    accent: entry.status === "available" ? "amber" : entry.status === "in-progress" ? "cyan" : "rose",
  };
}

function flattenMagicStyles(categories: GrimoireCategory[]) {
  return categories.flatMap((category) =>
    category.styles.map((style) => ({
      categoryTitle: category.title,
      title: style.title,
      description: style.description,
    }))
  );
}

function toMagicCard(entry: {
  categoryTitle: string;
  title: string;
  description: string;
}): ArchivistCard {
  return {
    id: `magic-${entry.categoryTitle}-${entry.title}`,
    kind: "magic",
    title: entry.title,
    eyebrow: entry.categoryTitle,
    description: entry.description,
    detail: "Catalogo de magia",
    accent: "violet",
  };
}

function toBestiaryCard(entry: BestiaryEntry): ArchivistCard {
  return {
    id: `bestiary-${entry.id}`,
    kind: "bestiary",
    title: entry.name,
    eyebrow: entry.category || "Bestiario",
    description: entry.description,
    detail: `${entry.type} | ${entry.threatLevel}`,
    accent: entry.rarity === "legendary" || entry.rarity === "calamity" ? "rose" : "amber",
    imageUrl: entry.imageUrl,
  };
}

function toFloraCard(entry: FloraEntry): ArchivistCard {
  return {
    id: `flora-${entry.id}`,
    kind: "flora",
    title: entry.name,
    eyebrow: entry.category || "Flora",
    description: entry.description,
    detail: `${entry.type} | ${entry.rarity}`,
    accent: "emerald",
    imageUrl: entry.imageUrl,
  };
}

function toDocumentCard(entry: ArchivistLiveContext["documents"][number]): ArchivistCard {
  return {
    id: `document-${entry.id}`,
    kind: "document",
    title: entry.title,
    eyebrow: entry.category || entry.type,
    description: entry.summary || entry.content.slice(0, 160),
    detail: entry.source || "Archivo del reino",
    accent: "cyan",
  };
}

function toPlayerCard(entry: ArchivistLiveContext["players"][number]): ArchivistCard {
  return {
    id: `player-${entry.id}`,
    kind: "player",
    title: entry.username,
    eyebrow: entry.isAdmin ? "Admin" : "Jugador",
    description: `Oro: ${entry.gold.toLocaleString("es-PY")}`,
    detail: entry.authUserId ? "Cuenta vinculada" : "Cuenta local",
    accent: entry.isAdmin ? "amber" : "cyan",
  };
}

export async function fetchArchivistLiveContext(options?: {
  includeAdminData?: boolean;
}): Promise<ArchivistLiveState> {
  const includeAdminData = options?.includeAdminData === true;

  const [
    marketResult,
    eventsResult,
    missionsResult,
    grimoireResult,
    documentsResult,
    playersResult,
  ] = await Promise.all([
    fetchMarketItems(),
    fetchRealmEvents(),
    includeAdminData ? fetchAdminRealmMissions() : fetchPublicRealmMissions(),
    fetchGrimoireContent(),
    fetchKnowledgeDocuments({ includeHidden: includeAdminData }),
    includeAdminData ? fetchAllPlayers() : Promise.resolve([]),
  ]);

  const messages = [
    marketResult.message,
    eventsResult.message,
    missionsResult.message,
    grimoireResult.message,
    documentsResult.message,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    status:
      marketResult.status === "ready" &&
      eventsResult.status === "ready" &&
      missionsResult.status === "ready" &&
      grimoireResult.status === "ready" &&
      documentsResult.status === "ready"
        ? "ready"
        : "partial",
    message: messages[0] ?? "",
    context: {
      marketItems: marketResult.items,
      events: eventsResult.events,
      missions: missionsResult.missions,
      grimoireCategories: grimoireResult.categories,
      bestiary: grimoireResult.bestiary,
      flora: grimoireResult.flora,
      documents: documentsResult.documents,
      players: playersResult,
    },
  };
}

export function buildArchivistRuntimeSummary(
  context: ArchivistLiveContext,
  options?: { includeAdminData?: boolean }
) {
  const activeEvents = context.events.filter((entry) => entry.status === "active");
  const publicMissions = context.missions.filter((entry) => entry.visible !== false);
  const activeMissionTitles = publicMissions
    .filter((entry) => entry.status !== "closed")
    .slice(0, 8)
    .map((entry) => entry.title);
  const expensiveMarket = [...context.marketItems]
    .sort((left, right) => right.price - left.price)
    .slice(0, 4)
    .map((item) => `${item.name} (${item.price} oro, ${item.rarity})`);
  const cheapMarket = [...context.marketItems]
    .sort((left, right) => left.price - right.price)
    .slice(0, 4)
    .map((item) => `${item.name} (${item.price} oro)`);
  const visibleEventTitles = activeEvents.slice(0, 8).map((entry) => entry.title);
  const visibleDocumentTitles = context.documents.slice(0, 8).map((entry) => entry.title);
  const magicTitles = flattenMagicStyles(context.grimoireCategories)
    .slice(0, 10)
    .map((entry) => `${entry.title} [${entry.categoryTitle}]`);
  const playerNames = context.players.slice(0, 50).map((entry) => entry.username);
  const sortedByGold = [...context.players].sort((left, right) => right.gold - left.gold);
  const richestPlayers = sortedByGold
    .slice(0, 15)
    .map((entry) => `${entry.username}: ${entry.gold.toLocaleString("es-PY")} oro`);
  const poorestPlayers = sortedByGold
    .slice(-10)
    .reverse()
    .map((entry) => `${entry.username}: ${entry.gold.toLocaleString("es-PY")} oro`);

  const lines = [
    `Mercado cargado: ${context.marketItems.length} items.`,
    `Eventos activos: ${activeEvents.length}.`,
    `Misiones visibles: ${publicMissions.length}.`,
    `Bestiario: ${context.bestiary.length} entradas.`,
    `Flora: ${context.flora.length} entradas.`,
    `Magias: ${flattenMagicStyles(context.grimoireCategories).length} estilos.`,
    expensiveMarket.length > 0
      ? `Items mas caros ahora: ${expensiveMarket.join(" | ")}`
      : "",
    cheapMarket.length > 0 ? `Items mas baratos ahora: ${cheapMarket.join(" | ")}` : "",
    visibleEventTitles.length > 0
      ? `Eventos activos por nombre: ${visibleEventTitles.join(" | ")}`
      : "",
    activeMissionTitles.length > 0
      ? `Misiones abiertas por nombre: ${activeMissionTitles.join(" | ")}`
      : "",
    magicTitles.length > 0 ? `Magias destacadas: ${magicTitles.join(" | ")}` : "",
    visibleDocumentTitles.length > 0
      ? `Documentos cargados: ${visibleDocumentTitles.join(" | ")}`
      : "",
  ];

  if (options?.includeAdminData) {
    if (richestPlayers.length > 0) {
      lines.unshift(`Ranking de mayores fortunas (Staff): ${richestPlayers.join(" | ")}`);
    }
    if (poorestPlayers.length > 0 && context.players.length > richestPlayers.length) {
      lines.push(`Ranking de menores fortunas (Staff): ${poorestPlayers.join(" | ")}`);
    }
    lines.push(`Total de jugadores en el reino: ${context.players.length}.`);
    if (playerNames.length > 0) {
      lines.push(`Lista de jugadores (muestra de 50): ${playerNames.join(" | ")}`);
    }
  }

  return lines.filter(Boolean).join("\n");
}

export function pickArchivistCards(
  context: ArchivistLiveContext,
  query: string,
  options?: {
    includeAdminData?: boolean;
    limit?: number;
    kinds?: ArchivistCardKind[];
    minScore?: number;
    strict?: boolean;
  }
) {
  const tokens = tokenize(query);
  const limit = options?.limit ?? 4;
  const allowedKinds = options?.kinds ? new Set(options.kinds) : null;
  const rawTokens = tokenizeForIntent(query);
  const inferredKinds = allowedKinds ?? inferCardKinds(rawTokens);
  const minScore = options?.minScore ?? (options?.strict || inferredKinds ? 4 : 3);

  if (tokens.length === 0 && !inferredKinds) {
    return [];
  }

  const pool: Array<{ score: number; card: ArchivistCard }> = [
    ...context.marketItems.map((item) => ({
      score:
        scoreMatch(tokens, [
          item.name,
          item.description,
          item.ability,
          item.category,
          item.rarity,
          item.price,
        ]) + categoryBoost("market", rawTokens),
      card: toMarketCard(item),
    })),
    ...context.events.map((entry) => ({
      score:
        scoreMatch(tokens, [
          entry.title,
          entry.description,
          entry.status,
          entry.rewards,
          entry.requirements,
        ]) + categoryBoost("event", rawTokens),
      card: toEventCard(entry),
    })),
    ...context.missions.map((entry) => ({
      score:
        scoreMatch(tokens, [
          entry.title,
          entry.description,
          entry.type,
          entry.difficulty,
          entry.status,
        ]) + categoryBoost("mission", rawTokens),
      card: toMissionCard(entry),
    })),
    ...flattenMagicStyles(context.grimoireCategories).map((entry) => ({
        score:
          scoreMatch(tokens, [entry.title, entry.description, entry.categoryTitle]) +
        categoryBoost("magic", rawTokens),
      card: toMagicCard(entry),
    })),
    ...context.bestiary.map((entry) => ({
      score:
        scoreMatch(tokens, [
          entry.name,
          entry.description,
          entry.category,
          entry.type,
          entry.threatLevel,
        ]) + categoryBoost("bestiary", rawTokens),
      card: toBestiaryCard(entry),
    })),
    ...context.flora.map((entry) => ({
      score:
        scoreMatch(tokens, [
          entry.name,
          entry.description,
          entry.category,
          entry.type,
          entry.properties,
        ]) + categoryBoost("flora", rawTokens),
      card: toFloraCard(entry),
    })),
    ...context.documents.map((entry) => ({
      score: scoreMatch(tokens, [entry.title, entry.summary, entry.category, entry.type]),
      card: toDocumentCard(entry),
    })),
    ...(options?.includeAdminData
      ? context.players.map((entry) => ({
          score:
            scoreMatch(tokens, [entry.username, entry.gold]) +
            categoryBoost("player", rawTokens),
          card: toPlayerCard(entry),
        }))
      : []),
  ];

  return pool
    .filter((entry) => entry.score >= minScore)
    .filter((entry) => !inferredKinds || inferredKinds.has(entry.card.kind))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.card);
}

function tokenizeForIntent(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function inferCardKinds(tokens: string[]) {
  const kinds = (Object.keys(CARD_KIND_KEYWORDS) as ArchivistCardKind[]).filter((kind) =>
    CARD_KIND_KEYWORDS[kind].some((keyword) => tokens.includes(keyword))
  );

  return kinds.length > 0 ? new Set(kinds) : null;
}

function categoryBoost(kind: ArchivistCardKind, tokens: string[]) {
  const isPlayerMatch = kind === "player" && CARD_KIND_KEYWORDS.player.some((keyword) => tokens.includes(keyword));
  if (isPlayerMatch) return 10;
  return CARD_KIND_KEYWORDS[kind].some((keyword) => tokens.includes(keyword)) ? 2 : 0;
}
