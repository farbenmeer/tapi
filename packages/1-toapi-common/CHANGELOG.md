# @toapi/common

## 1.1.0

### Minor Changes

- a3a106e: Move the `Observable` type from `@toapi/client` to `@toapi/common`. `@toapi/client` continues to re-export `Observable`, so its public API is unchanged. `@toapi/react` now depends on `@toapi/common` directly and no longer has a peer dependency on `@toapi/client`.

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
