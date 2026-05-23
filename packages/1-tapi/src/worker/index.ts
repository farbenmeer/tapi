import { isMutation } from "../shared/is-mutation";
import type { Logger } from "../shared/logger";
import { getCachedEntry, getMetadata } from "./cache";
import { mutateAndInvalidate } from "./mutate-and-invalidate";
import { serveFromNetwork } from "./serve-from-network";
export { listenForInvalidations } from "./revalidation-stream";
export { cleanup } from "./cleanup";
export type { CleanupOptions } from "./cleanup";
export type { Logger } from "../shared/logger";

export async function handleTapiRequest(req: Request, options?: { logger?: Logger }) {
  const errorLog = options?.logger?.error ?? ((err: unknown) => console.error("TApi Worker fetch failed", err));

  if (isMutation(req)) {
    return mutateAndInvalidate(req);
  } else {
    const cachedResponse = await getCachedEntry(req);

    if (!cachedResponse) {
      // no cached response, serve from network
      return serveFromNetwork(req);
    }

    const meta = await getMetadata(req.url);

    if (meta?.expiresAt) {
      if (meta.expiresAt > Date.now()) {
        // cached response is still valid
        return cachedResponse;
      } else {
        // cached response is expired
        try {
          // try to serve from network
          return serveFromNetwork(req);
        } catch (error) {
          // probably network not available, serve old response
          errorLog(error);
          return cachedResponse;
        }
      }
    }

    // no expiration header, serve cached response
    return cachedResponse;
  }
}
