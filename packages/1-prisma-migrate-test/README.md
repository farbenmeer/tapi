# @farbenmeer/prisma-migrate-test

A utility for applying Prisma migrations to any database client with a `$queryRawUnsafe` method. Useful for setting up test databases.

## Installation

```bash
npm install @farbenmeer/prisma-migrate-test
```

### Peer Dependencies

```bash
npm install @prisma/client prisma
```

## Usage

```typescript
import { applyMigrations } from "@farbenmeer/prisma-migrate-test";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();
await applyMigrations(client);
```

With a custom migrations path:

```typescript
await applyMigrations(client, "path/to/migrations/folder");
```

## API

### `applyMigrations(client, migrationsPath?): Promise<void>`

Reads all Prisma migration SQL files, concatenates them in chronological order, and executes the result via `client.$queryRawUnsafe`.

**Parameters:**
- `client` - Any object with a `$queryRawUnsafe(query: string): Promise<unknown>` method
- `migrationsPath` - Path to the Prisma migrations folder (default: `"prisma/migrations"`)

## Vitest Setup Examples

### PGlite (in-memory PostgreSQL)

Install dependencies:

```bash
npm install @electric-sql/pglite pglite-prisma-adapter
```

Configure your Prisma schema to use the `postgresql` provider and generate the client with the `pglite` previewFeature. Then in your tests:

```typescript
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { applyMigrations } from "@farbenmeer/prisma-migrate-test";
import { afterEach, beforeEach } from "vitest";

let pglite: PGlite;
let prisma: PrismaClient;

beforeEach(async () => {
  pglite = new PGlite();
  const adapter = new PrismaPGlite(pglite);
  prisma = new PrismaClient({ adapter });
  await applyMigrations(prisma, "prisma/migrations");
});

afterEach(async () => {
  await prisma.$disconnect();
  await pglite.close();
});
```

Each test gets a fresh in-memory PostgreSQL database with all migrations applied.

### SQLite (in-memory)

Install dependencies:

```bash
npm install better-sqlite3 @prisma/adapter-better-sqlite3
npm install -D @types/better-sqlite3
```

Configure your Prisma schema to use the `sqlite` provider and generate the client with the `driverAdapters` previewFeature. Then in your tests:

```typescript
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { applyMigrations } from "@farbenmeer/prisma-migrate-test";
import { afterEach, beforeEach } from "vitest";

let prisma: PrismaClient;

beforeEach(async () => {
  const adapter = new PrismaBetterSqlite3({ url: ":memory:" });
  prisma = new PrismaClient({ adapter });
  await applyMigrations(prisma, "prisma/migrations");
});

afterEach(async () => {
  await prisma.$disconnect();
});
```

Each test gets a fresh in-memory SQLite database with all migrations applied.

## End-to-End Tests

The `e2e/` directory contains a full Prisma setup with real in-memory databases:

```
e2e/
  prisma/
    pglite/
      schema.prisma         # PostgreSQL provider schema
      migrations/           # Prisma-generated SQL migrations
    sqlite/
      schema.prisma         # SQLite provider schema
      migrations/           # Prisma-generated SQL migrations
  pglite.test.ts            # PGlite (in-memory PostgreSQL) e2e tests
  sqlite.test.ts            # better-sqlite3 (in-memory SQLite) e2e tests
```

Run the e2e tests:

```bash
pnpm test:e2e
```

The e2e tests apply the real migrations via `applyMigrations` and verify the schema by running SQL queries against the live in-memory databases.

## License

MIT
