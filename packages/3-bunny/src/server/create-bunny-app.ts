import type { ApiDefinition } from "@farbenmeer/tapi/server";
import {
  createRequestHandler,
  PubSub,
  streamRevalidatedTags,
} from "@farbenmeer/tapi/server";
import connect from "connect";
import { readFileSync } from "node:fs";
import path from "node:path";
import serveStatic from "serve-static";
import { loadEnv } from "../load-env.js";
import { fromResponse, toRequest } from "./node-http-adapter.js";
import type { Cache } from "@farbenmeer/tapi/server";
import type { ServerConfig } from "../config.js";
import { parseURL } from "./parse-url.js";
import { readFile } from "node:fs/promises";

interface BunnyServerOptions {
  api: () => Promise<{ api: ApiDefinition<any>; cache?: Cache }>;
  dist: string;
  serverConfig?: ServerConfig;
}

export function createBunnyApp({
  api,
  dist,
  serverConfig,
}: BunnyServerOptions) {
  loadEnv("production");
  const app = connect();
  const apiRequestHandler = api().then(async ({ api }) =>
    createRequestHandler(api, {
      basePath: "/api",
      hooks: {
        error: (error) => {
          console.error(error);
        },
      },
    }),
  );

  app.use(async (req, res, next) => {
    if (!req.url) return next();
    const url = parseURL(serverConfig, req);

    if (/^\/api(\/|$)/.test(url.pathname)) {
      const request = toRequest(req, url);
      const response = await apiRequestHandler.then((handle) =>
        handle(request),
      );
      if (response.status < 300) {
        console.info(
          `Bunny: ${request.method} ${url.pathname} ${response.status} ${response.statusText}`,
        );
      } else {
        console.error(
          `Bunny: ${request.method} ${url.pathname} ${response.status} ${response.statusText}`,
        );
      }
      await fromResponse(res, response);
      return;
    }

    next();
  });

  app.use(serveStatic(dist, { index: false }));

  // SPA fallback: serve index.html for non-API, non-static routes
  let indexHtml: string | null = null;
  app.use(async (_req, res) => {
    indexHtml ??= await readFile(path.join(dist, "index.html"), "utf-8");
    res.setHeader("Content-Type", "text/html");
    res.end(indexHtml);
  });

  return app;
}
