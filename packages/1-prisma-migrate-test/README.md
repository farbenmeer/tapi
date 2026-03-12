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
