import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: ".cache/sw",
    emptyOutDir: true,
    target: "es2020",
    lib: {
      entry: "src/sw.ts",
      formats: ["es"],
      fileName: () => "sw.js",
    },
    rolldownOptions: {
      output: { codeSplitting: false },
    },
  },
});
