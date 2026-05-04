# @farbenmeer/vite-plugin-tapi

## 0.2.0

### Minor Changes

- 2d652c2: vite-plugin-tapi: auto-load .env into process.env in dev and preview

  Mirror Vite's `loadEnv` result into `process.env` at the top of both `configureServer` and `configurePreviewServer` so server-side libraries (BetterAuth, DB clients, OAuth secrets) see their secrets without any changes to user code. Shell vars keep precedence over `.env` values. Standalone production servers (i.e. running the built `server.js` directly) are unchanged and remain responsible for their own env loading.

- 8bd884a: Refactor Vite Plugin:

  - production deployments should run srvx directly
  - dev and preview mode work as expected
  - invalidation stream is served directly by TApi's server handler (under api base path)

### Patch Changes

- cfa8d49: vite-plugin-tapi: emit client + server bundles
- Updated dependencies [8bd884a]
  - @farbenmeer/tapi@0.10.7
