import {
  INVALIDATION_POST_EVENT,
  TAGS_CONTENT_TYPE,
} from "../shared/constants";
import { deleteCache, expireAll, invalidateTags } from "./cache";

declare const self: ServiceWorkerGlobalScope;

interface Options {
  url: string;
}

export async function listenForInvalidations({ url }: Options) {
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
        error,
      );
    }
    await new Promise((resolve) =>
      setTimeout(resolve, 500 * Math.pow(2, retry)),
    );
  }

  if (!res) {
    console.error(
      `TApi: Failed to open invalidation stream after ${MAX_ATTEMPTS} attempts, giving up.`,
    );
    return;
  }

  const contentType = res.headers.get("Content-Type");
  if (!res.ok || contentType !== TAGS_CONTENT_TYPE || !res.body) {
    console.error(
      "TApi: Failed to open invalidation stream. Cleaning up and unregistering service worker.",
      res.status,
      res.statusText,
    );
    await deleteCache();
    await self.registration.unregister();
    return;
  }

  console.info("TApi: Invalidation Stream Connection Established");

  try {
    const tags = await expireAll();
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({ type: INVALIDATION_POST_EVENT, tags });
    }
    console.info("TApi: Marked all cached entries as expired");
  } catch {
    console.warn("TApi: Failed to expire existing cache entries");
  }

  try {
    let buffer = "";
    const decoder = new TextDecoder();
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk);
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      const clients = await self.clients.matchAll();

      for (const line of lines) {
        const rawTags = line.trim();
        if (!rawTags) continue;
        const tags = rawTags.split(" ");
        console.info("TApi: Remote-Invalidating tags", tags);
        await invalidateTags(tags);
        for (const client of clients) {
          client.postMessage({ type: INVALIDATION_POST_EVENT, tags });
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "NetworkError") {
      console.info(
        "TApi: Network disconnected, retrying revalidation connection...",
      );
      setTimeout(() => {
        listenForInvalidations({ url });
      }, 5000);
    }
    console.error("TApi: Failed to read invalidation stream", error);
  }
}
