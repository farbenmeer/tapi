import { Command } from "commander";
import { mkdir, rmdir } from "node:fs/promises";
import path from "node:path";
import { generateServer } from "./server";
import { tailwindPlugin } from "./tailwind-plugin";

export const build = new Command()
  .name("build")
  .option("--sourcemap", "Generate sourcemaps", false)
  .description("Bunny Development server")
  .action(async (options) => {
    const distDir = path.join(process.cwd(), ".bunny", "dist");
    await rmdir(distDir, { recursive: true });
    await mkdir(distDir, { recursive: true });
    const serverFile = await generateServer();
    await Bun.build({
      entrypoints: [serverFile],
      outdir: distDir,
      target: "bun",
      format: "esm",
      minify: true,
      naming: {
        entry: "[name].[ext]",
        asset: "__bunny/assets/[name]-[hash].[ext]",
        chunk: "__bunny/chunks/[name]-[hash].[ext]",
      },
      sourcemap: options.sourcemap,
      env: "BUNNY_PUBLIC_*",
      plugins: [tailwindPlugin],
    });
  });
