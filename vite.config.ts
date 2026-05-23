import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://kingdoom-sync.vercel.app",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("react")) return "react";
            if (id.includes("lucide-react")) return "icons";
          }

          if (id.includes("src/sections/MarketSection")) return "MarketSection";
          if (id.includes("src/sections/RankingSection")) return "RankingSection";
          if (id.includes("src/components/LibrarySection")) return "LibrarySection";
          if (id.includes("src/components/GrimoireSection")) return "GrimoireSection";

          // Minigames manual chunks
          if (id.includes("TavernCrash")) return "TavernCrash";
          if (id.includes("TavernSlots")) return "TavernSlots";
          if (id.includes("TavernTowerDefense")) return "TavernTowerDefense";
          if (id.includes("TavernPlinko")) return "TavernPlinko";
          if (id.includes("TavernRoulette")) return "TavernRoulette";
          if (id.includes("TavernHorseRace")) return "TavernHorseRace";
          if (id.includes("TavernScratch")) return "TavernScratch";
        },
      },
    },
  },
});
