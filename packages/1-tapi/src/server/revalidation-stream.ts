import {
  SESSION_COOKIE_NAME,
  TAGS_CONTENT_TYPE,
} from "../shared/constants.js";
import type { Cache } from "./cache.js";

const KEEPALIVE_INTERVAL = 10 * 1000;

interface Options {
  cache: Cache;
}

export function streamRevalidatedTags({ cache }: Options) {
  const id = crypto.randomUUID();
  let interval: ReturnType<typeof setInterval> | null = null;
  let unsubscribe = () => {};
  const stream = new ReadableStream({
    async start(controller) {
      const textEncoder = new TextEncoder();
      // subscribe to tag invalidations
      unsubscribe = cache.subscribe((tags, meta) => {
        // ignore our own invalidations
        if (
          meta &&
          typeof meta === "object" &&
          "clientId" in meta &&
          meta.clientId === id
        )
          return;
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

  const headers = new Headers({
    "Set-Cookie": `${SESSION_COOKIE_NAME}=${id}; Path=/; HttpOnly; SameSite=Strict`,
    "Content-Type": TAGS_CONTENT_TYPE,
  });

  return new Response(stream, {
    headers,
  });
}
