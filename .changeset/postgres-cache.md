---
"@farbenmeer/tag-based-cache": minor
---

Add `PostgresCache`, a `Cache` implementation backed by PostgreSQL. It stores entries and tags in two tables, garbage-collects expired entries, and propagates cross-host invalidation via `LISTEN`/`NOTIFY`. An optional `schema` constructor option places the tables in a dedicated Postgres schema (with its own invalidation channel), and `createSchema: false` lets you manage the schema via migrations. Requires `pg` as a peer dependency.
