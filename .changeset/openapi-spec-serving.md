---
"@farbenmeer/tapi": patch
"@farbenmeer/bunny": patch
---

Serve the generated OpenAPI spec at `<basePath>/__tapi/openapi.json` when `openapi: { title, version }` is passed to `defineApi`.

Removed Bunny's `/.well-known/openapi.json` route in favor of the new TApi route. `createBunnyApp` no longer accepts an `apiInfo` option — pass `openapi: { title, version }` to your `defineApi` call instead to expose the spec.
