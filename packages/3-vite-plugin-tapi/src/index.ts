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
  /**
   * How the production server (`dist/server.js`) serves the client build.
   *
   * By default the bundled server serves the static client
   * (`<outDir>/client`, a sibling of `server.js`) and, for navigations that
   * match no file, falls back to `index.html` so history-routed SPAs survive
   * deep-links and reloads. This makes `srvx serve --entry dist/server.js` a
   * complete single-host deployment — no `-s` flag, no separate static host.
   *
   * Static serving uses `node:fs`, so it requires a Node/Bun/Deno runtime
   * with filesystem access (the documented `srvx` deployment).
   *
   * - `true` (default): serve static files + SPA fallback to `index.html`.
   * - `false`: API only — the client is served by a dedicated static host /
   *   CDN, or a runtime without filesystem access (Workers).
   * - `{ fallback: false }`: serve static files but `404` instead of the SPA
   *   fallback (multi-page apps without client-side routing).
   * - `{ fallback: "404.html" }`: serve that file (relative to the client
   *   dir) for unmatched navigations instead of `index.html`.
   *
   * Default: `true`.
   */
  static?: boolean | { fallback?: boolean | string };
}

/**
 * Generate the source of the bundled production server (`dist/server.js`).
 *
 * `serveClient: false` reproduces the historical API-only handler. Otherwise
 * the handler composes three layers, in order:
 *   1. API routes under `basePath` (handled by `createRequestHandler`),
 *   2. static files from `./client` (the sibling client build), and
 *   3. an `index.html` SPA fallback for unmatched GET/HEAD navigations.
 *
 * With an empty `basePath` the API is root-mounted, so static files are tried
 * first and the API gets a chance before the SPA fallback.
 */
function buildServerModule(opts: {
  resolvedEntry: string;
  basePath: string;
  serveClient: boolean;
  spaFallback: string | null;
}): string {
  const { resolvedEntry, basePath, serveClient, spaFallback } = opts;

  if (!serveClient) {
    return [
      `import { createRequestHandler } from "@farbenmeer/tapi/server";`,
      `import { api } from ${JSON.stringify(resolvedEntry)};`,
      ``,
      `export const fetch = createRequestHandler(api, { basePath: ${JSON.stringify(basePath)} });`,
      `export default { fetch };`,
    ].join("\n");
  }

  return [
    `import { createRequestHandler } from "@farbenmeer/tapi/server";`,
    `import { serveStatic } from "srvx/static";`,
    `import { readFileSync } from "node:fs";`,
    `import { fileURLToPath } from "node:url";`,
    `import { api } from ${JSON.stringify(resolvedEntry)};`,
    ``,
    `const basePath = ${JSON.stringify(basePath)};`,
    `const apiFetch = createRequestHandler(api, { basePath });`,
    ``,
    // The client build is emitted next to this module as ./client.
    `const clientDir = fileURLToPath(new URL("./client", import.meta.url));`,
    `const serveAsset = serveStatic({ dir: clientDir });`,
    ``,
    `const fallbackFile = ${JSON.stringify(spaFallback)};`,
    `let fallbackHtml;`,
    `if (fallbackFile) {`,
    `  try {`,
    `    fallbackHtml = readFileSync(new URL("./client/" + fallbackFile, import.meta.url));`,
    `  } catch {`,
    // No index.html shipped (e.g. API-only client dir) — skip the fallback.
    `    fallbackHtml = undefined;`,
    `  }`,
    `}`,
    ``,
    // Sentinel so a static miss is distinguishable from a real Response.
    `const MISS = Symbol("tapi:static-miss");`,
    ``,
    `export const fetch = async (request) => {`,
    `  const { pathname } = new URL(request.url);`,
    ``,
    // A non-empty basePath cleanly separates API routes from static assets.
    `  if (basePath && (pathname === basePath || pathname.startsWith(basePath + "/"))) {`,
    `    return apiFetch(request);`,
    `  }`,
    ``,
    `  const asset = await serveAsset(request, () => MISS);`,
    `  if (asset !== MISS) return asset;`,
    ``,
    // Root-mounted API: let it answer before we reach for the SPA fallback.
    `  if (!basePath) {`,
    `    const apiResponse = await apiFetch(request);`,
    `    if (apiResponse.status !== 404) return apiResponse;`,
    `  }`,
    ``,
    `  if (fallbackHtml && (request.method === "GET" || request.method === "HEAD")) {`,
    `    return new Response(fallbackHtml, {`,
    `      headers: {`,
    `        "content-type": "text/html; charset=utf-8",`,
    // The shell references hashed assets; never cache the shell itself.
    `        "cache-control": "no-cache",`,
    `      },`,
    `    });`,
    `  }`,
    ``,
    `  return new Response("Not Found", { status: 404 });`,
    `};`,
    `export default { fetch };`,
  ].join("\n");
}

export default function tapi(options: TapiPluginOptions = {}): Plugin {
  const entryOption = options.entry ?? "src/api.ts";
  const basePath = options.basePath ?? "/api";

  // Resolve the `static` option into the production server's behavior:
  // `serveClient` toggles static file serving, `spaFallback` is the file
  // served for unmatched navigations (or `null` to 404 instead).
  const staticOption = options.static ?? true;
  const serveClient = staticOption !== false;
  const spaFallback: string | null = !serveClient
    ? null
    : staticOption === true || staticOption.fallback === undefined
      ? "index.html"
      : staticOption.fallback === true
        ? "index.html"
        : staticOption.fallback === false
          ? null
          : staticOption.fallback;

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
        if (!mod.api.logger) {
          mod.api.logger = {
            error: (error) => {
              if (error instanceof Error) vite.ssrFixStacktrace(error);
              console.error(error);
            },
          };
        }
        currentHandler = createRequestHandler(mod.api, {
          basePath,
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
            "[vite-plugin-tapi] dist/server.js has no fetch export — run `vite build` first.",
          );
        }
      } catch (err) {
        console.error(
          "[vite-plugin-tapi] failed to import dist/server.js for preview:",
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
          return buildServerModule({
            resolvedEntry,
            basePath,
            serveClient,
            spaFallback,
          });
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
