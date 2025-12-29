export * from "@farbenmeer/tapi/client";
export * from "@farbenmeer/react-tapi";
import { StrictMode, Suspense, type ReactNode } from "react";
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
    const root = (import.meta.hot.data.root ??= createRoot(elem));
    root.render(wrapped);
  } else {
    createRoot(elem).render(wrapped);
  }
}
