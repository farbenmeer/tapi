# @farbenmeer/workflow

A durable workflow engine for TypeScript. Define workflows as plain functions, break them into retryable steps, and let the engine handle persistence, retries, and lease-based distributed execution.

## Installation

```bash
pnpm add @farbenmeer/workflow
```

## Quick start

```ts
import { startEngine, workflow, step } from "@farbenmeer/workflow";
import { InMemoryAdapter } from "@farbenmeer/workflow/adapter-inmemory";

const fetchUser = step(async (userId: string) => {
  const res = await fetch(`/api/users/${userId}`);
  return res.json();
});

const sendEmail = step(async (email: string) => {
  await fetch("/api/email", { method: "POST", body: JSON.stringify({ to: email }) });
});

const engine = startEngine({
  storage: new InMemoryAdapter(),
  workflows: {
    onboardUser: workflow((userId: string) => {
      const user = fetchUser(userId);
      sendEmail(user.email);
    }),
  },
});

// Trigger a workflow
await engine.onboardUser("user-123");
```

## How it works

Workflows are synchronous generator-like functions. Each `step()` call either returns a cached result (if the step already succeeded) or throws internally to trigger execution. The engine catches this, runs the step's async function with retries, persists the result, then replays the workflow from the top. This means:

- Steps that already succeeded are skipped on replay (their cached result is returned)
- Failed steps are retried with exponential backoff
- Workflows survive process restarts since all state is persisted
- Multiple workers can poll for work using lease-based concurrency

### Steps

Steps wrap async functions with retry logic and persistence.

```ts
// Default: 3 attempts, 250ms base backoff
const myStep = step(async (input: string) => {
  return await doSomething(input);
});

// Custom retry config
const riskyStep = step({ attempts: 5, baseTimeout: 1000 }, async (input: string) => {
  return await unreliableService(input);
});
```

Backoff is exponential: `baseTimeout * 2^(attempt - 1)`.

To fail a step immediately without retries, throw a `FatalError`:

```ts
import { FatalError } from "@farbenmeer/workflow";

const validated = step(async (input: string) => {
  if (!isValid(input)) throw new FatalError("Invalid input");
  return process(input);
});
```

### Scheduled workflows

Run workflows on a recurring interval:

```ts
engine.onboardUser.schedule(3600, "user-123"); // every hour
```

## Storage adapters

The engine is storage-agnostic. Pick an adapter based on your stack:

### In-memory (testing / development)

```ts
import { InMemoryAdapter } from "@farbenmeer/workflow/adapter-inmemory";

const storage = new InMemoryAdapter();
```

Uses an in-memory SQLite database under the hood via better-sqlite3.

### SQLite

```ts
import Database from "better-sqlite3";
import { SqliteAdapter } from "@farbenmeer/workflow/adapter-sqlite";

const db = new Database("workflows.db");
const storage = new SqliteAdapter(db);
```

Accepts any object with a `prepare(sql)` method that returns `{ all(...params), run(...params) }` — compatible with better-sqlite3 and similar drivers.

### PostgreSQL

```ts
import pg from "pg";
import { PostgresAdapter } from "@farbenmeer/workflow/adapter-postgres";

const pool = new pg.Pool();
const storage = new PostgresAdapter(pool);
```

Accepts any object with a `query(sql, params?)` method returning `Promise<{ rows }>` — compatible with `pg.Pool`, `pg.Client`, and similar drivers. Uses `FOR UPDATE SKIP LOCKED` for safe concurrent worker polling.

### Drizzle (better-sqlite3)

```ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import { DrizzleBetterSqliteAdapter } from "@farbenmeer/workflow/adapter-drizzle-better-sqlite";

const db = drizzle("workflows.db");
const storage = new DrizzleBetterSqliteAdapter(db);
```

Accepts a drizzle database instance and shares the underlying connection. The drizzle schema is exported from the same entrypoint for use with drizzle migrations.

### Drizzle (node-postgres)

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { DrizzleNodePostgresAdapter } from "@farbenmeer/workflow/adapter-drizzle-node-postgres";

const db = drizzle(process.env.DATABASE_URL);
const storage = new DrizzleNodePostgresAdapter(db);
```

### Schema setup

Apply the appropriate schema to your database before using an adapter. The SQL files are included in the package:

- SQLite: `src/sql/sqlite.sql`
- PostgreSQL: `src/sql/postgres.sql`

For drizzle users, the generated drizzle schemas can be used with `drizzle-kit` for migrations.

## Writing a custom adapter

Implement the `Adapter` interface:

```ts
import type { Adapter } from "@farbenmeer/workflow";

class MyAdapter implements Adapter {
  getLastestRun(workflowId, input) { /* ... */ }
  getNextWorkflow(leaseDuration) { /* ... */ }
  createWorkflow(input) { /* ... */ }
  failWorkflow(runId, error) { /* ... */ }
  lease(runId, leaseDuration) { /* ... */ }
  finishWorkflow(runId) { /* ... */ }
  listWorkflows(options?) { /* ... */ }
  getSteps(runId) { /* ... */ }
  putStep(state) { /* ... */ }
}
```

## License

MIT

---

## Development

The following is only relevant for contributing to this package.

### Codegen

The canonical schemas are `src/sql/sqlite.sql` and `src/sql/postgres.sql`. All type definitions and drizzle schemas are generated from them:

```bash
pnpm generate
```

This runs `scripts/generate.ts`, a pure SQL parser that produces:

- `src/adapter-sqlite/types.ts` — Kysely type interfaces for SQLite
- `src/adapter-postgres/types.ts` — Kysely type interfaces for PostgreSQL
- `src/adapter-drizzle-better-sqlite/schema.ts` — Drizzle schema for SQLite
- `src/adapter-drizzle-node-postgres/schema.ts` — Drizzle schema for PostgreSQL

After changing the SQL schemas, run `pnpm generate` and commit the updated generated files.

### Architecture

The adapters use [kysely](https://kysely.dev/) internally as a query builder only — queries are compiled to SQL via `.compile()` and executed against the raw database interface the user provides. Kysely is never exposed in the public API.

### Tests

```bash
pnpm test
```

SQLite tests use better-sqlite3 with `:memory:` databases. PostgreSQL tests use [@electric-sql/pglite](https://github.com/electric-sql/pglite) for an in-process Postgres instance.
