---
title: defineApi
---

The `defineApi` function is the entry point for defining your API structure. It creates a container that allows you to chain route definitions together, building a fully typed map of your API that can be shared with the client.

## Usage

Conventionally, this is defined in a shared file (e.g., `api.ts`) that is imported by both your server entry point and your client configuration.

```ts
// api.ts
import { defineApi } from "@farbenmeer/tapi/server";

export const api = defineApi()
  .route("/users", import("./routes/users"))
  .route("/users/:id", import("./routes/user-detail"));
```

## Signature

```ts
function defineApi(): ApiDefinition<{}>
```

Returns an empty `ApiDefinition` instance.

## Methods

### `.route(path, module)`

Registers a route at a specific path.

- **Parameters**:
  - `path`: A string representing the URL path. It supports:
    - Static segments: `/users`
    - Dynamic parameters: `/users/:id`
    - Wildcards: `/files/*` or `/files/*path`
  - `module`: A Promise that resolves to a module containing the route handlers (usually via `import()`).

- **Returns**: A new `ApiDefinition` instance with the added route included in its type signature.

## Path Patterns

### Static Paths
Matches the exact URL path.

```ts
.route("/health", import("./routes/health"))
```

### Dynamic Parameters
Matches segments of the path and passes them as parameters to the handler.

```ts
.route("/posts/:postId/comments/:commentId", import("./routes/comment"))
```
In the handler, these can be accessed via `req.params().postId` and `req.params().commentId`.

### Wildcards
Matches everything remaining in the path.

```ts
// Matches /files/images/logo.png
.route("/files/*path", import("./routes/files"))
```
In the handler, this is accessed via `req.params().path` (which would be `"images/logo.png"`).

## Type Inference

The primary purpose of `defineApi` is to build a complex TypeScript type representing your entire API surface. This type is inferred automatically as you chain `.route()` calls.
