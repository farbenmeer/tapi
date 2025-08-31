import * as d from "drizzle-orm/sqlite-core";
import type { UserInfoResponse } from "oauth4webapi";

export const users = d.sqliteTable("users", {
  id: d
    .text("id")
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  email: d.text("email").unique(),
  emailVerified: d.int("email_verified").notNull().default(0),
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
    info: d
      .text("info", { mode: "json" })
      .$type<
        Omit<
          UserInfoResponse,
          "sub" | "email" | "picture" | "email_verified" | "name"
        >
      >(),
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
