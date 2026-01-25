import { isMutation } from "../shared/is-mutation";
import { getMetadata } from "./cache-meta";
import { mutateAndInvalidate } from "./mutate-and-invalidate";
import { serveFromNetwork } from "./serve-from-network";

export async function handleTapiRequest(cache: Cache, req: Request) {
  if (isMutation(req)) {
    return mutateAndInvalidate(cache, req);
  } else {
    const cachedResponse = await cache.match(req.url);

    if (!cachedResponse) {
      // no cached response, serve from network
      return serveFromNetwork(cache, req);
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
          return serveFromNetwork(cache, req);
        } catch (error) {
          // probably network not available, serve old response
          console.error("TApi Worker fetch failed", error);
          return cachedResponse;
        }
      }
    }

    // no expiration header, serve cached response
    return cachedResponse;
  }
}
