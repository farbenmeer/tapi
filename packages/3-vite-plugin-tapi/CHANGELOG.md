# @farbenmeer/vite-plugin-tapi

## 1.0.0

### Minor Changes

- 7b2c251: Migrate four more packages to the `@toapi` scope, keeping the original
  `@farbenmeer` names as backward-compatible shims:

  - `@farbenmeer/tag-based-cache` → `@toapi/cache`
  - `@farbenmeer/router` → `@toapi/router`
  - `@farbenmeer/react-tapi` → `@toapi/react`
  - `@farbenmeer/vite-plugin-tapi` → `@toapi/vite-plugin`

  Each original package is now a thin, build-free shim whose entry points
  re-export from the corresponding `@toapi/*` package via hand-authored
  `.js`/`.d.ts` files, so existing consumers need no changes.

- 7b2c251: `@toapi/vite-plugin` now imports and generates code targeting `@toapi/server`
  instead of `@farbenmeer/tapi/server`, and its peer dependency changed from
  `@farbenmeer/tapi` to `@toapi/server`. Consumers (including via the
  `@farbenmeer/vite-plugin-tapi` shim) should depend on `@toapi/server`; the
  server module the plugin emits into the build now imports from `@toapi/server`.

### Patch Changes

- 29bedf3: vite-plugin-tapi-demo: the reference Caddyfile now sets cache headers for the client build

  Content-hashed assets under `/assets/*` are served with
  `Cache-Control: public, max-age=31536000, immutable`, and the SPA shell (`/`,
  `index.html`) with `no-cache`; `file_server` already emits `ETag`/`Last-Modified`
  and answers `304`. A comment documents dropping `encode` when running behind a
  compressing edge to avoid double compression, and the docker e2e test asserts
  both cache headers.

  Docs: the `srvx -s` static-serving note now calls out that it has no SPA history
  fallback and sets no cache headers, pointing client-routed SPAs at a static
  server / CDN (the reference Caddyfile) instead.

- Updated dependencies [7b2c251]
- Updated dependencies [b81f517]
- Updated dependencies [7b2c251]
  - @toapi/vite-plugin@1.0.0
  - @toapi/server@1.0.0
