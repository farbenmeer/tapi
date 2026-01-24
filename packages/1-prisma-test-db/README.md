# @farbenmeer/prisma-test-db

A simple utility for creating isolated PostgreSQL test databases using [PGlite](https://pglite.dev/) and [Prisma ORM](https://www.prisma.io/).

## Installation

```bash
npm install @farbenmeer/prisma-test-db
```

### Peer Dependencies

```bash
npm install @prisma/client prisma
```

### Prisma Configuration

Your Prisma schema must enable the `driverAdapters` preview feature:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Usage

```typescript
import { PrismaClient } from "@prisma/client";
import { createTestPGlite } from "@farbenmeer/prisma-test-db";
import { describe, it, beforeEach, afterEach } from "vitest";

describe("my tests", () => {
  let testDb: Awaited<ReturnType<typeof createTestPGlite>>;
  let prisma: PrismaClient;

  beforeEach(async () => {
    testDb = await createTestPGlite("./prisma/migrations");
    prisma = new PrismaClient({ adapter: testDb.adapter });
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await testDb.close();
  });

  it("should create a user", async () => {
    const user = await prisma.user.create({
      data: { email: "test@example.com" },
    });
    expect(user.email).toBe("test@example.com");
  });
});
```

## API

### `createTestPGlite(migrationsPath?: string): Promise<TestPGliteInstance>`

Creates a new in-memory PGlite database with all Prisma migrations applied.

**Parameters:**
- `migrationsPath` - Path to the Prisma migrations folder (default: `"prisma/migrations"`)

**Returns:** `TestPGliteInstance`
- `pglite` - The PGlite database instance
- `adapter` - The PrismaPGlite adapter for use with Prisma Client
- `close()` - Async function to close the database

## License

MIT