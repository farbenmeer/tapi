import { serve } from "srvx";
import { createRequestHandler } from "@farbenmeer/tapi/server";

type Api = Parameters<typeof createRequestHandler>[0];

export interface StartServerOptions {
  api: Api;
  basePath: string;
  port: number;
}

/**
 * Production runtime for the bundled `server.mjs`. Imported by the
 * plugin's virtual entry — not part of the user-facing API surface.
 *
 * @internal
 */
export async function startServer(opts: StartServerOptions): Promise<void> {
  const fetch = createRequestHandler(opts.api, { basePath: opts.basePath });
  const server = serve({ port: opts.port, fetch });
  await server.ready();
  console.info(`[tapi] server listening on ${server.url}`);
}
