import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Plugin temporal de diagnostico: VITE_DEBUG_CHUNKS=1 npm run build
const debugChunkModules: Plugin = {
  name: "debug-chunk-modules",
  generateBundle(_options, bundle) {
    if (!process.env.VITE_DEBUG_CHUNKS) return;
    const targets = ["MarketSection", "LibrarySection", "TavernRoulette", "GrimoireSection", "index-"];
    for (const [name, chunk] of Object.entries(bundle)) {
      if (chunk.type !== "chunk") continue;
      if (!targets.some((t) => name.includes(t))) continue;
      console.log(`\n## ${name}`);
      for (const moduleId of Object.keys(chunk.modules)) {
        console.log("  -", moduleId.replace(/^.*node_modules/, "node_modules").replace(/^.*src/, "src"));
      }
    }
  },
};

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), debugChunkModules],
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
          // Nucleo compartido del shell: si estos modulos caen dentro de un
          // chunk lazy (le pasaba a supabaseClient dentro de GrimoireSection y
          // a PlayerSessionContext dentro de TavernRoulette), ese chunk se
          // vuelve dependencia estatica del entry y se descarga en el primer
          // load. Anclarlos a "app-core" corta esas aristas invertidas.
          if (
            id.includes("vite/preload-helper") ||
            id.includes("src/context/") ||
            id.includes("src/utils/supabaseClient") ||
            id.includes("src/utils/supabaseErrors") ||
            id.includes("src/utils/players") ||
            id.includes("src/utils/gifUtils") ||
            id.includes("src/components/SectionHeader") ||
            id.includes("src/components/ExpandableText") ||
            id.includes("src/hooks/")
          ) {
            return "app-core";
          }

          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("framer-motion")) return "motion";
            // lucide-react debe evaluarse ANTES que react: si no, cae en el chunk react
            if (id.includes("lucide-react")) return "icons";
            // @vercel/analytics y speed-insights se cargan diferidos (main.tsx);
            // no deben mezclarse en el chunk eager de react
            if (id.includes("@vercel")) return "vercel";
            if (id.includes("gsap")) return "gsap";
            // Match estricto: solo react, react-dom y scheduler.
            // id.includes("react") a secas arrastraba @gsap/react, @vercel/*/react, etc.
            if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return "react";
            }
          }

          // Los datos del grimorio (~235KB) se separan de la UI para cachear
          // de forma independiente: editar la UI no invalida los datos y viceversa
          if (id.includes("src/data/grimorio")) return "grimoire-data";

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
