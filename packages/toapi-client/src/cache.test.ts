import { describe, expect, test, vi } from "vitest";
import { TAGS_HEADER } from "@toapi/common";
import { Cache } from "./cache.js";

/** A promise whose resolution is controlled externally. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Drain the microtask + macrotask queues so async cache work settles. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function jsonResponse(body: unknown, tags: string[]) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      [TAGS_HEADER]: tags.join(" "),
    },
  });
}

describe("Cache", () => {
  test("stale in-flight revalidation of an evicted entry does not corrupt the replacement's tag index", async () => {
    // A large minTTL keeps the queued cleanup timeouts from firing during the
    // test, so the only mutations we observe come from the race under test.
    const cache = new Cache({ minTTL: 100_000 });
    const url = "/thing";

    // entry A: first fetch returns tags ["thing"]; the second fetch (the
    // revalidation triggered below) stays in-flight until we resolve it, and
    // then re-tags to ["other"] — dropping the "thing" membership.
    const staleRevalidation = deferred<Response>();
    let aCalls = 0;
    const fetchA = vi.fn(() => {
      aCalls += 1;
      if (aCalls === 1) return Promise.resolve(jsonResponse({ v: "a1" }, ["thing"]));
      return staleRevalidation.promise;
    });

    // Load entry A and keep it alive with a subscriber so entry.current is set.
    const obsA = cache.request(url, fetchA);
    const unsubscribeA = obsA.subscribe(vi.fn());
    await obsA;
    await flush();

    // Kick off a revalidation of A that stays in-flight (fetch #2 is pending).
    // Don't await — it only settles once we resolve `staleRevalidation`.
    const staleRevalidationDone = cache.revalidateUrl(url);
    await flush();

    // Subscribers drop to zero, then another revalidateUrl takes the
    // zero-subscriber branch and evicts A (removing its "thing" tag membership)
    // while its revalidation is still in-flight.
    unsubscribeA();
    await cache.revalidateUrl(url);

    // A fresh request installs a NEW entry (B) for the same url, tagged
    // "thing", re-registering the url under tagIndex["thing"].
    const fetchB = vi.fn(() => Promise.resolve(jsonResponse({ v: "b" }, ["thing"])));
    const obsB = cache.request(url, fetchB);
    obsB.subscribe(vi.fn());
    await obsB;
    await flush();
    expect(fetchB).toHaveBeenCalledTimes(1);

    // The stale revalidation of the evicted entry A finally resolves. Its
    // completion must NOT touch the shared tag index, because the url now
    // belongs to entry B.
    staleRevalidation.resolve(jsonResponse({ v: "a2" }, ["other"]));
    await staleRevalidationDone;
    await flush();

    // Entry B must still be reachable through the "thing" tag: a tag
    // invalidation should refresh it.
    await cache.revalidateTags(["thing"]);
    expect(fetchB).toHaveBeenCalledTimes(2);
  });
});
