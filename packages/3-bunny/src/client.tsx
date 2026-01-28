export * from "@farbenmeer/react-tapi";
export * from "@farbenmeer/tapi/client";

import { type ReactNode, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

export function startBunnyClient(app: ReactNode) {
  let elem = document.getElementById("__bunny");

  if (!elem) {
    elem = document.createElement("div");
    elem.id = "__bunny";
    document.body.insertBefore(elem, document.body.firstChild);
  }

  const wrapped = (
    <StrictMode>
      <Suspense>{app}</Suspense>
    </StrictMode>
  );

  if (import.meta.hot) {
    if (!import.meta.hot.data.root) {
      import.meta.hot.data.root = createRoot(elem);
    }
    const root = import.meta.hot.data.root;
    root.render(wrapped);
  } else {
    createRoot(elem).render(wrapped);
  }

  if (import.meta.env.PROD) {
    if ("serviceWorker" in navigator) {
      try {
        navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        console.info("Bunny: Service worker registered");
      } catch (error) {
        console.error("Bunny: Failed to register service worker", error);
      }
    }
  } else {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        registrations.forEach((registration) => {
          registration.unregister();
        })
      );
    }
  }
}
