import { defineAuth, OauthProvider } from "@farbenmeer/bunny/server";
import { DrizzleSqliteAdapter } from "@farbenmeer/bunny/auth/adapter-drizzle-sqlite";
import { db } from "./lib/db";
import { MockProvider } from "@farbenmeer/bunny/server";

export const auth = defineAuth({
  providers: [MockProvider()],
  adapter: new DrizzleSqliteAdapter(db),
});
