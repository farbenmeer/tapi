import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyMigrations } from "./index.js";

function createTestMigrations(tmpDir: string) {
  const migrationsDir = path.join(tmpDir, "prisma", "migrations");
  fs.mkdirSync(migrationsDir, { recursive: true });

  const migration1Dir = path.join(migrationsDir, "20240101000000_init");
  fs.mkdirSync(migration1Dir, { recursive: true });
  fs.writeFileSync(
    path.join(migration1Dir, "migration.sql"),
    `CREATE TABLE "users" (\n  "id" SERIAL PRIMARY KEY,\n  "email" VARCHAR(255) NOT NULL\n);\n`
  );

  const migration2Dir = path.join(migrationsDir, "20240102000000_add_posts");
  fs.mkdirSync(migration2Dir, { recursive: true });
  fs.writeFileSync(
    path.join(migration2Dir, "migration.sql"),
    `CREATE TABLE "posts" (\n  "id" SERIAL PRIMARY KEY,\n  "title" VARCHAR(255) NOT NULL\n);\n`
  );

  return migrationsDir;
}

describe("applyMigrations", () => {
  let tmpDir: string;
  let migrationsPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "prisma-test-db-"));
    migrationsPath = createTestMigrations(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should call $queryRawUnsafe for each SQL statement across all migrations", async () => {
    const client = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };

    await applyMigrations(client, migrationsPath);

    expect(client.$queryRawUnsafe).toHaveBeenCalled();
    const allSql = client.$queryRawUnsafe.mock.calls.map((c) => c[0] as string).join(" ");
    expect(allSql).toContain('"users"');
    expect(allSql).toContain('"posts"');
  });

  it("should apply migrations in chronological order", async () => {
    const client = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };

    await applyMigrations(client, migrationsPath);

    const allSql = client.$queryRawUnsafe.mock.calls.map((c) => c[0] as string).join("\n");
    expect(allSql.indexOf('"users"')).toBeLessThan(allSql.indexOf('"posts"'));
  });

  it("should use default migrations path when not provided", async () => {
    const client = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };

    await expect(applyMigrations(client)).rejects.toThrow(
      "Migrations directory not found"
    );
  });

  it("should throw on missing migrations directory", async () => {
    const client = { $queryRawUnsafe: vi.fn() };

    await expect(
      applyMigrations(client, "/nonexistent/path/migrations")
    ).rejects.toThrow("Migrations directory not found");
  });

  it("should propagate errors from $queryRawUnsafe", async () => {
    const client = {
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error("syntax error")),
    };

    await expect(applyMigrations(client, migrationsPath)).rejects.toThrow(
      "syntax error"
    );
  });
});
