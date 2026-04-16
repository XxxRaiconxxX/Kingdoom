import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App as CapacitorApp } from "@capacitor/app";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import { PlayerSessionProvider } from "./context/PlayerSessionContext";
import { handleSupabaseAuthRedirect, isCapacitorNativeRuntime } from "./utils/supabaseClient";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontro el elemento #root en index.html");
}

if (isCapacitorNativeRuntime()) {
  void CapacitorApp.getLaunchUrl().then(async (launchData) => {
    const url = launchData?.url;

    if (url) {
      await handleSupabaseAuthRedirect(url);
    }
  });

  void CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
    await handleSupabaseAuthRedirect(url);
  });
}

createRoot(rootElement).render(
  <StrictMode>
    <PlayerSessionProvider>
      <App />
      <Analytics />
      <SpeedInsights />
    </PlayerSessionProvider>
  </StrictMode>
);
