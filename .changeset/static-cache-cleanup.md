---
"@farbenmeer/tapi": minor
"@farbenmeer/bunny": patch
---

Remove `buildId` from the worker and server cache APIs and add a
`cleanup` function to the worker module.

**Breaking changes**

- `handleTapiRequest(req)` no longer takes a `buildId` argument.
- `listenForInvalidations({ url })` no longer takes `buildId`.
- `createRequestHandler(api, { ... })` no longer accepts `buildId`.
- `streamRevalidatedTags({ cache })` no longer accepts `buildId`; the
  server no longer emits the `X-TAPI-Build-Id` response header on the
  invalidation stream.

The worker now uses static IndexedDB and Cache Storage names
(`tapi-cache-meta`, `tapi-cache`) instead of namespacing by buildId.
Whenever a fresh revalidation stream connects, the worker still marks
every cached entry as expired (`expireAll`), so stale entries are
re-fetched on next access — there is no need to reset the cache by
namespace on each deploy.

**New: `cleanup({ maximumStaleAge })`**

A new `cleanup` export from `@farbenmeer/tapi/worker` reconciles the
worker's stores. Call it from the service worker's `activate` event:

```ts
import { cleanup } from "@farbenmeer/tapi/worker";

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanup({ maximumStaleAge: 60 * 60 * 24 * 7 }));
});
```

It deletes cache + meta entries whose `expiresAt` is older than
`maximumStaleAge` seconds, drops cache entries that have no matching
meta record (orphans), and rebuilds the tags store from the surviving
meta records — healing any drift between the meta and tags stores.

**Migration**

- Drop `buildId` from any call to `handleTapiRequest`,
  `listenForInvalidations`, `createRequestHandler`, and
  `streamRevalidatedTags`.
- Optionally call `cleanup({ maximumStaleAge })` from the SW's
  `activate` event to bound long-term cache growth.
- Cache databases / Cache Storage entries from previous versions
  (`tapi-cache-<buildId>`, `tapi-cache-meta-<buildId>`) will be
  orphaned on disk after upgrading. They are recoverable caches and can
  be cleared from DevTools or left for the browser's storage budget to
  evict.
