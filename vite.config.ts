import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          motion: ["framer-motion"],
          icons: ["lucide-react"],
          supabase: ["@supabase/supabase-js"],
          vercel: ["@vercel/analytics/react", "@vercel/speed-insights/react"],
        },
      },
    },
  },
});
