import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { formatSupabaseReadError, supabase, supabaseConfigError } from "@/src/services/supabase";

type SessionPlayer = {
  id: string;
  username: string;
  gold: number;
};

type SessionState = {
  player: SessionPlayer | null;
  isLoading: boolean;
  errorMessage: string;
  connectByUsername: (username: string) => Promise<void>;
  refreshGold: () => Promise<void>;
  updateGold: (nextGold: number) => Promise<boolean>;
  disconnect: () => void;
  clearError: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      player: null,
      isLoading: false,
      errorMessage: "",
      clearError: () => set({ errorMessage: "" }),
      connectByUsername: async (username: string) => {
        const normalized = username.trim();

        if (!normalized) {
          set({ errorMessage: "Escribe un username valido." });
          return;
        }

        if (!supabase) {
          set({ errorMessage: supabaseConfigError });
          return;
        }

        set({ isLoading: true, errorMessage: "" });

        const { data, error } = await supabase
          .from("players")
          .select("id, username, gold")
          .ilike("username", normalized)
          .limit(1);

        const exactPlayer = data?.[0];

        if (error) {
          set({
            isLoading: false,
            player: null,
            errorMessage: formatSupabaseReadError("los jugadores", error),
          });
          return;
        }

        if (!exactPlayer) {
          const { data: partialData, error: partialError } = await supabase
            .from("players")
            .select("id, username, gold")
            .ilike("username", `%${normalized}%`)
            .limit(2);

          if (partialError) {
            set({
              isLoading: false,
              player: null,
              errorMessage: formatSupabaseReadError("los jugadores", partialError),
            });
            return;
          }

          if (!partialData || partialData.length !== 1) {
            set({
              isLoading: false,
              player: null,
              errorMessage:
                partialData && partialData.length > 1
                  ? "Hay varios jugadores parecidos. Escribe el nombre completo."
                  : "No se encontro ese jugador. Usa el nombre registrado por el staff.",
            });
            return;
          }

          set({
            isLoading: false,
            player: {
              id: partialData[0].id,
              username: partialData[0].username,
              gold: Number(partialData[0].gold ?? 0),
            },
          });
          return;
        }

        set({
          isLoading: false,
          player: {
            id: exactPlayer.id,
            username: exactPlayer.username,
            gold: Number(exactPlayer.gold ?? 0),
          },
        });
      },
      refreshGold: async () => {
        const currentPlayer = get().player;
        if (!currentPlayer) {
          return;
        }
        if (!supabase) {
          set({ errorMessage: supabaseConfigError });
          return;
        }

        const { data, error } = await supabase
          .from("players")
          .select("gold")
          .eq("id", currentPlayer.id)
          .maybeSingle();

        if (error || !data) {
          set({ errorMessage: formatSupabaseReadError("el oro actual", error) });
          return;
        }

        set({
          player: {
            ...currentPlayer,
            gold: Number(data.gold ?? 0),
          },
        });
      },
      updateGold: async (nextGold: number) => {
        const currentPlayer = get().player;
        if (!currentPlayer) {
          return false;
        }
        if (!supabase) {
          set({ errorMessage: supabaseConfigError });
          return false;
        }

        const safeGold = Math.max(0, Math.floor(nextGold));
        const { error } = await supabase
          .from("players")
          .update({ gold: safeGold })
          .eq("id", currentPlayer.id);

        if (error) {
          set({ errorMessage: "No se pudo actualizar el oro del jugador." });
          return false;
        }

        set({
          player: {
            ...currentPlayer,
            gold: safeGold,
          },
          errorMessage: "",
        });
        return true;
      },
      disconnect: () => set({ player: null, errorMessage: "" }),
    }),
    {
      name: "kingdoom-native-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ player: state.player }),
    }
  )
);
