# @farbenmeer/vite-plugin-tapi-example-demo

## 0.1.0

### Minor Changes

- 8bd884a: Refactor Vite Plugin:

  - production deployments should run srvx directly
  - dev and preview mode work as expected
  - invalidation stream is served directly by TApi's server handler (under api base path)

### Patch Changes

- 2d652c2: vite-plugin-tapi: auto-load .env into process.env in dev and preview

  Mirror Vite's `loadEnv` result into `process.env` at the top of both `configureServer` and `configurePreviewServer` so server-side libraries (BetterAuth, DB clients, OAuth secrets) see their secrets without any changes to user code. Shell vars keep precedence over `.env` values. Standalone production servers (i.e. running the built `server.js` directly) are unchanged and remain responsible for their own env loading.

- Updated dependencies [2d652c2]
- Updated dependencies [8bd884a]
- Updated dependencies [cfa8d49]
  - @farbenmeer/vite-plugin-tapi@0.2.0
