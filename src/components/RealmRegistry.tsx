import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Info, Loader2, ScrollText, Search, User, Users, X } from "lucide-react";
import { CharacterSheet } from "../types";
import { supabase } from "../lib/supabase";
import { CharSheetModal } from "./CharSheetModal";

interface RealmRegistryProps {
  onClose: () => void;
}

export const RealmRegistry: React.FC<RealmRegistryProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allSheets, setAllSheets] = useState<CharacterSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedSheet, setSelectedSheet] = useState<CharacterSheet | null>(null);
  const [playerNamesById, setPlayerNamesById] = useState<Record<string, string>>({});

  const getSheetPlayerId = (sheet: CharacterSheet) => {
    const raw = (sheet as CharacterSheet & { player_id?: string }).playerId
      ?? (sheet as CharacterSheet & { player_id?: string }).player_id
      ?? "";
    return String(raw).trim();
  };

  const getSheetPlayerUsername = (sheet: CharacterSheet) => {
    const raw = (sheet as CharacterSheet & { player_username?: string }).playerUsername
      ?? (sheet as CharacterSheet & { player_username?: string }).player_username
      ?? "";
    return String(raw).trim();
  };

  const formatPlayerLabel = (sheet: CharacterSheet) => {
    const explicitUsername = getSheetPlayerUsername(sheet);
    if (explicitUsername) {
      return explicitUsername;
    }

    const playerId = getSheetPlayerId(sheet);
    if (playerId && playerNamesById[playerId]) {
      return playerNamesById[playerId];
    }

    if (playerId) {
      return `${playerId.slice(0, 8)}...`;
    }

    return "Desconocido";
  };

  useEffect(() => {
    let cancelled = false;

    async function loadRegistry() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [sheetsResponse, playersResponse] = await Promise.all([
          supabase.from("character_sheets").select("*"),
          supabase.from("players").select("id, username"),
        ]);

        if (sheetsResponse.error) {
          throw sheetsResponse.error;
        }

        if (cancelled) {
          return;
        }

        const nextSheets = ((sheetsResponse.data ?? []) as CharacterSheet[]).slice().sort((a, b) =>
          String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", {
            sensitivity: "base",
          })
        );
        const nextPlayerNamesById = playersResponse.error
          ? {}
          : Object.fromEntries(
              ((playersResponse.data ?? []) as Array<{ id: string; username: string }>).map((player) => [
                player.id,
                player.username,
              ])
            );

        setAllSheets(nextSheets);
        setPlayerNamesById(nextPlayerNamesById);
      } catch (error) {
        console.error("Error loading registry sheets:", error);
        if (!cancelled) {
          setLoadError("No se pudieron cargar las fichas publicas del reino.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRegistry();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleSheets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return allSheets;
    }

    return allSheets.filter((sheet) => {
      const playerId = getSheetPlayerId(sheet);
      const playerUsername = getSheetPlayerUsername(sheet) || playerNamesById[playerId] || "";
      const searchableValues = [
        sheet.name,
        sheet.race,
        sheet.profession,
        sheet.birthRealm,
        playerUsername,
      ];

      return searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [allSheets, playerNamesById, searchQuery]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-stone-800 bg-[#0a0a0a] shadow-2xl"
      >
        <div className="shrink-0 border-b border-stone-800 bg-stone-900/30 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <ScrollText className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold uppercase tracking-wider text-amber-500">
                  Registro del Reino
                </h2>
                <p className="text-sm text-stone-400">
                  Todas las fichas publicas del reino, solo para consulta.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-stone-800 bg-stone-900 p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="border-b border-stone-800 bg-stone-900/10 p-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Filtrar por personaje, jugador, raza, profesion o reino..."
              className="w-full rounded-xl border border-stone-700 bg-stone-900 py-4 pl-12 pr-4 text-stone-200 placeholder:text-stone-500 transition-all focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
            <p className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              Puedes abrir cualquier ficha para revisarla, pero no editarla.
            </p>
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-950/50 px-3 py-1 text-stone-300">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              {visibleSheets.length} ficha{visibleSheets.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {loadError ? (
          <div className="border-b border-stone-800 bg-rose-500/10 px-6 py-3 text-sm text-rose-200">
            {loadError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-stone-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-sm">Cargando las fichas del reino...</p>
          </div>
        ) : (
          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            {visibleSheets.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleSheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    type="button"
                    className="group rounded-xl border border-stone-800 bg-stone-900/40 p-4 text-left transition-colors hover:border-amber-500/30"
                    onClick={() => setSelectedSheet(sheet)}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <h4 className="line-clamp-1 text-sm font-bold uppercase tracking-wider text-amber-500 transition-colors group-hover:text-amber-400">
                        {sheet.name || "Sin Nombre"}
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-stone-400">
                      <p className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Jugador: <span className="text-stone-300">{formatPlayerLabel(sheet)}</span>
                      </p>
                      <p className="line-clamp-1">
                        {sheet.race || "Raza desconocida"} • {sheet.profession || "Sin profesion"}
                      </p>
                      {sheet.birthRealm ? (
                        <p className="line-clamp-1 text-stone-500">Reino: {sheet.birthRealm}</p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-stone-500">
                <Search className="h-12 w-12 opacity-20" />
                <p>
                  {searchQuery
                    ? "No se encontraron fichas con ese filtro."
                    : "No hay fichas publicas registradas todavia."}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <CharSheetModal
        isOpen={!!selectedSheet}
        onClose={() => setSelectedSheet(null)}
        character={selectedSheet}
      />
    </div>
  );
};
