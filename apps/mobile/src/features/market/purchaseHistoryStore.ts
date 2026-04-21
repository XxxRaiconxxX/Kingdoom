import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type NativePurchaseHistoryItem = {
  id: string;
  playerId: string;
  playerUsername: string;
  itemId: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  remainingGold: number;
  orderRef: string;
  purchasedAt: string;
};

type PurchaseHistoryState = {
  entries: NativePurchaseHistoryItem[];
  addEntry: (entry: NativePurchaseHistoryItem) => void;
  clearPlayerEntries: (playerId: string) => void;
};

const MAX_HISTORY_ENTRIES = 60;

export const usePurchaseHistoryStore = create<PurchaseHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => {
          const next = [entry, ...state.entries];
          return { entries: next.slice(0, MAX_HISTORY_ENTRIES) };
        }),
      clearPlayerEntries: (playerId) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.playerId !== playerId),
        })),
    }),
    {
      name: "kingdoom-native-purchase-history",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
