import { CharacterSheet } from "../types";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "kingdoom_character_sheets";

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
  if (supabase) {
    const { data, error } = await supabase.from('character_sheets').select('*');
    if (error) {
      console.error("Supabase error fetching sheets:", error);
      return getLocalSheets(); // Fallback
    }
    return data as CharacterSheet[];
  }
  return getLocalSheets();
}

export async function saveCharacterSheet(sheet: CharacterSheet): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('character_sheets').upsert(sheet);
    if (error) {
      console.error("Supabase error saving sheet:", error);
      saveLocalSheet(sheet); // Fallback
    }
  } else {
    saveLocalSheet(sheet);
  }
}

export async function deleteCharacterSheet(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('character_sheets').delete().eq('id', id);
    if (error) {
      console.error("Supabase error deleting sheet:", error);
      deleteLocalSheet(id); // Fallback
    }
  } else {
    deleteLocalSheet(id);
  }
}

export async function getPlayerSheets(playerId: string): Promise<CharacterSheet[]> {
  if (supabase) {
    const { data, error } = await supabase.from('character_sheets').select('*').eq('playerId', playerId);
    if (error) {
      console.error("Supabase error fetching player sheets:", error);
      return getLocalSheets().filter(s => s.playerId === playerId); // Fallback
    }
    return data as CharacterSheet[];
  }
  return getLocalSheets().filter(s => s.playerId === playerId);
}

