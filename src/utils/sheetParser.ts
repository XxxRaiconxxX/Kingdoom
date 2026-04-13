import { CharacterSheet } from "../types";

export function parseWhatsAppSheet(rawText: string): Partial<CharacterSheet> {
  // Clean up decorative lines
  const lines = rawText.split('\n').map(l => l.trim());
  const cleanLines = lines.filter(l => {
    if (/^[*\s╭═°•><☾╰⊷⊶⊰❂⊱]+$/.test(l)) return false;
    if (l.includes('𝔗𝔥𝔢 ƙ𝔦𝔫𝔤𝔇𝔬𝔬𝔪t')) return false;
    if (l.includes('Tienes 12 puntos para distribuir')) return false;
    if (l.includes('Pv Base 100')) return false;
    if (l.includes('(Noble, plebeyo o burgues)')) return false;
    if (l.includes('(En caso de ser)')) return false;
    return true;
  });

  const text = cleanLines.join('\n');

  // Define keywords and their regex variations
  const fields = [
    { key: 'name', regex: /\*?-?Nombre Completo\/?\s*Apodo:?\*?/i },
    { key: 'age', regex: /\*?-?Edad:?\*?/i },
    { key: 'gender', regex: /\*?-?G[eé]nero:?\*?/i },
    { key: 'height', regex: /\*?-?Estatura:?\*?/i },
    { key: 'race', regex: /\*?-?Raza:?\*?/i },
    { key: 'powers', regex: /\*?-?Poderes Oficiales:?\*?/i },
    { key: 'weapon', regex: /\*?-?Arma principal:?\*?/i },
    { key: 'combatStyle', regex: /\*?-?Estilo de combate:?\*?/i },
    { key: 'birthRealm', regex: /\*?-?Reino donde naci[oó]:?\*?/i },
    { key: 'socialClass', regex: /\*?-?Clase social:?\*?/i },
    { key: 'nobleTitle', regex: /\*?-?T[ií]tulo de Nobleza:?\*?/i },
    { key: 'profession', regex: /\*?-?Profesi[oó]n:?\*?/i },
    { key: 'nonMagicSkills', regex: /\*?-?Habilidades no m[aá]gicas:?\*?/i },
    { key: 'personality', regex: /\*?-?Personalidad:?\*?/i },
    { key: 'history', regex: /\*?-?Historia:?\*?/i },
    { key: 'extras', regex: /\*?-?Extras:?\*?/i },
    { key: 'weaknesses', regex: /\*?-?Debilidades:?\*?/i },
    { key: 'inventory', regex: /\*?-?Inventario:?\*?/i },
    { key: 'stats_section', regex: /\*?-?Estad[ií]sticas:?\*?/i }
  ];

  // Find all matches
  const matches: { key: string, index: number, length: number }[] = [];
  fields.forEach(f => {
    const match = text.match(f.regex);
    if (match && match.index !== undefined) {
      matches.push({ key: f.key, index: match.index, length: match[0].length });
    }
  });

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  const result: Partial<CharacterSheet> = {};

  const cleanValue = (val: string) => {
    // Remove leading/trailing asterisks, dashes, colons, and whitespace
    return val.replace(/^[\*\-\:\s]+|[\*\-\:\s]+$/g, '').trim();
  };

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const start = current.index + current.length;
    const end = next ? next.index : text.length;
    let value = text.substring(start, end).trim();
    
    value = cleanValue(value);
    
    if (current.key !== 'stats_section') {
      (result as any)[current.key] = value;
    }
  }

  // Handle case where name doesn't have a label and is at the very beginning
  if (matches.length > 0 && matches[0].index > 0) {
    if (!matches.find(m => m.key === 'name')) {
       let potentialName = text.substring(0, matches[0].index).trim();
       potentialName = cleanValue(potentialName);
       if (potentialName) result.name = potentialName;
    }
  }

  // Extract stats specifically
  const extractNumber = (regex: RegExp) => {
    const match = text.match(regex);
    return match ? parseInt(match[1].replace(/\D/g, ''), 10) || 0 : 0;
  };

  result.stats = {
    strength: extractNumber(/Fuerza:\*?\s*(\d+)/i),
    agility: extractNumber(/agilidad:\*?\s*(\d+)/i),
    intelligence: extractNumber(/inteligencia:\*?\s*(\d+)/i),
    defense: extractNumber(/defensa:\*?\s*(\d+)/i),
    magicDefense: extractNumber(/defensa m[aá]gica:\*?\s*(\d+)/i),
  };

  return result;
}
