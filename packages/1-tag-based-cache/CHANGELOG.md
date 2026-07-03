# @farbenmeer/tag-based-cache

## 0.3.0

### Minor Changes

- b4e077a: Add `PostgresCache`, a `Cache` implementation backed by PostgreSQL. It stores entries and tags in two tables, garbage-collects expired entries, and propagates cross-host invalidation via `LISTEN`/`NOTIFY`. An optional `schema` constructor option places the tables in a dedicated Postgres schema (with its own invalidation channel), and `createSchema: false` lets you manage the schema via migrations. Requires `pg` as a peer dependency.

## 0.2.1

### Patch Changes

- 18c305c: fix transaction leak in sqlite caches when set() hits a duplicate key

## 0.2.0

### Minor Changes

- 92afc95: distributed caching and invalidation
