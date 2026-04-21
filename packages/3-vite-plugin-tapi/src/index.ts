import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { serve, type ServerHandler, type Server } from "srvx";
import { createRequestHandler } from "@farbenmeer/tapi/server";

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
   * Port for the dev server. Default: `PORT` env var or `3000`.
   */
  port?: number;
  /**
   * If `true`, the production build inlines `srvx` and `@farbenmeer/tapi`
   * into the output so it runs without `node_modules`. Default: `false`.
   */
  standalone?: boolean;
}

const VIRTUAL_ID = "virtual:tapi-server";
const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_ID;

export default function tapi(options: TapiPluginOptions = {}): Plugin {
  const entryOption = options.entry ?? "src/api.ts";
  const basePath = options.basePath ?? "/api";
  const standalone = options.standalone ?? false;

  let resolvedEntry = "";
  let server: Server | undefined;
  let currentHandler: ServerHandler | undefined;

  return {
    name: "vite-plugin-tapi",

    config(_userConfig, env) {
      if (env.command !== "build") return;
      return {
        build: {
          ssr: true,
          outDir: "dist",
          rolldownOptions: {
            input: VIRTUAL_ID,
            output: {
              format: "esm",
              entryFileNames: "server.mjs",
            },
            external: standalone
              ? []
              : ["srvx", /^@farbenmeer\/tapi(\/.*)?$/],
          },
        },
      };
    },

    configResolved(config) {
      resolvedEntry = path.isAbsolute(entryOption)
        ? entryOption
        : path.resolve(config.root, entryOption);
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;
      const entryImport = JSON.stringify(resolvedEntry);
      return [
        `import { serve } from "srvx";`,
        `import { createRequestHandler } from "@farbenmeer/tapi/server";`,
        `import { api } from ${entryImport};`,
        ``,
        `const fetch = createRequestHandler(api, { basePath: ${JSON.stringify(basePath)} });`,
        `const port = Number(process.env.PORT) || ${options.port ?? 3000};`,
        ``,
        `const server = serve({ port, fetch });`,
        `await server.ready();`,
        `console.info(\`[tapi] server listening on \${server.url}\`);`,
        ``,
      ].join("\n");
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

      const port = options.port ?? (Number(process.env.PORT) || 3000);
      server = serve({
        port,
        fetch: async (req) => {
          if (!currentHandler) {
            return new Response("[vite-plugin-tapi] api not loaded", {
              status: 503,
            });
          }
          return currentHandler(req);
        },
      });
      await server.ready();
      console.info(`[vite-plugin-tapi] dev server on ${server.url}`);

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

      registerShutdown(vite);
    },

    async closeBundle() {
      await server?.close();
      server = undefined;
    },
  };

  function registerShutdown(vite: ViteDevServer) {
    const close = async () => {
      await server?.close();
      server = undefined;
    };
    vite.httpServer?.on("close", close);
  }
}
