import { lazy, StrictMode, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PlayerSessionProvider } from "./context/PlayerSessionContext";
import "./index.css";

const Analytics = lazy(() =>
  import("@vercel/analytics/react").then((module) => ({
    default: module.Analytics,
  }))
);
const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then((module) => ({
    default: module.SpeedInsights,
  }))
);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontro el elemento #root en index.html");
}

function DeferredVercelInsights() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShouldLoad(true), 1800);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!shouldLoad) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Analytics />
      <SpeedInsights />
    </Suspense>
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <PlayerSessionProvider>
      <App />
      <DeferredVercelInsights />
    </PlayerSessionProvider>
  </StrictMode>
);
