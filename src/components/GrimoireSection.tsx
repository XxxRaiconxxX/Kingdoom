import { useEffect, useMemo, useState } from "react";
import { 
  Zap, 
  ChevronDown, 
  Info, 
  Timer, 
  AlertTriangle, 
  ShieldAlert,
  Search,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GRIMOIRE_DATA } from "../data/grimorio";
import { SectionHeader } from "./SectionHeader";
import type { MagicStyle, AbilityLevel } from "../types";

export function GrimoireSection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(GRIMOIRE_DATA[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCategory = GRIMOIRE_DATA.find(c => c.id === selectedCategoryId);

  return (
    <section className="space-y-6">
      <div className="rounded-[2.5rem] border border-stone-800 bg-stone-900/80 p-6 md:p-8 shadow-2xl shadow-black/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <SectionHeader
            eyebrow="Conocimiento Prohibido"
            title="Grimorio de Poderes"
            description="Explora las escuelas de magia del reino, sus fundamentos fisicos y sus limites eticos. Todo poder tiene un precio y una restriccion."
          />
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 group-focus-within:text-amber-400 transition" />
            <input 
              type="text"
              placeholder="Buscar habilidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 rounded-2xl border border-stone-800 bg-stone-950/50 py-3 pl-11 pr-4 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {GRIMOIRE_DATA.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                selectedCategoryId === category.id
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 scale-105"
                  : "bg-stone-800/50 text-stone-400 hover:bg-stone-800 hover:text-stone-100 border border-stone-700/50"
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {selectedCategory?.styles.map((style) => (
          <MagicStylePanel 
            key={style.id} 
            style={style} 
            searchQuery={searchQuery}
          />
        ))}
        
        {selectedCategory?.styles.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-stone-800 bg-stone-900/20 p-12 text-center">
            <BookOpen className="h-10 w-10 text-stone-700 mx-auto mb-4" />
            <p className="text-stone-500 text-sm italic">
              Esta seccion del grimorio aun no ha sido transcrita por los eruditos del reino...
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function normalizeLoreText(raw: string) {
  return raw.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function renderInlineBold(text: string) {
  // Minimal markdown-like support: **bold**
  const nodes: Array<string | JSX.Element> = [];
  let remaining = text;
  let boldIndex = 0;

  for (;;) {
    const match = remaining.match(/\*\*(.+?)\*\*/);
    if (!match) {
      if (remaining) nodes.push(remaining);
      break;
    }

    const full = match[0];
    const boldText = match[1];
    const start = remaining.indexOf(full);

    if (start > 0) nodes.push(remaining.slice(0, start));
    nodes.push(
      <strong key={`b-${boldIndex++}`} className="font-semibold text-stone-50">
        {boldText}
      </strong>
    );

    remaining = remaining.slice(start + full.length);
  }

  return nodes;
}

function LoreText({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const normalized = normalizeLoreText(text);
    if (!normalized) return [];
    return normalized.split(/\n{2,}/g);
  }, [text]);

  return (
    <div className="space-y-4 font-serif text-[14px] sm:text-[15px] leading-7 text-stone-200/85">
      {blocks.map((rawBlock, idx) => {
        const block = rawBlock.trim();
        if (!block) return null;

        if (/^-{3,}$/.test(block)) {
          return (
            <div
              key={`hr-${idx}`}
              className="h-px w-full bg-gradient-to-r from-transparent via-stone-700/70 to-transparent"
            />
          );
        }

        const headingMatch = block.match(/^(#{1,6})\s*(.+)$/);
        if (headingMatch) {
          const content = headingMatch[2]
            .trim()
            .replace(/^-+/, "")
            .replace(/-+$/, "")
            .trim();

          return (
            <div key={`h-${idx}`} className="pt-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-stone-800/70" />
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-400">
                  {content}
                </div>
                <div className="h-px flex-1 bg-stone-800/70" />
              </div>
            </div>
          );
        }

        return (
          <p key={`p-${idx}`} className="text-pretty">
            {renderInlineBold(block)}
          </p>
        );
      })}
    </div>
  );
}

function MagicStylePanel({ style, searchQuery }: { style: MagicStyle, searchQuery: string }) {
  // Collapsed by default on first load (better scanning on mobile).
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const hasMatch = useMemo(() => {
    if (!normalizedQuery) return false;
    if (style.title.toLowerCase().includes(normalizedQuery)) return true;

    for (const abilities of Object.values(style.levels)) {
      for (const ability of abilities || []) {
        if (
          ability.name.toLowerCase().includes(normalizedQuery) ||
          ability.effect.toLowerCase().includes(normalizedQuery)
        ) {
          return true;
        }
      }
    }

    return false;
  }, [normalizedQuery, style.levels, style.title]);

  useEffect(() => {
    if (!normalizedQuery) return;
    setIsOpen(hasMatch);
  }, [hasMatch, normalizedQuery]);

  return (
    <div className="rounded-[2.5rem] border border-stone-800 bg-stone-900/60 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between p-6 md:p-8 text-left hover:bg-stone-800/20 transition"
      >
        <div className="flex items-start gap-5">
          <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-stone-100 uppercase tracking-tight">{style.title}</h3>
            <p className="mt-2 text-sm text-amber-500/60 font-medium font-serif italic">Fundamento Arcano</p>
          </div>
        </div>
        <div className={`mt-2 rounded-xl bg-stone-800 p-2 text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-8 md:px-8 border-t border-stone-800/50">
              <div className="mt-6 p-6 rounded-3xl bg-stone-950/40 border border-stone-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-amber-400/80 uppercase text-[10px] font-bold tracking-[0.2em]">
                  <Info className="h-3 w-3" />
                  Marco Teorico
                </div>
                <LoreText text={style.description} />
              </div>

              <div className="mt-10 space-y-10">
                {[1, 2, 3, 4, 5].map((level) => {
                  const levelAbilities = style.levels[level] || [];
                  const filtered = levelAbilities.filter(a => 
                    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.effect.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (searchQuery && filtered.length === 0) return null;
                  if (!searchQuery && levelAbilities.length === 0) return null;

                  return (
                    <div key={level} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-stone-800"></div>
                        <div className="text-xs font-black uppercase tracking-[0.3em] text-stone-500 px-4 py-1.5 rounded-full border border-stone-800 bg-stone-900/50">
                          Nivel <span className="text-amber-500">{level}</span>
                        </div>
                        <div className="h-px flex-1 bg-stone-800"></div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        {(searchQuery ? filtered : levelAbilities).map((ability, idx) => (
                          <AbilityCard key={`${level}-${idx}`} ability={ability} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AbilityCard({ ability }: { ability: AbilityLevel }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-3xl border transition-all duration-300 group overflow-hidden ${
      expanded 
        ? "border-amber-500/30 bg-amber-500/5 shadow-2xl shadow-amber-500/5" 
        : "border-stone-800 bg-stone-950/30 hover:border-stone-700 hover:bg-stone-900/20"
    }`}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black transition-colors ${
            expanded ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-400 group-hover:bg-amber-500/20 group-hover:text-amber-400"
          }`}>
            {ability.level}
          </div>
          <h4 className="min-w-0 font-bold leading-5 text-stone-100 group-hover:text-white transition-colors break-words text-pretty">
            {ability.name}
          </h4>
        </div>
        <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${expanded ? 'rotate-180 text-amber-400' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-4">
              <div className="p-4 rounded-2xl bg-stone-900/40 text-[13px] leading-6 text-stone-300 border border-stone-800/30">
                <p>{ability.effect}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-stone-900/40 border border-stone-800/30">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-1">
                    <Timer className="h-3 w-3" />
                    Cooldown
                  </div>
                  <p className="text-xs font-semibold text-stone-200">{ability.cd}</p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-900/40 border border-stone-800/30">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-400/80 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    Limitante
                  </div>
                  <p className="text-xs font-semibold text-stone-200">{ability.limit}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">
                  <ShieldAlert className="h-4 w-4" />
                  Anti-Mano Negra
                </div>
                <p className="text-xs italic leading-5 text-rose-200/70">
                  {ability.antiManoNegra}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
