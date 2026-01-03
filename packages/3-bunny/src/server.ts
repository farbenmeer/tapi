export * from "@farbenmeer/tapi/server";
import { createRequestHandler } from "@farbenmeer/tapi/server";
import connect from "connect";
import serveStatic from "serve-static";
import type { ApiDefinition } from "@farbenmeer/tapi/server";
import { fromResponse, toRequest } from "./node-http-adapter.js";
import { loadEnv } from "./load-env.js";

interface BunnyServerOptions {
  api: () => Promise<{ api: ApiDefinition<any> }>;
  dist: string;
}

export function createBunnyApp({ api, dist }: BunnyServerOptions) {
  loadEnv("production");
  const app = connect();
  const apiRequestHandler = api().then(({ api }) =>
    createRequestHandler(api, {
      basePath: "/api",
    })
  );

  app.use(async (req, res, next) => {
    if (!req.url) return next();
    const forwarded = req.headers["x-forwarded-for"];
    const host = forwarded ?? req.headers["host"] ?? `localhost:3000`;
    const url = new URL(req.url, `http://${host}`);

    if (/^\/api(\/|$)/.test(url.pathname)) {
      const request = toRequest(req, url);
      const response = await apiRequestHandler.then((handle) =>
        handle(request)
      );
      await fromResponse(res, response);
      res.end();
      return;
    }

    next();
  });

  app.use(serveStatic(dist));

  return app;
}
