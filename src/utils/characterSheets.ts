import type { CharacterSheet } from "../types";
import { supabase } from "../lib/supabase";
import { deleteCharacterPortraitByUrl } from "./characterPortraits";

const STORAGE_KEY = "kingdoom_character_sheets";
export const MAX_PLAYER_CHARACTER_SHEETS = 2;
const CHARACTER_SHEET_REGISTRY_SUMMARY_SELECT = [
  "id",
  "playerId",
  "playerUsername",
  "portraitUrl",
  "name",
  "race",
  "profession",
  "birthRealm",
].join(", ");

let supportsPlayerUsername: boolean | null = null;
let supportsPortraitUrl: boolean | null = null;

export type CharacterSheetRegistrySummary = Pick<
  CharacterSheet,
  "id" | "playerId" | "playerUsername" | "portraitUrl" | "name" | "race" | "profession" | "birthRealm"
>;

async function detectPlayerUsernameSupport() {
  if (supportsPlayerUsername !== null) {
    return supportsPlayerUsername;
  }

  try {
    const { error } = await supabase
      .from("character_sheets")
      .select("playerUsername")
      .limit(1);

    if (error) {
      // If the column doesn't exist, Postgres usually returns 42703.
      const message = String((error as any).message ?? "");
      const code = String((error as any).code ?? "");
      const missingColumn =
        code === "42703" ||
        message.toLowerCase().includes("playerusername") &&
          message.toLowerCase().includes("does not exist");
      supportsPlayerUsername = !missingColumn;
      return supportsPlayerUsername;
    }

    supportsPlayerUsername = true;
    return true;
  } catch {
    // If this check fails for any reason, do not block saving.
    supportsPlayerUsername = false;
    return false;
  }
}

async function detectPortraitUrlSupport() {
  if (supportsPortraitUrl !== null) {
    return supportsPortraitUrl;
  }

  try {
    const { error } = await supabase
      .from("character_sheets")
      .select("portraitUrl")
      .limit(1);

    if (error) {
      const message = String((error as any).message ?? "");
      const code = String((error as any).code ?? "");
      const missingColumn =
        code === "42703" ||
        (message.toLowerCase().includes("portraiturl") &&
          message.toLowerCase().includes("does not exist"));
      supportsPortraitUrl = !missingColumn;
      return supportsPortraitUrl;
    }

    supportsPortraitUrl = true;
    return true;
  } catch {
    supportsPortraitUrl = false;
    return false;
  }
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

export async function getCharacterSheetRegistrySummaries(): Promise<CharacterSheetRegistrySummary[]> {
  const { data, error } = await supabase
    .from("character_sheets")
    .select(CHARACTER_SHEET_REGISTRY_SUMMARY_SELECT)
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase error fetching registry summaries:", error);
    return getLocalSheets()
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
        name: sheet.name,
        race: sheet.race,
        profession: sheet.profession,
        birthRealm: sheet.birthRealm,
      }));
  }

  return ((data ?? []) as unknown) as CharacterSheetRegistrySummary[];
}

export async function saveCharacterSheet(sheet: CharacterSheet): Promise<void> {
  const canStorePlayerUsername = await detectPlayerUsernameSupport();
  const canStorePortraitUrl = await detectPortraitUrlSupport();
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
  const { data, error } = await supabase
    .from("character_sheets")
    .select("*")
    .eq("playerId", playerId)
    .order("createdAt", { ascending: false });
  if (error) {
    console.error("Supabase error fetching player sheets:", error);
    return getLocalSheets().filter((s) => s.playerId === playerId); // Fallback
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
  const { playerUsername, portraitUrl, ...rest } = sheet;

  return {
    ...rest,
    ...(canStorePlayerUsername ? { playerUsername } : {}),
    ...(canStorePortraitUrl ? { portraitUrl } : {}),
  };
}
