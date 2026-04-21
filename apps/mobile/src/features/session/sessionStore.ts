import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { supabase, supabaseConfigError } from "@/src/services/supabase";

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
          .eq("username", normalized)
          .maybeSingle();

        if (error || !data) {
          set({
            isLoading: false,
            player: null,
            errorMessage: "No se encontro ese jugador en Supabase.",
          });
          return;
        }

        set({
          isLoading: false,
          player: {
            id: data.id,
            username: data.username,
            gold: Number(data.gold ?? 0),
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
          set({ errorMessage: "No se pudo refrescar el oro actual." });
          return;
        }

        set({
          player: {
            ...currentPlayer,
            gold: Number(data.gold ?? 0),
          },
        });
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
