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

**Returns:** `PgliteTestDb`

| Method | Returns | Description |
|---|---|---|
| `getAdapter()` | `Promise<PrismaPGlite>` | Restores a clone from the dump and returns a new adapter |
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
