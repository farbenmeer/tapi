import {
  BUILD_ID_HEADER,
  SESSION_COOKIE_NAME,
  TAGS_CONTENT_TYPE,
} from "../shared/constants.js";
import type { Cache } from "./cache.js";

const KEEPALIVE_INTERVAL = 10 * 1000;

interface Options {
  cache: Cache;
  buildId: string;
}

export function streamRevalidatedTags({ cache, buildId }: Options) {
  const id = crypto.randomUUID();
  let interval: NodeJS.Timeout | null = null;
  let unsubscribe = () => {};
  const stream = new ReadableStream({
    async start(controller) {
      const textEncoder = new TextEncoder();
      // subscribe to tag invalidations
      unsubscribe = cache.subscribe((tags, meta) => {
        console.log("revalidated", tags, meta);
        // ignore our own invalidations
        if (meta.clientId === id) return;
        // send tags to client
        controller.enqueue(textEncoder.encode(`${tags.join(" ")}\n`));
      });

      // keepalive
      interval = setInterval(() => {
        controller.enqueue("\n");
      }, KEEPALIVE_INTERVAL);
    },
    cancel() {
      if (interval) clearInterval(interval);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Set-Cookie": `${SESSION_COOKIE_NAME}=${id}; Path=/; HttpOnly; SameSite=Strict`,
      "Content-Type": TAGS_CONTENT_TYPE,
      [BUILD_ID_HEADER]: buildId,
    },
  });
}
