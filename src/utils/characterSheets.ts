import type { CharacterSheet } from "../types";
import { supabase } from "../lib/supabase";
import { deleteCharacterPortraitByUrl } from "./characterPortraits";

const STORAGE_KEY = "kingdoom_character_sheets";
export const MAX_PLAYER_CHARACTER_SHEETS = 2;
const CHARACTER_SHEET_REGISTRY_BASE_SELECT = [
  "id",
  "playerId",
  "name",
  "race",
  "profession",
  "birthRealm",
];

const CHARACTER_SHEET_REGISTRY_OPTIONAL_COLUMNS = [
  "playerUsername",
  "portraitUrl",
  "recycleStatus",
  "originalPlayerId",
  "originalPlayerUsername",
  "recycledAt",
  "assignedAt",
  "assignedToPlayerId",
] as const;

type CharacterSheetOptionalColumn = (typeof CHARACTER_SHEET_REGISTRY_OPTIONAL_COLUMNS)[number];

const optionalColumnSupport: Partial<Record<CharacterSheetOptionalColumn, boolean>> = {};

export type CharacterSheetRegistrySummary = Pick<
  CharacterSheet,
  | "id"
  | "playerId"
  | "playerUsername"
  | "portraitUrl"
  | "recycleStatus"
  | "originalPlayerId"
  | "originalPlayerUsername"
  | "recycledAt"
  | "assignedAt"
  | "assignedToPlayerId"
  | "name"
  | "race"
  | "profession"
  | "birthRealm"
>;

type RegistryMode = "active" | "recycled";

async function detectOptionalColumnSupport(column: CharacterSheetOptionalColumn) {
  const cached = optionalColumnSupport[column];
  if (typeof cached === "boolean") {
    return cached;
  }

  try {
    const { error } = await supabase
      .from("character_sheets")
      .select(column)
      .limit(1);

    if (error) {
      const message = String((error as any).message ?? "");
      const code = String((error as any).code ?? "");
      const missingColumn =
        code === "42703" ||
        message.toLowerCase().includes(column.toLowerCase()) &&
          message.toLowerCase().includes("does not exist");
      optionalColumnSupport[column] = !missingColumn;
      return optionalColumnSupport[column];
    }

    optionalColumnSupport[column] = true;
    return true;
  } catch {
    optionalColumnSupport[column] = false;
    return false;
  }
}

async function buildCharacterSheetRegistrySelect() {
  const optionalColumns = await Promise.all(
    CHARACTER_SHEET_REGISTRY_OPTIONAL_COLUMNS.map(async (column) => ({
      column,
      supported: await detectOptionalColumnSupport(column),
    }))
  );

  return [
    ...CHARACTER_SHEET_REGISTRY_BASE_SELECT,
    ...optionalColumns
      .filter(({ supported }) => supported)
      .map(({ column }) => column),
  ].join(", ");
}

// Fallback: Local Storage
function getLocalSheets(): CharacterSheet[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse character sheets", e);
      return [];
    }
  }
  return [];
}

function saveLocalSheet(sheet: CharacterSheet): void {
  const sheets = getLocalSheets();
  const existingIndex = sheets.findIndex(s => s.id === sheet.id);
  if (existingIndex >= 0) {
    sheets[existingIndex] = sheet;
  } else {
    sheets.push(sheet);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
}

function deleteLocalSheet(id: string): void {
  const sheets = getLocalSheets();
  const filtered = sheets.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Main Exports (Async to support Supabase)
export async function getCharacterSheets(): Promise<CharacterSheet[]> {
  const { data, error } = await supabase
    .from("character_sheets")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) {
    console.error("Supabase error fetching sheets:", error);
    return getLocalSheets(); // Fallback
  }
  return (data ?? []) as CharacterSheet[];
}

export async function getActiveCharacterSheetCount(): Promise<number> {
  const canFilterRecycleStatus = await detectOptionalColumnSupport("recycleStatus");

  let query = supabase
    .from("character_sheets")
    .select("id", { count: "exact", head: true });

  if (canFilterRecycleStatus) {
    query = query.or("recycleStatus.is.null,recycleStatus.neq.available");
  }

  const { count, error } = await query;

  if (error) {
    console.error("Supabase error fetching character sheet count:", error);
    return getLocalSheets().filter((sheet) => sheet.recycleStatus !== "available").length;
  }

  return count ?? 0;
}

export async function getCharacterSheetRegistrySummaries(
  mode: RegistryMode = "active"
): Promise<CharacterSheetRegistrySummary[]> {
  const canFilterRecycleStatus = await detectOptionalColumnSupport("recycleStatus");

  if (mode === "recycled" && !canFilterRecycleStatus) {
    return [];
  }

  let query = supabase
    .from("character_sheets")
    .select(await buildCharacterSheetRegistrySelect())
    .order("name", { ascending: true });

  if (canFilterRecycleStatus) {
    query =
      mode === "recycled"
        ? query.eq("recycleStatus", "available")
        : query.or("recycleStatus.is.null,recycleStatus.neq.available");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error fetching registry summaries:", error);
    return getLocalSheets()
      .filter((sheet) =>
        mode === "recycled"
          ? sheet.recycleStatus === "available"
          : sheet.recycleStatus !== "available"
      )
      .slice()
      .sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", {
          sensitivity: "base",
        })
      )
      .map((sheet) => ({
        id: sheet.id,
        playerId: sheet.playerId,
        playerUsername: sheet.playerUsername,
        portraitUrl: sheet.portraitUrl,
        recycleStatus: sheet.recycleStatus,
        originalPlayerId: sheet.originalPlayerId,
        originalPlayerUsername: sheet.originalPlayerUsername,
        recycledAt: sheet.recycledAt,
        assignedAt: sheet.assignedAt,
        assignedToPlayerId: sheet.assignedToPlayerId,
        name: sheet.name,
        race: sheet.race,
        profession: sheet.profession,
        birthRealm: sheet.birthRealm,
      }));
  }

  return ((data ?? []) as unknown) as CharacterSheetRegistrySummary[];
}

export async function saveCharacterSheet(sheet: CharacterSheet): Promise<void> {
  const canStorePlayerUsername = await detectOptionalColumnSupport("playerUsername");
  const canStorePortraitUrl = await detectOptionalColumnSupport("portraitUrl");
  const payload = sanitizeSheetForSupabase(
    sheet,
    canStorePlayerUsername,
    canStorePortraitUrl
  );

  const { error } = await supabase.from("character_sheets").upsert(payload);
  if (error) {
    console.error("Supabase error saving sheet:", error);
    saveLocalSheet(sheet); // Fallback
  }
}

export async function deleteCharacterSheet(id: string, portraitUrl?: string): Promise<void> {
  await deleteCharacterPortraitByUrl(portraitUrl);
  const { error } = await supabase.from("character_sheets").delete().eq("id", id);
  if (error) {
    console.error("Supabase error deleting sheet:", error);
    deleteLocalSheet(id); // Fallback
  }
}

export async function getPlayerSheets(playerId: string): Promise<CharacterSheet[]> {
  const canFilterRecycleStatus = await detectOptionalColumnSupport("recycleStatus");
  let query = supabase
    .from("character_sheets")
    .select("*")
    .eq("playerId", playerId)
    .order("createdAt", { ascending: false });

  if (canFilterRecycleStatus) {
    query = query.or("recycleStatus.is.null,recycleStatus.neq.available");
  }

  const { data, error } = await query;
  if (error) {
    console.error("Supabase error fetching player sheets:", error);
    return getLocalSheets().filter(
      (s) => s.playerId === playerId && s.recycleStatus !== "available"
    ); // Fallback
  }
  return (data ?? []) as CharacterSheet[];
}

export async function getCharacterSheetById(id: string): Promise<CharacterSheet | null> {
  const { data, error } = await supabase
    .from("character_sheets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Supabase error fetching full sheet:", error);
    return getLocalSheets().find((sheet) => sheet.id === id) ?? null;
  }

  return (data ?? null) as CharacterSheet | null;
}

function sanitizeSheetForSupabase(
  sheet: CharacterSheet,
  canStorePlayerUsername: boolean,
  canStorePortraitUrl: boolean
) {
  const {
    playerUsername,
    portraitUrl,
    recycleStatus,
    originalPlayerId,
    originalPlayerUsername,
    recycledAt,
    assignedAt,
    assignedToPlayerId,
    ...rest
  } = sheet;

  return {
    ...rest,
    ...(canStorePlayerUsername ? { playerUsername } : {}),
    ...(canStorePortraitUrl ? { portraitUrl } : {}),
    ...(optionalColumnSupport.recycleStatus ? { recycleStatus } : {}),
    ...(optionalColumnSupport.originalPlayerId ? { originalPlayerId } : {}),
    ...(optionalColumnSupport.originalPlayerUsername ? { originalPlayerUsername } : {}),
    ...(optionalColumnSupport.recycledAt ? { recycledAt } : {}),
    ...(optionalColumnSupport.assignedAt ? { assignedAt } : {}),
    ...(optionalColumnSupport.assignedToPlayerId ? { assignedToPlayerId } : {}),
  };
}
