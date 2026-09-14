# @toapi/router

## 1.0.3

### Patch Changes

- 9fffc7b: Render only the first matching route in `Switch`.

## 1.0.2

### Patch Changes

- a2cc715: Relative imports in the published packages now carry the `.js` extension. `@toapi/react`, `@toapi/router` and `@toapi/worker` could not be imported from Node at all — the build emits import specifiers verbatim (`module: "Preserve"`), and with `"type": "module"` Node requires a full specifier, so `import "@toapi/react"` failed with `ERR_MODULE_NOT_FOUND`. This affected any consumer resolving through Node rather than a bundler: SSR, scripts, and tests running in a node environment.

  `@toapi/cache` was unaffected at runtime (its extensionless imports were type-only and erased) but is included for consistency.

  A Biome rule (`useImportExtensions` with `forceJsExtensions`) now guards against a regression, and `pnpm lint` runs it in CI.

## 1.0.1

### Patch Changes

- 1a2e6e8: remove dependencies on deprecated packages

## 1.0.0

### Major Changes

- f86e1da: bump router to v1

## 0.7.0

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

## 0.6.2

### Patch Changes

- 99b28fb: actually export switch component
- 0bbf9ba: Handle Back-Navigation

## 0.6.1

### Patch Changes

- eb95338: match any non-slash character in path regexes

## 0.6.0

### Minor Changes

- 7a48760: add switch component

## 0.5.0

### Minor Changes

- afa6f78: relative routing for router.push

### Patch Changes

- 0d17bce: fix useParams generic type
- bc09780: fix relative paths on root parent

## 0.4.0

### Minor Changes

- cd64f38: add search getter to turn immutablesearchparams to search string

## 0.3.0

### Minor Changes

- 980801f: switch path syntax from brackets to colon-notation

## 0.2.0

### Minor Changes

- bb41e24: move to pnpm
