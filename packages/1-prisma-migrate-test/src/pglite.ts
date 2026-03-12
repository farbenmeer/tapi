import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PGlite, type Extensions } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { readMigrationSql } from "./migrations.js";

export interface PgliteTestDb {
  cleanup(): void;
  getAdapter(): Promise<PrismaPGlite>;
}

interface Options {
  migrationsPath?: string;
  extensions?: Extensions;
}

export function createPgliteTestDb({
  migrationsPath = "prisma/migrations",
  extensions = {},
}: Options = {}): PgliteTestDb {
  const fullSql = readMigrationSql(migrationsPath);

  const dump = (async () => {
    const pglite = await PGlite.create({ extensions });
    await pglite.exec(fullSql);
    const dump = await pglite.dumpDataDir();
    await pglite.close();
    return dump;
  })();

  const instances: PGlite[] = [];

  return {
    async cleanup(): Promise<void> {
      for (const instance of instances) {
        await instance.close();
      }
    },
    async getAdapter() {
      const pg = await PGlite.create({ extensions, loadDataDir: await dump });
      instances.push(pg);
      const adapter = new PrismaPGlite(pg);
      return adapter;
    },
  };
}
