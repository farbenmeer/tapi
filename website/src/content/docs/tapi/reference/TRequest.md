---
title: TRequest
---

`TRequest` is an enhanced version of the standard Web API `Request` object. It is passed as the argument to your route handlers and authorization functions, providing type-safe access to validated request data.

## Interface

`TRequest` extends the standard `Request` interface, adding four helper methods to access processed data.

```ts
type TRequest<AuthData, Params, Query, Body> = Request & {
  auth: () => AuthData;
  params: () => Params;
  query: () => Query;
  data: () => Promise<Body>;
};
```

## Methods

### `auth()`

Returns the authentication data returned by the `authorize` function in your handler definition.

- **Returns**: `AuthData`
- **Throws**: Error if called inside the `authorize` function itself (as auth data hasn't been resolved yet).

```ts
const user = req.auth();
console.log(user.id);
```

### `params()`

Returns the validated path parameters extracted from the URL.

- **Returns**: `Params` object
- **Description**: Access route parameters defined with colon syntax (e.g., `/users/:id`) or wildcards. The keys match the parameter names in your route definition.

```ts
// Route: /users/:id
const { id } = req.params();
```

### `query()`

Returns the validated query string parameters.

- **Returns**: `Query` object
- **Description**: Access parsed and validated URL search parameters. These are typed according to the `query` schema provided in `defineHandler`.

```ts
// URL: /search?q=tapi&page=1
const { q, page } = req.query();
```

### `data()`

Returns the validated request body.

- **Returns**: `Promise<Body>`
- **Description**: Asynchronously parses and validates the request body (JSON). Unlike the other methods, this returns a Promise because reading the body stream is an async operation.

```ts
const { title, description } = await req.data();
```

## Standard Request Methods

Since `TRequest` inherits from `Request`, all standard request properties and methods are available, though you should prefer the typed helpers when available.

- `req.headers`
- `req.method`
- `req.url`
- `req.signal`
- `req.formData()`
- `req.blob()`

```ts
// Checking raw headers
const userAgent = req.headers.get("User-Agent");
```

## Usage Example

```ts
export const POST = defineHandler({
  authorize: (req) => {
    // Access standard request props in authorize
    const token = req.headers.get("Authorization");
    return verify(token);
  },
  params: { id: z.string() },
  body: z.object({ name: z.string() })
}, async (req) => {
  // Access typed helpers in handler
  const user = req.auth();          // From authorize()
  const { id } = req.params();      // From URL path
  const { name } = await req.data();// From request body
  
  return TResponse.json({ success: true });
});
```
