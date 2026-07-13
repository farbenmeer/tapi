---
title: "createLocalClient"
description: "Call your Toapi handlers in-process with the same typed client — no HTTP round-trip, ideal for server components and scripts."
---

The `createLocalClient` function lets you use your typed API client in a server-side environment (like Next.js Server Components, Astro frontmatter, or scripts). Instead of making real HTTP network requests, it calls your request handlers directly in memory while preserving the same convenient API and type safety as the browser [client](/client/).

## Usage

You typically create a local client instance alongside your API definition or in a server-only utility file.

```ts
// server-client.ts
import { createLocalClient } from "@toapi/server";
import { api } from "./api"; // Your ApiDefinition

export const serverClient = createLocalClient(api);
```

Then use it in your server code:

```tsx
// app/page.tsx (Server Component)
import { serverClient } from "@/server-client";

export default async function Page() {
  // Calls the handler function directly, no HTTP request involved
  const users = await serverClient.users.get();

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Signature

```ts
function createLocalClient<Routes>(
  api: ApiDefinition<Routes>,
  init?: RequestInit,
): Client<Routes>;
```

## Parameters

### `api`

**Type**: [`ApiDefinition`](/server/reference/api-definition/)

The API definition object returned by [`defineApi`](/server/reference/define-api/). This contains the complete map of your routes and handlers.

### `init`

**Type**: `RequestInit`

Optional default request init merged into every synthetic request. Use it to supply headers (such as `Cookie` or `Authorization`) that your `authorize` functions rely on. Per-call init passed to a client method is merged on top of these defaults.

## How it works

`createLocalClient` creates a standard [`createFetchClient`](/client/) but overrides the internal `fetch` implementation:

1. It initializes your API using [`createRequestHandler`](/server/reference/create-request-handler/).
2. When you call a method like `.get()`, it constructs a `Request` object representing that call.
3. It passes this request directly to the request handler.
4. It parses the returned `Response` and returns the typed data.

This eliminates the overhead of serialization, network latency, and the self-signed certificate issues that can occur when a server tries to fetch from itself over HTTP.

## Passing request context

Since `createLocalClient` runs inside your server process, the requests it generates are synthetic. They have a base URL of `http://localhost`.

If your `authorize` functions or handlers rely on specific headers (like `Cookie` or `Authorization`) that would normally come from an incoming browser request, pass that context explicitly — either as the `init` argument when constructing the client, or per call:

```ts
const headerStore = await headers();

serverClient.users.post(
  { name: "Milo Mock" },
  {
    headers: {
      Authorization: headerStore.get("Authorization") ?? "",
    },
  },
);
```

## Related

- [`@toapi/client`](/client/) — the underlying fetch client and its full method surface.
- [`createRequestHandler`](/server/reference/create-request-handler/) — the handler this client calls in-process.
