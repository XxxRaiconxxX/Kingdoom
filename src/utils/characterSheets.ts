import type { CharacterSheet } from "../types";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "kingdoom_character_sheets";
const PORTRAITS_STORAGE_KEY = "kingdoom_character_sheet_portraits";

let supportsPlayerUsername: boolean | null = null;
let supportsPortraitUrl: boolean | null = null;

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

function getLocalPortraits(): Record<string, string> {
  const stored = localStorage.getItem(PORTRAITS_STORAGE_KEY);
  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored) as Record<string, string>;
  } catch (error) {
    console.error("Failed to parse character sheet portraits", error);
    return {};
  }
}

function saveLocalPortrait(sheetId: string, portraitUrl?: string): void {
  const portraits = getLocalPortraits();

  if (portraitUrl) {
    portraits[sheetId] = portraitUrl;
  } else {
    delete portraits[sheetId];
  }

  localStorage.setItem(PORTRAITS_STORAGE_KEY, JSON.stringify(portraits));
}

function mergePortraits(sheets: CharacterSheet[]): CharacterSheet[] {
  const portraits = getLocalPortraits();

  return sheets.map((sheet) => ({
    ...sheet,
    portraitUrl: sheet.portraitUrl ?? portraits[sheet.id],
  }));
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

function deleteLocalPortrait(id: string): void {
  const portraits = getLocalPortraits();
  delete portraits[id];
  localStorage.setItem(PORTRAITS_STORAGE_KEY, JSON.stringify(portraits));
}

// Main Exports (Async to support Supabase)
export async function getCharacterSheets(): Promise<CharacterSheet[]> {
  const { data, error } = await supabase.from("character_sheets").select("*");
  if (error) {
    console.error("Supabase error fetching sheets:", error);
    return mergePortraits(getLocalSheets()); // Fallback
  }
  return mergePortraits((data ?? []) as CharacterSheet[]);
}

export async function saveCharacterSheet(sheet: CharacterSheet): Promise<void> {
  const canStorePlayerUsername = await detectPlayerUsernameSupport();
  const canStorePortraitUrl = await detectPortraitUrlSupport();
  const payload = sanitizeSheetForSupabase(
    sheet,
    canStorePlayerUsername,
    canStorePortraitUrl
  );

  saveLocalPortrait(sheet.id, sheet.portraitUrl);

  const { error } = await supabase.from("character_sheets").upsert(payload);
  if (error) {
    console.error("Supabase error saving sheet:", error);
    saveLocalSheet(sheet); // Fallback
  }
}

export async function deleteCharacterSheet(id: string): Promise<void> {
  const { error } = await supabase.from("character_sheets").delete().eq("id", id);
  deleteLocalPortrait(id);
  if (error) {
    console.error("Supabase error deleting sheet:", error);
    deleteLocalSheet(id); // Fallback
  }
}

export async function getPlayerSheets(playerId: string): Promise<CharacterSheet[]> {
  const { data, error } = await supabase
    .from("character_sheets")
    .select("*")
    .eq("playerId", playerId);
  if (error) {
    console.error("Supabase error fetching player sheets:", error);
    return mergePortraits(getLocalSheets().filter((s) => s.playerId === playerId)); // Fallback
  }
  return mergePortraits((data ?? []) as CharacterSheet[]);
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
