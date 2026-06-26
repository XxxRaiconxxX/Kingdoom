import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArchiveRestore, Loader2, ScrollText, Search, User, Users, X } from "lucide-react";
import { CharacterSheet } from "../types";
import { supabase } from "../lib/supabase";
import { CharSheetModal } from "./CharSheetModal";
import {
  getCharacterSheetById,
  getCharacterSheetRegistrySummaries,
  type CharacterSheetRegistrySummary,
} from "../utils/characterSheets";

interface RealmRegistryProps {
  onClose: () => void;
}

type RegistryViewMode = "public" | "recycled";

export const RealmRegistry: React.FC<RealmRegistryProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [publicSheets, setPublicSheets] = useState<CharacterSheetRegistrySummary[]>([]);
  const [recycledSheets, setRecycledSheets] = useState<CharacterSheetRegistrySummary[]>([]);
  const [registryMode, setRegistryMode] = useState<RegistryViewMode>("public");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedSheet, setSelectedSheet] = useState<CharacterSheet | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [isSheetLoading, setIsSheetLoading] = useState(false);
  const [playerNamesById, setPlayerNamesById] = useState<Record<string, string>>({});

  const getSheetPlayerId = (sheet: CharacterSheetRegistrySummary | CharacterSheet) => {
    const raw =
      (sheet as (CharacterSheetRegistrySummary | CharacterSheet) & { player_id?: string }).playerId ??
      (sheet as (CharacterSheetRegistrySummary | CharacterSheet) & { player_id?: string }).player_id ??
      "";
    return String(raw).trim();
  };

  const getSheetPlayerUsername = (sheet: CharacterSheetRegistrySummary | CharacterSheet) => {
    const raw =
      (sheet as (CharacterSheetRegistrySummary | CharacterSheet) & { player_username?: string }).playerUsername ??
      (sheet as (CharacterSheetRegistrySummary | CharacterSheet) & { player_username?: string }).player_username ??
      "";
    return String(raw).trim();
  };

  const formatPlayerLabel = (sheet: CharacterSheetRegistrySummary | CharacterSheet) => {
    if (sheet.recycleStatus === "available") {
      const originalOwner =
        sheet.originalPlayerUsername ||
        (sheet.originalPlayerId ? playerNamesById[sheet.originalPlayerId] : "") ||
        "";
      return originalOwner ? `Ficha reciclada de ${originalOwner}` : "Ficha reciclada";
    }

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
        const [publicSheetsResponse, recycledSheetsResponse, playersResponse] = await Promise.all([
          getCharacterSheetRegistrySummaries("active"),
          getCharacterSheetRegistrySummaries("recycled"),
          supabase.from("players").select("id, username"),
        ]);

        if (cancelled) {
          return;
        }

        const nextPlayerNamesById = playersResponse.error
          ? {}
          : Object.fromEntries(
              ((playersResponse.data ?? []) as Array<{ id: string; username: string }>).map(
                (player) => [player.id, player.username]
              )
            );

        setPublicSheets(publicSheetsResponse);
        setRecycledSheets(recycledSheetsResponse);
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

  const activeSheets = registryMode === "recycled" ? recycledSheets : publicSheets;
  const activeRegistryLabel = registryMode === "recycled" ? "Fichas recicladas" : "Fichas publicas";

  useEffect(() => {
    if (!selectedSheetId) {
      setSelectedSheet(null);
      setIsSheetLoading(false);
      return;
    }

    let cancelled = false;
    const sheetId = selectedSheetId;

    async function loadSelectedSheet() {
      setIsSheetLoading(true);

      try {
        const fullSheet = await getCharacterSheetById(sheetId);
        if (cancelled) {
          return;
        }

        setSelectedSheet(fullSheet);
      } catch (error) {
        console.error("Error loading full registry sheet:", error);
        if (!cancelled) {
          setSelectedSheet(null);
        }
      } finally {
        if (!cancelled) {
          setIsSheetLoading(false);
        }
      }
    }

    void loadSelectedSheet();

    return () => {
      cancelled = true;
    };
  }, [selectedSheetId]);

  const visibleSheets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return activeSheets;
    }

    return activeSheets.filter((sheet) => {
      const playerId = getSheetPlayerId(sheet);
      const playerUsername = getSheetPlayerUsername(sheet) || playerNamesById[playerId] || "";
      const originalUsername =
        sheet.originalPlayerUsername ||
        (sheet.originalPlayerId ? playerNamesById[sheet.originalPlayerId] : "");
      const searchableValues = [
        sheet.name,
        sheet.race,
        sheet.profession,
        sheet.birthRealm,
        playerUsername,
        originalUsername,
      ];

      return searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeSheets, playerNamesById, searchQuery]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative mt-4 flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-stone-800 bg-[#0a0a0a] shadow-2xl sm:mt-0"
      >
        <div className="sticky top-0 z-20 shrink-0 border-b border-stone-800 bg-stone-900/95 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <ScrollText className="h-5 w-5 text-amber-500 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-amber-500 sm:text-2xl">
                  Registro del Reino
                </h2>
                <p className="text-sm text-stone-400">
                  {activeRegistryLabel} del reino.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-xl border border-stone-800 bg-stone-900 p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
              aria-label="Cerrar registro publico"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        <div className="sticky top-[89px] z-10 border-b border-stone-800 bg-stone-900/88 p-4 backdrop-blur-sm sm:top-[109px] sm:p-6">
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl border border-stone-800 bg-stone-950/60 p-1">
            <button
              type="button"
              onClick={() => setRegistryMode("public")}
              className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-black uppercase tracking-[0.14em] transition-colors ${
                registryMode === "public"
                  ? "bg-amber-500 text-stone-950"
                  : "text-stone-400 hover:bg-stone-900 hover:text-stone-100"
              }`}
            >
              <Users className="h-4 w-4" />
              Publicas
            </button>
            <button
              type="button"
              onClick={() => setRegistryMode("recycled")}
              className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-black uppercase tracking-[0.14em] transition-colors ${
                registryMode === "recycled"
                  ? "bg-emerald-400 text-stone-950"
                  : "text-stone-400 hover:bg-stone-900 hover:text-stone-100"
              }`}
            >
              <ArchiveRestore className="h-4 w-4" />
              Recicladas
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar ficha..."
              className="w-full rounded-xl border border-stone-700 bg-stone-900 py-4 pl-12 pr-4 text-stone-200 placeholder:text-stone-500 transition-all focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-xs text-stone-500">
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
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
            {visibleSheets.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleSheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    type="button"
                    className="group rounded-[1.25rem] border border-stone-800 bg-stone-900/40 p-3 text-left transition-colors hover:border-amber-500/30"
                    onClick={() => setSelectedSheetId(sheet.id)}
                  >
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-stone-800 bg-stone-950">
                        {sheet.portraitUrl ? (
                          <img loading="lazy" decoding="async" 
                            src={sheet.portraitUrl}
                            alt={sheet.name || "Retrato del personaje"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-600">
                            <User className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-sm font-bold uppercase tracking-wider text-amber-500 transition-colors group-hover:text-amber-400">
                          {sheet.name || "Sin Nombre"}
                        </h4>
                        <p className="mt-1 line-clamp-1 text-xs text-stone-400">
                          {sheet.race || "Raza desconocida"} - {sheet.profession || "Sin profesion"}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-stone-500">
                          {formatPlayerLabel(sheet)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-[11px] uppercase tracking-[0.14em] text-stone-500">
                        {sheet.birthRealm || "Reino no indicado"}
                      </span>
                      <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-amber-200">
                        {registryMode === "recycled" ? "Disponible" : "Ver ficha"}
                      </span>
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
                    : registryMode === "recycled"
                      ? "Aun no hay fichas recicladas disponibles."
                      : "No hay fichas publicas registradas todavia."}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <CharSheetModal
        isOpen={!!selectedSheetId}
        onClose={() => {
          setSelectedSheetId(null);
          setSelectedSheet(null);
        }}
        character={selectedSheet}
      />
      {isSheetLoading ? (
        <div className="pointer-events-none fixed inset-0 z-[121] flex items-center justify-center bg-black/35">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/95 px-5 py-4 text-sm text-stone-200 shadow-2xl">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
              <span>Cargando ficha completa...</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
