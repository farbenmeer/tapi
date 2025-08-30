import { defineAuth, OauthProvider } from "@farbenmeer/bun-auth";
import { DrizzleSqliteAdapter } from "@farbenmeer/bun-auth/adapter-drizzle-sqlite";
import { db } from "./lib/db";
import { MockProvider } from "@farbenmeer/bun-auth";

export const auth = defineAuth({
  providers: [MockProvider()],
  adapter: new DrizzleSqliteAdapter(db),
});
