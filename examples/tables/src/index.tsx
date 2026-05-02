import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Suspense } from "react";

createRoot(document.body).render(
  <Suspense>
    <App />
  </Suspense>,
);
