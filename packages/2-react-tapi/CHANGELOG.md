# @farbenmeer/react-tapi

## 10.0.0

### Patch Changes

- Updated dependencies [a3a106e]
  - @toapi/client@1.1.0
  - @toapi/react@1.1.0

## 9.0.0

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
- Updated dependencies [b81f517]
  - @toapi/react@1.0.0
  - @toapi/client@1.0.0
