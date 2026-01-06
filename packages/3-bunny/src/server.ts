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
      hooks: {
        error: (error) => {
          console.error(error);
          return error;
        },
      },
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

    next();
  });

  app.use(serveStatic(dist));

  return app;
}
