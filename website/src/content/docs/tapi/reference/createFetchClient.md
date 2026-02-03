---
title: createFetchClient
---

The `createFetchClient` function creates a type-safe client for your API to be used in browser environments. It uses a `Proxy` to dynamically build request URLs based on the property access path, matching the structure defined in `defineApi`.

## Usage

```ts
import { createFetchClient } from "@farbenmeer/tapi/client";
import type { api } from "./api"; // Your API definition type

const client = createFetchClient<typeof api>("https://api.example.com");

// Usage
await client.users.get();
await client.users['123'].post({ name: 'New Name' });
```

## Signature

```ts
function createFetchClient<Routes>(
  apiUrl: string,
  options?: Options
): Client<Routes>
```

## Parameters

### `apiUrl`
**Type**: `string`

The base URL of your API server (e.g., `https://example.com/api`).

### `options`
**Type**: `object` (Optional)

| Property | Type | Description |
| --- | --- | --- |
| `fetch` | `(url: string, init: RequestInit) => Promise<Response>` | Custom fetch implementation. Defaults to global `window.fetch`. Useful for mocking or adding global middleware/interceptors. |

## Client Methods

The returned client is a proxy that mirrors your API structure. For any given route path, you can call standard HTTP methods.

### `.get(query?)`

Performs a GET request.

- **Arguments**:
  - `query`: (Optional) An object of query parameters if defined in the route schema.
- **Returns**: A Promise that resolves to the typed response data. It also has a `.subscribe()` method for real-time updates if the cache changes.

```ts
const users = await client.users.get({ active: true });
```

### `.post(body, options?)`
### `.put(body, options?)`
### `.patch(body, options?)`

Performs a mutation request.

- **Arguments**:
  - `body`: The request body data (JSON object or FormData).
  - `options`: (Optional) Request configuration, including `query` params if the route supports them.
- **Returns**: A Promise resolving to the response data.

```ts
await client.users.post({ name: "Alice" });
```

### `.delete(query?, options?)`

Performs a DELETE request.

- **Arguments**:
  - `query`: (Optional) Query parameters.
  - `options`: (Optional) Request configuration.

## Features

### Smart Caching & Deduplication
The client automatically caches in-flight GET requests. If you call `client.users.get()` multiple times while a request is pending, only one network call is made.

### Tag-Based Revalidation
The client tracks cache tags sent by the server (via `X-TAPI-Tags` header in `TResponse`). Tags are specified on the server using `cache: { tags: [...] }` in the `TResponseInit` object. When a mutation (POST/PUT/PATCH/DELETE) response includes tags that match cached GET requests, those GET requests are automatically invalidated and re-fetched if there are active subscribers.

### Subscriptions
The promise returned by `.get()` is augmented with a `.subscribe()` method. This is useful for integrating with React hooks or other state management libraries to listen for cache updates.

```ts
const promise = client.users.get();
promise.subscribe((newData) => {
  console.log("Data updated:", newData);
});
```
