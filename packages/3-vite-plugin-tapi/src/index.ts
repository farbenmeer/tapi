import path from "node:path";
import type { Plugin } from "vite";
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { createApiMiddleware } from "./createApiMiddleware.js";
import type { ApiHandler } from "./ApiHandler.js";

export interface TapiServerOptions {
  /**
   * Target runtime for the production server entry.
   * When set to `"node"`, emits `dist/server.mjs` that imports `api.mjs`
   * and serves it using `serve` from `srvx/node`.
   */
  runtime?: "node";
  /**
   * When `true`, `dist/server.mjs` also serves static assets from the
   * same directory as itself (the dist/ folder). Requires `runtime: "node"`.
   */
  serveStaticAssets?: boolean;
}

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
   * Default port for the production server entry (`dist/server.mjs`).
   * Falls back to the `PORT` environment variable at runtime.
   * In dev/preview mode, also used to set Vite's server port when `PORT` is unset.
   */
  port?: number;
  /**
   * Packages to mark as external in the `api.mjs` build.
   * Passed directly to `rolldownOptions.external`.
   * By default everything is bundled; only explicitly listed packages are kept external.
   */
  external?: (string | RegExp)[];
  /**
   * Production server configuration. When provided with `runtime: "node"`,
   * emits `dist/server.mjs`.
   */
  server?: TapiServerOptions;
}

function generateServerMjs(options: TapiPluginOptions): string {
  const port = options.port ?? 3000;

  if (options.server?.serveStaticAssets) {
    return [
      `import handler from "./api.mjs";`,
      `import { serve } from "srvx/node";`,
      `import { serveStatic } from "srvx/static";`,
      `import { fileURLToPath } from "node:url";`,
      ``,
      `const staticDir = fileURLToPath(new URL(".", import.meta.url));`,
      `const staticMiddleware = serveStatic({ dir: staticDir });`,
      ``,
      `const port = Number(process.env.PORT) || ${port};`,
      `const server = serve({`,
      `  port,`,
      `  async fetch(req) {`,
      `    const apiRes = await handler.fetch(req);`,
      `    if (apiRes.status !== 404) return apiRes;`,
      `    return staticMiddleware(req, () => new Response("Not Found", { status: 404 }));`,
      `  },`,
      `});`,
      `await server.ready();`,
      `console.info(\`[tapi] server listening on \${server.url}\`);`,
      ``,
    ].join("\n");
  }

  return [
    `import handler from "./api.mjs";`,
    `import { serve } from "srvx/node";`,
    ``,
    `const port = Number(process.env.PORT) || ${port};`,
    `const server = serve({ port, ...handler });`,
    `await server.ready();`,
    `console.info(\`[tapi] server listening on \${server.url}\`);`,
    ``,
  ].join("\n");
}

export default function tapi(options: TapiPluginOptions = {}): Plugin {
  const entryOption = options.entry ?? "src/api.ts";
  const basePath = options.basePath ?? "/api";

  let resolvedEntry = "";
  let resolvedRoot = "";
  let resolvedOutDir = "";
  let isBuildCommand = false;
  let currentHandler: ApiHandler | undefined;

  return {
    name: "vite-plugin-tapi",

    config(_userConfig, env) {
      // Never override the user's build config — closeBundle handles the API build.
      // In dev/preview, forward port to Vite's server so there is one entry point.
      if (env.command === "build") return;

      const port =
        options.port ??
        (process.env.PORT ? Number(process.env.PORT) : undefined);
      if (!port) return;
      return { server: { port }, preview: { port } };
    },

    configResolved(config) {
      resolvedEntry = path.isAbsolute(entryOption)
        ? entryOption
        : path.resolve(config.root, entryOption);
      resolvedRoot = config.root;
      resolvedOutDir = path.resolve(config.root, config.build.outDir);
      isBuildCommand = config.command === "build";
    },

    async configureServer(vite) {
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
      const apiMjsPath = path.join(
        path.resolve(
          previewServer.config.root,
          previewServer.config.build.outDir,
        ),
        "api.mjs",
      );

      let fetchHandler: ApiHandler | undefined;
      try {
        const mod = (await import(apiMjsPath)) as {
          fetch?: ApiHandler;
          default?: { fetch?: ApiHandler };
        };
        fetchHandler = mod.default?.fetch ?? mod.fetch;
        if (!fetchHandler) {
          console.warn(
            "[vite-plugin-tapi] dist/api.mjs has no fetch export — run `vite build` first.",
          );
        }
      } catch (err) {
        console.error(
          "[vite-plugin-tapi] failed to import dist/api.mjs for preview:",
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

      const VIRTUAL_API_ID = "virtual:tapi-api";
      const RESOLVED_VIRTUAL_API_ID = "\0" + VIRTUAL_API_ID;

      const inlinePlugin = (): Plugin => ({
        name: "tapi-api-virtual",
        resolveId(id) {
          return id === VIRTUAL_API_ID ? RESOLVED_VIRTUAL_API_ID : null;
        },
        load(id) {
          if (id !== RESOLVED_VIRTUAL_API_ID) return null;
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
          outDir: resolvedOutDir,
          emptyOutDir: false,
          rolldownOptions: {
            input: { api: VIRTUAL_API_ID },
            output: {
              format: "esm",
              entryFileNames: "[name].mjs",
            },
            external: options.external ?? [],
          },
        },
      });

      if (options.server?.runtime === "node") {
        const { writeFile } = await import("node:fs/promises");
        await writeFile(
          path.join(resolvedOutDir, "server.mjs"),
          generateServerMjs(options),
          "utf8",
        );
      }
    },
  };
}
