import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "@toapi/router";
import { App } from "./app/app";

declare global {
  interface Window {
    __DEV_MARKER__?: string;
  }
}

if (import.meta.env.DEV) {
  window.__DEV_MARKER__ = "DEV_ONLY_MARKER_9f3a1b7c";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense>
      <Router>
        <App />
      </Router>
    </Suspense>
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js", { type: "module", scope: "/", updateViaCache: "none" })
    .catch((error) => console.error("Failed to register service worker", error));
}
