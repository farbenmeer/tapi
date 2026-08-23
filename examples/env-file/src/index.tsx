/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `index.html`.
 */

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense>
      <App />
    </Suspense>
  </StrictMode>,
);
