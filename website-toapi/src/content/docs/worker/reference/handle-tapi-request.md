---
title: "handleTapiRequest"
description: "Handle a single service-worker fetch event: serve from cache, revalidate from network, or invalidate on mutation."
---

`handleTapiRequest` is the core request handler for the Toapi service worker.
Pass it the `Request` from a `fetch` event and it decides whether to serve from
Cache Storage, fetch from the network, or run a mutation and invalidate the
affected tags.

## Signature

```ts
function handleTapiRequest(
  req: Request,
  options?: { logger?: Logger },
): Promise<Response>;
```

- **`req`** — the request to handle, typically `event.request` from a
  service-worker `fetch` event.
- **`options.logger`** — an optional [`Logger`](#logger) whose `error` method is
  called when a network refetch of an expired entry fails. Defaults to
  `console.error`.

Returns a `Promise<Response>` suitable for passing to `event.respondWith(...)`.

## Usage

```ts
import { handleTapiRequest } from "@toapi/worker";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/api") &&
    !url.pathname.startsWith("/api/__tapi")
  ) {
    event.respondWith(handleTapiRequest(event.request));
  }
});
```

Only route requests you actually want cached/handled through this function.
Exclude the Toapi control endpoints (such as the `/api/__tapi/invalidations`
stream) from the handler.

## Behavior

The handler branches on whether the request is a **mutation** — that is, whether
its method is `POST`, `PUT`, `PATCH`, or `DELETE`.

### Mutations

For a mutation, the request is forwarded to the network. When the response comes
back, any cache tags it carries (via the tags response header) are invalidated,
marking the corresponding cached entries as stale. The network response is
returned unchanged. If the response carries no tags, invalidation is skipped.

### Reads (safe methods)

For a non-mutation request (`GET`, `HEAD`, etc.) the handler resolves in this
order:

1. **No cached entry** — the request is served from the network. The response is
   stored in the cache only if it is `ok` and carries a tags or expires-at
   header; otherwise any stale entry for that URL is removed.
2. **Cached entry with a future `expiresAt`** — the cached response is returned
   directly, without touching the network.
3. **Cached entry that has expired** — the handler tries to refetch from the
   network. If the refetch fails (for example, the device is offline), the error
   is passed to `options.logger.error` and the stale cached response is served as
   a fallback.
4. **Cached entry with no expiry recorded** — the cached response is returned.

:::tip
Step 3 is what makes the worker offline-tolerant: an expired entry is always
preferable to a network failure, so the user still sees data.
:::

## `Logger`

```ts
interface Logger {
  error?: (error: unknown) => void | Promise<void>;
}
```

`Logger` is re-exported from `@toapi/common`. Provide one to route worker errors
into your own reporting rather than `console.error`:

```ts
import { handleTapiRequest, type Logger } from "@toapi/worker";

const logger: Logger = {
  error: (err) => reportToSentry(err),
};

handleTapiRequest(event.request, { logger });
```

## Related

- [`listenForInvalidations`](/tapi/worker/reference/listen-for-invalidations/)
- [`cleanup`](/tapi/worker/reference/cleanup/)
- [Service worker setup guide](/tapi/worker/guides/service-worker/)
