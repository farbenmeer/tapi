import { startBunnyClient } from "@farbenmeer/bunny/client";
import { Router } from "@farbenmeer/router";
import { App } from "app/app";

startBunnyClient(
  <Router>
    <App />
  </Router>
);
