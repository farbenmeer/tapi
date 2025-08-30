import { Command } from "commander";
import * as migrator from "drizzle-orm/bun-sqlite/migrator";
import path from "node:path";
import "./tailwind-plugin";

export const migrate = new Command()
  .name("migrate")
  .description("Apply Database Migrations")
  .action(async () => {
    const dbPath = path.join(process.cwd(), "src", "lib", "db");
    const { db } = await import(dbPath);
    migrator.migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
  });
