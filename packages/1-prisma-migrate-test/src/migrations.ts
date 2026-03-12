import * as fs from "node:fs";
import * as path from "node:path";

export function resolveMigrationsPath(migrationsPath: string): string {
  const resolved = path.isAbsolute(migrationsPath)
    ? migrationsPath
    : path.resolve(process.cwd(), migrationsPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Migrations directory not found: ${resolved}`);
  }

  return resolved;
}

export function readMigrationSql(migrationsPath: string): string {
  const resolvedPath = resolveMigrationsPath(migrationsPath);
  const migrations = getMigrationFiles(resolvedPath);
  return migrations
    .map((migration) => fs.readFileSync(migration.path, "utf-8"))
    .join("\n");
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
