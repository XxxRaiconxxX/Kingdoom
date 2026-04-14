import { lazy, Suspense, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Backpack,
  Coins,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRound,
  WalletCards,
  Send,
  ScrollText,
  Plus,
  Eye,
  Trash2,
  Search
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { CharImportModal } from "./CharImportModal";
import { CharSheetModal } from "./CharSheetModal";
import { RealmRegistry } from "./RealmRegistry";
import { CharacterSheet } from "../types";
import { getPlayerSheets, saveCharacterSheet, deleteCharacterSheet } from "../utils/characterSheets";

const AdminControlSheet = lazy(() =>
  import("./AdminControlSheet").then((module) => ({
    default: module.AdminControlSheet,
  }))
);
const PlayerInventorySheet = lazy(() =>
  import("./PlayerInventorySheet").then((module) => ({
    default: module.PlayerInventorySheet,
  }))
);
const PlayerTradeSheet = lazy(() =>
  import("./PlayerTradeSheet").then((module) => ({
    default: module.PlayerTradeSheet,
  }))
);

export function PlayerProfilePanel({
  collapsed,
  onCollapsedChange,
}: {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const {
    player,
    isAdmin,
    isHydrating,
    isSubmittingProfile,
    profileError,
    connectPlayer,
    clearPlayer,
    setProfileError,
  } = usePlayerSession();
  const [usernameInput, setUsernameInput] = useState("");
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  
  // Character Sheets State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<CharacterSheet | null>(null);
  const [playerSheets, setPlayerSheets] = useState<CharacterSheet[]>([]);
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);

  const isCollapsed = Boolean(collapsed && player);

  useEffect(() => {
    if (player) {
      getPlayerSheets(player.id).then(setPlayerSheets);
    } else {
      setPlayerSheets([]);
    }
  }, [player]);

  const handleSaveSheet = async (partialSheet: Partial<CharacterSheet>) => {
    if (!player) return;

    const stats = partialSheet.stats ?? {
      strength: 0,
      agility: 0,
      intelligence: 0,
      defense: 0,
      magicDefense: 0,
    };

    const newSheet: CharacterSheet = {
      id: crypto.randomUUID(),
      playerId: player.id,
      playerUsername: player.username,
      name: partialSheet.name ?? "",
      age: partialSheet.age ?? "",
      gender: partialSheet.gender ?? "",
      height: partialSheet.height ?? "",
      race: partialSheet.race ?? "",
      powers: partialSheet.powers ?? "",
      stats: {
        strength: Number(stats.strength ?? 0) || 0,
        agility: Number(stats.agility ?? 0) || 0,
        intelligence: Number(stats.intelligence ?? 0) || 0,
        defense: Number(stats.defense ?? 0) || 0,
        magicDefense: Number(stats.magicDefense ?? 0) || 0,
      },
      weapon: partialSheet.weapon ?? "",
      combatStyle: partialSheet.combatStyle ?? "",
      birthRealm: partialSheet.birthRealm ?? "",
      socialClass: partialSheet.socialClass ?? "",
      nobleTitle: partialSheet.nobleTitle ?? "",
      profession: partialSheet.profession ?? "",
      nonMagicSkills: partialSheet.nonMagicSkills ?? "",
      personality: partialSheet.personality ?? "",
      history: partialSheet.history ?? "",
      extras: partialSheet.extras ?? "",
      weaknesses: partialSheet.weaknesses ?? "",
      inventory: partialSheet.inventory ?? "",
      createdAt: new Date().toISOString(),
    };

    await saveCharacterSheet(newSheet);
    const updatedSheets = await getPlayerSheets(player.id);
    setPlayerSheets(updatedSheets);
  };

  const confirmDeleteSheet = async () => {
    if (sheetToDelete) {
      await deleteCharacterSheet(sheetToDelete);
      if (player) {
        const updatedSheets = await getPlayerSheets(player.id);
        setPlayerSheets(updatedSheets);
      }
      setSheetToDelete(null);
    }
  };

  const handleDeleteSheet = (id: string) => {
    setSheetToDelete(id);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const connectedPlayer = await connectPlayer(usernameInput);

    if (connectedPlayer) {
      setUsernameInput("");
    }
  }

  return (
    <section className="rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-5 shadow-2xl shadow-black/20 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
            Perfil del reino
          </p>
          <h2 className="text-2xl font-black text-stone-100 md:text-3xl">
            Tu sesion de jugador
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-stone-400">
            Conecta una sola vez tu nombre registrado y el mercado junto con la
            taberna usaran ese mismo perfil para leer y descontar tu oro.
          </p>
        </div>

      </div>

      <div className="mt-5">
        {isHydrating ? (
          <div className="flex items-center gap-3 rounded-[1.5rem] border border-stone-800 bg-stone-950/45 px-4 py-4 text-sm text-stone-300">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            Restaurando tu sesion guardada...
          </div>
        ) : player ? (
          isCollapsed ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Conectado
                      </p>
                      <p className="mt-1 text-lg font-black text-stone-100">
                        {player.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        clearPlayer();
                        setUsernameInput(player.username);
                        onCollapsedChange?.(false);
                      }}
                      className="rounded-xl border border-stone-700 p-2 text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
                      title="Cambiar usuario"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onCollapsedChange?.(!isCollapsed)}
                      className="rounded-xl border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
                      title="Ver panel completo"
                    >
                      Panel
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setIsAdminOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:border-amber-400/35 hover:bg-amber-500/14"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Admin
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsInventoryOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
                  >
                    <Backpack className="h-3.5 w-3.5" />
                    Inventario
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTradeOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400/35 hover:bg-cyan-500/14"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </button>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      Oro
                    </p>
                    <p className="mt-1 text-2xl font-black text-amber-300">
                      {player.gold}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRegistryOpen(true)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition hover:border-purple-400/35 hover:bg-purple-500/14"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Buscar fichas
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Jugador conectado
                      </p>
                      <p className="mt-1 text-xl font-black text-stone-100">
                        {player.username}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        clearPlayer();
                        setUsernameInput(player.username);
                        onCollapsedChange?.(false);
                      }}
                      className="rounded-xl border border-stone-700 p-2 text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
                      title="Cambiar usuario"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setIsAdminOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-300 transition hover:border-amber-400/35 hover:bg-amber-500/14 md:py-2"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Admin
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setIsInventoryOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 px-3 py-2.5 text-xs font-semibold text-stone-400 transition hover:border-stone-500 hover:text-stone-200 md:py-2"
                    >
                      <Backpack className="h-3.5 w-3.5" />
                      Inventario
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTradeOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2.5 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400/35 hover:bg-cyan-500/14 md:py-2"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Enviar
                    </button>
                    <button
                      type="button"
                      onClick={() => onCollapsedChange?.(!isCollapsed)}
                      className="rounded-xl border border-stone-700 px-3 py-2.5 text-xs font-semibold text-stone-300 transition hover:border-stone-500 hover:text-stone-100 md:py-2"
                      title="Compactar panel"
                    >
                      Panel
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegistryOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-3 py-2.5 text-xs font-semibold text-purple-300 transition hover:border-purple-400/35 hover:bg-purple-500/14 md:py-2 col-span-2 md:col-span-1"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Buscar Fichas
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      Oro disponible
                    </p>
                    <p className="mt-1 text-2xl font-black text-amber-300">
                      {player.gold}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fichas de Personaje Section */}
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-500/10 p-2.5 text-green-400 shrink-0">
                    <ScrollText className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-100 uppercase tracking-wider">Mis Personajes</h3>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600/20 border border-green-500/30 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-600/30 hover:text-green-300 transition-colors w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Importar Ficha
                </button>
              </div>

              {playerSheets.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-stone-800 rounded-xl">
                  <p className="text-stone-500 text-sm">Aun no has importado ninguna ficha de personaje.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playerSheets.map(sheet => (
                    <div key={sheet.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col gap-3 hover:border-amber-500/30 transition-colors">
                      <div>
                        <h4 className="font-bold text-amber-400 truncate uppercase tracking-wider">{sheet.name || 'Personaje Sin Nombre'}</h4>
                        <p className="text-xs text-stone-400 truncate mt-1">
                          {sheet.race || "Raza Desconocida"} {sheet.profession ? ` - ${sheet.profession}` : ""}
                        </p>
                        {sheet.powers && (
                          <p className="text-xs text-stone-500 truncate mt-1">
                            Poder: {sheet.powers.replace(/\*/g, '')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-auto">
                        <button 
                          onClick={() => setSelectedSheet(sheet)}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Ficha
                        </button>
                        <button 
                          onClick={() => handleDeleteSheet(sheet.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                          title="Eliminar ficha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 rounded-[1.5rem] border border-stone-800 bg-stone-950/45 p-4 md:grid-cols-[1fr_auto]"
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-200">
                Nombre del jugador registrado
              </span>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(event) => {
                  setUsernameInput(event.target.value);
                  if (profileError) {
                    setProfileError("");
                  }
                }}
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-400/40"
                placeholder="Tu nombre exacto en la base de datos"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmittingProfile}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
            >
              {isSubmittingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  Conectar perfil
                </>
              )}
            </button>

            {profileError ? (
              <div className="md:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {profileError}
              </div>
            ) : null}
          </form>
        )}
      </div>

      <AnimatePresence>
        {isAdminOpen && player && isAdmin ? (
          <Suspense
            key="admin-sheet"
            fallback={
              <ProfileSheetFallback message="Abriendo el centro de control del reino..." />
            }
          >
            <AdminControlSheet onClose={() => setIsAdminOpen(false)} />
          </Suspense>
        ) : null}
        {isInventoryOpen && player ? (
          <Suspense
            key="inventory-sheet"
            fallback={
              <ProfileSheetFallback message="Abriendo el inventario del jugador..." />
            }
          >
            <PlayerInventorySheet onClose={() => setIsInventoryOpen(false)} />
          </Suspense>
        ) : null}
        {isTradeOpen && player ? (
          <Suspense
            key="trade-sheet"
            fallback={
              <ProfileSheetFallback message="Abriendo el centro de intercambios..." />
            }
          >
            <PlayerTradeSheet onClose={() => setIsTradeOpen(false)} />
          </Suspense>
        ) : null}
      </AnimatePresence>

      {/* Character Sheet Modals */}
      <CharImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSave={handleSaveSheet} 
      />
      <CharSheetModal 
        isOpen={!!selectedSheet} 
        onClose={() => setSelectedSheet(null)} 
        character={selectedSheet} 
      />

      <AnimatePresence>
        {isRegistryOpen && (
          <RealmRegistry onClose={() => setIsRegistryOpen(false)} />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {sheetToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-serif font-bold text-amber-500 mb-2">Eliminar ficha?</h3>
              <p className="text-stone-300 text-sm mb-6">
                Esta accion no se puede deshacer. Seguro que deseas eliminar esta ficha de personaje?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSheetToDelete(null)}
                  className="px-4 py-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteSheet}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ProfileSheetFallback({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-md md:px-6 md:py-6">
      <div className="w-full max-w-sm rounded-[2rem] border border-stone-800 bg-stone-950 px-5 py-6 text-center shadow-2xl shadow-black/40">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
          Cargando
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-300">{message}</p>
      </div>
    </div>
  );
}
