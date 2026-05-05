import { createRequestHandler } from "@farbenmeer/tapi/server";
import path from "node:path";
import type { Plugin } from "vite";
import { loadEnv } from "vite";
import type { ApiHandler } from "./ApiHandler.js";
import { createApiMiddleware } from "./createApiMiddleware.js";

export interface TapiPluginOptions {
  /**
   * Path to the file that exports `api` (a TApi `ApiDefinition`).
   * Resolved against the Vite root. Default: `"src/api.ts"`.
   */
  entry?: string;
  /**
   * Base path passed to `createRequestHandler`. Default: `"/api"`.
   */
  basePath?: string;
  /**
   * Default port for Vite's dev/preview server. Falls back to the `PORT`
   * environment variable when set.
   */
  port?: number;
  /**
   * Packages to keep external in the server bundle.
   * Passed directly to `rolldownOptions.external`.
   * Default: `[]` — everything is bundled.
   */
  external?: (string | RegExp)[];
}

export default function tapi(options: TapiPluginOptions = {}): Plugin {
  const entryOption = options.entry ?? "src/api.ts";
  const basePath = options.basePath ?? "/api";

  let userOutDirBase = "dist";
  let resolvedEntry = "";
  let resolvedRoot = "";
  let serverOutDir = "";
  let isBuildCommand = false;
  let currentHandler: ApiHandler | undefined;

  return {
    name: "vite-plugin-tapi",

    config(userConfig, _env) {
      // Capture the user's outDir BEFORE we override it, so we can compute
      // the parallel server output directory in later hooks.
      userOutDirBase = userConfig.build?.outDir ?? "dist";

      const port =
        options.port ??
        (process.env.PORT ? Number(process.env.PORT) : undefined);

      // Always redirect the client build to <outDir>/client so server code
      // (written by closeBundle into <outDir>/server) cannot leak into the
      // static hosting deploy.
      return {
        build: { outDir: path.join(userOutDirBase, "client") },
        ...(port ? { server: { port }, preview: { port } } : {}),
      };
    },

    configResolved(config) {
      resolvedEntry = path.isAbsolute(entryOption)
        ? entryOption
        : path.resolve(config.root, entryOption);
      resolvedRoot = config.root;
      serverOutDir = path.resolve(config.root, userOutDirBase);
      isBuildCommand = config.command === "build";
    },

    async configureServer(vite) {
      // Vite injects .env values into `import.meta.env` for the client only;
      // the api runs in this same Node process and reads `process.env`. Mirror
      // every var (empty prefix, not just VITE_*) into process.env so server
      // code sees secrets like BETTER_AUTH_SECRET. Existing process.env wins.
      const env = loadEnv(vite.config.mode, vite.config.envDir, "");
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }

      const loadHandler = async () => {
        const mod = (await vite.ssrLoadModule(resolvedEntry)) as {
          api?: Parameters<typeof createRequestHandler>[0];
        };
        if (!mod.api) {
          throw new Error(
            `[vite-plugin-tapi] ${resolvedEntry} must export \`api\` (an ApiDefinition).`,
          );
        }
        currentHandler = createRequestHandler(mod.api, {
          basePath,
          hooks: {
            error: (error) => {
              if (error instanceof Error) vite.ssrFixStacktrace(error);
              console.error(error);
            },
          },
        });
      };

      try {
        await loadHandler();
      } catch (err) {
        if (err instanceof Error) vite.ssrFixStacktrace(err);
        console.error("[vite-plugin-tapi] initial load failed:", err);
      }

      vite.middlewares.use(createApiMiddleware(() => currentHandler, basePath));

      const onChange = async () => {
        vite.moduleGraph.invalidateAll();
        try {
          await loadHandler();
        } catch (err) {
          if (err instanceof Error) vite.ssrFixStacktrace(err);
          console.error("[vite-plugin-tapi] reload failed:", err);
        }
      };
      vite.watcher.on("change", onChange);
      vite.watcher.on("add", onChange);
      vite.watcher.on("unlink", onChange);
    },

    async configurePreviewServer(previewServer) {
      // Same rationale as configureServer: mirror .env values into process.env
      // so the bundled server (running in this same Node process) can read
      // secrets via process.env. Existing process.env wins.
      const env = loadEnv(
        previewServer.config.mode,
        previewServer.config.envDir,
        "",
      );
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }

      const serverJsPath = path.join(
        path.resolve(previewServer.config.root, userOutDirBase),
        "server.js",
      );

      let fetchHandler: ApiHandler | undefined;
      try {
        const mod = (await import(serverJsPath)) as {
          fetch?: ApiHandler;
          default?: { fetch?: ApiHandler };
        };
        fetchHandler = mod.default?.fetch ?? mod.fetch;
        if (!fetchHandler) {
          console.warn(
            "[vite-plugin-tapi] dist/server/server.js has no fetch export — run `vite build` first.",
          );
        }
      } catch (err) {
        console.error(
          "[vite-plugin-tapi] failed to import dist/server/server.js for preview:",
          err,
        );
      }

      if (!fetchHandler) return;
      previewServer.middlewares.use(
        createApiMiddleware(() => fetchHandler, basePath),
      );
    },

    async closeBundle() {
      if (!isBuildCommand) return;

      const VIRTUAL_SERVER_ID = "virtual:tapi-server";
      const RESOLVED_VIRTUAL_SERVER_ID = "\0" + VIRTUAL_SERVER_ID;

      const inlinePlugin = (): Plugin => ({
        name: "tapi-server-virtual",
        resolveId(id) {
          return id === VIRTUAL_SERVER_ID ? RESOLVED_VIRTUAL_SERVER_ID : null;
        },
        load(id) {
          if (id !== RESOLVED_VIRTUAL_SERVER_ID) return null;
          return [
            `import { createRequestHandler } from "@farbenmeer/tapi/server";`,
            `import { api } from ${JSON.stringify(resolvedEntry)};`,
            ``,
            `export const fetch = createRequestHandler(api, { basePath: ${JSON.stringify(basePath)} });`,
            `export default { fetch };`,
          ].join("\n");
        },
      });

      const { build } = await import("vite");
      await build({
        root: resolvedRoot,
        configFile: false,
        logLevel: "silent",
        plugins: [inlinePlugin()],
        // noExternal: true so node_modules are bundled by default;
        // only packages in options.external are kept external.
        ssr: { noExternal: true },
        build: {
          ssr: true,
          outDir: serverOutDir,
          emptyOutDir: false,
          sourcemap: true,
          rolldownOptions: {
            input: { server: VIRTUAL_SERVER_ID },
            output: {
              format: "esm",
              entryFileNames: "[name].js",
            },
            external: options.external ?? [],
          },
        },
      });
    },
  };
}
