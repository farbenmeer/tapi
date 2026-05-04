import { defineConfig } from "vite";
import tapi from "@farbenmeer/vite-plugin-tapi";

export default defineConfig({
  plugins: [tapi()],
});
