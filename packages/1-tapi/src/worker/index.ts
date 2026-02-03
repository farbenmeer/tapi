import { TAGS_CONTENT_TYPE } from "../shared/constants";
import { isMutation } from "../shared/is-mutation";
import { getMetadata, invalidateTags } from "./cache-meta";
import { mutateAndInvalidate } from "./mutate-and-invalidate";
import { serveFromNetwork } from "./serve-from-network";

declare const self: ServiceWorkerGlobalScope;

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

export async function listenForInvalidations(cache: Cache, url: string) {
  console.info("TApi: Listening for invalidations...");

  let res: Response | null = null;
  const MAX_ATTEMPTS = 1000;
  for (let retry = 0; retry < MAX_ATTEMPTS; retry++) {
    try {
      res = await fetch(url);
      break;
    } catch (error) {
      console.warn(
        `TApi: Failed attempt #${retry + 1} to open invalidation stream`,
        error
      );
    }
    await new Promise((resolve) =>
      setTimeout(resolve, 500 * Math.pow(2, retry))
    );
  }

  if (!res) {
    console.error(
      `TApi: Failed to open invalidation stream after ${MAX_ATTEMPTS} attempts`
    );
    return;
  }

  const contentType = res.headers.get("Content-Type");
  if (!res.ok || contentType !== TAGS_CONTENT_TYPE || !res.body) {
    console.error(
      "TApi: Failed to open invalidation stream. Unregistering service worker.",
      res.status,
      res.statusText
    );
    await self.registration.unregister();
    return;
  }

  console.info("TApi: Invalidation Stream Connection Established");

  try {
    let buffer = "";
    const decoder = new TextDecoder();
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk);
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const rawTags = line.trim();
        if (!rawTags) continue;
        const tags = rawTags.split(" ");
        console.info("TApi: Invalidating tags", tags);
        await invalidateTags(cache, tags);
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({ type: "TAPI_INVALIDATE_TAGS", tags });
        }
      }
    }
  } catch (error) {
    console.error("Bunny: Failed to read invalidation stream", error);
  }
}
