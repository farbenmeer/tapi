import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite", // 'mysql' | 'sqlite' | 'turso'
  schema: "./src/lib/schema.ts",
  dbCredentials: {
    url: process.env.SQLITE_FILE ?? "./db.sqlite",
  },
});
