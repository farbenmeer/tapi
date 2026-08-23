import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import toapi from "@toapi/vite-plugin";

export default defineConfig({
  plugins: [react(), toapi()],
  server: {
    allowedHosts: ["localhost", "127.0.0.1", "host.containers.internal"],
  },
  build: {
    rollupOptions: {
      input: { index: "index.html", sw: "src/sw.ts" },
      output: {
        // The service worker must be served from the root scope under a
        // stable name, so it is excluded from the hashed asset naming.
        entryFileNames: (chunk) =>
          chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js",
      },
    },
  },
});
