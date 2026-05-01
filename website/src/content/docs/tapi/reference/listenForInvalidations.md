---
title: listenForInvalidations
---

`listenForInvalidations` connects a service worker to the server's invalidation stream. When the server invalidates cache tags, the service worker receives them and immediately purges matching cached responses, then notifies all open clients to refetch.

## Usage

Call `listenForInvalidations` once at the top level of your service worker file, outside of any event listener:

```ts
// service-worker.ts
import { handleTapiRequest, listenForInvalidations } from "@farbenmeer/tapi/worker";

declare const self: ServiceWorkerGlobalScope;

const BUILD_ID = "__BUILD_ID__"; // replaced at build time

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api")) {
    event.respondWith(handleTapiRequest(BUILD_ID, event.request));
  }
});

listenForInvalidations({
  url: "/__tapi/invalidations",
  buildId: BUILD_ID,
});
```

The `url` must point to a route handled by [`streamRevalidatedTags`](/tapi/reference/streamrevalidatedtags) on the server. The `buildId` must match the value passed to `streamRevalidatedTags`.

## Signature

```ts
function listenForInvalidations(options: Options): Promise<void>
```

Returns a `Promise` that resolves once the connection is established (or fails after exhausting retries). Reconnection after a network drop is handled automatically.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `url` | `string` | The URL of the server-side invalidation stream endpoint. You can use the built-in `INVALIDATIONS_ROUTE` constant (`/__tapi/invalidations`) or a custom path. |
| `buildId` | `string` | A unique identifier for the current build. Must match the `buildId` passed to `streamRevalidatedTags` on the server. |

## Behavior

### On connection

When `listenForInvalidations` successfully opens the stream, it:

1. Marks **all** currently cached entries as expired.
2. Posts an `TAPI_INVALIDATE_TAGS` message to all open clients with the full list of expired tags, triggering an immediate refetch.

This ensures that any data cached while the service worker was offline or during a previous deployment is immediately refreshed.

### While connected

For each line received from the stream:

1. Parses the space-separated tag names.
2. Invalidates matching cache entries via `invalidateTags`.
3. Posts a `TAPI_INVALIDATE_TAGS` message to all open clients so they refetch affected data.

### On network disconnect

If the stream closes due to a network error, `listenForInvalidations` waits 5 seconds and then reconnects automatically.

### On build ID mismatch

If the `X-TAPI-Build-Id` response header does not match `buildId`, the service worker calls `self.registration.update()` to install the latest version and clears the stale cache.

### On non-stream response

If the server returns an unexpected response (wrong `Content-Type`, non-2xx status), the service worker unregisters itself and clears its cache to avoid serving stale data indefinitely.

### Retry logic

If the initial fetch fails (e.g., server not yet reachable), `listenForInvalidations` retries up to 1000 times using exponential backoff (starting at 500 ms).

## Related

- [`streamRevalidatedTags`](/tapi/reference/streamrevalidatedtags) — the server-side function that produces the invalidation stream.
- [`handleTapiRequest`](/tapi/guides/service-worker) — the service worker fetch handler that caches TApi responses.
- [Caching Strategies](/tapi/reference/caching) — overview of how all cache layers work together.
- [Service Worker Setup](/tapi/guides/service-worker) — step-by-step guide for setting up the service worker.
