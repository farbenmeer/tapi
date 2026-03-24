---
title: createPgliteTestDb
---

`createPgliteTestDb` creates an isolated PGlite test database using the template-clone pattern. Migrations run once into an in-memory PGlite instance and the result is dumped; each test gets a cheap clone restored from that dump.

```ts
import { createPgliteTestDb } from "@farbenmeer/prisma-migrate-test/pglite";
```

## Peer Dependencies

```bash
npm install @electric-sql/pglite pglite-prisma-adapter
```

Configure your Prisma schema to use the `postgresql` provider and generate the client with the `pglite` previewFeature.

## API

### `createPgliteTestDb(options?): PgliteTestDb`

**Parameters:**

| Option | Type | Default | Description |
|---|---|---|---|
| `migrationsPath` | `string` | `"prisma/migrations"` | Path to the Prisma migrations folder |
| `extensions` | `object` | `{}` | PGlite extensions to pass to each instance |
| `seed` | `string \| ((adapter: PrismaPGlite) => Promise<void>)` | — | Optional seed data applied after migrations. Pass a SQL string or an async function that receives the Prisma adapter. Runs once when the template is built. |

**Returns:** `PgliteTestDb`

| Method | Returns | Description |
|---|---|---|
| `getAdapter()` | `Promise<PrismaPGlite & { reset(): Promise<void> }>` | Restores a clone from the dump and returns a new adapter with a `reset()` method |
| `cleanup()` | `Promise<void>` | Closes all open PGlite instances |

## Usage

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

## Seeding

The `seed` option populates the template with initial data after migrations run. Since the seed is applied before the dump, every clone includes the seeded data automatically.

### SQL string

```typescript
const testDb = createPgliteTestDb({
  seed: `INSERT INTO "User" (email, name) VALUES ('alice@test.com', 'Alice')`,
});
```

### Function

Use a function to seed via Prisma, which gives you type-safe access to your models:

```typescript
const testDb = createPgliteTestDb({
  seed: async (adapter) => {
    const prisma = new PrismaClient({ adapter });
    await prisma.user.create({
      data: { email: "alice@test.com", name: "Alice" },
    });
    await prisma.$disconnect();
  },
});
```

## Resetting

The adapter returned by `getAdapter()` includes a `reset()` method that truncates all public tables (except `_prisma_migrations`). This is useful for cleaning up between tests without creating a new clone:

```typescript
const adapter = await testDb.getAdapter();
const prisma = new PrismaClient({ adapter });

// ... run test ...

await adapter.reset(); // all tables are now empty
```
