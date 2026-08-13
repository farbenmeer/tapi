# @toapi/worker

## 1.1.1

### Patch Changes

- 5c5eecc: Fix offline stale-fallback in the worker: `serveFromNetwork` is now awaited so the expired-cache catch block can serve the cached response when the network is unavailable.

## 1.1.0

### Minor Changes

- 90c496a: Add `setupToapiWorker`, a single-call helper that registers the `activate` and `fetch` listeners and opens the revalidation stream, replacing the manual `cleanup` / `handleToapiRequest` / `listenForInvalidations` wiring. The individual functions remain exported for advanced setups.

  Rename `handleTapiRequest` to `handleToapiRequest` as part of the tapi → toapi rebrand. `handleTapiRequest` stays as a deprecated alias for the same function and will be removed in a future major version.

### Patch Changes

- Updated dependencies [a3a106e]
  - @toapi/common@1.1.0

## 1.0.1

## 1.0.0

### Minor Changes

- b81f517: Split `@farbenmeer/tapi` into four independently-published packages under the new
  `@toapi` scope:

  - `@toapi/common` — shared code and the route/handler type contract (`Route`,
    `Handler`, `Schema`, `TRequest`, `TResponse`, `CookieStore`, `HttpError`,
    constants, `Logger`, `isMutation`, …)
  - `@toapi/client` — `createFetchClient` and client types
  - `@toapi/server` — `defineApi`, `createRequestHandler`, `createLocalClient`, OpenAPI, …
  - `@toapi/worker` — service-worker request handling

  `@farbenmeer/tapi` is retained as a thin backward-compatible shim: its `./server`,
  `./client`, and `./worker` subpaths now re-export from the corresponding `@toapi/*`
  packages, so existing consumers need no changes.

### Patch Changes

- Updated dependencies [b81f517]
  - @toapi/common@1.0.0
