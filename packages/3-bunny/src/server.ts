export * from "@farbenmeer/tapi/server";
import { createRequestHandler } from "@farbenmeer/tapi/server";
import connect from "connect";
import serveStatic from "serve-static";
import type { ApiDefinition } from "../../1-tapi/dist/server/define-api";
import { fromResponse, toRequest } from "./node-http-adapter";

interface BunnyServerOptions {
  port: number;
  api: ApiDefinition<any>;
  dist: string;
}

export function startBunnyServer({ port, api, dist }: BunnyServerOptions) {
  const app = connect();
  const apiRequestHandler = createRequestHandler(api, { basePath: "/api" });

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

    next();
  });

  app.use(serveStatic(dist));

  const server = app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });

  return server;
}
