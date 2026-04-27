import type {
  AbilityLevel,
  BestiaryEntry,
  BestiaryRarity,
  FloraEntry,
  MagicStyle,
} from "@/src/features/shared/types";
import { supabase, supabaseConfigError } from "@/src/services/supabase";

type MagicStyleRow = {
  id: string;
  category_id: string;
  category_title: string;
  title: string;
  description: string;
  levels: Record<string, AbilityLevel[]> | null;
};

type BestiaryRow = {
  id: string;
  name: string;
  category: string;
  type: string;
  general_data: string;
  threat_level: string;
  domestication: string;
  usage: string;
  origin_place: string;
  found_at: string;
  description: string;
  ability: string;
  rarity: BestiaryRarity;
  image_url: string;
};

type FloraRow = {
  id: string;
  name: string;
  category: string;
  type: string;
  general_data: string;
  properties: string;
  usage: string;
  origin_place: string;
  found_at: string;
  description: string;
  rarity: BestiaryRarity;
  image_url: string;
};

function mapMagicStyle(row: MagicStyleRow): MagicStyle {
  const rawLevels = row.levels ?? {};
  const levels = Object.fromEntries(
    Object.entries(rawLevels).map(([key, value]) => [Number(key), value])
  ) as Record<number, AbilityLevel[]>;

  return {
    id: row.id,
    categoryId: row.category_id,
    categoryTitle: row.category_title,
    title: row.title,
    description: row.description,
    levels,
  };
}

function mapBestiary(row: BestiaryRow): BestiaryEntry {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.type,
    generalData: row.general_data,
    threatLevel: row.threat_level,
    domestication: row.domestication,
    usage: row.usage,
    originPlace: row.origin_place,
    foundAt: row.found_at,
    description: row.description,
    ability: row.ability,
    rarity: row.rarity,
    imageUrl: row.image_url,
  };
}

function mapFlora(row: FloraRow): FloraEntry {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.type,
    generalData: row.general_data,
    properties: row.properties,
    usage: row.usage,
    originPlace: row.origin_place,
    foundAt: row.found_at,
    description: row.description,
    rarity: row.rarity,
    imageUrl: row.image_url,
  };
}

export async function fetchGrimoireNative() {
  if (!supabase) {
    return {
      magic: [] as MagicStyle[],
      bestiary: [] as BestiaryEntry[],
      flora: [] as FloraEntry[],
      errorMessage: supabaseConfigError,
    };
  }

  const [magicResult, bestiaryResult, floraResult] = await Promise.all([
    supabase
      .from("grimoire_magic_styles")
      .select("id, category_id, category_title, title, description, levels")
      .order("category_title", { ascending: true }),
    supabase
      .from("grimoire_bestiary_entries")
      .select(
        "id, name, category, type, general_data, threat_level, domestication, usage, origin_place, found_at, description, ability, rarity, image_url"
      )
      .order("name", { ascending: true }),
    supabase
      .from("grimoire_flora_entries")
      .select(
        "id, name, category, type, general_data, properties, usage, origin_place, found_at, description, rarity, image_url"
      )
      .order("name", { ascending: true }),
  ]);

  const errorMessage =
    magicResult.error || bestiaryResult.error || floraResult.error
      ? "No se pudo cargar todo el grimorio desde Supabase."
      : "";

  return {
    magic: ((magicResult.data ?? []) as MagicStyleRow[]).map(mapMagicStyle),
    bestiary: ((bestiaryResult.data ?? []) as BestiaryRow[]).map(mapBestiary),
    flora: ((floraResult.data ?? []) as FloraRow[]).map(mapFlora),
    errorMessage,
  };
}
