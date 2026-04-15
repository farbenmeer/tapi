---
title: Bun Setup
description: Learn how to set up TApi with Bun's native HTTP server.
---

This guide explains how to integrate TApi with [Bun](https://bun.sh/)'s native HTTP server, `Bun.serve`. Because `createRequestHandler` works with standard Web API `Request` and `Response` objects, it can be passed straight to `Bun.serve` as its `fetch` handler — no adapter required.

## Installation

First, install the package:

```bash
bun add @farbenmeer/tapi
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

## 2. Create the Server

Pass the handler returned by `createRequestHandler` directly to `Bun.serve`.

```ts
// src/index.ts
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { api } from "./api";

// ensure basePath matches the URL prefix where TApi is mounted
const handler = createRequestHandler(api, {
  basePath: "/api",
});

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // Mount TApi under /api
    if (path.startsWith("/api")) {
      return handler(req);
    }

    // Everything else falls through (static assets, other routes, ...)
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
```

If your server serves nothing but the TApi routes, you can pass `handler` directly and drop the `basePath`:

```ts
const handler = createRequestHandler(api);

Bun.serve({
  port: 3000,
  fetch: handler,
});
```

### Using Bun's native routing

`Bun.serve` also exposes a `routes` option that matches paths with `:param` and `*` wildcards. You can mount TApi on a catch-all pattern and keep `fetch` as the fallback for everything else:

```ts
// src/index.ts
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { api } from "./api";

const handler = createRequestHandler(api, {
  basePath: "/api",
});

Bun.serve({
  port: 3000,
  routes: {
    "/api/*": (req) => handler(req),
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});
```

This lets you mix TApi with other native Bun routes — for example a health check or a static response — without writing path checks by hand:

```ts
Bun.serve({
  port: 3000,
  routes: {
    "/health": new Response("ok"),
    "/api/*": (req) => handler(req),
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});
```

## 3. Create the Client

To consume your API, create the typed client.

```ts
// src/client.ts
import { createFetchClient } from "@farbenmeer/tapi/client";
import type { api } from "./api";

export const client = createFetchClient<typeof api>("http://localhost:3000/api");
```

## 4. Add a Route

Create a route handler file. For example, `src/routes/hello.ts`:

```ts
// src/routes/hello.ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server";

export const GET = defineHandler({
  authorize: () => true,
}, async () => {
  return TResponse.json({ message: "Hello from TApi on Bun!" });
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

Start the server with Bun:

```bash
bun run src/index.ts
```

And call it using the typed client:

```ts
// src/example-usage.ts
import { client } from "./client";

async function main() {
  const response = await client.hello.get();
  console.log(response.message); // "Hello from TApi on Bun!"
}

main();
```

## 6. Revalidation Stream

To enable tag-based revalidation across all cache layers, add a revalidation endpoint. `defineApi` automatically creates a `PubSub` instance, so no extra setup is needed for single-host deployments.

Register `/api/revalidate` **before** the catch-all `/api` branch, otherwise the TApi handler will swallow it:

```ts
// src/index.ts
import {
  createRequestHandler,
  streamRevalidatedTags,
} from "@farbenmeer/tapi/server";
import { api } from "./api";

const handler = createRequestHandler(api, {
  basePath: "/api",
});

Bun.serve({
  port: 3000,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    if (path === "/api/revalidate") {
      return streamRevalidatedTags({
        cache: api.cache,
        buildId: process.env.BUILD_ID!,
      });
    }

    if (path.startsWith("/api")) {
      return handler(req);
    }

    return new Response("Not Found", { status: 404 });
  },
});
```

The equivalent using Bun's native routing — `/api/revalidate` is listed as a concrete route so it takes precedence over the `/api/*` catch-all:

```ts
Bun.serve({
  port: 3000,
  routes: {
    "/api/revalidate": () =>
      streamRevalidatedTags({
        cache: api.cache,
        buildId: process.env.BUILD_ID!,
      }),
    "/api/*": (req) => handler(req),
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});
```

Set `BUILD_ID` to a value that changes on every deployment (e.g. a git commit hash) so the service worker cache is fresh after each deploy.

For setting up a service worker that connects to this endpoint, see the [Service Worker guide](/tapi/guides/service-worker). For details on how the cache layers interact, see [Caching Strategies](/tapi/reference/caching).
