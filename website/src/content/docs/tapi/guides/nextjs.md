---
title: Next.js Setup
description: Learn how to set up TApi with Next.js App Router.
---

This guide explains how to integrate TApi with the Next.js App Router.

## Installation

First, install the package:

```bash
npm install @farbenmeer/tapi
# or
pnpm add @farbenmeer/tapi
```

## 1. Define your API

Create a central file to define your API structure. This acts as the source of truth for your routes.

```ts
// src/api.ts
import { defineApi } from "@farbenmeer/tapi/server";

export const api = defineApi()
  // We'll add routes here later
  // .route("/hello", import("./routes/hello"))
```

## 2. Create the Route Handler

Next.js App Router uses a catch-all route to handle dynamic API requests. Create a file at `src/app/api/[...tapi]/route.ts`.

This handler captures all requests to `/api/*` and routes them through TApi.

```ts
// src/app/api/[...tapi]/route.ts
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { api } from "@/api"; // Adjust import path as needed

const handler = createRequestHandler(api, {
  basePath: "/api"
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
```

## 3. Create the Client

To consume your API from client components, create a type-safe fetch client.

```ts
// src/client.ts
"use client";

import { createFetchClient } from "@farbenmeer/tapi/client";
import type { api } from "@/api";

// Assuming your API is mounted at /api
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

And register it in your `src/api.ts`:

```ts
// src/api.ts
import { defineApi } from "@farbenmeer/tapi/server";

export const api = defineApi()
  .route("/hello", import("./routes/hello"));
```

## 5. Usage in Components

### Client Components

Use the client in your interactive components:

```tsx
// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { client } from "@/client";

export default function ClientPage() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    client.hello.get().then((data) => setMsg(data.message));
  }, []);

  if (!msg) return <div>Loading...</div>;

  return <h1>{msg}</h1>;
}
```

### Server Components

For Server Components, you can skip the HTTP overhead by using `createLocalClient`. This calls your handlers directly.

Create a server-only client instance:

```ts
// src/server-client.ts
import { createLocalClient } from "@farbenmeer/tapi/server";
import { api } from "@/api";

export const serverClient = createLocalClient(api);
```

Then use it in your Server Component:

```tsx
// src/app/page.tsx
import { serverClient } from "@/server-client";

export default async function ServerPage() {
  const data = await serverClient.hello.get();
  
  return <h1>{data.message}</h1>;
}
```
