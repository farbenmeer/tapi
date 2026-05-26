---
"@farbenmeer/tapi": patch
"@farbenmeer/bunny": patch
---

Serve the generated OpenAPI spec at `<basePath>/__tapi/openapi.json` when `oas: { title, version }` is passed to `defineApi`.

Removed Bunny's `/.well-known/openapi.json` route in favor of the new TApi route. `createBunnyApp` no longer accepts an `apiInfo` option — pass `oas: { title, version }` to your `defineApi` call instead to expose the spec.
