import {
  createRequestHandler,
  generateOpenAPISchema,
} from "@farbenmeer/tapi/server";
import { Command } from "commander";
import connect from "connect";
import esbuild from "esbuild";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "../load-env.js";
import { fromResponse, toRequest } from "../node-http-adapter.js";
import { readConfig } from "./read-config.js";

export const dev = new Command()
  .name("dev")
  .description("Bunny Development server")
  .option("--port <port>", "Port to listen on", "3000")
  .action(async ({ port }) => {
    const config = await readConfig();
    const bunnyDir = path.join(process.cwd(), ".bunny/dev");
    if (existsSync(bunnyDir)) {
      await rm(bunnyDir, { recursive: true });
    }
    await mkdir(bunnyDir, { recursive: true });
    const srcDir = path.join(process.cwd(), "src");

    loadEnv("development");

    const viteServer = await createServer({
      configFile: false,
      root: srcDir,
      mode: "development",
      ...config.vite,
      server: {
        middlewareMode: true,
        ...config.vite?.server,
      },
      plugins: [...(config.vite?.plugins ?? []), viteTsconfigPaths()],
    });

    const app = connect();

    let apiRequestHandler: (req: Request) => Promise<Response>;
    let openAPISchema: string;
    async function reload() {
      const { api } = await import(
        path.resolve(bunnyDir, `api.cjs?ts=${Date.now()}`)
      );
      apiRequestHandler = createRequestHandler(api, {
        basePath: "/api",
        hooks: {
          error: (error) => {
            console.error(error);
          },
        },
      });
      const packageJson = JSON.parse(
        await readFile(path.join(process.cwd(), "package.json"), "utf8")
      );
      const schema = await generateOpenAPISchema(api, {
        info: {
          title: packageJson.name,
          version: packageJson.version,
        },
      });
      openAPISchema = JSON.stringify(schema);
    }

    const esbuildContext = await esbuild.context({
      entryPoints: [path.resolve(srcDir, "api.ts")],
      bundle: true,
      packages: "external",
      outdir: bunnyDir,
      platform: "node",
      target: "node24",
      outExtension: { ".js": ".cjs" },
      plugins: [
        {
          name: "bunny-hot-reload",
          setup(build) {
            build.onEnd(async () => {
              await reload();
            });
          },
        },
      ],
    });

    await esbuildContext.watch();

    app.use(async (req, res, next) => {
      if (!req.url) return next();
      const forwarded = req.headers["x-forwarded-for"];
      const host = forwarded ?? req.headers["host"] ?? `localhost:${port}`;
      const url = new URL(req.url, `http://${host}`);
      if (/^\/api(\/|$)/.test(url.pathname)) {
        const request = toRequest(req, url);
        const response = await apiRequestHandler(request);
        if (response.status < 300) {
          console.info(
            `Bunny: ${request.method} ${url.pathname} ${response.status} ${response.statusText}`
          );
        } else {
          console.error(
            `Bunny: ${request.method} ${url.pathname} ${response.status} ${response.statusText}`
          );
        }
        await fromResponse(res, response);
        res.end();
        return;
      }
      if (url.pathname === "/.well-known/openapi.json") {
        res.setHeader("Content-Type", "application/json");
        res.write(openAPISchema);
        res.end();
        return;
      }
      next();
    });

    app.use(viteServer.middlewares);

    app.listen(parseInt(port, 10));
    console.log(`Dev-Server started on port ${port}`);
  });
