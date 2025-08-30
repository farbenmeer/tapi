import { defineAuth, OauthProvider } from "@farbenmeer/bun-auth";
import { DrizzleSqliteAdapter } from "@farbenmeer/bun-auth/adapter-drizzle-sqlite";
import { db } from "./db";

export const auth = defineAuth({
  providers: [
    OauthProvider({
      id: "mock",
      issuer: "https://oauth-mock.mock.beeceptor.com",
      clientId: "mock",
      clientSecret: "mock",
    }),
  ],
  adapter: new DrizzleSqliteAdapter(db),
});
