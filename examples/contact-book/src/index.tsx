import { startBunnyClient } from "@farbenmeer/bunny/client";
import { Router } from "@farbenmeer/router";
import { App } from "app/app";

declare global {
  interface Window {
    __BUNNY_DEV_MARKER__?: string;
  }
}

if (process.env.BUNNY_ENV === "development") {
  window.__BUNNY_DEV_MARKER__ = "BUNNY_DEV_ONLY_MARKER_9f3a1b7c";
}

startBunnyClient(
  <Router>
    <App />
  </Router>
);
