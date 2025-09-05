# Bun Auth

Very simple oauth authentication for Bun's built in HTTP server.

## Installation
Install the package using bun:
```bash
bun add @farbenmeer/bun-auth
```

Set up your drizzle database schema:
```ts
// schema.ts
export * from "@farbenmeer/bun-auth/adapter-drizzle-sqlite/schema";
```

Set up your drizzle-database:
```ts
// db.ts
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const db = drizzle(process.env.SQLITE_FILE || "./db.sqlite", { schema });
```

Define your authentication strategy:
```ts
// auth.ts
import { defineAuth, OauthProvider } from "@farbenmeer/bun-auth/server";
import { db } from "./db"
import { DrizzleSqliteAdapter } from "@farbenmeer/bun-auth/adapter-drizzle-sqlite";

const db = drizzle(process.env.SQLITE_FILE || "./db.sqlite", { schema });

const auth = defineAuth({
  adapter: new DrizzleSqliteAdapter(db),
  providers: [
    OauthProvider({
      id: "google",
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET!,
      issuer: "https://accounts.google.com",
    })
  ]
});
```

Set up the route where you define your web server:
```ts
import { serve } from "bun";
import { auth } from "./auth";
import { createAuthRoute } from "@farbenmeer/bun-auth/server"

const server = serve({
  routes: {
    "/api/auth/*": createAuthRoute(auth),
  },
  port: 3000,
  development: process.env.NODE_ENV === "development" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
```

## Usage

`defineAuth` returns a function that can be used to authenticate a request:

```ts
async function handleHelloRequest(request: Request) {
  const session = await auth(request)

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(`Hello, ${session.user.name}!`)
}
```
