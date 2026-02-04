---
title: Hono Setup
description: Learn how to set up TApi with the Hono web framework.
---

This guide explains how to integrate TApi with [Hono](https://hono.dev/), a fast, lightweight, web-standard web framework.

## Installation

First, install the packages:

```bash
npm install @farbenmeer/tapi hono
# or
pnpm add @farbenmeer/tapi hono
```

## 1. Define your API

Create a central file to define your API structure.

```ts
// src/api.ts
import { defineApi } from "@farbenmeer/tapi/server";

export const api = defineApi()
  // We'll add routes here later
  // .route("/hello", import("./routes/hello"))
```

## 2. Integrate with Hono

You can mount the TApi request handler onto a Hono application instance. Since `createRequestHandler` works with standard Web API `Request` and `Response` objects, it integrates seamlessly with Hono.

```ts
// src/index.ts
import { Hono } from "hono";
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { api } from "./api";

const app = new Hono();

// Initialize the TApi handler
// ensure basePath matches the route you mount it on
const handler = createRequestHandler(api, {
  basePath: "/api"
});

// Mount the handler on the /api prefix
// The '*' wildcard ensures all subpaths are captured
app.all("/api/*", (c) => {
  return handler(c.req.raw);
});

export default app;
```

If you are using a runtime like Bun, Deno, or Cloudflare Workers, `export default app` is usually sufficient entry point.

## 3. Create the Client

To consume your API, create the typed client.

```ts
// src/client.ts
import { createFetchClient } from "@farbenmeer/tapi/client";
import type { api } from "./api";

// Adjust the URL to match your server's address
export const client = createFetchClient<typeof api>("http://localhost:3000/api");
```

## 4. Add a Route

Create a route handler file. For example, `src/routes/hello.ts`:

```ts
// src/routes/hello.ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server";

export const GET = defineHandler({
  authorize: () => true
}, async () => {
  return TResponse.json({ message: "Hello from TApi on Hono!" });
});
```

Register it in `src/api.ts`:

```ts
// src/api.ts
import { defineApi } from "@farbenmeer/tapi/server";

export const api = defineApi()
  .route("/hello", import("./routes/hello"));
```

## 5. Usage

Now you can start your Hono server and use the client to make requests.

```ts
// src/example-usage.ts
import { client } from "./client";

async function main() {
  const response = await client.hello.get();
  console.log(response.message); // "Hello from TApi on Hono!"
}

main();
```

### Context Integration

If you need to access Hono's `Context` (like environment variables in Cloudflare Workers) inside your TApi handlers, you currently need to pass them via a custom storage mechanism (like `AsyncLocalStorage`) or by extending the request object before passing it to `handler`, since TApi abstracts away the underlying framework's specific context object in favor of a standard `TRequest`.

## 6. Revalidation Stream

To enable tag-based revalidation across all cache layers, set up a shared `PubSub` instance and a revalidation endpoint.

Update your Hono app to use a `PubSub` and add a `/api/revalidate` route:

```ts
// src/index.ts
import { Hono } from "hono";
import { PubSub, createRequestHandler, streamRevalidatedTags } from "@farbenmeer/tapi/server";
import { api } from "./api";

const app = new Hono();

const pubsub = new PubSub();

const handler = createRequestHandler(api, {
  basePath: "/api",
  cache: pubsub,
});

app.get("/api/revalidate", (c) => {
  return streamRevalidatedTags({
    cache: pubsub,
    buildId: process.env.BUILD_ID!,
  });
});

app.all("/api/*", (c) => {
  return handler(c.req.raw);
});

export default app;
```

The revalidation route is registered before the catch-all so it doesn't get swallowed by the TApi handler.

Set `BUILD_ID` to a value that changes on every deployment (e.g. a git commit hash) so the service worker cache is fresh after each deploy.

For setting up a service worker that connects to this endpoint, see the [Service Worker guide](/tapi/guides/service-worker). For details on how the cache layers interact, see [Caching Strategies](/tapi/reference/caching).
