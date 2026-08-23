import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import toapi from "@toapi/vite-plugin";

export default defineConfig({
  plugins: [react(), toapi()],
});
