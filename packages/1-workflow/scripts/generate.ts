import { spawn } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const BIN = path.join(ROOT, "node_modules/.bin");

function makeTmpDir(prefix: string) {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runAsync(
  command: string,
  args: string[],
  cwd: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function cleanDrizzleKitOutput(dir: string) {
  for (const file of readdirSync(dir)) {
    if (file.endsWith(".sql") || file === "relations.ts" || file === "meta") {
      rmSync(path.join(dir, file), { recursive: true, force: true });
    }
  }
}

async function generateSqlite() {
  const sqliteSql = readFileSync(path.join(SRC, "sql/sqlite.sql"), "utf-8");
  const tmpDir = makeTmpDir("workflow-codegen-sqlite-");
  const tmpDb = path.join(tmpDir, "codegen.sqlite");

  try {
    const db = new Database(tmpDb);
    db.exec(sqliteSql);
    db.close();

    await runAsync(
      `${BIN}/kysely-codegen`,
      [
        "--dialect",
        "sqlite",
        "--url",
        tmpDb,
        "--out-file",
        path.join(SRC, "adapter-sqlite/types.ts"),
      ],
      ROOT,
    );

    await runAsync(
      `${BIN}/drizzle-kit`,
      [
        "pull",
        "--dialect",
        "sqlite",
        "--url",
        `file:${tmpDb}`,
        "--out",
        path.join(SRC, "adapter-drizzle-better-sqlite"),
      ],
      ROOT,
    );

    cleanDrizzleKitOutput(path.join(SRC, "adapter-drizzle-better-sqlite"));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log("SQLite codegen complete.");
}

async function generatePostgres() {
  const postgresSql = readFileSync(
    path.join(SRC, "sql/postgres.sql"),
    "utf-8",
  );

  const pg = new PGlite();
  await pg.exec(postgresSql);

  const server = new PGLiteSocketServer({
    db: pg,
    port: 5433,
    host: "127.0.0.1",
    maxConnections: 100,
  });

  await server.start();

  const connectionUrl =
    "postgres://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable";

  try {
    await runAsync(
      `${BIN}/kysely-codegen`,
      [
        "--dialect",
        "postgres",
        "--url",
        connectionUrl,
        "--out-file",
        path.join(SRC, "adapter-postgres/types.ts"),
      ],
      ROOT,
    );

    await runAsync(
      `${BIN}/drizzle-kit`,
      [
        "pull",
        "--dialect",
        "postgresql",
        "--url",
        connectionUrl,
        "--out",
        path.join(SRC, "adapter-drizzle-node-postgres"),
      ],
      ROOT,
    );

    cleanDrizzleKitOutput(path.join(SRC, "adapter-drizzle-node-postgres"));
  } finally {
    await server.stop();
    await pg.close();
  }

  console.log("Postgres codegen complete.");
}

async function main() {
  await generateSqlite();
  await generatePostgres();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
