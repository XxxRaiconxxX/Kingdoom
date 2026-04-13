import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Wand2, AlertCircle } from 'lucide-react';
import { CharacterSheet } from '../types';
import { parseWhatsAppSheet } from '../utils/sheetParser';

interface CharImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sheet: Partial<CharacterSheet>) => void;
}

export const CharImportModal: React.FC<CharImportModalProps> = ({ isOpen, onClose, onSave }) => {
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<Partial<CharacterSheet> | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = () => {
    setIsParsing(true);
    setTimeout(() => {
      const data = parseWhatsAppSheet(rawText);
      setParsedData(data);
      setIsParsing(false);
    }, 600); // Fake delay for effect
  };

  const handleSave = () => {
    if (parsedData) {
      onSave(parsedData);
      setRawText('');
      setParsedData(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-zinc-900 border border-green-500/30 rounded-xl shadow-2xl shadow-green-900/20 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
          <div className="flex items-center justify-between p-4 border-b border-green-500/20 bg-green-950/20">
            <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Importar Ficha de WhatsApp
            </h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {!parsedData ? (
              <div className="space-y-4">
                <div className="bg-green-950/30 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-200/80">
                    Pega aquí el texto exacto de tu ficha de WhatsApp. Nuestro sistema mágico extraerá tus estadísticas, lore y habilidades automáticamente.
                  </p>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="*╭═════°•>☾<•°═════╮*&#10;*º𝔗𝔥𝔢 ƙ𝔦𝔫𝔤𝔇𝔬𝔬𝔪t*&#10;*╰═════°•>☾<•°═════╯*&#10;&#10;*-Nombre Completo/ Apodo:*&#10;Arthur Pendragon..."
                  className="w-full h-64 bg-black/50 border border-green-500/30 rounded-lg p-4 text-green-100 placeholder:text-green-900/50 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 resize-none font-mono text-sm"
                />
                <button
                  onClick={handleParse}
                  disabled={!rawText.trim() || isParsing}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isParsing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Procesar Ficha
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Vista Previa de Extracción</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold">Nombre / Apodo</label>
                      <input 
                        type="text" 
                        value={parsedData.name || ''} 
                        onChange={e => setParsedData({...parsedData, name: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold">Raza</label>
                      <input 
                        type="text" 
                        value={parsedData.race || ''} 
                        onChange={e => setParsedData({...parsedData, race: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold">Estadísticas Extraídas</label>
                    <div className="grid grid-cols-5 gap-2 mt-1">
                      {Object.entries(parsedData.stats || {}).map(([key, val]) => (
                        <div key={key} className="bg-zinc-900 border border-zinc-700 rounded p-2 text-center">
                          <div className="text-[10px] text-zinc-400 uppercase truncate">{key}</div>
                          <div className="text-green-400 font-bold">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold">Historia (Fragmento)</label>
                    <textarea 
                      value={parsedData.history || ''} 
                      onChange={e => setParsedData({...parsedData, history: e.target.value})}
                      className="w-full h-24 bg-zinc-900 border border-zinc-700 rounded p-2 text-white mt-1 resize-none text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setParsedData(null)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Volver a Pegar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Guardar Ficha
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
