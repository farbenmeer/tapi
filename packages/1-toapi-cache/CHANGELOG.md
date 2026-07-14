# @toapi/cache

## 0.4.0

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

## 0.3.0

### Minor Changes

- b4e077a: Add `PostgresCache`, a `Cache` implementation backed by PostgreSQL. It stores entries and tags in two tables, garbage-collects expired entries, and propagates cross-host invalidation via `LISTEN`/`NOTIFY`. An optional `schema` constructor option places the tables in a dedicated Postgres schema (with its own invalidation channel), and `createSchema: false` lets you manage the schema via migrations. Requires `pg` as a peer dependency.

## 0.2.1

### Patch Changes

- 18c305c: fix transaction leak in sqlite caches when set() hits a duplicate key

## 0.2.0

### Minor Changes

- 92afc95: distributed caching and invalidation
