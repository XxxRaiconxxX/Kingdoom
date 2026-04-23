import { GRIMOIRE_DATA } from "../data/grimorio";
import type {
  AbilityLevel,
  BestiaryEntry,
  BestiaryRarity,
  GrimoireCategory,
  MagicStyle,
} from "../types";
import { formatAdminPermissionMessage } from "./supabaseErrors";
import { supabase } from "./supabaseClient";

type MagicStyleRow = {
  id: string;
  category_id: string;
  category_title: string;
  title: string;
  description: string;
  levels: Record<number, AbilityLevel[]>;
  sort_order: number | null;
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
  created_at?: string;
  updated_at?: string;
};

export type AdminMagicStyleInput = {
  id: string;
  categoryId: string;
  categoryTitle: string;
  title: string;
  description: string;
  levels: Record<number, AbilityLevel[]>;
  sortOrder?: number;
};

export type AdminBestiaryInput = Omit<BestiaryEntry, "createdAt" | "updatedAt">;

export type GrimoireContentState = {
  status: "ready" | "fallback";
  message: string;
  categories: GrimoireCategory[];
  bestiary: BestiaryEntry[];
};

export const BESTIARY_RARITIES: Array<{ id: BestiaryRarity; label: string }> = [
  { id: "common", label: "Comun" },
  { id: "uncommon", label: "Poco comun" },
  { id: "rare", label: "Raro" },
  { id: "legendary", label: "Legendario" },
  { id: "calamity", label: "Calamidad" },
];

export function slugifyGrimoireId(value: string, fallback = "entrada") {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return slug || fallback;
}

function mapMagicRow(row: MagicStyleRow): MagicStyle & {
  categoryId: string;
  categoryTitle: string;
  sortOrder: number;
} {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    levels: row.levels ?? {},
    categoryId: row.category_id,
    categoryTitle: row.category_title,
    sortOrder: row.sort_order ?? 0,
  };
}

function cloneStaticCategories(): GrimoireCategory[] {
  return GRIMOIRE_DATA.map((category) => ({
    ...category,
    styles: category.styles.map((style) => ({
      ...style,
      levels: { ...style.levels },
    })),
  }));
}

function mergeMagicRowsWithStatic(rows: MagicStyleRow[]): GrimoireCategory[] {
  const categories = cloneStaticCategories();
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  rows.map(mapMagicRow).forEach((style) => {
    let category = categoryMap.get(style.categoryId);

    if (!category) {
      category = {
        id: style.categoryId,
        title: style.categoryTitle,
        styles: [],
      };
      categoryMap.set(style.categoryId, category);
      categories.push(category);
    }

    const nextStyle: MagicStyle = {
      id: style.id,
      title: style.title,
      description: style.description,
      levels: style.levels,
    };
    const existingIndex = category.styles.findIndex((entry) => entry.id === style.id);

    if (existingIndex >= 0) {
      category.styles[existingIndex] = nextStyle;
      return;
    }

    category.styles.push(nextStyle);
  });

  return categories.map((category) => ({
    ...category,
    styles: category.styles.sort((a, b) => a.title.localeCompare(b.title)),
  }));
}

function flattenStaticMagicStyles() {
  return GRIMOIRE_DATA.flatMap((category) =>
    category.styles.map((style, index) => ({
      ...style,
      categoryId: category.id,
      categoryTitle: category.title,
      sortOrder: index,
    }))
  );
}

function mapBestiaryRow(row: BestiaryRow): BestiaryEntry {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "",
    type: row.type ?? "",
    generalData: row.general_data ?? "",
    threatLevel: row.threat_level ?? "",
    domestication: row.domestication ?? "",
    usage: row.usage ?? "",
    originPlace: row.origin_place,
    foundAt: row.found_at,
    description: row.description,
    ability: row.ability,
    rarity: row.rarity,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildMagicPayload(input: AdminMagicStyleInput) {
  return {
    id: input.id.trim(),
    category_id: input.categoryId.trim(),
    category_title: input.categoryTitle.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    levels: input.levels,
    sort_order: input.sortOrder ?? 0,
  };
}

function buildBestiaryPayload(input: AdminBestiaryInput) {
  return {
    id: input.id.trim(),
    name: input.name.trim(),
    category: input.category.trim(),
    type: input.type.trim(),
    general_data: input.generalData.trim(),
    threat_level: input.threatLevel.trim(),
    domestication: input.domestication.trim(),
    usage: input.usage.trim(),
    origin_place: input.originPlace.trim(),
    found_at: input.foundAt.trim(),
    description: input.description.trim(),
    ability: input.ability.trim(),
    rarity: input.rarity,
    image_url: input.imageUrl.trim(),
  };
}

export async function fetchGrimoireContent(): Promise<GrimoireContentState> {
  const [magicResult, bestiaryResult] = await Promise.all([
    supabase
      .from("grimoire_magic_styles")
      .select("id, category_id, category_title, title, description, levels, sort_order")
      .order("category_title", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("grimoire_bestiary_entries")
      .select(
        "id, name, category, type, general_data, threat_level, domestication, usage, origin_place, found_at, description, ability, rarity, image_url, created_at, updated_at"
      )
      .order("name", { ascending: true }),
  ]);

  const magicRows = (magicResult.data ?? []) as MagicStyleRow[];
  const bestiaryRows = (bestiaryResult.data ?? []) as BestiaryRow[];

  return {
    status: magicRows.length > 0 || bestiaryRows.length > 0 ? "ready" : "fallback",
    message:
      magicResult.error || bestiaryResult.error
        ? "El Grimorio usa contenido local mientras faltan tablas administrables en Supabase."
        : "",
    categories: magicRows.length > 0 ? mergeMagicRowsWithStatic(magicRows) : GRIMOIRE_DATA,
    bestiary: bestiaryRows.map(mapBestiaryRow),
  };
}

export async function fetchAdminMagicStyles() {
  const { data, error } = await supabase
    .from("grimoire_magic_styles")
    .select("id, category_id, category_title, title, description, levels, sort_order")
    .order("category_title", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      status: "fallback" as const,
      message:
        "Aun no hay magias administradas en Supabase. Se muestran los estilos base del proyecto como plantilla.",
      styles: flattenStaticMagicStyles(),
    };
  }

  return {
    status: "ready" as const,
    message: "",
    styles: mergeMagicRowsWithStatic(data as MagicStyleRow[]).flatMap((category) =>
      category.styles.map((style, index) => ({
        ...style,
        categoryId: category.id,
        categoryTitle: category.title,
        sortOrder: index,
      }))
    ),
  };
}

export async function upsertMagicStyle(input: AdminMagicStyleInput) {
  const { error } = await supabase
    .from("grimoire_magic_styles")
    .upsert(buildMagicPayload(input), { onConflict: "id" });

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage("No se pudo guardar la magia.", error.message),
    };
  }

  return { status: "saved" as const, message: "Magia guardada correctamente." };
}

export async function deleteMagicStyle(id: string) {
  const { error } = await supabase.from("grimoire_magic_styles").delete().eq("id", id);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage("No se pudo borrar la magia.", error.message),
    };
  }

  return { status: "deleted" as const, message: "Magia borrada correctamente." };
}

export async function fetchBestiaryEntries() {
  const { data, error } = await supabase
    .from("grimoire_bestiary_entries")
    .select(
      "id, name, category, type, general_data, threat_level, domestication, usage, origin_place, found_at, description, ability, rarity, image_url, created_at, updated_at"
    )
    .order("name", { ascending: true });

  if (error) {
    return {
      status: "fallback" as const,
      message:
        "Aun no hay Bestiario administrable en Supabase. Crea la tabla para empezar a cargar criaturas.",
      entries: [] as BestiaryEntry[],
    };
  }

  return {
    status: "ready" as const,
    message: "",
    entries: ((data ?? []) as BestiaryRow[]).map(mapBestiaryRow),
  };
}

export async function upsertBestiaryEntry(input: AdminBestiaryInput) {
  const { error } = await supabase
    .from("grimoire_bestiary_entries")
    .upsert(buildBestiaryPayload(input), { onConflict: "id" });

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage("No se pudo guardar la bestia.", error.message),
    };
  }

  return { status: "saved" as const, message: "Bestia guardada correctamente." };
}

export async function deleteBestiaryEntry(id: string) {
  const { error } = await supabase
    .from("grimoire_bestiary_entries")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      status: "error" as const,
      message: formatAdminPermissionMessage("No se pudo borrar la bestia.", error.message),
    };
  }

  return { status: "deleted" as const, message: "Bestia borrada correctamente." };
}
