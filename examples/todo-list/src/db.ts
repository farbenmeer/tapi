import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("todos.sqlite");

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0
  )
`);
