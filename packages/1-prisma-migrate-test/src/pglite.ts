import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { readMigrationSql } from "./migrations.js";

export interface PgliteTestDb {
  cleanup(): void;
  getAdapter(): Promise<{ adapter: PrismaPGlite; pglite: PGlite }>;
}

export async function createPgliteTestDb(
  migrationsPath: string = "prisma/migrations"
): Promise<PgliteTestDb> {
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "prisma-test-pglite-")
  );
  const templateDir = path.join(tmpDir, "template");

  const fullSql = readMigrationSql(migrationsPath);

  const pglite = new PGlite(templateDir);
  await pglite.exec(fullSql);
  await pglite.close();

  let counter = 0;

  return {
    cleanup(): void {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
    async getAdapter(): Promise<{ adapter: PrismaPGlite; pglite: PGlite }> {
      const cloneDir = path.join(tmpDir, `test-${++counter}`);
      fs.cpSync(templateDir, cloneDir, { recursive: true });
      const pg = new PGlite(cloneDir);
      const adapter = new PrismaPGlite(pg);
      return { adapter, pglite: pg };
    },
  };
}
