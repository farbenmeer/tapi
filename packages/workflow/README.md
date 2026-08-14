# @farbenmeer/workflow

> This package is deprecated and unmaintained. Use [reflow-ts](https://danfry1.github.io/reflow-ts/) instead.

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
    onboardUser: workflow(async (userId: string) => {
      const user = await fetchUser(userId);
      await sendEmail(user.email);
    }),
  },
});

// Trigger a workflow
await engine.onboardUser("user-123");
```

## How it works

Workflows are async functions. Each `step()` returns a Promise that either resolves to a cached result (if the step already succeeded in a previous attempt of this run) or runs the underlying async function with retries and persistence. The engine binds an [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) run context around the workflow, so steps find their cached state through normal `await`s without needing any sync replay trickery. This means:

- Workflows can `await` anything, not just steps. Plain promises, helpers, libraries — all fine.
- Failed steps are retried with exponential backoff; on retry exhaustion the step's promise rejects and your `try/catch` runs.
- After a worker restart, the workflow function is replayed from the top. Steps that already succeeded resolve immediately with their cached result; steps that previously exhausted retries throw deterministically. Execution effectively resumes where it left off.
- Parallel work composes naturally: `await Promise.all([stepA(input), stepB(input)])` runs both steps concurrently.
- Multiple workers can poll for work using lease-based concurrency.

**Determinism note.** Because workflows are replayed from the top, the workflow function itself should be deterministic — its branching and the order in which it invokes steps must be reproducible across replays. Put any non-determinism (timestamps, random numbers, external lookups) inside a `step()` so its result is persisted.

## Usage

### Defining steps

Steps wrap async functions with retry logic and persistence. The function you pass to `step()` is run when the step is awaited inside a workflow.

```ts
import { step } from "@farbenmeer/workflow";

// Default: 3 attempts, 250ms base backoff
const fetchUser = step(async (userId: string) => {
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
});

// Custom retry config
const callFlakyApi = step(
  { attempts: 5, baseTimeout: 1000 },
  async (input: string) => {
    return await unreliableService(input);
  },
);
```

Retry backoff is exponential: `baseTimeout * 2^(attempt - 1)`. Step results must be JSON-serializable — they're persisted by the adapter and rehydrated on replay.

A step must be called from inside a workflow. Calling one from regular application code throws.

### Defining workflows

A workflow is an `async` function. Use steps for anything you want persisted, retried, or to make resumable.

```ts
import { workflow } from "@farbenmeer/workflow";

const onboardUser = workflow(async (userId: string) => {
  const user = await fetchUser(userId);
  await sendEmail(user.email);
});
```

Workflows take a single argument. Use an object if you need multiple parameters. The input is also persisted, so it must be JSON-serializable.

### Starting the engine and triggering workflows

Pass your workflows to `startEngine` along with a storage adapter. Each workflow name becomes a callable property on the returned engine.

```ts
import { startEngine } from "@farbenmeer/workflow";
import { InMemoryAdapter } from "@farbenmeer/workflow/adapter-inmemory";

const engine = startEngine({
  storage: new InMemoryAdapter(),
  workflows: { onboardUser },
  // optional:
  leaseDuration: 60, // seconds; how long a worker holds a run before it can be picked up by someone else
  logger: console,   // any object with debug / info / warn / error / log
});

// Persist a run. The promise resolves once the run is queued; actual
// execution happens in the engine's polling loop in the background.
await engine.onboardUser("user-123");
```

### Parallel steps

Because workflows are real async functions, you can fan out with `Promise.all`. Each step gets a stable, distinct ID even when the same step is invoked multiple times with the same input.

```ts
const greetEveryone = workflow(async (ids: string[]) => {
  const users = await Promise.all(ids.map(fetchUser));
  await Promise.all(users.map((u) => sendEmail(u.email)));
});
```

### Error handling

A failed step rejects with the underlying error after exhausting its retry budget. Wrap it in `try/catch` to recover inside the workflow.

```ts
const tryNotify = workflow(async (userId: string) => {
  const user = await fetchUser(userId);
  try {
    await sendEmail(user.email);
  } catch (err) {
    await logFailedNotification({ userId, message: String(err) });
  }
});
```

If a step throws `FatalError`, retries are skipped and the error is surfaced immediately:

```ts
import { FatalError } from "@farbenmeer/workflow";

const validate = step(async (input: string) => {
  if (!isValid(input)) throw new FatalError("Invalid input");
  return process(input);
});
```

If the workflow itself doesn't catch a thrown error, the engine marks the run as failed (its `error` field is populated) and moves on.

### Listing workflow runs

```ts
const page = await engine.listWorkflows({ pageSize: 20 });
for (const run of page.workflows) {
  console.log(run.workflowId, run.runId, run.error, run.finishedAt);
}
if (page.nextCursor) {
  const next = await engine.listWorkflows({
    pageSize: 20,
    cursor: page.nextCursor,
  });
}
```

Each `WorkflowState` carries `workflowId`, `runId`, `input`, `error`, `startedAt`, `finishedAt`, and `leaseExpiredAt`.

### Scheduling recurring runs

Each workflow has a `.schedule(intervalSeconds, input)` method that re-triggers it on an interval. If a previous run for the same input completed recently, the next run is delayed until the interval has elapsed.

```ts
engine.onboardUser.schedule(3600, "user-123"); // every hour
```

### Stopping the engine

`engine.stop()` halts the polling loop. In-flight runs finish, but no new ones are picked up.

```ts
process.on("SIGINT", () => engine.stop());
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
  getLatestRun(workflowId, input) { /* ... */ }
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
