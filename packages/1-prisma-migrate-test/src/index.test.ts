import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { applyMigrations } from "./index.js";

const migrationsPath = path.join(
  import.meta.dirname,
  "fixtures",
  "prisma",
  "migrations"
);

describe("applyMigrations", () => {
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
