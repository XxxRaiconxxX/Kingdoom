import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { BookOpen, Flower2, ImagePlus, Loader2, PawPrint, Scale, Sparkles, Trash2 } from "lucide-react";
import type { AbilityLevel, BestiaryEntry, BestiaryRarity, FloraEntry, MagicStyle } from "../types";
import {
  BESTIARY_RARITIES,
  deleteBestiaryEntry,
  deleteFloraEntry,
  deleteMagicStyle,
  fetchAdminMagicStyles,
  fetchBestiaryEntries,
  fetchFloraEntries,
  slugifyGrimoireId,
  upsertBestiaryEntry,
  upsertFloraEntry,
  upsertMagicStyle,
} from "../utils/grimoireContent";
import {
  ADMIN_LIST_PREVIEW_COUNT,
  AdminAiDebugCard,
  ExpandableListToggle,
} from "./admin/AdminControlPrimitives";
import {
  analyzeMagicBalanceWithAi,
  generateBestiaryWithAi,
  generateMagicDraftWithAi,
} from "../utils/grimoireAi";
import type { MagicBalanceMode } from "../utils/grimoireAi";
import type { AiDebugInfo } from "../utils/aiDebug";

type AdminMagicStyle = MagicStyle & {
  categoryId: string;
  categoryTitle: string;
  sortOrder: number;
};

const EMPTY_LEVELS: Record<number, AbilityLevel[]> = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
};

function formatLevels(levels: Record<number, AbilityLevel[]>) {
  return JSON.stringify(levels, null, 2);
}

function parseLevels(raw: string): Record<number, AbilityLevel[]> {
  const parsed = JSON.parse(raw) as Record<number, AbilityLevel[]>;
  return {
    1: parsed[1] ?? [],
    2: parsed[2] ?? [],
    3: parsed[3] ?? [],
    4: parsed[4] ?? [],
    5: parsed[5] ?? [],
  };
}

function emptyLevels(): Record<number, AbilityLevel[]> {
  return {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
}

function stripMarkdown(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanHeading(value: string) {
  return stripMarkdown(
    value
      .replace(/^#+\s*/, "")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
  );
}

function extractDraftCategory(lines: string[]) {
  for (const line of lines) {
    if (!normalizeForSearch(line).includes("catalogo de")) continue;

    const boldMatch = line.match(/\*\*([^*]+)\*\*/);
    if (boldMatch?.[1]) {
      return stripMarkdown(boldMatch[1]);
    }
  }

  return "General";
}

function parseMagicBullet(line: string) {
  const match = line.match(/^\s*\*\s+\*\*([^:]+):\*\*\s*(.*)$/);
  if (!match) return null;

  const label = normalizeForSearch(match[1]);
  const value = stripMarkdown(match[2] ?? "");

  if (label === "efecto") return { field: "effect" as const, value };
  if (label === "cd") return { field: "cd" as const, value };
  if (label === "limitante") return { field: "limit" as const, value };
  if (label === "anti-mano negra" || label === "anti mano negra") {
    return { field: "antiManoNegra" as const, value };
  }

  return null;
}

function parseMagicDraft(raw: string) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const meaningfulLines = lines.filter((line) => line.trim().length > 0);

  if (meaningfulLines.length === 0) {
    throw new Error("empty");
  }

  const categoryTitle = extractDraftCategory(meaningfulLines);
  const categoryId = slugifyGrimoireId(categoryTitle, "general");
  const styleHeadingIndex = lines.findIndex((line) => {
    const normalized = normalizeForSearch(line);
    return (
      /^#{2,}/.test(line.trim()) &&
      !normalized.includes("escala") &&
      !normalized.includes("habilidades") &&
      cleanHeading(line).length > 0
    );
  });
  const scaleIndex = lines.findIndex((line) =>
    normalizeForSearch(line).includes("escala de niveles")
  );
  const firstLevelIndex = lines.findIndex((line) =>
    /^#{2,}/.test(line.trim()) && normalizeForSearch(line).includes("lv")
  );
  const title =
    styleHeadingIndex >= 0
      ? cleanHeading(lines[styleHeadingIndex])
      : "Nueva magia";
  const descriptionEnd =
    scaleIndex >= 0
      ? scaleIndex
      : firstLevelIndex >= 0
        ? firstLevelIndex
        : lines.length;
  const description = lines
    .slice(0, descriptionEnd)
    .filter((line, index) => index !== styleHeadingIndex)
    .filter((line) => line.trim() !== "---")
    .join("\n")
    .trim();
  const levels = emptyLevels();
  let currentLevel = 0;
  let currentAbility: AbilityLevel | null = null;
  let currentField: keyof Pick<AbilityLevel, "effect" | "cd" | "limit" | "antiManoNegra"> | null = null;

  function pushCurrentAbility() {
    if (!currentAbility || currentLevel < 1 || currentLevel > 5) return;

    levels[currentLevel].push({
      ...currentAbility,
      effect: currentAbility.effect.trim(),
      cd: currentAbility.cd.trim() || "Sin CD especificado.",
      limit: currentAbility.limit.trim() || "Sin limitante especificada.",
      antiManoNegra:
        currentAbility.antiManoNegra.trim() ||
        "Pendiente de definir por administracion.",
    });
  }

  for (const line of lines.slice(firstLevelIndex >= 0 ? firstLevelIndex : 0)) {
    const trimmed = line.trim();
    const normalized = normalizeForSearch(trimmed);

    if (!trimmed || trimmed === "---") continue;
    if (normalized.startsWith("continuamos") || normalized.startsWith("¿continuamos")) {
      break;
    }

    const levelMatch = trimmed.match(/^#{2,}.*lv\s*([1-5])/i);
    if (levelMatch?.[1]) {
      pushCurrentAbility();
      currentAbility = null;
      currentField = null;
      currentLevel = Number(levelMatch[1]);
      continue;
    }

    const abilityMatch =
      trimmed.match(/^\d+\.\s+\*\*([^*]+?)\*\*:?\s*(.*)$/) ??
      trimmed.match(/^\d+\.\s+([^:]+):\s*(.*)$/);

    if (abilityMatch?.[1] && currentLevel >= 1 && currentLevel <= 5) {
      pushCurrentAbility();
      const initialEffect = stripMarkdown(abilityMatch[2] ?? "");
      currentAbility = {
        level: currentLevel,
        name: stripMarkdown(abilityMatch[1]),
        effect: initialEffect,
        cd: "",
        limit: "",
        antiManoNegra: "",
      };
      currentField = initialEffect ? "effect" : null;
      continue;
    }

    if (!currentAbility) continue;

    const bullet = parseMagicBullet(trimmed);
    if (bullet) {
      if (bullet.field === "effect" && currentAbility.effect) {
        currentAbility.effect = `${currentAbility.effect} ${bullet.value}`.trim();
      } else {
        currentAbility[bullet.field] = bullet.value;
      }
      currentField = bullet.field;
      continue;
    }

    if (currentField && !trimmed.startsWith("#")) {
      currentAbility[currentField] = `${currentAbility[currentField]} ${stripMarkdown(trimmed)}`.trim();
    }
  }

  pushCurrentAbility();

  const totalAbilities = Object.values(levels).reduce(
    (total, entries) => total + entries.length,
    0
  );

  if (totalAbilities === 0) {
    throw new Error("levels");
  }

  return {
    categoryId,
    categoryTitle,
    title,
    description,
    levels,
    totalAbilities,
  };
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AdminMagicManager() {
  const [styles, setStyles] = useState<AdminMagicStyle[]>([]);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [styleId, setStyleId] = useState("");
  const [categoryId, setCategoryId] = useState("general");
  const [categoryTitle, setCategoryTitle] = useState("General");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [levelsText, setLevelsText] = useState(formatLevels(EMPTY_LEVELS));
  const [draftText, setDraftText] = useState("");
  const [showAdvancedLevels, setShowAdvancedLevels] = useState(false);
  const [showAllStylesList, setShowAllStylesList] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDebug, setAiDebug] = useState<AiDebugInfo | null>(null);
  const [aiTone, setAiTone] = useState("");
  const [aiTheme, setAiTheme] = useState("");
  const [aiRestriction, setAiRestriction] = useState("");
  const [aiCombatStyle, setAiCombatStyle] = useState<"yes" | "no" | "optional">(
    "optional"
  );
  const [aiScientificAngle, setAiScientificAngle] = useState("");
  const [balanceMode, setBalanceMode] = useState<MagicBalanceMode>("review");
  const [balanceFocus, setBalanceFocus] = useState("");
  const [balanceText, setBalanceText] = useState("");
  const [balanceDebug, setBalanceDebug] = useState<AiDebugInfo | null>(null);
  const [isBalancingAi, setIsBalancingAi] = useState(false);

  async function loadStyles() {
    const result = await fetchAdminMagicStyles();
    setStyles(result.styles);
    setFeedback(result.message);
  }

  useEffect(() => {
    void loadStyles();
  }, []);

  const filteredStyles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return styles;

    return styles.filter((style) =>
      `${style.title} ${style.categoryTitle}`.toLowerCase().includes(query)
    );
  }, [search, styles]);
  const visibleStyles = useMemo(
    () =>
      showAllStylesList
        ? filteredStyles
        : filteredStyles.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredStyles, showAllStylesList]
  );

  useEffect(() => {
    setShowAllStylesList(false);
  }, [search]);

  function resetForm() {
    setStyleId("");
    setCategoryId("general");
    setCategoryTitle("General");
    setTitle("");
    setDescription("");
    setLevelsText(formatLevels(EMPTY_LEVELS));
    setDraftText("");
    setShowAdvancedLevels(false);
    setFeedback("");
    setAiDebug(null);
    setBalanceText("");
    setBalanceDebug(null);
  }

  function preloadStyle(style: AdminMagicStyle) {
    setStyleId(style.id);
    setCategoryId(style.categoryId);
    setCategoryTitle(style.categoryTitle);
    setTitle(style.title);
    setDescription(style.description);
    setLevelsText(formatLevels(style.levels));
    setDraftText("");
    setShowAdvancedLevels(false);
    setFeedback("");
    setAiDebug(null);
    setBalanceText("");
    setBalanceDebug(null);
  }

  function applyDraftText(raw: string) {
    try {
      const parsed = parseMagicDraft(raw);
      setCategoryId(parsed.categoryId);
      setCategoryTitle(parsed.categoryTitle);
      setTitle(parsed.title);
      setDescription(parsed.description);
      setLevelsText(formatLevels(parsed.levels));
      setFeedback(
        `Formato interpretado: ${parsed.totalAbilities} habilidades cargadas. Revisa y guarda.`
      );
    } catch {
      setFeedback(
        "No pude interpretar la magia. Revisa que tenga titulo, seccion 'Escala de niveles' y bloques 'Habilidades de Lv1-Lv5'."
      );
    }
  }

  function handleParseDraft() {
    applyDraftText(draftText);
  }

  async function handleGenerateWithAi() {
    setIsGeneratingAi(true);
    setFeedback("");
    setAiDebug(null);

    const result = await generateMagicDraftWithAi({
      categoryTitle,
      titleSeed: title,
      tone: aiTone,
      theme: aiTheme,
      restriction: aiRestriction,
      combatStyle: aiCombatStyle,
      scientificAngle: aiScientificAngle,
      includeDebug: true,
    });

    setIsGeneratingAi(false);
    setAiDebug(result.debug ?? null);

    if (result.status !== "ready") {
      setFeedback(result.message);
      return;
    }

    setDraftText(result.draftText);
    applyDraftText(result.draftText);
  }

  async function handleBalanceWithAi() {
    if (!title.trim()) {
      setFeedback("Selecciona o carga una magia antes de analizar balance.");
      return;
    }

    let levels: Record<number, AbilityLevel[]>;

    try {
      levels = parseLevels(levelsText);
    } catch {
      setFeedback("No puedo analizar: el JSON Lv1-Lv5 no es valido.");
      return;
    }

    setIsBalancingAi(true);
    setFeedback("");
    setBalanceText("");
    setBalanceDebug(null);

    const result = await analyzeMagicBalanceWithAi({
      mode: balanceMode,
      focus: balanceFocus,
      categoryTitle,
      title,
      description,
      levels,
      includeDebug: true,
    });

    setIsBalancingAi(false);
    setBalanceDebug(result.debug ?? null);

    if (result.status !== "ready") {
      setFeedback(result.message);
      return;
    }

    setBalanceText(result.analysisText);
    setFeedback(result.message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    try {
      const levels = parseLevels(levelsText);
      const id = styleId || slugifyGrimoireId(`${categoryId}-${title}`, "magia");
      const result = await upsertMagicStyle({
        id,
        categoryId: categoryId.trim() || "general",
        categoryTitle: categoryTitle.trim() || "General",
        title,
        description,
        levels,
      });

      setFeedback(result.message);

      if (result.status === "saved") {
        resetForm();
        await loadStyles();
      }
    } catch {
      setFeedback("El formato JSON de niveles no es valido. Revisa llaves, comas y arrays Lv1-Lv5.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!styleId) {
      setFeedback("Selecciona una magia antes de borrar.");
      return;
    }

    if (!window.confirm(`Seguro que quieres borrar "${title}" del Grimorio?`)) {
      return;
    }

    setIsSaving(true);
    const result = await deleteMagicStyle(styleId);
    setFeedback(result.message);
    if (result.status === "deleted") {
      resetForm();
      await loadStyles();
    }
    setIsSaving(false);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="kd-glass rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <AdminManagerHeader
          icon={<Sparkles className="h-5 w-5" />}
          eyebrow="Editor del grimorio"
          title={styleId ? "Editar magia" : "Crear magia"}
        />

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-[1.4rem] border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-bold text-stone-100">Asistente IA</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-stone-400">
              Genera una magia completa en el formato exacto del grimorio actual y la interpreta sola.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminTextField
                label="Tono"
                value={aiTone}
                onChange={setAiTone}
                placeholder="arcano, ritual, belico, prohibido..."
              />
              <AdminTextField
                label="Tema central"
                value={aiTheme}
                onChange={setAiTheme}
                placeholder="proteccion, sangre, resonancia, invocacion..."
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminTextField
                label="Restriccion"
                value={aiRestriction}
                onChange={setAiRestriction}
                placeholder="Debe ser defensiva y util en escenas narrativas."
              />
              <AdminTextField
                label="Enfoque tecnico"
                value={aiScientificAngle}
                onChange={setAiScientificAngle}
                placeholder="metamateriales, biologia, resonancia, runas..."
              />
            </div>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold text-stone-200">Combate</span>
              <select
                value={aiCombatStyle}
                onChange={(event) =>
                  setAiCombatStyle(event.target.value as "yes" | "no" | "optional")
                }
                className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-cyan-400/40 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
              >
                <option value="optional">Mixta</option>
                <option value="yes">Orientada a combate</option>
                <option value="no">Mayormente narrativa</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void handleGenerateWithAi()}
              disabled={isGeneratingAi}
              className="kd-touch mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-extrabold text-cyan-100 transition hover:bg-cyan-500/15 disabled:opacity-60"
            >
              {isGeneratingAi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generar magia con IA
            </button>
            <div className="mt-4">
              <AdminAiDebugCard debug={aiDebug} />
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-300" />
              <p className="text-sm font-bold text-stone-100">Balanceador</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[0.42fr_1fr]">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-stone-200">Modo</span>
                <select
                  value={balanceMode}
                  onChange={(event) => setBalanceMode(event.target.value as MagicBalanceMode)}
                  className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-emerald-400/40 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
                >
                  <option value="review">Revisar</option>
                  <option value="buff">Buff</option>
                  <option value="nerf">Nerf</option>
                  <option value="improve">Mejorar</option>
                </select>
              </label>
              <AdminTextField
                label="Enfoque"
                value={balanceFocus}
                onChange={setBalanceFocus}
                placeholder="Ej: revisar abuso en Lv4 o volverla mas narrativa."
              />
            </div>
            <button
              type="button"
              onClick={() => void handleBalanceWithAi()}
              disabled={isBalancingAi}
              className="kd-touch mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-extrabold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
            >
              {isBalancingAi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scale className="h-4 w-4" />
              )}
              Analizar balance
            </button>
            {balanceText ? (
              <div className="mt-4 rounded-[1.2rem] border border-emerald-500/20 bg-stone-950/55 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                  Sugerencia IA
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-200">
                  {balanceText}
                </p>
              </div>
            ) : null}
            <div className="mt-4">
              <AdminAiDebugCard debug={balanceDebug} />
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-amber-500/20 bg-amber-500/5 p-4">
            <AdminTextArea
              label="Pegar magia completa"
              value={draftText}
              onChange={setDraftText}
              placeholder="Pega aqui el texto completo: catalogo, titulo, descripcion y habilidades Lv1-Lv5..."
              rows={10}
            />
            <p className="mt-2 text-xs leading-5 text-amber-100/70">
              Ideal para staff: pega el formato narrativo y Jarvis lo convierte a los campos del Grimorio.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleParseDraft}
                className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400"
              >
                <Sparkles className="h-4 w-4" />
                Interpretar formato
              </button>
              <button
                type="button"
                onClick={() => setDraftText("")}
                className="kd-touch rounded-2xl border border-stone-700 px-4 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500"
              >
                Limpiar texto pegado
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField
              label="Categoria ID"
              value={categoryId}
              onChange={setCategoryId}
              placeholder="invocacion"
            />
            <AdminTextField
              label="Categoria visible"
              value={categoryTitle}
              onChange={setCategoryTitle}
              placeholder="Invocacion"
            />
          </div>
          <AdminTextField
            label="Nombre del estilo"
            value={title}
            onChange={setTitle}
            placeholder="Bestias Divinas"
          />
          <AdminTextArea
            label="Fundamento / descripcion"
            value={description}
            onChange={setDescription}
            placeholder="Texto tecnico, cientifico o narrativo del estilo..."
            rows={6}
          />
          <div className="rounded-[1.4rem] border border-stone-800 bg-stone-950/35 p-4">
            <button
              type="button"
              onClick={() => setShowAdvancedLevels((current) => !current)}
              className="kd-touch flex w-full items-center justify-between gap-3 text-left"
            >
              <span>
                <span className="block text-sm font-bold text-stone-100">
                  Niveles generados
                </span>
                <span className="mt-1 block text-xs leading-5 text-stone-500">
                  Uso avanzado. Normalmente no hace falta tocar esto si ya pegaste el formato narrativo.
                </span>
              </span>
              <span className="rounded-full border border-stone-700 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                {showAdvancedLevels ? "Ocultar" : "Ver JSON"}
              </span>
            </button>
            {showAdvancedLevels ? (
              <div className="mt-4">
                <AdminTextArea
                  label="JSON Lv1-Lv5"
                  value={levelsText}
                  onChange={setLevelsText}
                  placeholder="Formato interno del grimorio"
                  rows={12}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              disabled={isSaving}
              className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              {styleId ? "Actualizar magia" : "Guardar magia"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="kd-touch rounded-2xl border border-stone-700 px-5 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500"
            >
              Limpiar
            </button>
            {styleId ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSaving}
                className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Borrar
              </button>
            ) : null}
          </div>

          {feedback ? (
            <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
              {feedback}
            </p>
          ) : null}
        </form>
      </section>

      <section className="kd-glass rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <AdminManagerHeader
          icon={<BookOpen className="h-5 w-5" />}
          eyebrow="Estilos actuales"
          title="Magias del Grimorio"
        />
        <div className="mt-4">
          <AdminTextField
            label="Buscar magia"
            value={search}
            onChange={setSearch}
            placeholder="Filtra por estilo o categoria"
          />
        </div>
        <div className="mt-4 space-y-3">
          {visibleStyles.map((style) => (
            <button
              key={`${style.categoryId}-${style.id}`}
              type="button"
              onClick={() => preloadStyle(style)}
              className="kd-touch kd-hover-lift flex w-full items-center justify-between gap-3 rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
            >
              <div>
                <p className="text-sm font-bold text-stone-100">{style.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                  {style.categoryTitle}
                </p>
              </div>
              <span className="rounded-full border border-stone-700 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                editar
              </span>
            </button>
          ))}
          <ExpandableListToggle
            shownCount={visibleStyles.length}
            totalCount={filteredStyles.length}
            expanded={showAllStylesList}
            onToggle={() => setShowAllStylesList((current) => !current)}
            itemLabel="magias"
          />
        </div>
      </section>
    </div>
  );
}

export function AdminBestiaryManager() {
  const [entries, setEntries] = useState<BestiaryEntry[]>([]);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [generalData, setGeneralData] = useState("");
  const [threatLevel, setThreatLevel] = useState("");
  const [domestication, setDomestication] = useState("");
  const [usage, setUsage] = useState("");
  const [originPlace, setOriginPlace] = useState("");
  const [foundAt, setFoundAt] = useState("");
  const [description, setDescription] = useState("");
  const [ability, setAbility] = useState("");
  const [rarity, setRarity] = useState<BestiaryRarity>("common");
  const [imageUrl, setImageUrl] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDebug, setAiDebug] = useState<AiDebugInfo | null>(null);
  const [aiTone, setAiTone] = useState("");
  const [showAllEntriesList, setShowAllEntriesList] = useState(false);

  async function loadEntries() {
    const result = await fetchBestiaryEntries();
    setEntries(result.entries);
    setFeedback(result.message);
  }

  useEffect(() => {
    void loadEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;

    return entries.filter((entry) =>
      `${entry.name} ${entry.category} ${entry.type} ${entry.threatLevel} ${entry.originPlace} ${entry.foundAt} ${entry.rarity}`
        .toLowerCase()
        .includes(query)
    );
  }, [entries, search]);
  const visibleEntries = useMemo(
    () =>
      showAllEntriesList
        ? filteredEntries
        : filteredEntries.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredEntries, showAllEntriesList]
  );

  useEffect(() => {
    setShowAllEntriesList(false);
  }, [search]);

  function resetForm() {
    setId("");
    setName("");
    setCategory("");
    setType("");
    setGeneralData("");
    setThreatLevel("");
    setDomestication("");
    setUsage("");
    setOriginPlace("");
    setFoundAt("");
    setDescription("");
    setAbility("");
    setRarity("common");
    setImageUrl("");
    setFeedback("");
    setAiDebug(null);
  }

  function preloadEntry(entry: BestiaryEntry) {
    setId(entry.id);
    setName(entry.name);
    setCategory(entry.category);
    setType(entry.type);
    setGeneralData(entry.generalData);
    setThreatLevel(entry.threatLevel);
    setDomestication(entry.domestication);
    setUsage(entry.usage);
    setOriginPlace(entry.originPlace);
    setFoundAt(entry.foundAt);
    setDescription(entry.description);
    setAbility(entry.ability);
    setRarity(entry.rarity);
    setImageUrl(entry.imageUrl);
    setFeedback("");
    setAiDebug(null);
  }

  async function handleImageUpload(file?: File) {
    if (!file) return;
    try {
      setImageUrl(await readImageAsDataUrl(file));
    } catch {
      setFeedback("No se pudo cargar la imagen seleccionada.");
    }
  }

  async function handleGenerateWithAi() {
    setIsGeneratingAi(true);
    setFeedback("");
    setAiDebug(null);

    const result = await generateBestiaryWithAi({
      name,
      category,
      type,
      threatLevel,
      domestication,
      usage,
      originPlace,
      foundAt,
      rarity,
      tone: aiTone,
      includeDebug: true,
    });

    setIsGeneratingAi(false);
    setAiDebug(result.debug ?? null);

    if (result.status !== "ready" || !result.entry) {
      setFeedback(result.message);
      return;
    }

    setName(result.entry.name);
    setCategory(result.entry.category);
    setType(result.entry.type);
    setGeneralData(result.entry.generalData);
    setThreatLevel(result.entry.threatLevel);
    setDomestication(result.entry.domestication);
    setUsage(result.entry.usage);
    setOriginPlace(result.entry.originPlace);
    setFoundAt(result.entry.foundAt);
    setDescription(result.entry.description);
    setAbility(result.entry.ability);
    setRarity(result.entry.rarity);
    setImageUrl(result.entry.imageUrl);
    setFeedback(result.message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    const result = await upsertBestiaryEntry({
      id: id || slugifyGrimoireId(name, "bestia"),
      name,
      category,
      type,
      generalData,
      threatLevel,
      domestication,
      usage,
      originPlace,
      foundAt,
      description,
      ability,
      rarity,
      imageUrl,
    });

    setFeedback(result.message);
    if (result.status === "saved") {
      resetForm();
      await loadEntries();
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    if (!id) {
      setFeedback("Selecciona una bestia antes de borrar.");
      return;
    }

    if (!window.confirm(`Seguro que quieres borrar "${name}" del Bestiario?`)) {
      return;
    }

    setIsSaving(true);
    const result = await deleteBestiaryEntry(id);
    setFeedback(result.message);
    if (result.status === "deleted") {
      resetForm();
      await loadEntries();
    }
    setIsSaving(false);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="kd-glass rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <AdminManagerHeader
          icon={<PawPrint className="h-5 w-5" />}
          eyebrow="Editor del bestiario"
          title={id ? "Editar bestia" : "Crear bestia"}
        />

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-[1.4rem] border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-bold text-stone-100">Asistente IA</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-stone-400">
              Completa la bestia con una ficha rica, ordenada y lista para el bestiario del reino.
            </p>
            <AdminTextField
              label="Tono"
              value={aiTone}
              onChange={setAiTone}
              placeholder="sombrio, volcanico, sagrado, depredador..."
            />
            <button
              type="button"
              onClick={() => void handleGenerateWithAi()}
              disabled={isGeneratingAi}
              className="kd-touch mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-extrabold text-cyan-100 transition hover:bg-cyan-500/15 disabled:opacity-60"
            >
              {isGeneratingAi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generar bestia con IA
            </button>
            <div className="mt-4">
              <AdminAiDebugCard debug={aiDebug} />
            </div>
          </div>

          <AdminTextField label="Nombre de la bestia" value={name} onChange={setName} placeholder="Lobo de Ceniza" />
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Categoria" value={category} onChange={setCategory} placeholder="Bestia elemental" />
            <AdminTextField label="Tipo" value={type} onChange={setType} placeholder="Reptil colosal" />
          </div>
          <AdminTextField
            label="Nivel de amenaza"
            value={threatLevel}
            onChange={setThreatLevel}
            placeholder="S+, Extrema, Alto..."
          />
          <AdminTextArea
            label="Datos generales"
            value={generalData}
            onChange={setGeneralData}
            placeholder="Tamano, peso, habitat, alimentacion, comportamiento..."
            rows={5}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextArea
              label="Domesticacion"
              value={domestication}
              onChange={setDomestication}
              placeholder="Domesticable o condiciones para controlarla..."
              rows={4}
            />
            <AdminTextArea
              label="Uso"
              value={usage}
              onChange={setUsage}
              placeholder="Uso en el mundo, combate, forja, recursos, etc."
              rows={4}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Lugar de origen" value={originPlace} onChange={setOriginPlace} placeholder="Bosques de Vyralis" />
            <AdminTextField label="Donde se encuentra" value={foundAt} onChange={setFoundAt} placeholder="Ruinas, pantanos, frontera..." />
          </div>
          <AdminTextArea label="Descripcion" value={description} onChange={setDescription} placeholder="Descripcion narrativa y comportamiento..." rows={5} />
          <AdminTextArea label="Habilidad" value={ability} onChange={setAbility} placeholder="Ataque, aura, veneno, grito, maldicion..." rows={4} />

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-200">Rareza</span>
            <select
              value={rarity}
              onChange={(event) => setRarity(event.target.value as BestiaryRarity)}
              className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]"
            >
              {BESTIARY_RARITIES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <AdminTextField label="URL o imagen cargada" value={imageUrl} onChange={setImageUrl} placeholder="https://... o data URL" />
          <label className="kd-touch flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-700 bg-stone-950/45 px-4 py-4 text-sm font-bold text-stone-300 transition hover:border-amber-500/30 hover:text-amber-300">
            <ImagePlus className="h-4 w-4" />
            Cargar imagen desde galeria
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleImageUpload(event.target.files?.[0])}
            />
          </label>

          {imageUrl ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-stone-800 bg-stone-950/45">
              <img src={imageUrl} alt={name || "Preview de bestia"} loading="lazy" decoding="async" className="h-48 w-full object-cover" />
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              disabled={isSaving}
              className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PawPrint className="h-4 w-4" />}
              {id ? "Actualizar bestia" : "Guardar bestia"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="kd-touch rounded-2xl border border-stone-700 px-5 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500"
            >
              Limpiar
            </button>
            {id ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSaving}
                className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Borrar
              </button>
            ) : null}
          </div>

          {feedback ? (
            <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
              {feedback}
            </p>
          ) : null}
        </form>
      </section>

      <section className="kd-glass rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <AdminManagerHeader
          icon={<PawPrint className="h-5 w-5" />}
          eyebrow="Catalogo de criaturas"
          title="Bestiario"
        />
        <div className="mt-4">
          <AdminTextField label="Buscar bestia" value={search} onChange={setSearch} placeholder="Nombre, origen o rareza" />
        </div>
        <div className="mt-4 space-y-3">
          {filteredEntries.length > 0 ? (
            visibleEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => preloadEntry(entry)}
                className="kd-touch kd-hover-lift flex w-full items-center gap-3 rounded-[1.2rem] border border-stone-800 bg-stone-950/50 p-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
                  {entry.imageUrl ? (
                    <img src={entry.imageUrl} alt={entry.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-stone-100">{entry.name}</p>
                  <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-stone-500">
                    {entry.category || "Sin categoria"} / {entry.rarity}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
              No hay bestias cargadas todavia.
            </div>
          )}
          <ExpandableListToggle
            shownCount={visibleEntries.length}
            totalCount={filteredEntries.length}
            expanded={showAllEntriesList}
            onToggle={() => setShowAllEntriesList((current) => !current)}
            itemLabel="bestias"
          />
        </div>
      </section>
    </div>
  );
}

export function AdminFloraManager() {
  const [entries, setEntries] = useState<FloraEntry[]>([]);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAllEntriesList, setShowAllEntriesList] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [generalData, setGeneralData] = useState("");
  const [properties, setProperties] = useState("");
  const [usage, setUsage] = useState("");
  const [originPlace, setOriginPlace] = useState("");
  const [foundAt, setFoundAt] = useState("");
  const [description, setDescription] = useState("");
  const [rarity, setRarity] = useState<BestiaryRarity>("common");
  const [imageUrl, setImageUrl] = useState("");

  async function loadEntries() {
    const result = await fetchFloraEntries();
    setEntries(result.entries);
    setFeedback(result.message);
  }

  useEffect(() => {
    void loadEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;

    return entries.filter((entry) =>
      `${entry.name} ${entry.category} ${entry.type} ${entry.generalData} ${entry.properties} ${entry.usage} ${entry.originPlace} ${entry.foundAt} ${entry.description} ${entry.rarity}`
        .toLowerCase()
        .includes(query)
    );
  }, [entries, search]);

  const visibleEntries = useMemo(
    () =>
      showAllEntriesList
        ? filteredEntries
        : filteredEntries.slice(0, ADMIN_LIST_PREVIEW_COUNT),
    [filteredEntries, showAllEntriesList]
  );

  useEffect(() => {
    setShowAllEntriesList(false);
  }, [search]);

  function resetForm() {
    setId("");
    setName("");
    setCategory("");
    setType("");
    setGeneralData("");
    setProperties("");
    setUsage("");
    setOriginPlace("");
    setFoundAt("");
    setDescription("");
    setRarity("common");
    setImageUrl("");
    setFeedback("");
  }

  function preloadEntry(entry: FloraEntry) {
    setId(entry.id);
    setName(entry.name);
    setCategory(entry.category);
    setType(entry.type);
    setGeneralData(entry.generalData);
    setProperties(entry.properties);
    setUsage(entry.usage);
    setOriginPlace(entry.originPlace);
    setFoundAt(entry.foundAt);
    setDescription(entry.description);
    setRarity(entry.rarity);
    setImageUrl(entry.imageUrl);
    setFeedback("");
  }

  async function handleImageUpload(file?: File) {
    if (!file) return;
    try {
      setImageUrl(await readImageAsDataUrl(file));
    } catch {
      setFeedback("No se pudo cargar la imagen seleccionada.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    const result = await upsertFloraEntry({
      id: id || slugifyGrimoireId(name, "flora"),
      name,
      category,
      type,
      generalData,
      properties,
      usage,
      originPlace,
      foundAt,
      description,
      rarity,
      imageUrl,
    });

    setFeedback(result.message);
    if (result.status === "saved") {
      resetForm();
      await loadEntries();
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    if (!id) {
      setFeedback("Selecciona una entrada de flora antes de borrar.");
      return;
    }

    if (!window.confirm(`Seguro que quieres borrar "${name}" de Flora?`)) {
      return;
    }

    setIsSaving(true);
    const result = await deleteFloraEntry(id);
    setFeedback(result.message);
    if (result.status === "deleted") {
      resetForm();
      await loadEntries();
    }
    setIsSaving(false);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="kd-glass rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <AdminManagerHeader
          icon={<Flower2 className="h-5 w-5" />}
          eyebrow="Editor de flora"
          title={id ? "Editar flora" : "Crear flora"}
        />

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <AdminTextField label="Nombre" value={name} onChange={setName} placeholder="Flor de ceniza" />
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Categoria" value={category} onChange={setCategory} placeholder="Hierba medicinal" />
            <AdminTextField label="Tipo" value={type} onChange={setType} placeholder="Flora mistica, hongo, arbol..." />
          </div>
          <AdminTextArea
            label="Datos generales"
            value={generalData}
            onChange={setGeneralData}
            placeholder="Tamano, ciclo, habitat, recoleccion, estacionalidad..."
            rows={5}
          />
          <AdminTextArea
            label="Propiedades"
            value={properties}
            onChange={setProperties}
            placeholder="Efectos, toxicidad, aroma, reaccion alquimica..."
            rows={4}
          />
          <AdminTextArea
            label="Uso"
            value={usage}
            onChange={setUsage}
            placeholder="Uso medicinal, culinario, alquimico, ritual o industrial..."
            rows={4}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Lugar de origen" value={originPlace} onChange={setOriginPlace} placeholder="Valles de Vyralis" />
            <AdminTextField label="Donde se encuentra" value={foundAt} onChange={setFoundAt} placeholder="Pantanos, ruinas, cavernas..." />
          </div>
          <AdminTextArea
            label="Descripcion"
            value={description}
            onChange={setDescription}
            placeholder="Descripcion visual, natural y narrativa..."
            rows={5}
          />

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-200">Rareza</span>
            <select
              value={rarity}
              onChange={(event) => setRarity(event.target.value as BestiaryRarity)}
              className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/40 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]"
            >
              {BESTIARY_RARITIES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <AdminTextField label="URL o imagen cargada" value={imageUrl} onChange={setImageUrl} placeholder="https://... o data URL" />
          <label className="kd-touch flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-700 bg-stone-950/45 px-4 py-4 text-sm font-bold text-stone-300 transition hover:border-amber-500/30 hover:text-amber-300">
            <ImagePlus className="h-4 w-4" />
            Cargar imagen desde galeria
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleImageUpload(event.target.files?.[0])}
            />
          </label>

          {imageUrl ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-stone-800 bg-stone-950/45">
              <img src={imageUrl} alt={name || "Preview de flora"} loading="lazy" decoding="async" className="h-48 w-full object-cover" />
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              disabled={isSaving}
              className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flower2 className="h-4 w-4" />}
              {id ? "Actualizar flora" : "Guardar flora"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="kd-touch rounded-2xl border border-stone-700 px-5 py-3 text-sm font-bold text-stone-300 transition hover:border-stone-500"
            >
              Limpiar
            </button>
            {id ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSaving}
                className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Borrar
              </button>
            ) : null}
          </div>

          {feedback ? (
            <p className="rounded-[1.2rem] border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm leading-6 text-stone-300">
              {feedback}
            </p>
          ) : null}
        </form>
      </section>

      <section className="kd-glass rounded-[1.8rem] border border-stone-800 bg-stone-900/70 p-5">
        <AdminManagerHeader
          icon={<Flower2 className="h-5 w-5" />}
          eyebrow="Catalogo de naturaleza"
          title="Flora"
        />
        <div className="mt-4">
          <AdminTextField label="Buscar flora" value={search} onChange={setSearch} placeholder="Nombre, origen o rareza" />
        </div>
        <div className="mt-4 space-y-3">
          {filteredEntries.length > 0 ? (
            visibleEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => preloadEntry(entry)}
                className="kd-touch kd-hover-lift flex w-full items-center gap-3 rounded-[1.2rem] border border-stone-800 bg-stone-950/50 p-3 text-left transition hover:border-amber-500/20 hover:bg-stone-900"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
                  {entry.imageUrl ? (
                    <img src={entry.imageUrl} alt={entry.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-stone-100">{entry.name}</p>
                  <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-stone-500">
                    {entry.category || "Sin categoria"} / {entry.rarity}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-stone-700 bg-stone-950/40 px-4 py-4 text-sm leading-6 text-stone-400">
              No hay flora cargada todavia.
            </div>
          )}
          <ExpandableListToggle
            shownCount={visibleEntries.length}
            totalCount={filteredEntries.length}
            expanded={showAllEntriesList}
            onToggle={() => setShowAllEntriesList((current) => !current)}
            itemLabel="entradas"
          />
        </div>
      </section>
    </div>
  );
}

function AdminManagerHeader({
  icon,
  eyebrow,
  title,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{eyebrow}</p>
        <h4 className="mt-1 text-xl font-black text-stone-100">{title}</h4>
      </div>
    </div>
  );
}

function AdminTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]"
      />
    </label>
  );
}

function AdminTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-200">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]"
      />
    </label>
  );
}
