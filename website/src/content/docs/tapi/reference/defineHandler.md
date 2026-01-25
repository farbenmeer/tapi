---
title: defineHandler
---

The `defineHandler` function is the core building block for creating API endpoints in TApi. It ensures end-to-end type safety by connecting your request schema validation with your implementation logic.

## Usage

```ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server";
import { z } from "zod";

export const GET = defineHandler({
  authorize: () => true,
  query: {
    limit: z.coerce.number().min(1).default(10)
  }
}, async (req) => {
  const { limit } = req.query();
  return TResponse.json({ limit });
});
```

## Signature

```ts
function defineHandler<Response, AuthData, Params, Query, Body>(
  schema: Schema<Response, AuthData, Params, Query, Body>,
  handler: (req: TRequest<AuthData, Params, Query, Body>) => Promise<TResponse<Response>>
): Handler
```

## Parameters

### `schema`

An object defining the input validation, authorization logic, and response structure.

| Property | Type | Description |
| --- | --- | --- |
| `authorize` | `(req: TRequest) => AuthData` | **Required.** A function that determines if the request is allowed. Throw an error to deny access. The return value is accessible via `req.auth()`. |
| `params` | `ZodSchema` (object) | Optional. Zod schema for validating path parameters (e.g., `/users/:id`). |
| `query` | `ZodSchema` (object) | Optional. Zod schema for validating query string parameters. |
| `body` | `ZodSchema` | Optional. Zod schema for validating the JSON request body. |
| `response` | `ZodSchema` | Optional. Zod schema to define the expected response shape. Currently used for OpenAPI generation. |

### `handler`

The implementation function that receives the validated request and returns a response.

- **Arguments**: `req` - A [TRequest](./TRequest) object containing validated data.
- **Returns**: A promise resolving to a [TResponse](./TResponse).

## Examples

### Basic GET Route

```ts
export const GET = defineHandler({
  authorize: () => true
}, async () => {
  return TResponse.json({ message: "Hello World" });
});
```

### Route with Path Parameters

For a route defined as `/users/:id`:

```ts
export const GET = defineHandler({
  authorize: () => true,
  params: {
    id: z.string().uuid()
  }
}, async (req) => {
  const { id } = req.params();
  return TResponse.json({ userId: id });
});
```

### POST Route with Body Validation

```ts
export const POST = defineHandler({
  authorize: (req) => {
    if (!req.headers.get("Authorization")) throw new Error("Unauthorized");
    return { userId: "current-user" };
  },
  body: z.object({
    title: z.string().min(3),
    content: z.string()
  })
}, async (req) => {
  const user = req.auth();
  const { title, content } = await req.data();

  // Perform database operation...
  
  return TResponse.json({ success: true, author: user.userId });
});
```
