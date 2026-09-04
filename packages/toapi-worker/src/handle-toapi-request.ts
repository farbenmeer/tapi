import type { Logger } from "@toapi/common";
import { isMutation } from "@toapi/common";
import { getCachedEntry, getMetadata } from "./cache.js";
import { mutateAndInvalidate } from "./mutate-and-invalidate.js";
import { serveFromNetwork } from "./serve-from-network.js";
import { consoleFallback } from "./console-fallback.js";

export async function handleToapiRequest(
  req: Request,
  options?: { logger?: Logger },
) {
  const logger = consoleFallback(options?.logger);

  if (isMutation(req)) {
    return mutateAndInvalidate(req);
  } else {
    const cachedResponse = await getCachedEntry(req);

    if (!cachedResponse) {
      // no cached response, serve from network
      return serveFromNetwork(req);
    }

    const meta = await getMetadata(req.url);

    if (meta && (!meta.expiresAt || meta.expiresAt > Date.now())) {
      return cachedResponse;
    } else {
      // cached response is expired
      try {
        // try to serve from network
        return await serveFromNetwork(req);
      } catch (error) {
        // probably network not available, serve old response
        logger.error(error);
        return cachedResponse;
      }
    }
  }
}

/**
 * @deprecated Renamed to {@link handleToapiRequest} as part of the tapi → toapi
 * rebrand. This alias points to the same function and will be removed in a
 * future major version.
 */
export const handleTapiRequest = handleToapiRequest;
