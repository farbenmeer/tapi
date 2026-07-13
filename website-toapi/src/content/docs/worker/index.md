---
title: "@toapi/worker"
description: "Service-worker request handling for Toapi: offline-capable caching and remote tag revalidation."
---

`@toapi/worker` is the service-worker half of the Toapi caching system. It runs
inside a browser [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
and intercepts requests to your Toapi endpoints, transparently caching responses
in [Cache Storage](https://developer.mozilla.org/en-US/docs/Web/API/Cache) and
tracking their cache tags and expiry in IndexedDB.

Together with the server's revalidation stream this gives you:

- **Instant reads** — cached responses are served without hitting the network.
- **Tag-based revalidation** — when the server invalidates a tag, the worker
  marks every affected cache entry as stale so it is refetched on next access.
- **Offline resilience** — if the network is unavailable, an expired-but-present
  cache entry is served rather than failing.

## Installation

```bash
npm install @toapi/worker
```

The package targets the `WebWorker` type lib rather than the `DOM` lib. See the
[service-worker guide](/tapi/worker/guides/service-worker/) for the `tsconfig.json`
setup and the full build/register recipe.

## Public API

| Export | Kind | Purpose |
| --- | --- | --- |
| [`handleTapiRequest`](/tapi/worker/reference/handle-tapi-request/) | function | Handle a single `fetch` event: serve from cache, network, or invalidate on mutation. |
| [`listenForInvalidations`](/tapi/worker/reference/listen-for-invalidations/) | function | Open the server's revalidation stream and apply remote tag invalidations. |
| [`cleanup`](/tapi/worker/reference/cleanup/) | function | Reconcile the cache and metadata stores, typically from the `activate` event. |
| `CleanupOptions` | type | Options for [`cleanup`](/tapi/worker/reference/cleanup/). |
| `Logger` | type | Re-exported from `@toapi/common`; the optional logger accepted by `handleTapiRequest`. |

## Minimal service worker

```ts
// service-worker.ts
import {
  handleTapiRequest,
  listenForInvalidations,
  cleanup,
} from "@toapi/worker";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanup({ maximumStaleAge: 60 * 60 * 24 * 7 }));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/api") &&
    !url.pathname.startsWith("/api/__tapi")
  ) {
    event.respondWith(handleTapiRequest(event.request));
  }
});

listenForInvalidations({ url: "/api/__tapi/invalidations" });
```

:::note
`@toapi/worker` only manages requests you route to it. The `fetch` listener
above deliberately handles requests under `/api` while excluding the
`/api/__tapi` control endpoints (such as the invalidation stream). Adjust
those checks to match your API base path.
:::

## Related

- [Service worker setup guide](/tapi/worker/guides/service-worker/)
- [`@toapi/cache`](/tapi/cache/) — the server-side tag-based cache that
  produces the tags and expiry headers this worker reads.
