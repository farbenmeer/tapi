import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import { NodeRequest, sendNodeResponse } from "srvx/node";
import type { ApiHandler } from "./ApiHandler.js";

export function createApiMiddleware(
  getHandler: () => ApiHandler | undefined,
  basePath: string,
): Connect.NextHandleFunction {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ) => {
    try {
      const handler = getHandler();
      if (!handler) return next();
      const url = req.url ?? "/";
      if (basePath && !url.startsWith(basePath)) return next();
      const webReq = new NodeRequest({ req, res });
      const webRes = await handler(webReq);
      // When there's no basePath restriction, fall through to Vite on 404
      // so static files, HMR, etc. are still served correctly.
      if (webRes.status === 404 && !basePath) return next();
      await sendNodeResponse(res, webRes);
    } catch (error) {
      console.error(`[vite-plugin-tapi]`, error);
      next();
    }
  };
}
