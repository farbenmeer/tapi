import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <Suspense fallback={<p>Loading…</p>}>
      <App />
    </Suspense>
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .catch((error) => console.error("Failed to register service worker", error));
}
