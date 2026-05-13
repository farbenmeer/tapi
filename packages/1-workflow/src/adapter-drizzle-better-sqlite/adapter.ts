import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { SqliteAdapter } from "../adapter-sqlite/adapter-sqlite";

export class DrizzleBetterSqliteAdapter extends SqliteAdapter {
  constructor(drizzleDb: BetterSQLite3Database<any>) {
    super((drizzleDb as any).$client);
  }
}
