import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import esbuild from "esbuild";
import * as vite from "vite";
import { loadEnv } from "../load-env.js";
import type { BunnyManifest } from "../manifest.js";
import { generateServer } from "./generate-server.js";
import { readConfig } from "./read-config.js";
import { randomUUID } from "node:crypto";

export const build = new Command()
  .name("build")
  .option("--sourcemap", "Generate sourcemaps", true)
  .option("--standalone", "Generate standalone server", false)
  .description("Bunny Production Build")
  .action(async (options) => {
    const bunnyDir = path.join(process.cwd(), ".bunny", "prod");
    const srcDir = path.join(process.cwd(), "src");
    const distDir = path.join(bunnyDir, "dist");
    if (existsSync(bunnyDir)) {
      await rm(bunnyDir, { recursive: true, force: true });
    }
    await mkdir(bunnyDir, { recursive: true });

    const buildId = randomUUID();
    await writeFile(path.join(bunnyDir, "buildId.txt"), buildId);

    loadEnv("production");
    const config = await readConfig();

    const clientBuildOutput = await vite.build({
      configFile: false,
      root: srcDir,
      mode: "production",
      ...config.vite,
      build: {
        outDir: distDir,
        sourcemap: options.sourcemap,
        emptyOutDir: false,
        ...config.vite?.build,
        rolldownOptions: {
          input: path.join(srcDir, "index.html"),
          ...config.vite?.build?.rolldownOptions,
        },
      },
      resolve: {
        tsconfigPaths: true,
        ...config.vite?.resolve,
      },
      plugins: config.vite?.plugins,
      define: {
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV ?? "production",
        ),
        "process.env.BUNNY_BUNDLE": JSON.stringify("client"),
        "process.env.BUNNY_ENV": JSON.stringify("production"),
        ...config.client?.define,
      },
    });

    const packageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "package.json"), "utf8"),
    );

    if (options.standalone) {
      const serverBuild = await esbuild.build({
        stdin: {
          contents: generateServer(
            path.join(srcDir, "api.ts"),
            {
              title: packageJson.name,
              version: packageJson.version,
            },
            config.server,
          ),
          sourcefile: path.join(bunnyDir, "virtual", "server.js"),
          resolveDir: bunnyDir,
        },
        bundle: true,
        outdir: bunnyDir,
        sourcemap: options.sourcemap,
        platform: "node",
        target: "node24",
        entryNames: "server",
        outExtension: { ".js": ".cjs" },
        packages: "bundle",
        metafile: true,
        define: {
          "process.env.BUNNY_BUNDLE": JSON.stringify("server"),
          "process.env.BUNNY_ENV": JSON.stringify("production"),
          "process.env.BUNNY_SERVER": JSON.stringify("standalone"),
          ...config.server?.define,
        },
      });

      const serverMeta = serverBuild.metafile.outputs[".bunny/prod/server.cjs"];
      console.log("Bunny: Built Standalone Server");
      if (serverMeta) {
        console.log("Total Modules:", Object.keys(serverMeta?.inputs).length);
        console.log(
          "User Modules:",
          Object.keys(serverMeta?.inputs).filter((key) =>
            key.startsWith("src"),
          ),
        );
        console.log("Output Size:", Math.round(serverMeta.bytes / 1000), "kiB");
      }
    } else {
      const apiBuild = await esbuild.build({
        entryPoints: [path.join(srcDir, "api.ts")],
        bundle: true,
        outdir: bunnyDir,
        sourcemap: options.sourcemap,
        platform: "node",
        target: "node24",
        outExtension: {
          ".js": ".cjs",
        },
        packages: "external",
        metafile: true,
        define: {
          "process.env.BUNNY_BUNDLE": JSON.stringify("server"),
          "process.env.BUNNY_ENV": JSON.stringify("production"),
          "process.env.BUNNY_SERVER": JSON.stringify("cli"),
          ...config.server?.define,
        },
      });
      const apiMeta = apiBuild.metafile.outputs[".bunny/prod/api.cjs"];
      console.log("Bunny: Built API");
      if (apiMeta) {
        console.log("User Modules:", Object.keys(apiMeta?.inputs));
        console.log("Output Size:", Math.round(apiMeta.bytes / 1000), "kiB");
      }
    }

    const clientFiles = Array.isArray(clientBuildOutput)
      ? clientBuildOutput
      : ([clientBuildOutput] as vite.Rollup.RollupOutput[]);
    const manifest: BunnyManifest = {
      buildId,
      staticCachedFiles: clientFiles.flatMap((build) =>
        build.output.map((file) => `/${file.fileName}`),
      ),
    };
    await esbuild.build({
      entryPoints: [path.resolve(import.meta.dirname, "../worker.js")],
      bundle: true,
      minify: true,
      sourcemap: options.sourcemap,
      platform: "browser",
      target: "es2020",
      outdir: path.join(bunnyDir, "dist"),
      entryNames: "sw",
      define: {
        __BUNNY_MANIFEST: JSON.stringify(JSON.stringify(manifest)),
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV ?? "production",
        ),
        "process.env.BUNNY_BUNDLE": JSON.stringify("worker"),
        "process.env.BUNNY_ENV": JSON.stringify("production"),
        ...config.worker?.define,
      },
    });
    console.log("Bunny: Built Service Worker");
  });
