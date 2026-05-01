---
title: streamRevalidatedTags
---

`streamRevalidatedTags` creates a long-polling HTTP response that streams invalidated cache tags to connected service workers. This is the server-side half of TApi's tag-based revalidation system.

## Usage

Register a dedicated route in your server that calls `streamRevalidatedTags` and returns the result. The service worker will connect to this route on startup and receive tag invalidations in real time.

```ts
import { streamRevalidatedTags } from "@farbenmeer/tapi/server";
import { api } from "./api";

// Next.js App Router example
export const GET = () =>
  streamRevalidatedTags({ cache: api.cache, buildId: process.env.BUILD_ID! });
```

The route path must match the `url` passed to [`listenForInvalidations`](/tapi/reference/listenforinvalidations) in your service worker. You can use the built-in `INVALIDATIONS_ROUTE` constant (`/__tapi/invalidations`) or define your own.

```ts
import {
  streamRevalidatedTags,
  INVALIDATIONS_ROUTE,
} from "@farbenmeer/tapi/server";
import { api } from "./api";

// INVALIDATIONS_ROUTE === "/__tapi/invalidations"
export const GET = () =>
  streamRevalidatedTags({ cache: api.cache, buildId: process.env.BUILD_ID! });
```

## Signature

```ts
function streamRevalidatedTags(options: Options): Response
```

Returns a streaming `Response` with `Content-Type: text/tapi-tags`. The response body is a newline-delimited stream of space-separated tag names. A keepalive newline is sent every 10 seconds to keep the connection alive.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `cache` | `Cache` | The cache/pub-sub instance to subscribe to. Use `api.cache` to share the same instance as your `defineApi` call. |
| `buildId` | `string` | A unique identifier for the current build. The service worker uses this to detect when it needs to reload. Typically set to a Git commit SHA or build timestamp via an environment variable. |

## Response Headers

The response includes the following headers:

| Header | Value | Description |
| --- | --- | --- |
| `Content-Type` | `text/tapi-tags` | Signals to the service worker that this is a TApi invalidation stream. |
| `X-TAPI-Build-Id` | `buildId` | The build ID passed in options. Used by the service worker to detect stale builds. |
| `Set-Cookie` | `__tapi-session=<uuid>` | A session cookie that prevents the server from echoing a client's own mutations back to that same client. |

## Behavior

- **Session deduplication**: Each connected client receives a unique session ID via a cookie. When the server invalidates tags, it skips notifying the client whose mutation triggered the invalidation (the `meta.clientId` passed to `cache.delete`).
- **Keepalive**: A blank newline is sent every 10 seconds to prevent proxies and load balancers from closing idle connections.
- **Build ID mismatch**: If the service worker connects and the `X-TAPI-Build-Id` header does not match its own `buildId`, the service worker will update itself.

## Related

- [`listenForInvalidations`](/tapi/reference/listenforinvalidations) — the service worker counterpart that consumes this stream.
- [`defineApi`](/tapi/reference/defineapi) — exposes `api.cache` used in the `cache` option.
- [`PubSub`](/tapi/reference/caching#server-side-cache) — the default in-process pub-sub implementation.
- [Caching Strategies](/tapi/reference/caching) — overview of how all cache layers work together.
