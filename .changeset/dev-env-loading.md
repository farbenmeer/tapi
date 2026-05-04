---
"@farbenmeer/vite-plugin-tapi": minor
"@farbenmeer/bunny": patch
"@farbenmeer/vite-plugin-tapi-example-demo": patch
---

vite-plugin-tapi: auto-load .env into process.env in dev and preview

Mirror Vite's `loadEnv` result into `process.env` at the top of both `configureServer` and `configurePreviewServer` so server-side libraries (BetterAuth, DB clients, OAuth secrets) see their secrets without any changes to user code. Shell vars keep precedence over `.env` values. Standalone production servers (i.e. running the built `server.js` directly) are unchanged and remain responsible for their own env loading.
