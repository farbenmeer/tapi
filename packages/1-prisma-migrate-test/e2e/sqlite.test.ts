import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "./generated/sqlite/index.js";
import { createSqliteTestDb, type SqliteTestDb } from "../src/sqlite.js";

const migrationsPath = path.join(
  fileURLToPath(import.meta.url),
  "../prisma/sqlite/migrations"
);

describe("createSqliteTestDb (SQLite e2e)", () => {
  let testDb: SqliteTestDb;
  let prisma: PrismaClient;

  beforeAll(() => {
    testDb = createSqliteTestDb(migrationsPath);
  });

  afterAll(() => {
    testDb.cleanup();
  });

  beforeEach(() => {
    prisma = new PrismaClient({ adapter: testDb.getAdapter() });
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("creates the expected tables via migrations", async () => {
    const tables = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
    `;
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain("User");
    expect(tableNames).toContain("Post");
  });

  it("creates and retrieves a User", async () => {
    const user = await prisma.user.create({
      data: { email: "alice@example.com", name: "Alice" },
    });
    expect(user.id).toBeTypeOf("number");
    expect(user.email).toBe("alice@example.com");
    expect(user.name).toBe("Alice");

    const found = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(found.email).toBe("alice@example.com");
  });

  it("enforces unique constraint on User.email", async () => {
    await prisma.user.create({ data: { email: "bob@example.com" } });
    await expect(
      prisma.user.create({ data: { email: "bob@example.com" } })
    ).rejects.toThrow();
  });

  it("creates a Post linked to a User and queries the relation", async () => {
    const user = await prisma.user.create({ data: { email: "carol@example.com" } });
    const post = await prisma.post.create({
      data: { title: "Hello", content: "World", userId: user.id },
    });
    expect(post.userId).toBe(user.id);

    const userWithPosts = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { posts: true },
    });
    expect(userWithPosts.posts).toHaveLength(1);
    expect(userWithPosts.posts[0]!.title).toBe("Hello");
  });

  it("rejects a Post with a non-existent userId", async () => {
    await expect(
      prisma.post.create({ data: { title: "Orphan", userId: 9999 } })
    ).rejects.toThrow();
  });

  it("deletes a User and cascades correctly", async () => {
    const user = await prisma.user.create({ data: { email: "dave@example.com" } });
    await prisma.post.create({ data: { title: "Post", userId: user.id } });

    await prisma.post.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    const remaining = await prisma.user.findMany();
    expect(remaining).toHaveLength(0);
  });
});
