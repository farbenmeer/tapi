import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestPGlite } from "./index.js";

// Create a temporary migrations directory for testing
function createTestMigrations(tmpDir: string) {
  const migrationsDir = path.join(tmpDir, "prisma", "migrations");
  fs.mkdirSync(migrationsDir, { recursive: true });

  // Migration 1: Create users table
  const migration1Dir = path.join(migrationsDir, "20240101000000_init");
  fs.mkdirSync(migration1Dir, { recursive: true });
  fs.writeFileSync(
    path.join(migration1Dir, "migration.sql"),
    `
    CREATE TABLE "users" (
      "id" SERIAL PRIMARY KEY,
      "email" VARCHAR(255) NOT NULL UNIQUE,
      "name" VARCHAR(255),
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `
  );

  // Migration 2: Create posts table
  const migration2Dir = path.join(migrationsDir, "20240102000000_add_posts");
  fs.mkdirSync(migration2Dir, { recursive: true });
  fs.writeFileSync(
    path.join(migration2Dir, "migration.sql"),
    `
    CREATE TABLE "posts" (
      "id" SERIAL PRIMARY KEY,
      "title" VARCHAR(255) NOT NULL,
      "content" TEXT,
      "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `
  );

  return migrationsDir;
}

describe("createTestPGlite", () => {
  let tmpDir: string;
  let migrationsPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "prisma-test-db-"));
    migrationsPath = createTestMigrations(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should create a database with migrations applied", async () => {
    const testDb = await createTestPGlite(migrationsPath);

    try {
      // Verify tables exist by querying them
      const usersResult = await testDb.pglite.query("SELECT * FROM users");
      expect(usersResult.rows).toEqual([]);

      const postsResult = await testDb.pglite.query("SELECT * FROM posts");
      expect(postsResult.rows).toEqual([]);
    } finally {
      await testDb.close();
    }
  });

  it("should create isolated databases for each call", async () => {
    const db1 = await createTestPGlite(migrationsPath);
    const db2 = await createTestPGlite(migrationsPath);

    // Insert into db1
    await db1.pglite.exec(
      `INSERT INTO users (email, name) VALUES ('user1@test.com', 'User 1')`
    );

    // db2 should be empty
    const usersInDb2 = await db2.pglite.query("SELECT * FROM users");
    expect(usersInDb2.rows).toHaveLength(0);

    // db1 should have the user
    const usersInDb1 = await db1.pglite.query("SELECT * FROM users");
    expect(usersInDb1.rows).toHaveLength(1);

    await db1.close();
    await db2.close();
  });

  it("should support CRUD operations", async () => {
    const testDb = await createTestPGlite(migrationsPath);

    try {
      // Create user
      const userResult = await testDb.pglite.query<{
        id: number;
        email: string;
        name: string;
      }>(
        `INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User') RETURNING id, email, name`
      );
      const user = userResult.rows[0]!;
      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("Test User");

      // Create post
      const postResult = await testDb.pglite.query<{
        id: number;
        title: string;
        user_id: number;
      }>(
        `INSERT INTO posts (title, content, user_id) VALUES ('My Post', 'Hello', $1) RETURNING id, title, user_id`,
        [user.id]
      );
      const post = postResult.rows[0]!;
      expect(post.title).toBe("My Post");
      expect(post.user_id).toBe(user.id);

      // Query posts by user
      const userPosts = await testDb.pglite.query(
        `SELECT * FROM posts WHERE user_id = $1`,
        [user.id]
      );
      expect(userPosts.rows).toHaveLength(1);
    } finally {
      await testDb.close();
    }
  });

  it("should return a working PrismaPGlite adapter", async () => {
    const testDb = await createTestPGlite(migrationsPath);

    try {
      // The adapter should be defined
      expect(testDb.adapter).toBeDefined();
    } finally {
      await testDb.close();
    }
  });

  it("should throw on missing migrations directory", async () => {
    await expect(
      createTestPGlite("/nonexistent/path/migrations")
    ).rejects.toThrow("Migrations directory not found");
  });

  it("should throw on invalid migration SQL", async () => {
    // Create a migration with invalid SQL
    const badMigrationDir = path.join(
      migrationsPath,
      "20240103000000_bad_migration"
    );
    fs.mkdirSync(badMigrationDir, { recursive: true });
    fs.writeFileSync(
      path.join(badMigrationDir, "migration.sql"),
      `INVALID SQL STATEMENT;`
    );

    await expect(createTestPGlite(migrationsPath)).rejects.toThrow(
      /Failed to apply migration 20240103000000_bad_migration/
    );
  });
});
