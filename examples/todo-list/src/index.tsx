/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { startBunnyClient } from "@farbenmeer/bunny/client";
import { App } from "app/app";

startBunnyClient(<App />);
