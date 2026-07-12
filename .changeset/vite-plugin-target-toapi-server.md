---
"@toapi/vite-plugin": minor
"@farbenmeer/vite-plugin-tapi": minor
---

`@toapi/vite-plugin` now imports and generates code targeting `@toapi/server`
instead of `@farbenmeer/tapi/server`, and its peer dependency changed from
`@farbenmeer/tapi` to `@toapi/server`. Consumers (including via the
`@farbenmeer/vite-plugin-tapi` shim) should depend on `@toapi/server`; the
server module the plugin emits into the build now imports from `@toapi/server`.
