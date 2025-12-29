import {
  createRequestHandler,
  generateOpenAPISchema,
} from "@farbenmeer/tapi/server";
import { Command } from "commander";
import connect from "connect";
import esbuild from "esbuild";
import { mkdir, readFile, rm } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createServer } from "vite";
import { fromResponse, toRequest } from "../node-http-adapter.js";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { existsSync } from "node:fs";

export const dev = new Command()
  .name("dev")
  .description("Bunny Development server")
  .option("--port <port>", "Port to listen on", "3000")
  .action(async ({ port }) => {
    const bunnyDir = path.join(process.cwd(), ".bunny/dev");
    if (existsSync(bunnyDir)) {
      await rm(bunnyDir, { recursive: true });
    }
    await mkdir(bunnyDir, { recursive: true });
    const srcDir = path.join(process.cwd(), "src");

    const viteServer = await createServer({
      configFile: false,
      root: srcDir,
      server: {
        middlewareMode: true,
      },
      mode: "development",
      plugins: [viteTsconfigPaths()],
    });

    const app = connect();

    let apiRequestHandler: (req: Request) => Promise<Response>;
    let openAPISchema: string;
    async function reload() {
      for (const key of Object.keys(require.cache)) {
        if (key.startsWith(bunnyDir)) {
          delete require.cache[key];
        }
      }
      const { api } = require(path.resolve(bunnyDir, "api.js"));
      apiRequestHandler = createRequestHandler(api, {
        basePath: "/api",
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
        fromResponse(res, response);
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

    http.createServer(app).listen(parseInt(port, 10));
    console.log(`Dev-Server started on port ${port}`);
  });
