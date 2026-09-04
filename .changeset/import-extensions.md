---
"@toapi/react": patch
"@toapi/router": patch
"@toapi/worker": patch
"@toapi/cache": patch
---

Relative imports in the published packages now carry the `.js` extension. `@toapi/react`, `@toapi/router` and `@toapi/worker` could not be imported from Node at all — the build emits import specifiers verbatim (`module: "Preserve"`), and with `"type": "module"` Node requires a full specifier, so `import "@toapi/react"` failed with `ERR_MODULE_NOT_FOUND`. This affected any consumer resolving through Node rather than a bundler: SSR, scripts, and tests running in a node environment.

`@toapi/cache` was unaffected at runtime (its extensionless imports were type-only and erased) but is included for consistency.

A Biome rule (`useImportExtensions` with `forceJsExtensions`) now guards against a regression, and `pnpm lint` runs it in CI.
