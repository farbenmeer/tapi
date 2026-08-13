---
title: "createLocalFetch"
description: "Call your Toapi handlers in-process through the same typed client — no HTTP round-trip, ideal for server components and scripts."
---

The `createLocalFetch` function returns a `fetch`-compatible function backed by your API's request handlers. Pass it as the `fetch` option to [`createFetchClient`](/tapi/client/) and every call the client makes is served in-process — no real HTTP network request — while preserving the same convenient API and type safety as the browser client. This is ideal for Next.js Server Components, Astro frontmatter, or scripts.

## Usage

Create the local `fetch` alongside your API definition or in a server-only utility file, and hand it to `createFetchClient`:

```ts
// server-client.ts
import { createFetchClient } from "@toapi/client";
import { createLocalFetch } from "@toapi/server";
import { api } from "./api"; // Your ApiDefinition

export const serverClient = createFetchClient<typeof api.routes>(
  "http://localhost",
  { fetch: createLocalFetch(api) },
);
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
function createLocalFetch<Routes>(
  api: ApiDefinition<Routes>,
  init?: RequestInit,
): typeof fetch;
```

## Parameters

### `api`

**Type**: [`ApiDefinition`](/tapi/server/reference/api-definition/)

The API definition object returned by [`defineApi`](/tapi/server/reference/define-api/). This contains the complete map of your routes and handlers.

### `init`

**Type**: `RequestInit`

Optional default request init merged into every synthetic request. Use it to supply headers (such as `Cookie` or `Authorization`) that your `authorize` functions rely on. Per-call init passed to the client's `fetch` is merged on top of these defaults, with per-call headers taking precedence.

## Return value

A function with the standard `fetch` signature — `(url, init?) => Promise<Response>` — suitable for the `fetch` option of [`createFetchClient`](/tapi/client/). Rather than opening a network connection, it constructs a `Request` and passes it to your API's [request handler](/tapi/server/reference/create-request-handler/), returning the handler's `Response`.

## How it works

`createLocalFetch` composes with [`createFetchClient`](/tapi/client/) instead of wrapping it:

1. It initializes your API using [`createRequestHandler`](/tapi/server/reference/create-request-handler/).
2. The returned `fetch` merges the default `init` with the per-call init (per-call headers win) and builds a `Request`.
3. It passes this request directly to the request handler.
4. `createFetchClient` parses the returned `Response` and returns the typed data.

This eliminates the overhead of serialization, network latency, and the self-signed certificate issues that can occur when a server tries to fetch from itself over HTTP.

## Passing request context

Since `createLocalFetch` runs inside your server process, the requests it generates are synthetic. Give `createFetchClient` any base URL — `http://localhost` is conventional — and the local `fetch` resolves calls against it without touching the network.

If your `authorize` functions or handlers rely on specific headers (like `Cookie` or `Authorization`) that would normally come from an incoming browser request, pass that context explicitly — either as the `init` argument to `createLocalFetch`, or per call:

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

- [`@toapi/client`](/tapi/client/) — the underlying fetch client and its full method surface.
- [`createRequestHandler`](/tapi/server/reference/create-request-handler/) — the handler this `fetch` calls in-process.
