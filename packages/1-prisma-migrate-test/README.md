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

let testDb = createSqliteTestDb("prisma/migrations");
let prisma: PrismaClient;

beforeAll(() => {
  testDb = createSqliteTestDb("prisma/migrations");
});

afterAll(() => {
  testDb.cleanup();
});

beforeEach(() => {
  prisma = new PrismaClient({ adapter: testDb.getAdapter() });
});

afterEach(async () => {
  await prisma.$disconnect();
});
```

### API

#### `createSqliteTestDb(migrationsPath?): SqliteTestDb`

Runs all migrations once into a template `.db` file, then provides cheap per-test clones.

**Parameters:**
- `migrationsPath` — path to the Prisma migrations folder (default: `"prisma/migrations"`)

**Returns:** `SqliteTestDb`
- `getAdapter(): PrismaBetterSqlite3` — copies the template and returns a new adapter backed by the clone
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
import { PGlite } from "@electric-sql/pglite";
import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
let pglite: PGlite;
let prisma: PrismaClient;

beforeAll(async () => {
  testDb = await createPgliteTestDb("prisma/migrations");
});

afterAll(() => {
  testDb.cleanup();
});

beforeEach(async () => {
  const { adapter, pglite: pg } = await testDb.getAdapter();
  pglite = pg;
  prisma = new PrismaClient({ adapter });
});

afterEach(async () => {
  await prisma.$disconnect();
  await pglite.close();
});
```

### API

#### `createPgliteTestDb(migrationsPath?): Promise<PgliteTestDb>`

Runs all migrations once into a template PGlite directory, then provides cheap per-test clones.

**Parameters:**
- `migrationsPath` — path to the Prisma migrations folder (default: `"prisma/migrations"`)

**Returns:** `Promise<PgliteTestDb>`
- `getAdapter(): Promise<{ adapter: PrismaPGlite; pglite: PGlite }>` — copies the template directory and returns a new adapter and PGlite instance
- `cleanup(): void` — deletes the temp directory

The caller must `await pglite.close()` after `await prisma.$disconnect()`.

## License

MIT
