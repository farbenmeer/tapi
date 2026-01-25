---
title: createLocalClient
---

The `createLocalClient` function allows you to use your typed API client in a server-side environment (like Next.js Server Components, `getServerSideProps`, or scripts). Instead of making actual HTTP network requests, it calls your request handlers directly in-memory while preserving the same convenient API and type safety as the browser client.

## Usage

You typically create a local client instance alongside your API definition or in a server-only utility file.

```ts
// server-client.ts
import { createLocalClient } from "@farbenmeer/tapi/server";
import { api } from "./api"; // Your ApiDefinition

export const serverClient = createLocalClient(api);
```

Then you can use it in your server code:

```ts
// app/page.tsx (Server Component)
import { serverClient } from "@/server-client";

export default async function Page() {
  // Calls the handler function directly, no HTTP request involved
  const users = await serverClient.users.get();

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

## Signature

```ts
function createLocalClient<Routes>(
  api: ApiDefinition<Routes>
): Client<Routes>
```

## Parameters

### `api`
**Type**: `ApiDefinition`

The API definition object returned by `defineApi()`. This contains the complete map of your routes and handlers.

## How It Works

`createLocalClient` creates a standard `createFetchClient` but overrides the internal `fetch` implementation. 

1. It initializes your API using `createRequestHandler`.
2. When you call a method like `.get()`, it constructs a `Request` object representing that call.
3. It passes this request directly to the request handler logic.
4. It parses the returned `Response` and returns the typed data.

This eliminates the overhead of serialization, network latency, and self-signed certificate issues that can occur when a server tries to fetch from itself via HTTP.

## Context Mocking

Since `createLocalClient` runs inside your server process, the "requests" it generates are synthetic. They will have a base URL of `http://localhost`.

If your `authorize` functions or handlers rely on specific headers (like `Cookie` or `Authorization`) that would normally come from an incoming browser request, you need to make sure you pass this context explicitly when using the local client:

```ts
const headerStore = await headers()
serverClient.users.post({ name: "Milo Mock"}, {
  headers: {
    Authorization: headerStore.get("Authorization")
  }
})
```
