---
"@farbenmeer/vite-plugin-tapi": minor
"@farbenmeer/bunny": patch
"@farbenmeer/vite-plugin-tapi-example-demo": patch
---

vite-plugin-tapi: auto-load .env into process.env in dev

Mirror Vite's `loadEnv` result into `process.env` at the top of `configureServer` so server-side libraries (BetterAuth, DB clients, OAuth secrets) see their secrets in dev without any changes to user code. Shell vars keep precedence over `.env` values. Production is unchanged.
