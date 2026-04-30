import fs from "node:fs";
import path from "node:path";
import { loadEnv, type Plugin, type ViteDevServer } from "vite";
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
        environments: {
          ssr: {
            build: {
              // Client build runs first and empties dist; ssr appends server.mjs.
              emptyOutDir: false,
              rolldownOptions: {
                input: VIRTUAL_ID,
                output: {
                  format: "esm",
                  entryFileNames: "server.mjs",
                },
                ...(standalone
                  ? {}
                  : { external: ["srvx", /^@farbenmeer\/tapi(\/.*)?$/] }),
              },
            },
            resolve: standalone ? { noExternal: true } : undefined,
          },
        },
        builder: {
          async buildApp(builder) {
            const hasClient = fs.existsSync(
              path.join(builder.config.root, "index.html"),
            );
            if (hasClient) {
              await builder.build(builder.environments.client);
            }
            await builder.build(builder.environments.ssr);
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
      console.info(`[vite-plugin-tapi] api server on ${server.url}`);

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
