---
"@toapi/cache": minor
"@toapi/router": minor
"@toapi/react": minor
"@toapi/vite-plugin": minor
"@farbenmeer/tag-based-cache": minor
"@farbenmeer/router": minor
"@farbenmeer/react-tapi": minor
"@farbenmeer/vite-plugin-tapi": minor
---

Migrate four more packages to the `@toapi` scope, keeping the original
`@farbenmeer` names as backward-compatible shims:

- `@farbenmeer/tag-based-cache` → `@toapi/cache`
- `@farbenmeer/router` → `@toapi/router`
- `@farbenmeer/react-tapi` → `@toapi/react`
- `@farbenmeer/vite-plugin-tapi` → `@toapi/vite-plugin`

Each original package is now a thin, build-free shim whose entry points
re-export from the corresponding `@toapi/*` package via hand-authored
`.js`/`.d.ts` files, so existing consumers need no changes.
