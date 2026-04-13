import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ScrollText, X, User, Info } from 'lucide-react';
import { CharacterSheet } from '../types';
import { supabase } from '../lib/supabase';
import { CharSheetModal } from './CharSheetModal';

interface RealmRegistryProps {
  onClose: () => void;
}

export const RealmRegistry: React.FC<RealmRegistryProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CharacterSheet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<CharacterSheet | null>(null);

  const formatPlayerLabel = (sheet: CharacterSheet) => {
    if (sheet.playerUsername?.trim()) return sheet.playerUsername;
    if (sheet.playerId) return `${sheet.playerId.slice(0, 8)}...`;
    return "Desconocido";
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const q = searchQuery.trim();
      // Prefer searching by username if the column exists. If not, fall back to playerId (uuid).
      const preferred = await supabase.from("character_sheets").select("*").or(
        `name.ilike.%${q}%,race.ilike.%${q}%,profession.ilike.%${q}%,playerUsername.ilike.%${q}%`
      );

      if (!preferred.error) {
        setSearchResults((preferred.data ?? []) as CharacterSheet[]);
        return;
      }

      const msg = String((preferred.error as any).message ?? "").toLowerCase();
      const code = String((preferred.error as any).code ?? "");
      const missingColumn =
        code === "42703" ||
        (msg.includes("playerusername") && msg.includes("does not exist"));

      if (!missingColumn) {
        throw preferred.error;
      }

      const fallback = await supabase.from("character_sheets").select("*").or(
        `name.ilike.%${q}%,race.ilike.%${q}%,profession.ilike.%${q}%,playerId.ilike.%${q}%`
      );

      if (fallback.error) throw fallback.error;
      setSearchResults((fallback.data ?? []) as CharacterSheet[]);
    } catch (error) {
      console.error('Error searching sheets:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0a0a0a] border border-stone-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] relative"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <ScrollText className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-amber-500 tracking-wider uppercase">Registro del Reino</h2>
              <p className="text-stone-400 text-sm">Busca fichas de otros jugadores</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl transition-colors border border-stone-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-stone-800 bg-stone-900/10">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre de personaje o jugador..."
              className="w-full bg-stone-900 border border-stone-700 rounded-xl py-4 pl-12 pr-4 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-stone-950 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
          <p className="text-stone-500 text-xs mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> Busca por personaje, raza, profesion o
            jugador.
          </p>
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(sheet => (
                <div 
                  key={sheet.id} 
                  className="bg-stone-900/40 border border-stone-800 rounded-xl p-4 hover:border-amber-500/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedSheet(sheet)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-amber-500 uppercase tracking-wider text-sm group-hover:text-amber-400 transition-colors line-clamp-1">
                      {sheet.name || 'Sin Nombre'}
                    </h4>
                  </div>
                  <div className="space-y-2 text-xs text-stone-400">
                    <p className="flex items-center gap-2">
                      <User className="w-3 h-3" /> Jugador:{" "}
                      <span className="text-stone-300">{formatPlayerLabel(sheet)}</span>
                    </p>
                    <p className="line-clamp-1">
                      {sheet.race || "Raza desconocida"} •{" "}
                      {sheet.profession || "Sin profesion"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-4">
              <Search className="w-12 h-12 opacity-20" />
              <p>{searchQuery ? 'No se encontraron fichas.' : 'Ingresa un nombre para buscar.'}</p>
            </div>
          )}
        </div>
      </motion.div>

      <CharSheetModal 
        isOpen={!!selectedSheet} 
        onClose={() => setSelectedSheet(null)} 
        character={selectedSheet} 
      />
    </div>
  );
};
