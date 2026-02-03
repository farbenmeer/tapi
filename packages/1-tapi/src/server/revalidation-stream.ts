import { SESSION_COOKIE_NAME, TAGS_CONTENT_TYPE } from "../shared/constants";
import type { Cache } from "./cache";

export function streamRevalidations(cache: Cache) {
  return async () => {
    const id = crypto.randomUUID();
    const stream = new ReadableStream({
      async start(controller) {
        // subscribe to tag invalidations
        cache.subscribe((tags, meta) => {
          // ignore our own invalidations
          if (meta.clientId === id) return;
          // send tags to client
          controller.enqueue(`${tags.join(" ")}\n`);
        });

        // keepalive
        setTimeout(() => {
          controller.enqueue("\n");
        }, 5000);

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Set-Cookie": `${SESSION_COOKIE_NAME}=${id}; Path=/; HttpOnly; SameSite=Strict`,
        "Content-Type": TAGS_CONTENT_TYPE,
      },
    });
  };
}
