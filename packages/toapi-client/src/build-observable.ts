import type { Logger, Observable, Subscription } from "@toapi/common";
import type { PubSub } from "./pub-sub.js";
import type { Cache } from "./cache.js";
import { request } from "./request.js";

interface Options {
  fetch(url: string, init: RequestInit): Promise<Response>;
  url: string;
  init: RequestInit;
  pubSub: PubSub;
  cache: Cache;
  logger?: Logger;
}

export function buildObservable(
  options: Options,
): Observable<unknown> & Promise<unknown> {
  const { url, pubSub, logger } = options;
  const { data } = request(options);

  function subscribe(callback: Subscription<unknown>) {
    const { data } = request(options);
    callback(data);
    return pubSub.subscribe(async (invalidUrls) => {
      if (invalidUrls.has(url)) {
        const { data } = request(options);
        // TODO in major release pass the finished data, not the promise here so subscribers don't need to bother with races.
        try {
          await callback(data);
        } catch (error) {
          logger?.error?.(error);
        }
      }
    });
  }

  return Object.assign(data, {
    subscribe,
    queryKey: url,
  });
}
