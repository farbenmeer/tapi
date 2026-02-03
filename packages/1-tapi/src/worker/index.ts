import { isMutation } from "../shared/is-mutation";
import { getCachedEntry, getMetadata } from "./cache";
import { mutateAndInvalidate } from "./mutate-and-invalidate";
import { serveFromNetwork } from "./serve-from-network";
export { listenForInvalidations } from "./revalidation-stream";

export async function handleTapiRequest(buildId: string, req: Request) {
  if (isMutation(req)) {
    return mutateAndInvalidate(buildId, req);
  } else {
    const cachedResponse = await getCachedEntry(buildId, req);

    if (!cachedResponse) {
      // no cached response, serve from network
      return serveFromNetwork(buildId, req);
    }

    const meta = await getMetadata(buildId, req.url);

    if (meta?.expiresAt) {
      if (meta.expiresAt > Date.now()) {
        // cached response is still valid
        return cachedResponse;
      } else {
        // cached response is expired
        try {
          // try to serve from network
          return serveFromNetwork(buildId, req);
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
