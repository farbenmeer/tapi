import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import * as fs from "node:fs";
import * as path from "node:path";

export interface TestPGliteInstance {
  pglite: PGlite;
  adapter: PrismaPGlite;
  close: () => Promise<void>;
}

/**
 * Creates an isolated PGlite database with all Prisma migrations applied.
 *
 * @example
 * ```ts
 * import { PrismaClient } from '@prisma/client';
 * import { createTestPGlite } from '@farbenmeer/prisma-test-db';
 *
 * const testDb = await createTestPGlite('./prisma/migrations');
 * const prisma = new PrismaClient({ adapter: testDb.adapter });
 *
 * // ... run tests ...
 *
 * await testDb.close();
 * ```
 */
export async function createTestPGlite(
  migrationsPath: string = "prisma/migrations"
): Promise<TestPGliteInstance> {
  const pglite = new PGlite();

  const resolvedPath = path.isAbsolute(migrationsPath)
    ? migrationsPath
    : path.resolve(process.cwd(), migrationsPath);

  await applyMigrations(pglite, resolvedPath);

  const adapter = new PrismaPGlite(pglite);

  return {
    pglite,
    adapter,
    close: async () => {
      await pglite.close();
    },
  };
}

async function applyMigrations(
  pglite: PGlite,
  migrationsPath: string
): Promise<void> {
  if (!fs.existsSync(migrationsPath)) {
    throw new Error(`Migrations directory not found: ${migrationsPath}`);
  }

  const migrations = getMigrationFiles(migrationsPath);

  for (const migration of migrations) {
    const sql = fs.readFileSync(migration.path, "utf-8");
    try {
      await pglite.exec(sql);
    } catch (error) {
      throw new Error(
        `Failed to apply migration ${migration.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

function getMigrationFiles(
  migrationsPath: string
): Array<{ name: string; path: string }> {
  const entries = fs.readdirSync(migrationsPath, { withFileTypes: true });
  const migrations: Array<{ name: string; path: string }> = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Prisma migrations: 20231201120000_initial/migration.sql
      const migrationSqlPath = path.join(
        migrationsPath,
        entry.name,
        "migration.sql"
      );
      if (fs.existsSync(migrationSqlPath)) {
        migrations.push({
          name: entry.name,
          path: migrationSqlPath,
        });
      }
    }
  }

  // Sort by name (Prisma migrations are prefixed with timestamps)
  return migrations.sort((a, b) => a.name.localeCompare(b.name));
}

export { PGlite, PrismaPGlite };
