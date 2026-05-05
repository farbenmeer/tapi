# @farbenmeer/tapi

## 0.11.0

### Minor Changes

- 8d6788c: Remove `buildId` from the worker and server cache APIs and add a
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

### Patch Changes

- 8d6788c: adjust server build output path and add vite plugin docs to website

## 0.10.7

### Patch Changes

- 8bd884a: Refactor Vite Plugin:

  - production deployments should run srvx directly
  - dev and preview mode work as expected
  - invalidation stream is served directly by TApi's server handler (under api base path)

## 0.10.6

### Patch Changes

- 837c536: undefined query parameters are ignored

## 0.10.5

### Patch Changes

- a34ecc8: optional query parameters

## 0.10.4

### Patch Changes

- 7cba1cc: local client can be passed additional fetch options

## 0.10.3

### Patch Changes

- e6781e2: Private routes can use tags for client side caching and streaming revalidation works in dev mode

## 0.10.2

### Patch Changes

- 9db39ab: fix inifinite reload issue for TTL-based refreshing endpoints
- 99b28fb: notify subscribers of currently revalidating routes

## 0.10.1

### Patch Changes

- 91378be: add handling for ndjson streams to tapi client

## 0.10.0

### Minor Changes

- 806bcd8: pass cache to defineApi, not createRequestHandler
- 36868d8: TResponse.ndjson responds with a newline-delimited json stream
- b1b4180: add revalidate method to TRequest

## 0.9.0

### Minor Changes

- a5228c8: do not pre-parse form data

### Patch Changes

- eb95338: match any non-slash character in path regexes
- 4786307: add toPrimitive handler as react seems to call that
- 7720a49: fix: actually return auth data from req.auth()

## 0.8.0

### Minor Changes

- c79808c: Service Worker caching
- 92afc95: distributed caching and invalidation

## 0.7.0

### Minor Changes

- 29cdbe7: patch, put, delete methods

### Patch Changes

- 9e51fd3: add explicit void response feature to TResponse api
- a2c3e5e: remove entries from cache that have no active subscription

## 0.6.1

### Patch Changes

- af307a9: memoize the full observablePromise instead of just the dataPromise

## 0.6.0

### Minor Changes

- 3183448: data is the first parameter to post requests

## 0.5.0

### Minor Changes

- b4f73d8: basic error handling

### Patch Changes

- 03c9103: export HttpError from client package

## 0.4.0

### Minor Changes

- 7f687af: formData parsing will no longer transform fields ending with brackets to an array automatically

### Patch Changes

- 7f687af: fix formData style post method calls

## 0.3.2

### Patch Changes

- f3153f2: unnamed wilcard parameters are not required params
- 9907a33: req.auth is a function and NonNullable

## 0.3.1

### Patch Changes

- 51a563d: await handler execution to handle errors

## 0.3.0

### Minor Changes

- 980801f: switch path syntax from brackets to colon-notation

## 0.2.0

### Minor Changes

- bb41e24: move to pnpm

## 0.1.10

### Patch Changes

- 8a287b3: Add generateOpenAPISchema method to TAPI and serve it as /openapi.json from bunny
- c696188: fix GetRoute type

## 0.1.9

### Patch Changes

- 8620659: split package into separate server and client exports

## 0.1.8

### Patch Changes

- b86ac32: authorization

## 0.1.7

### Patch Changes

- reintroduce cache

## 0.1.6

### Patch Changes

- 348d6e9: remove cache implementation and add react-tapi package

## 0.1.5

### Patch Changes

- 075598f: subsriptions
- 075598f: remove react query client
- 1c38b88: react-query client and tag-based caching

## 0.1.4

### Patch Changes

- d812323: export route types
- b7c534c: cache responses on client

## 0.1.3

### Patch Changes

- 0e3587a: assign fetch to variable to avoid global keyword

## 0.1.2

### Patch Changes

- 7ced7c1: export internal functions for handling single request

## 0.1.1

### Patch Changes

- 6309d9a: allow passing numbers as parameters for dynamic routes
- 6309d9a: pass zod schema for url parameters so they can be coerced on the fly
- 2de24ac: uppercase method names
