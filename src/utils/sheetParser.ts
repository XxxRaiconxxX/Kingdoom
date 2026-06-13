import type { CharacterSheet } from "../types";

/**
 * Parse the WhatsApp "ficha" template into structured fields.
 *
 * The WhatsApp format is decorative and inconsistent:
 * - lots of borders/separators
 * - labels may include "-", "*" and can be inline (e.g. "Edad: 200")
 * - long sections (Historia, Personalidad, etc.) can be multi-line
 *
 * We parse it in a best-effort way and return a partial sheet. The caller
 * should apply defaults before saving.
 */
export function parseWhatsAppSheet(rawText: string): Partial<CharacterSheet> {
  const normalizeKey = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents for matching
      .replace(/[\*\_`]/g, "")
      // remove decoration/punctuation (keeps "/" for "Nombre Completo/ Apodo")
      .replace(/[^a-z0-9\/\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const stripWrappers = (value: string) =>
    value.replace(/^[\*\-\:\s]+|[\*\-\:\s]+$/g, "").trim();

  const sanitizeValue = (value: string) => {
    const cleaned = stripWrappers(value).replace(/\*/g, "").trim();
    // Treat placeholder dashes as empty.
    if (/^[\-\–\—\_]+$/.test(cleaned)) return "";
    return cleaned;
  };

  const isDecorativeLine = (line: string) => {
    if (!/[a-z0-9]/i.test(line)) return true;
    const normalized = normalizeKey(line);
    if (normalized.includes("the kingdoom")) return true;
    if (normalized.includes("tienes 12 puntos para distribuir")) return true;
    if (normalized.includes("pv base")) return true;
    // Template helper lines sometimes come wrapped in parentheses/asterisks.
    if (normalized.includes("noble plebeyo o burgues")) return true;
    if (normalized.includes("en caso de ser")) return true;
    return false;
  };

  const lines = rawText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isDecorativeLine(line));

  type FieldKey =
    | "name"
    | "age"
    | "gender"
    | "height"
    | "race"
    | "powers"
    | "weapon"
    | "combatStyle"
    | "birthRealm"
    | "socialClass"
    | "nobleTitle"
    | "profession"
    | "nonMagicSkills"
    | "personality"
    | "history"
    | "extras"
    | "weaknesses"
    | "inventory";

  const PREFIXES: Array<[string, FieldKey]> = [
    ["nombre completo/apodo", "name"],
    ["nombre completo/ apodo", "name"],
    ["nombre completo", "name"],
    ["edad", "age"],
    ["genero", "gender"],
    ["estatura", "height"],
    ["raza", "race"],
    ["poderes oficiales", "powers"],
    ["arma principal", "weapon"],
    ["estilo de combate", "combatStyle"],
    ["reino donde nacio", "birthRealm"],
    ["reino donde naci", "birthRealm"],
    ["clase social", "socialClass"],
    ["titulo de nobleza", "nobleTitle"],
    ["profesion", "profession"],
    ["habilidades no magicas", "nonMagicSkills"],
    ["personalidad", "personality"],
    ["historia", "history"],
    ["extras", "extras"],
    ["debilidades", "weaknesses"],
    ["inventario", "inventory"],
  ];

  const result: Partial<CharacterSheet> = {};

  let currentKey: FieldKey | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentKey) return;
    const value = stripWrappers(buffer.join("\n").trim());
    (result as any)[currentKey] = value;
    buffer = [];
  };

  for (const rawLine of lines) {
    const line = sanitizeValue(rawLine.replace(/^[\u2022\-\u2219]+\s*/g, "").trim());
    const normalizedLine = normalizeKey(line);

    // Skip "Estadisticas" heading lines; individual stats are parsed separately.
    if (normalizedLine.startsWith("estadisticas")) {
      continue;
    }

    let matchedKey: FieldKey | null = null;
    if (normalizedLine === "nombre") {
      matchedKey = "name";
    } else {
      for (let i = 0; i < PREFIXES.length; i++) {
        if (normalizedLine.startsWith(PREFIXES[i][0])) {
          matchedKey = PREFIXES[i][1];
          break;
        }
      }
    }

    if (matchedKey) {
      flush();
      currentKey = matchedKey;

      // Inline value after ":" (e.g. "Edad: 200")
      const colonIndex = line.indexOf(":");
      if (colonIndex !== -1) {
        const inline = sanitizeValue(line.slice(colonIndex + 1));
        if (inline) buffer.push(inline);
      }

      continue;
    }

    if (currentKey) {
      const next = sanitizeValue(line);
      if (next) buffer.push(next);
    }
  }

  flush();

  const rawLines = rawText.replace(/\r\n/g, "\n").split("\n");
  const extractStatFromLines = (label: string) => {
    const normalizedLabel = normalizeKey(label);
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();
      if (!trimmed) continue;
      const normalized = normalizeKey(trimmed);
      if (!normalized.startsWith(normalizedLabel)) continue;

      const colonIndex = trimmed.indexOf(":");
      const after = colonIndex === -1 ? trimmed : trimmed.slice(colonIndex + 1);
      const match = after.match(/(\d+)/);
      if (!match) return 0;
      const parsed = Number(match[1]);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  result.stats = {
    strength: extractStatFromLines("Fuerza"),
    agility: extractStatFromLines("Agilidad"),
    intelligence: extractStatFromLines("Inteligencia"),
    defense: extractStatFromLines("Defensa"),
    magicDefense: extractStatFromLines("Defensa magica"),
  };

  return result;
}
