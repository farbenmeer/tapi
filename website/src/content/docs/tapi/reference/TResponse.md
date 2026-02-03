---
title: TResponse
---

`TResponse` is a subclass of the standard Web API `Response` object. It provides helper methods for creating common response types (like JSON) and adds support for features like cache tagging.

## Usage

In your route handlers, you should return instances of `TResponse` (usually via `TResponse.json`) to ensure type safety is maintained for the client.

```ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server";

export const GET = defineHandler({ authorize: () => true }, async () => {
  return TResponse.json({ message: "Hello World" });
});
```

## Static Methods

### `TResponse.json(data, init?)`

Creates a JSON response with the correct `Content-Type` header.

- **Parameters**:
  - `data`: The JSON-serializable data to return. This type is inferred and enforced by the handler schema if present.
  - `init`: (Optional) A `TResponseInit` object, which extends standard `ResponseInit`.
- **Returns**: `TResponse<T>`

```ts
return TResponse.json(
  { id: 1, name: "Item" },
  { status: 201 } // Created
);
```

### `TResponse.void(init?)`

Creates an empty response with no body (has the `Content-Length: 0` header).

This is useful to create routes that will return `undefined` on a client which
is the type react forms natively expect.

- **Parameters**:
  - `init`: (Optional) `TResponseInit` object.
- **Returns**: `TResponse<void>`

```ts
return TResponse.void();
```
When e.G. your `POST /users` endpoint returns `TResponse.void()` you can use it on the client side as
```tsx
<form action={client.users.post}>
````

## Cache Tags

`TResponse` supports a custom cache invalidation system via tags. When providing the `init` object, you can pass a `cache` object with a `tags` array. These tags are sent in the `X-TAPI-Tags` header and are used by the client-side `createFetchClient` to automatically invalidate cached queries when a mutation occurs.

```ts
// GET /books/1
return TResponse.json(book, {
  cache: { tags: [`book-${book.id}`, 'books-list'] }
});

// POST /books/1/update
// This response could trigger invalidation of queries depending on implementation,
// but usually tags are attached to GET requests for the client to learn what tags are associated with a resource.
```

## Properties

### `data`

The `TResponse` instance holds a reference to the raw data passed to `TResponse.json()`. This is useful for internal testing or server-side usage where you might want to access the typed object directly without parsing the body stream.

```ts
const response = TResponse.json({ success: true });
console.log(response.data.success); // true
```

## Interface

The initialization object `TResponseInit` extends the standard `ResponseInit` to include the optional `cache` property.

```ts
interface TResponseInit extends ResponseInit {
  cache?: {
    tags?: string[];
    ttl?: number;
  };
}
```

- `cache.tags`: An array of string tags used for cache invalidation.
- `cache.ttl`: Time-to-live in seconds for caching the response.

When both `tags` and `ttl` are specified, the cache entry is invalidated by whichever comes first — the TTL expiring or a tag being revalidated.
