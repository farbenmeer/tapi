---
title: Astro Setup
description: Learn how to set up TApi with Astro.
---

This guide explains how to integrate TApi with Astro API routes.

## Installation

First, install the package:

```bash
npm install @farbenmeer/tapi
# or
pnpm add @farbenmeer/tapi
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

## 2. Create the Route Handler

Astro uses file-based routing. To handle all requests under `/api`, create a catch-all route file at `src/pages/api/[...tapi].ts`.

```ts
// src/pages/api/[...tapi].ts
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { api } from "../../api";
import type { APIRoute } from "astro";

const handler = createRequestHandler(api, {
  basePath: "/api"
});

// The ALL export handles all HTTP methods (GET, POST, etc.)
export const ALL: APIRoute = ({ request }) => {
  return handler(request);
};
```

## 3. Create the Client

Create a client for browser-side usage.

```ts
// src/client.ts
import { createFetchClient } from "@farbenmeer/tapi/client";
import type { api } from "./api";

export const client = createFetchClient<typeof api>("/api");
```

## 4. Add a Route

Create a route handler file. For example, `src/routes/hello.ts`:

```ts
// src/routes/hello.ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server";

export const GET = defineHandler({
  authorize: () => true
}, async () => {
  return TResponse.json({ message: "Hello from TApi!" });
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

### Client-Side Usage

You can use the client in your `<script>` tags or within UI framework components (React, Vue, Svelte, etc.) that interact on the client.

```astro
---
// src/pages/client-demo.astro
---

<button id="fetch-btn">Fetch Data</button>
<div id="result"></div>

<script>
  import { client } from "../client";

  const btn = document.getElementById("fetch-btn");
  const result = document.getElementById("result");

  btn?.addEventListener("click", async () => {
    const data = await client.hello.get();
    if (result) result.innerText = data.message;
  });
</script>
```

### Server-Side Usage (Frontmatter)

When fetching data inside Astro component frontmatter (which runs on the server during build or SSR), you should use `createLocalClient` to call handlers directly without an HTTP round-trip.

First, set up a server client helper:

```ts
// src/server-client.ts
import { createLocalClient } from "@farbenmeer/tapi/server";
import { api } from "./api";

export const serverClient = createLocalClient(api);
```

Then use it in your Astro pages:

```astro
---
// src/pages/index.astro
import { serverClient } from "../server-client";

const data = await serverClient.hello.get();
---

<h1>{data.message}</h1>
```

## 6. Revalidation Stream

To enable tag-based revalidation across all cache layers, set up a shared `PubSub` instance and a revalidation endpoint.

First, update your route handler to use a `PubSub`:

```ts
// src/pages/api/[...tapi].ts
import { PubSub, createRequestHandler } from "@farbenmeer/tapi/server";
import { api } from "../../api";
import type { APIRoute } from "astro";

export const pubsub = new PubSub();

const handler = createRequestHandler(api, {
  basePath: "/api",
  cache: pubsub,
});

export const ALL: APIRoute = ({ request }) => {
  return handler(request);
};
```

Then add a revalidation endpoint at `src/pages/api/revalidate.ts`:

```ts
// src/pages/api/revalidate.ts
import { streamRevalidatedTags } from "@farbenmeer/tapi/server";
import { pubsub } from "./[...tapi]";
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  return streamRevalidatedTags({
    cache: pubsub,
    buildId: import.meta.env.BUILD_ID,
  });
};
```

Set `BUILD_ID` to a value that changes on every deployment (e.g. a git commit hash) so the service worker cache is fresh after each deploy.

For setting up a service worker that connects to this endpoint, see the [Service Worker guide](/tapi/guides/service-worker). For details on how the cache layers interact, see [Caching Strategies](/tapi/reference/caching).
