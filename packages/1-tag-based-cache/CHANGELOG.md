# @farbenmeer/tag-based-cache

## 0.5.0

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

### Patch Changes

- Updated dependencies [7b2c251]
  - @toapi/cache@0.4.0
