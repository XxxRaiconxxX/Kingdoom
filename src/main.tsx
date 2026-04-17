import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import { PlayerSessionProvider } from "./context/PlayerSessionContext";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontro el elemento #root en index.html");
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
