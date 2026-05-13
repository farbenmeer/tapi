import { readFileSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { SqliteAdapter } from "./adapter-sqlite/adapter-sqlite.js";

const SQLITE_SCHEMA = readFileSync(
  path.resolve(process.cwd(), "sql/sqlite.sql"),
  "utf-8",
);

export class InMemoryAdapter extends SqliteAdapter {
  constructor() {
    const db = new Database(":memory:");
    db.exec(SQLITE_SCHEMA);
    super(db);
  }
}
