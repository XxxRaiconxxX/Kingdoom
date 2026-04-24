import { ACTIVE_EVENTS } from "../data/events";
import {
  FACTION_DOSSIERS,
  LORE_CHAPTERS,
  LORE_RULES,
  REALM_FACTIONS,
} from "../data/lore";
import {
  COMMON_THREATS,
  DEMOGRAPHIC_BLOCS,
  DIPLOMATIC_TENSIONS,
  WORLD_STATUS,
} from "../data/world";
import type {
  BestiaryEntry,
  FloraEntry,
  GrimoireCategory,
  KnowledgeDocument,
  RealmEvent,
  RealmMission,
} from "../types";
import { fetchRealmEvents } from "./events";
import { fetchGrimoireContent } from "./grimoireContent";
import { fetchKnowledgeDocuments, slugifyKnowledgeId } from "./knowledge";
import { fetchPublicRealmMissions } from "./missions";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function joinLines(lines: Array<string | undefined | null>) {
  return lines.map((line) => line?.trim()).filter(Boolean).join("\n");
}

function createCanonDocument(
  input: Omit<KnowledgeDocument, "visible"> & { visible?: boolean }
): KnowledgeDocument {
  return {
    ...input,
    visible: input.visible ?? true,
  };
}

function buildMagicDocuments(categories: GrimoireCategory[]): KnowledgeDocument[] {
  return categories.flatMap((category) =>
    category.styles.map((style) => {
      const levelText = Object.entries(style.levels ?? {})
        .map(([level, abilities]) =>
          joinLines([
            `Lv${level}`,
            ...abilities.map((ability) =>
              joinLines([
                `${ability.name}`,
                `Efecto: ${ability.effect}`,
                `CD: ${ability.cd}`,
                `Limitante: ${ability.limit}`,
                `Anti-Mano Negra: ${ability.antiManoNegra}`,
              ])
            ),
          ])
        )
        .join("\n\n");

      return createCanonDocument({
        id: `canon-magic-${category.id}-${style.id}`,
        title: style.title,
        type: "magic",
        category: category.title,
        tags: [category.title, style.title, "grimorio", "magia"],
        source: "Grimorio publicado",
        summary: cleanText(style.description).slice(0, 240),
        content: joinLines([style.description, levelText]),
      });
    })
  );
}

function buildBestiaryDocuments(entries: BestiaryEntry[]): KnowledgeDocument[] {
  return entries.map((entry) =>
    createCanonDocument({
      id: `canon-bestiary-${entry.id}`,
      title: entry.name,
      type: "bestiary",
      category: entry.category || entry.rarity,
      tags: [
        entry.name,
        entry.category,
        entry.type,
        entry.rarity,
        entry.threatLevel,
        "bestiario",
      ].filter(Boolean),
      source: "Bestiario publicado",
      summary: cleanText(entry.description).slice(0, 240),
      content: joinLines([
        `Nombre: ${entry.name}`,
        `Categoria: ${entry.category}`,
        `Tipo: ${entry.type}`,
        `Datos generales: ${entry.generalData}`,
        `Nivel de amenaza: ${entry.threatLevel}`,
        `Domesticacion: ${entry.domestication}`,
        `Uso: ${entry.usage}`,
        `Origen: ${entry.originPlace}`,
        `Ubicacion: ${entry.foundAt}`,
        `Rareza: ${entry.rarity}`,
        `Descripcion: ${entry.description}`,
        `Habilidad: ${entry.ability}`,
      ]),
    })
  );
}

function buildFloraDocuments(entries: FloraEntry[]): KnowledgeDocument[] {
  return entries.map((entry) =>
    createCanonDocument({
      id: `canon-flora-${entry.id}`,
      title: entry.name,
      type: "flora",
      category: entry.category || entry.rarity,
      tags: [
        entry.name,
        entry.category,
        entry.type,
        entry.rarity,
        entry.originPlace,
        entry.foundAt,
        "flora",
      ].filter(Boolean),
      source: "Flora publicada",
      summary: cleanText(entry.description).slice(0, 240),
      content: joinLines([
        `Nombre: ${entry.name}`,
        `Categoria: ${entry.category}`,
        `Tipo: ${entry.type}`,
        `Datos generales: ${entry.generalData}`,
        `Propiedades: ${entry.properties}`,
        `Uso: ${entry.usage}`,
        `Origen: ${entry.originPlace}`,
        `Ubicacion: ${entry.foundAt}`,
        `Rareza: ${entry.rarity}`,
        `Descripcion: ${entry.description}`,
      ]),
    })
  );
}

function buildLoreDocuments(): KnowledgeDocument[] {
  const chapters = LORE_CHAPTERS.map((chapter) =>
    createCanonDocument({
      id: `canon-lore-${slugifyKnowledgeId(chapter.title)}`,
      title: chapter.title,
      type: "lore",
      category: "Cronicas",
      tags: [chapter.title, "lore", "cronica", "historia"],
      source: "Biblioteca publicada",
      summary: chapter.summary,
      content: joinLines([chapter.summary, chapter.content]),
    })
  );

  const rules = LORE_RULES.map((rule) =>
    createCanonDocument({
      id: `canon-rule-${slugifyKnowledgeId(rule.title)}`,
      title: rule.title,
      type: "rules",
      category: "Reglas",
      tags: [rule.title, "regla", "sistema"],
      source: "Biblioteca publicada",
      summary: rule.description,
      content: rule.description,
    })
  );

  const factions = [
    ...REALM_FACTIONS.map((faction) =>
      createCanonDocument({
        id: `canon-faction-short-${slugifyKnowledgeId(faction.name)}`,
        title: faction.name,
        type: "faction",
        category: "Facciones",
        tags: [faction.name, faction.motto, "faccion"],
        source: "Biblioteca publicada",
        summary: faction.description,
        content: joinLines([
          `Lema: ${faction.motto}`,
          `Descripcion: ${faction.description}`,
        ]),
      })
    ),
    ...FACTION_DOSSIERS.map((faction) =>
      createCanonDocument({
        id: `canon-faction-${faction.id}`,
        title: faction.name,
        type: "faction",
        category: faction.alignedRealm,
        tags: [
          faction.name,
          faction.motto,
          faction.alignedRealm,
          ...(faction.bonuses ?? []),
        ],
        source: "Dossier de facciones",
        summary: faction.playerDetails,
        content: joinLines([
          `Lema: ${faction.motto}`,
          `Reino alineado: ${faction.alignedRealm}`,
          `Historia: ${faction.history}`,
          `Especializacion: ${faction.specialization}`,
          `Tacticas: ${faction.tactics}`,
          `Equipo: ${faction.equipment}`,
          `Sede: ${faction.headquarters}`,
          `Relaciones: ${faction.relations
            .map((relation) => `${relation.realm}: ${relation.description}`)
            .join(" | ")}`,
          `Jugador: ${faction.playerDetails}`,
          faction.startingItem ? `Item inicial: ${faction.startingItem}` : "",
          faction.bonuses?.length ? `Bonos: ${faction.bonuses.join(", ")}` : "",
        ]),
      })
    ),
  ];

  return [...chapters, ...rules, ...factions];
}

function buildWorldDocuments(): KnowledgeDocument[] {
  return [
    createCanonDocument({
      id: "canon-world-status",
      title: WORLD_STATUS.title,
      type: "lore",
      category: "Mapa y Mundo",
      tags: ["mundo", "geopolitica", WORLD_STATUS.title],
      source: "Mapa y Mundo publicado",
      summary: WORLD_STATUS.description,
      content: WORLD_STATUS.description,
    }),
    ...DEMOGRAPHIC_BLOCS.map((bloc) =>
      createCanonDocument({
        id: `canon-world-${slugifyKnowledgeId(bloc.realm)}`,
        title: bloc.realm,
        type: "lore",
        category: "Demografia",
        tags: [
          bloc.realm,
          bloc.epithet,
          ...bloc.groups.flatMap((group) => [group.title, ...group.races]),
        ],
        source: "Mapa y Mundo publicado",
        summary: bloc.epithet,
        content: joinLines([
          `Epiteto: ${bloc.epithet}`,
          ...bloc.groups.map(
            (group) => `${group.title}: ${group.races.join(", ")}`
          ),
        ]),
      })
    ),
    ...DIPLOMATIC_TENSIONS.map((note) =>
      createCanonDocument({
        id: `canon-world-tension-${slugifyKnowledgeId(note.title)}`,
        title: note.title,
        type: "lore",
        category: "Tensiones diplomaticas",
        tags: [note.title, "tension", "diplomacia"],
        source: "Mapa y Mundo publicado",
        summary: note.description,
        content: note.description,
      })
    ),
    ...COMMON_THREATS.map((note) =>
      createCanonDocument({
        id: `canon-world-threat-${slugifyKnowledgeId(note.title)}`,
        title: note.title,
        type: "lore",
        category: "Amenazas comunes",
        tags: [note.title, "amenaza", "mundo"],
        source: "Mapa y Mundo publicado",
        summary: note.description,
        content: note.description,
      })
    ),
  ];
}

function buildEventDocuments(events: RealmEvent[]): KnowledgeDocument[] {
  return events.map((event) =>
    createCanonDocument({
      id: `canon-event-${event.id ?? slugifyKnowledgeId(event.title)}`,
      title: event.title,
      type: "event",
      category: event.status,
      tags: [event.title, event.status, ...event.factions, "evento"],
      source: "Eventos publicados",
      summary: event.description,
      content: joinLines([
        event.description,
        event.longDescription,
        `Inicio: ${event.startDate}`,
        `Cierre: ${event.endDate}`,
        `Estado: ${event.status}`,
        `Facciones: ${event.factions.join(", ")}`,
        `Recompensas: ${event.rewards}`,
        `Requisitos: ${event.requirements}`,
      ]),
    })
  );
}

function buildMissionDocuments(missions: RealmMission[]): KnowledgeDocument[] {
  return missions.map((mission) =>
    createCanonDocument({
      id: `canon-mission-${mission.id ?? slugifyKnowledgeId(mission.title)}`,
      title: mission.title,
      type: "mission",
      category: mission.difficulty,
      tags: [mission.title, mission.type, mission.difficulty, mission.status, "mision"],
      source: "Misiones publicadas",
      summary: mission.description,
      content: joinLines([
        mission.description,
        `Instrucciones: ${mission.instructions}`,
        `Tipo: ${mission.type}`,
        `Dificultad: ${mission.difficulty}`,
        `Estado: ${mission.status}`,
        `Recompensa de oro: ${mission.rewardGold}`,
        `Participantes maximos: ${mission.maxParticipants}`,
      ]),
    })
  );
}

function dedupeDocuments(documents: KnowledgeDocument[]) {
  const map = new Map<string, KnowledgeDocument>();

  documents.forEach((document) => {
    if (!map.has(document.id)) {
      map.set(document.id, document);
    }
  });

  return Array.from(map.values());
}

export async function fetchArchivistKnowledgeDocuments() {
  const [manualResult, grimoireResult, eventsResult, missionsResult] =
    await Promise.allSettled([
      fetchKnowledgeDocuments(),
      fetchGrimoireContent(),
      fetchRealmEvents(),
      fetchPublicRealmMissions(),
    ]);

  const manualDocuments =
    manualResult.status === "fulfilled" ? manualResult.value.documents : [];
  const manualMessage =
    manualResult.status === "fulfilled" ? manualResult.value.message : "";

  const grimoireDocuments =
    grimoireResult.status === "fulfilled"
      ? [
          ...buildMagicDocuments(grimoireResult.value.categories),
          ...buildBestiaryDocuments(grimoireResult.value.bestiary),
          ...buildFloraDocuments(grimoireResult.value.flora),
        ]
      : [];

  const eventDocuments =
    eventsResult.status === "fulfilled"
      ? buildEventDocuments(eventsResult.value.events)
      : buildEventDocuments(ACTIVE_EVENTS);

  const missionDocuments =
    missionsResult.status === "fulfilled"
      ? buildMissionDocuments(missionsResult.value.missions)
      : [];

  const documents = dedupeDocuments([
    ...manualDocuments,
    ...grimoireDocuments,
    ...buildLoreDocuments(),
    ...buildWorldDocuments(),
    ...eventDocuments,
    ...missionDocuments,
  ]);

  return {
    status: documents.length > 0 ? ("ready" as const) : ("error" as const),
    message:
      manualMessage && documents.length === manualDocuments.length
        ? manualMessage
        : "",
    documents,
  };
}
