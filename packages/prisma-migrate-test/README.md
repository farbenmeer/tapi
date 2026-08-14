# @farbenmeer/prisma-migrate-test

Factory functions for creating isolated test databases using the template-clone pattern: migrations run **once** to build a template, then each test gets a cheap clone — no repeated migration overhead.

## Installation

```bash
npm install @farbenmeer/prisma-migrate-test
```

## SQLite

### Peer dependencies

```bash
npm install better-sqlite3 @prisma/adapter-better-sqlite3
npm install -D @types/better-sqlite3
```

### Usage

```typescript
import { createSqliteTestDb } from "@farbenmeer/prisma-migrate-test/sqlite";
import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

let testDb: SqliteTestDb;
let prisma: PrismaClient;

beforeAll(() => {
  testDb = createSqliteTestDb({ migrationsPath: "prisma/migrations" });
});

afterAll(() => {
  testDb.cleanup();
});

beforeEach(async () => {
  prisma = new PrismaClient({ adapter: await testDb.getAdapter() });
});

afterEach(async () => {
  await prisma.$disconnect();
});
```

### API

#### `createSqliteTestDb(options?): SqliteTestDb`

Runs all migrations once into an in-memory template, then provides cheap per-test clones written to a temp directory.

**Parameters:**
- `options.migrationsPath` — path to the Prisma migrations folder (default: `"prisma/migrations"`)

**Returns:** `SqliteTestDb`
- `getAdapter(): Promise<PrismaBetterSqlite3>` — writes a clone of the template to disk and returns a new adapter backed by it
- `cleanup(): void` — deletes the temp directory

## PGlite

### Peer dependencies

```bash
npm install @electric-sql/pglite pglite-prisma-adapter
```

### Usage

Configure your Prisma schema to use the `postgresql` provider and generate the client with the `pglite` previewFeature.

```typescript
import { createPgliteTestDb } from "@farbenmeer/prisma-migrate-test/pglite";
import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

let testDb: PgliteTestDb;
let prisma: PrismaClient;

beforeAll(() => {
  testDb = createPgliteTestDb({ migrationsPath: "prisma/migrations" });
});

afterAll(async () => {
  await testDb.cleanup();
});

beforeEach(async () => {
  prisma = new PrismaClient({ adapter: await testDb.getAdapter() });
});

afterEach(async () => {
  await prisma.$disconnect();
});
```

### API

#### `createPgliteTestDb(options?): PgliteTestDb`

Runs all migrations once into an in-memory PGlite instance and dumps the result, then provides cheap per-test clones restored from that dump.

**Parameters:**
- `options.migrationsPath` — path to the Prisma migrations folder (default: `"prisma/migrations"`)
- `options.extensions` — PGlite extensions to pass to each instance (default: `{}`)
- `options.seed` — optional seed data applied after migrations. Pass a SQL string or an async function `(adapter: PrismaPGlite) => Promise<void>` to seed via Prisma. The seed runs once when the template is built, so every clone includes the seeded data.

**Returns:** `PgliteTestDb`
- `getAdapter(): Promise<PrismaPGlite & { reset(): Promise<void> }>` — restores a clone from the dump and returns a new adapter with a `reset()` method that truncates all public tables
- `cleanup(): Promise<void>` — closes all open PGlite instances

### Seeding

```typescript
// Seed with raw SQL
const testDb = createPgliteTestDb({
  seed: `INSERT INTO "User" (email, name) VALUES ('alice@test.com', 'Alice')`,
});

// Seed with a function (uses the Prisma adapter)
const testDb = createPgliteTestDb({
  seed: async (adapter) => {
    const prisma = new PrismaClient({ adapter });
    await prisma.user.create({ data: { email: "alice@test.com", name: "Alice" } });
    await prisma.$disconnect();
  },
});
```

### Resetting between tests

The adapter returned by `getAdapter()` includes a `reset()` method that truncates all public tables (except `_prisma_migrations`):

```typescript
const adapter = await testDb.getAdapter();
const prisma = new PrismaClient({ adapter });

// ... run test ...

await adapter.reset(); // truncates all tables
```

## License

MIT
