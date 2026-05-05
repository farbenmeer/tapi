# @farbenmeer/bunny

## 0.6.4

### Patch Changes

- 8d6788c: adjust server build output path and add vite plugin docs to website
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

- Updated dependencies [8d6788c]
- Updated dependencies [8d6788c]
  - @farbenmeer/tapi@0.11.0
  - @farbenmeer/react-tapi@8.0.0

## 0.6.3

### Patch Changes

- 2d652c2: vite-plugin-tapi: auto-load .env into process.env in dev and preview

  Mirror Vite's `loadEnv` result into `process.env` at the top of both `configureServer` and `configurePreviewServer` so server-side libraries (BetterAuth, DB clients, OAuth secrets) see their secrets without any changes to user code. Shell vars keep precedence over `.env` values. Standalone production servers (i.e. running the built `server.js` directly) are unchanged and remain responsible for their own env loading.

- 8bd884a: Refactor Vite Plugin:

  - production deployments should run srvx directly
  - dev and preview mode work as expected
  - invalidation stream is served directly by TApi's server handler (under api base path)

## 0.6.2

### Patch Changes

- 502140d: no default port so environment variable actually works

## 0.6.1

### Patch Changes

- 78fa57c: load env before loading config
- Updated dependencies [a34ecc8]
  - @farbenmeer/tapi@0.10.5

## 0.6.0

### Minor Changes

- 65f8be3: Define statically-replaced variables

### Patch Changes

- c648ec7: Remove deprecated vite-tsconfig-paths package
- Updated dependencies [7cba1cc]
  - @farbenmeer/tapi@0.10.4

## 0.5.2

### Patch Changes

- e6781e2: Private routes can use tags for client side caching and streaming revalidation works in dev mode
- Updated dependencies [e6781e2]
  - @farbenmeer/tapi@0.10.3

## 0.5.1

### Patch Changes

- 99b28fb: Add Examples including UI Tests
- 99b28fb: enable react dev server
- Updated dependencies [9db39ab]
- Updated dependencies [99b28fb]
- Updated dependencies [0bbf9ba]
- Updated dependencies [99b28fb]
  - @farbenmeer/tapi@0.10.2
  - @farbenmeer/router@0.6.2

## 0.5.0

### Minor Changes

- 806bcd8: pass cache to defineApi, not createRequestHandler

### Patch Changes

- Updated dependencies [806bcd8]
- Updated dependencies [36868d8]
- Updated dependencies [b1b4180]
  - @farbenmeer/tapi@0.10.0
  - @farbenmeer/react-tapi@8.0.0

## 0.4.2

### Patch Changes

- 2305793: do not assume host header for host by default

## 0.4.1

### Patch Changes

- Updated dependencies [a5228c8]
- Updated dependencies [eb95338]
- Updated dependencies [4786307]
- Updated dependencies [7720a49]
  - @farbenmeer/tapi@0.9.0
  - @farbenmeer/router@0.6.1
  - @farbenmeer/react-tapi@8.0.0

## 0.4.0

### Minor Changes

- c79808c: Service Worker caching
- 92afc95: distributed caching and invalidation

### Patch Changes

- 648fc37: bunny accepts cache-export from api.ts
- 648fc37: move recipes into core bunny package and distribute them with recipes command
- 010665b: better docs for 3rd party tools
- Updated dependencies [c79808c]
- Updated dependencies [92afc95]
  - @farbenmeer/tapi@0.8.0
  - @farbenmeer/react-tapi@7.0.0

## 0.3.5

### Patch Changes

- b62f7cc: include boilerplate archive in bunny package

## 0.3.4

### Patch Changes

- f810bca: fix server HMR
- f810bca: fix standalone build
- 5eead39: re-enable init command
- Updated dependencies [7a48760]
- Updated dependencies [9e51fd3]
- Updated dependencies [29cdbe7]
- Updated dependencies [a2c3e5e]
- Updated dependencies [a2c3e5e]
  - @farbenmeer/router@0.6.0
  - @farbenmeer/tapi@0.7.0
  - @farbenmeer/react-tapi@6.0.0

## 0.3.3

### Patch Changes

- 1ac57be: error handling for response transform
- Updated dependencies [af307a9]
  - @farbenmeer/react-tapi@5.0.1
  - @farbenmeer/tapi@0.6.1

## 0.3.2

### Patch Changes

- Updated dependencies [3183448]
  - @farbenmeer/tapi@0.6.0
  - @farbenmeer/react-tapi@5.0.0

## 0.3.1

### Patch Changes

- 07ba32a: gracefully handle closed stream
- b365ce2: flush headers before sending response body
- 47801fd: return error from error hook

## 0.3.0

### Minor Changes

- b4f73d8: basic error handling

### Patch Changes

- Updated dependencies [b4f73d8]
- Updated dependencies [03c9103]
  - @farbenmeer/tapi@0.5.0
  - @farbenmeer/react-tapi@4.0.0

## 0.2.9

### Patch Changes

- Updated dependencies [7f687af]
- Updated dependencies [7f687af]
  - @farbenmeer/tapi@0.4.0
  - @farbenmeer/react-tapi@3.0.0

## 0.2.8

### Patch Changes

- e91cbcd: request logs
- Updated dependencies [f3153f2]
- Updated dependencies [9907a33]
- Updated dependencies [0d17bce]
- Updated dependencies [afa6f78]
- Updated dependencies [bc09780]
  - @farbenmeer/tapi@0.3.2
  - @farbenmeer/router@0.5.0

## 0.2.7

### Patch Changes

- Updated dependencies [51a563d]
- Updated dependencies [cd64f38]
  - @farbenmeer/tapi@0.3.1
  - @farbenmeer/router@0.4.0

## 0.2.6

### Patch Changes

- 7d10e2f: fix incorrect response object conversion

## 0.2.5

### Patch Changes

- 4652e09: correctly load env file

## 0.2.4

### Patch Changes

- Updated dependencies [980801f]
  - @farbenmeer/router@0.3.0
  - @farbenmeer/tapi@0.3.0
  - @farbenmeer/react-tapi@2.0.0

## 0.2.3

### Patch Changes

- 2792981: resolve config from default export
- bc4244e: fix api import path in start script

## 0.2.2

### Patch Changes

- 2949bad: use dynamic import instead of require in bunny start command
- 9526ca0: fix \_\_dirname and incorrect api import in server.js

## 0.2.1

### Patch Changes

- cb0e855: add config file to pass vite config options

## 0.2.0

### Minor Changes

- bb41e24: move to pnpm

### Patch Changes

- Updated dependencies [bb41e24]
  - @farbenmeer/router@0.2.0
  - @farbenmeer/tapi@0.2.0
  - @farbenmeer/react-tapi@1.0.0

## 0.1.5

### Patch Changes

- 8a287b3: Add generateOpenAPISchema method to TAPI and serve it as /openapi.json from bunny
- Updated dependencies [8a287b3]
- Updated dependencies [c696188]
- Updated dependencies [c343771]
  - @farbenmeer/tapi@0.1.10
  - @farbenmeer/react-tapi@0.1.6

## 0.1.4

### Patch Changes

- 8620659: Bunny re-exports all the internal packages
- Updated dependencies [8620659]
- Updated dependencies [8620659]
  - @farbenmeer/bun-auth@0.1.4
  - @farbenmeer/tapi@0.1.9

## 0.1.3

### Patch Changes

- 13eb226: Include files explicitly in boilerplate repo and run install, generate migrate commands in init script

## 0.1.2

### Patch Changes

- 2578a14: Update Boilerplate with latest bun-auth version
- 3d47664: Initialize git repo and add gitignore file in init command

## 0.1.1

### Patch Changes

- 857aead: Add missing dependency on drizzle-orm
