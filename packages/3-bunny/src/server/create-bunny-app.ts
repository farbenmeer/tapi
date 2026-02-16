import type { ApiDefinition } from "@farbenmeer/tapi/server";
import {
  createRequestHandler,
  generateOpenAPISchema,
  PubSub,
  streamRevalidatedTags,
} from "@farbenmeer/tapi/server";
import connect from "connect";
import { readFileSync } from "node:fs";
import path from "node:path";
import serveStatic from "serve-static";
import { INVALIDATIONS_ROUTE } from "../constants.js";
import { loadEnv } from "../load-env.js";
import { fromResponse, toRequest } from "./node-http-adapter.js";
import type { Cache } from "@farbenmeer/tapi/server";
import { readFile } from "node:fs/promises";

interface BunnyServerOptions {
  api: () => Promise<{ api: ApiDefinition<any>; cache?: Cache }>;
  dist: string;
  apiInfo: { title: string; version: string; buildId: string };
}

export function createBunnyApp({ api, dist, apiInfo }: BunnyServerOptions) {
  loadEnv("production");
  const app = connect();
  const cache = api().then(({ cache = new PubSub() }) => cache);
  const apiRequestHandler = api().then(async ({ api }) =>
    createRequestHandler(api, {
      basePath: "/api",
      hooks: {
        error: (error) => {
          console.error(error);
        },
      },
      cache: await cache,
    }),
  );
  let openApiJson: string | undefined;

  app.use(async (req, res, next) => {
    if (!req.url) return next();
    const forwarded = req.headers["x-forwarded-for"];
    const host = forwarded ?? req.headers["host"] ?? `localhost:3000`;
    const url = new URL(req.url, `http://${host}`);

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

    if (url.pathname === "/.well-known/openapi.json") {
      if (!openApiJson) {
        openApiJson = JSON.stringify(
          await generateOpenAPISchema((await api()).api, {
            info: apiInfo,
          }),
        );
      }
      res.setHeader("Content-Type", "application/json");
      res.write(openApiJson);
      res.end();
      return;
    }

    if (url.pathname === INVALIDATIONS_ROUTE) {
      const response = streamRevalidatedTags({
        cache: await cache,
        buildId: apiInfo.buildId,
      });
      console.info(`Bunny: Starting Invalidation Stream`);
      response.headers.forEach((value, key) => {
        res.appendHeader(key, value);
      });
      if (res.closed) {
        return;
      }
      res.flushHeaders();
      if (response.body) {
        for await (const chunk of response.body) {
          res.write(chunk);
        }
      }
      console.info("Bunny: Closed Invalidation Stream");
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
