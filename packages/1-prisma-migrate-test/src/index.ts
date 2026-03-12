import * as fs from "node:fs";
import * as path from "node:path";

interface ClientWithQueryRawUnsafe {
  $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
}

/**
 * Applies all Prisma migrations to the given database client.
 *
 * @example
 * ```ts
 * import { applyMigrations } from '@farbenmeer/prisma-test-db';
 * import { PrismaClient } from '@prisma/client';
 *
 * const client = new PrismaClient();
 * await applyMigrations(client);
 * ```
 *
 * @example With a custom migrations path:
 * ```ts
 * await applyMigrations(client, 'path/to/migrations/folder');
 * ```
 */
export async function applyMigrations(
  client: ClientWithQueryRawUnsafe,
  migrationsPath: string = "prisma/migrations"
): Promise<void> {
  const resolvedPath = path.isAbsolute(migrationsPath)
    ? migrationsPath
    : path.resolve(process.cwd(), migrationsPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Migrations directory not found: ${resolvedPath}`);
  }

  const migrations = getMigrationFiles(resolvedPath);

  const sql = migrations
    .map((migration) => fs.readFileSync(migration.path, "utf-8"))
    .join("\n");

  const statements = sql
    .split(/;[ \t]*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await client.$queryRawUnsafe(statement);
  }
}

function getMigrationFiles(
  migrationsPath: string
): Array<{ name: string; path: string }> {
  const entries = fs.readdirSync(migrationsPath, { withFileTypes: true });
  const migrations: Array<{ name: string; path: string }> = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
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

  return migrations.sort((a, b) => a.name.localeCompare(b.name));
}
