---
title: Prisma Migrate Test
description: Factory functions for creating isolated test databases using the template-clone pattern.
---

`@farbenmeer/prisma-migrate-test` provides factory functions for creating isolated test databases using the template-clone pattern: migrations run **once** to build a template, then each test gets a cheap clone — no repeated migration overhead.

Two adapters are supported:

- [**SQLite**](/prisma-migrate-test/reference/sqlite) — in-memory template with per-test clones written to a temp directory. Uses `better-sqlite3`.
- [**PGlite**](/prisma-migrate-test/reference/pglite) — in-memory PGlite template with per-test clones restored from a dump. Uses `@electric-sql/pglite`.

## Installation

```bash
npm install @farbenmeer/prisma-migrate-test
```

## Quick Start

### SQLite

```bash
npm install better-sqlite3 @prisma/adapter-better-sqlite3
npm install -D @types/better-sqlite3
```

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

### PGlite

```bash
npm install @electric-sql/pglite pglite-prisma-adapter
```

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
