import { type Extensions, PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { readMigrationSql } from "./migrations.js";

export interface PgliteTestDb {
  cleanup(): void;
  getAdapter(): Promise<PrismaPGlite & { reset(): Promise<void> }>;
}

interface Options {
  migrationsPath?: string;
  extensions?: Extensions;
  seed?: string | ((adapter: PrismaPGlite) => Promise<void>);
}

export function createPgliteTestDb({
  migrationsPath = "prisma/migrations",
  extensions = {},
  seed,
}: Options = {}): PgliteTestDb {
  const fullSql = readMigrationSql(migrationsPath);

  const dump = (async () => {
    const pglite = await PGlite.create({ extensions });
    await pglite.exec(fullSql);
    if (seed) {
      if (typeof seed === "function") {
        await seed(new PrismaPGlite(pglite));
      } else {
        await pglite.exec(seed);
      }
    }
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
      return Object.assign(adapter, {
        reset: async () => {
          const [result] = await pg.exec(`
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
          `);
          if (result && result.rows.length > 0) {
            await pg.exec(
              `TRUNCATE TABLE ${result.rows.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`,
            );
          }
        },
      });
    },
  };
}
