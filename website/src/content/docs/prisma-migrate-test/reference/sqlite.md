---
title: createSqliteTestDb
---

`createSqliteTestDb` creates an isolated SQLite test database using the template-clone pattern. Migrations run once into an in-memory template; each test gets a cheap clone written to a temp directory.

```ts
import { createSqliteTestDb } from "@farbenmeer/prisma-migrate-test/sqlite";
```

## Peer Dependencies

```bash
npm install better-sqlite3 @prisma/adapter-better-sqlite3
npm install -D @types/better-sqlite3
```

## API

### `createSqliteTestDb(options?): SqliteTestDb`

**Parameters:**

| Option | Type | Default | Description |
|---|---|---|---|
| `migrationsPath` | `string` | `"prisma/migrations"` | Path to the Prisma migrations folder |

**Returns:** `SqliteTestDb`

| Method | Returns | Description |
|---|---|---|
| `getAdapter()` | `Promise<PrismaBetterSqlite3>` | Writes a clone of the template to disk and returns a new adapter backed by it |
| `cleanup()` | `void` | Deletes the temp directory |

## Usage

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
