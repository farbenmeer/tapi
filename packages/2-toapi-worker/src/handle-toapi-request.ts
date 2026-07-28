import type { Logger } from "@toapi/common";
import { isMutation } from "@toapi/common";
import { getCachedEntry, getMetadata } from "./cache";
import { mutateAndInvalidate } from "./mutate-and-invalidate";
import { serveFromNetwork } from "./serve-from-network";

export async function handleToapiRequest(
  req: Request,
  options?: { logger?: Logger },
) {
  const errorLog =
    options?.logger?.error ??
    ((err: unknown) => console.error("Toapi Worker fetch failed", err));

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
          return await serveFromNetwork(req);
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

/**
 * @deprecated Renamed to {@link handleToapiRequest} as part of the tapi → toapi
 * rebrand. This alias points to the same function and will be removed in a
 * future major version.
 */
export const handleTapiRequest = handleToapiRequest;
