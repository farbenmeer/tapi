import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { createPgliteTestDb, type PgliteTestDb } from "../src/pglite.js";
import { PrismaClient } from "./generated/pglite/index.js";

const migrationsPath = path.join(
  fileURLToPath(import.meta.url),
  "../prisma/pglite/migrations",
);

describe("createPgliteTestDb (PGlite e2e)", () => {
  let testDb: PgliteTestDb;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testDb = createPgliteTestDb({ migrationsPath });
  });

  afterAll(() => {
    testDb.cleanup();
  });

  beforeEach(async () => {
    prisma = new PrismaClient({ adapter: await testDb.getAdapter() });
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("creates the expected tables via migrations", async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tableNames = tables.map((t) => t.table_name);
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

    const found = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(found.email).toBe("alice@example.com");
  });

  it("enforces unique constraint on User.email", async () => {
    await prisma.user.create({ data: { email: "bob@example.com" } });
    await expect(
      prisma.user.create({ data: { email: "bob@example.com" } }),
    ).rejects.toThrow();
  });

  it("creates a Post linked to a User and queries the relation", async () => {
    const user = await prisma.user.create({
      data: { email: "carol@example.com" },
    });
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
      prisma.post.create({ data: { title: "Orphan", userId: 9999 } }),
    ).rejects.toThrow();
  });

  it("reset() truncates all public tables", async () => {
    const adapter = await testDb.getAdapter();
    const client = new PrismaClient({ adapter });

    const user = await client.user.create({
      data: { email: "reset@example.com", name: "Reset" },
    });
    await client.post.create({
      data: { title: "To be reset", userId: user.id },
    });

    expect(await client.user.count()).toBeGreaterThan(0);
    expect(await client.post.count()).toBeGreaterThan(0);

    await adapter.reset();

    expect(await client.user.count()).toBe(0);
    expect(await client.post.count()).toBe(0);

    // Tables still exist and are usable after reset
    const newUser = await client.user.create({
      data: { email: "after-reset@example.com" },
    });
    expect(newUser.id).toBeTypeOf("number");

    await client.$disconnect();
  });

  it("deletes a User and cascades correctly", async () => {
    const user = await prisma.user.create({
      data: { email: "dave@example.com" },
    });
    await prisma.post.create({ data: { title: "Post", userId: user.id } });

    await prisma.post.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    const remaining = await prisma.user.findMany();
    expect(remaining).toHaveLength(0);
  });
});
