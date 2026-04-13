import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Sword, Brain, Zap, Heart, Info, BookOpen, User, Backpack, Sparkles } from 'lucide-react';
import { CharacterSheet } from '../types';

interface CharSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterSheet | null;
}

const InfoItem = ({ label, value }: { label: string, value?: string }) => (
  <div className="bg-stone-900/40 border border-stone-800/50 rounded-lg p-3 flex flex-col justify-center">
    <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-sm text-stone-200 font-medium">{value || '-'}</div>
  </div>
);

const TextSection = ({ title, content, icon: Icon }: { title: string, content?: string, icon?: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!content || content.trim() === '') return null;

  const MAX_LENGTH = 250;
  const shouldTruncate = content.length > MAX_LENGTH;
  const displayContent = (!shouldTruncate || isExpanded) ? content : content.slice(0, MAX_LENGTH) + '...';

  return (
    <div className="mb-8">
      <h3 className="flex items-center gap-2 text-sm font-bold text-amber-500 uppercase tracking-[0.2em] mb-4 border-b border-stone-800/50 pb-2">
        {Icon && <Icon className="w-4 h-4" />} {title}
      </h3>
      <div className="text-stone-300 whitespace-pre-wrap text-sm leading-relaxed bg-stone-900/20 p-5 rounded-xl border border-stone-800/30">
        {displayContent}
        {shouldTruncate && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="block mt-4 text-amber-500 hover:text-amber-400 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            {isExpanded ? 'Leer menos' : 'Leer más'}
          </button>
        )}
      </div>
    </div>
  );
};

export const CharSheetModal: React.FC<CharSheetModalProps> = ({ isOpen, onClose, character }) => {
  const statConfig = [
    { key: 'strength', label: 'Fuerza', icon: Sword, color: 'text-red-400', bg: 'bg-red-500' },
    { key: 'agility', label: 'Agilidad', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500' },
    { key: 'intelligence', label: 'Inteligencia', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500' },
    { key: 'defense', label: 'Defensa', icon: Shield, color: 'text-zinc-400', bg: 'bg-zinc-500' },
    { key: 'magicDefense', label: 'Defensa Mágica', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500' },
  ];

  return (
    <AnimatePresence>
      {isOpen && character && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0a0a0a] border border-stone-800 rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] relative"
          >
            {/* Header */}
            <div className="shrink-0 flex items-start justify-between p-6 sm:p-8 border-b border-stone-800 bg-gradient-to-b from-stone-900/50 to-transparent">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-500 tracking-wider uppercase drop-shadow-sm">
                  {character.name || 'Sin Nombre'}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-sm font-serif">
                  {character.race && <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">{character.race}</span>}
                  {character.profession && <span className="px-3 py-1 bg-stone-800 text-stone-300 border border-stone-700 rounded-full">{character.profession}</span>}
                  {character.nobleTitle && <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">{character.nobleTitle}</span>}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl transition-colors border border-stone-800"
                title="Cerrar ficha"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 text-stone-300 font-serif">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* Left Column: Stats & Basic Info (Takes 4 cols on large screens) */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* Basic Info Grid */}
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-amber-500 uppercase tracking-[0.2em] mb-4">
                      <Info className="w-4 h-4" /> Datos Básicos
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoItem label="Edad" value={character.age} />
                      <InfoItem label="Género" value={character.gender} />
                      <InfoItem label="Estatura" value={character.height} />
                      <InfoItem label="Clase Social" value={character.socialClass} />
                      <div className="col-span-2">
                        <InfoItem label="Reino de Nacimiento" value={character.birthRealm} />
                      </div>
                    </div>
                  </section>

                  {/* Stats */}
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-amber-500 uppercase tracking-[0.2em] mb-4">
                      <Sword className="w-4 h-4" /> Atributos
                    </h3>
                    <div className="bg-stone-900/40 border border-stone-800/50 p-5 rounded-xl space-y-5">
                      {statConfig.map(stat => {
                        const val = character.stats[stat.key as keyof typeof character.stats] || 0;
                        const max = 20; // Assuming max stat might be higher
                        const percentage = Math.min(100, (val / max) * 100);
                        return (
                          <div key={stat.key}>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="flex items-center gap-2 text-stone-400 font-medium">
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                {stat.label}
                              </span>
                              <span className="font-bold text-stone-200">{val}</span>
                            </div>
                            <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                              <div className={`h-full ${stat.bg} shadow-[0_0_10px_currentColor]`} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        )
                      })}
                      <div className="mt-6 pt-5 border-t border-stone-800/50 flex justify-between items-center font-bold">
                        <span className="flex items-center gap-2 text-rose-400"><Heart className="w-5 h-5" /> PV Base</span>
                        <span className="text-rose-400 text-xl">100</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column: Lore & Combat (Takes 8 cols on large screens) */}
                <div className="lg:col-span-8">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                    <TextSection title="Arma Principal" content={character.weapon} icon={Sword} />
                    <TextSection title="Estilo de Combate" content={character.combatStyle} icon={Zap} />
                  </div>

                  <TextSection title="Poderes Oficiales" content={character.powers} icon={Sparkles} />
                  <TextSection title="Habilidades No Mágicas" content={character.nonMagicSkills} icon={User} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <TextSection title="Personalidad" content={character.personality} icon={User} />
                    <TextSection title="Debilidades" content={character.weaknesses} icon={Heart} />
                  </div>

                  <TextSection title="Historia" content={character.history} icon={BookOpen} />
                  <TextSection title="Inventario" content={character.inventory} icon={Backpack} />
                  <TextSection title="Extras" content={character.extras} icon={Info} />

                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
