import * as d from "drizzle-orm/sqlite-core";
export * from "@farbenmeer/bun-auth/adapter-drizzle-sqlite/schema";

export const users = d.sqliteTable("users", {
  id: d
    .text("id")
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  email: d.text("email").unique(),
  name: d.text("name"),
  picture: d.text("picture"),
});

export const accounts = d.sqliteTable(
  "accounts",
  {
    id: d
      .text("id")
      .primaryKey()
      .$defaultFn(() => Bun.randomUUIDv7()),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => users.id),
    provider: d.text("provider").notNull(),
    providerAccountId: d.text("provider_account_id").notNull(),
  },
  (t) => [d.unique().on(t.provider, t.providerAccountId)]
);

export const sessions = d.sqliteTable("sessions", {
  id: d
    .text("id")
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  userId: d
    .text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: d.int("expires_at").notNull(),
});
