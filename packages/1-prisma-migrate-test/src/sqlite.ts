import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { readMigrationSql } from "./migrations.js";

export interface SqliteTestDb {
  cleanup(): void;
  getAdapter(): Promise<PrismaBetterSqlite3>;
}

interface Options {
  migrationsPath?: string;
}

export function createSqliteTestDb({
  migrationsPath = "prisma/migrations",
}: Options = {}): SqliteTestDb {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "prisma-test-sqlite-"));

  const fullSql = readMigrationSql(migrationsPath);

  const db = new Database();
  db.exec(fullSql);
  const dump = db.serialize();
  db.close();

  let counter = 0;

  return {
    cleanup(): void {
      fsp.rm(tmpDir, { force: true, recursive: true });
    },
    async getAdapter() {
      const clonePath = path.join(tmpDir, `test-${++counter}.db`);
      await fsp.writeFile(clonePath, dump);
      return new PrismaBetterSqlite3({ url: clonePath });
    },
  };
}
