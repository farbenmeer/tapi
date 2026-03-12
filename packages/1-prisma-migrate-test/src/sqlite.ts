import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { readMigrationSql } from "./migrations.js";

export interface SqliteTestDb {
  cleanup(): void;
  getAdapter(): PrismaBetterSqlite3;
}

export function createSqliteTestDb(
  migrationsPath: string = "prisma/migrations"
): SqliteTestDb {
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "prisma-test-sqlite-")
  );
  const templatePath = path.join(tmpDir, "template.db");

  const fullSql = readMigrationSql(migrationsPath);

  const db = new Database(templatePath);
  db.exec(fullSql);
  db.close();

  let counter = 0;

  return {
    cleanup(): void {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
    getAdapter(): PrismaBetterSqlite3 {
      const clonePath = path.join(tmpDir, `test-${++counter}.db`);
      fs.copyFileSync(templatePath, clonePath);
      return new PrismaBetterSqlite3({ url: clonePath });
    },
  };
}
