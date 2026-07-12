import { defineConfig } from "vite";
import tapi from "@toapi/vite-plugin";

export default defineConfig({
  plugins: [tapi({ basePath: "/api" })],
});
