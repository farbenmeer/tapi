import { generateOpenAPISchema } from "@farbenmeer/tapi/server";
import { Command } from "commander";
import esbuild from "esbuild";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import * as vite from "vite";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { generateServer } from "./generate-server.js";
import { loadEnv } from "../load-env.js";
import { readConfig } from "./read-config.js";

export const build = new Command()
  .name("build")
  .option("--sourcemap", "Generate sourcemaps", true)
  .option("--standalone", "Generate standalone server", false)
  .description("Bunny Production Build")
  .action(async (options) => {
    const config = await readConfig();
    const bunnyDir = path.join(process.cwd(), ".bunny", "prod");
    const srcDir = path.join(process.cwd(), "src");
    if (existsSync(bunnyDir)) {
      await rm(bunnyDir, { recursive: true, force: true });
    }
    await mkdir(bunnyDir, { recursive: true });

    loadEnv("production");

    await vite.build({
      configFile: false,
      root: srcDir,
      mode: "production",
      ...config.vite,
      build: {
        outDir: path.join(bunnyDir, "dist"),
        sourcemap: options.sourcemap,
        emptyOutDir: false,
        ...config.vite?.build,
        rollupOptions: {
          input: path.join(srcDir, "index.html"),
          ...config.vite?.build?.rollupOptions,
        },
      },
      plugins: [...(config.vite?.plugins ?? []), viteTsconfigPaths()],
    });

    await esbuild.build({
      entryPoints: [path.join(srcDir, "api.ts")],
      bundle: true,
      outdir: bunnyDir,
      sourcemap: options.sourcemap,
      platform: "node",
      target: "node24",
      outExtension: {
        ".js": ".cjs",
      },
      packages: options.standalone ? "bundle" : "external",
    });

    const { api } = await import(path.join(bunnyDir, "api.cjs"));
    const wellKnownDir = path.join(bunnyDir, "dist", ".well-known");
    const packageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "package.json"), "utf8")
    );
    await mkdir(wellKnownDir);
    await writeFile(
      path.join(wellKnownDir, "openapi.json"),
      JSON.stringify(
        await generateOpenAPISchema(api, {
          info: {
            title: packageJson.name,
            version: packageJson.version,
          },
        })
      )
    );

    if (options.standalone) {
      await writeFile(path.join(bunnyDir, "server.js"), generateServer());
    }
  });
