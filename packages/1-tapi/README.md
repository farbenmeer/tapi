# TApi

This library makes it possible to build a Rest API including a fully typed client without a compile step.


## State of this library
Very much alpha. I just came up with this idea.
Currently only supports GET and POST requests.

## Plans
* Support more HTTP methods
* Add function to automatically generate OpenAPI specs
* Add support for server-clients for use on the server that call the handler functions directly instead of making a fetch request

## Inspiration
Very much [TRPC](https://trpc.io/). It's quite similar but with a REST paradigm so the API is actually usable for other clients.

## Setup

```bash
npm install @farbenmeer/tapi
yarn add @farbenmeer/tapi
pnpm add @farbenmeer/tapi
bun add @farbenmeer/tapi
```

Create a file (conventionally called `api.ts`) with your API definition:
```ts
import { defineApi } from "@farbenmeer/tapi/server"

export const api = defineApi()
```

Set up a route to handle the requests. This depends on your framework. For Next.js it would be `app/api/[...tapi]/route.ts`:
```ts
import { api } from "api"
import { createRequestHandler } from "@farbenmeer/tapi/server"

const handler = createRequestHandler(api)

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
```

Create another file (conventionally called `client.ts`) with your client definition:
```ts
import type { api } from "./api"
import { defineFetchClient } from "@farbenmeer/tapi/client"

export const client = defineFetchClient<typeof api>(apiUrl)
```
where `apiUrl` is the base URL of your API, usually something like `https://example.com/api`.

## Adding Routes
Define your first route as a file, in this example `api/books.ts`:

```ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server"

export const GET = defineHandler({ authorize: () => true }, async () => {
  return TResponse.json([
    { id: 1, title: "TApi for Dummies" },
    { id: 2, title: "Advanced TApi" }
  ])
})
```

extends `api.ts`:
```ts
import { defineApi } from "@farbenmeer/tapi/server"

export const api = defineApi()
  .route("/books", import("./api/books"))
```

## Authorization

The `authorize` argument in `defineHandler` allows you to authorize routes based on request headers and other request data. The authorize function receives a `TRequest` object that extends the standard Request, giving you access to headers, URL parameters, and query parameters for authorization decisions.

```ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server"

export const GET = defineHandler({
  authorize: (req) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Missing or invalid token')
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix
    // Validate token and return user data
    return validateTokenAndGetUser(token)
  }
}, async (req) => {
  // req.auth now contains the data returned from authorize
  const user = req.auth
  return TResponse.json({ message: `Hello ${user.name}` })
})
```

The authorize function can return any data type, which will then be available as `req.auth` in your handler. This is useful for passing user information, permissions, or other authorization context to your route handlers.

## Using the client
In your client-side javascript code, you can use the client to make requests to your API. For example:

```ts
import { client } from "client"

async function fetchBooks() {
  const books = await client.books.get()
  console.log(books)
}

fetchBooks()
```

## Dynamic Paths
Define a route with a dynamic path parameter using the params option for `defineHandler`, for example `/api/book.ts`
```ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server"
import { z } from "zod/v4"

export const GET = defineHandler({
  authorize: () => true,
  params: { id: z.string() }
}, async (req) => {
  return TResponse.json({
    id: req.params().id,
    title: `Book with id ${req.params().id}`
  })
})
```

extends `api.ts`:
```ts
import { defineApi } from "@farbenmeer/tapi/server"

export const api = defineApi()
  .route("/books", import("./api/books"))
  .route("/books/:id", import("./api/book"))
```

call the route on the client as
```ts
import { client } from "client"

async function fetchBook(id: string) {
  const book = await client.books[id].get()
  console.log(book)
}

fetchBook('1')
```

## Query Parameters
Define a route with query parameters using the query option for `defineHandler`, for example `/api/search.ts`
```ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server"
import { z } from "zod/v4"

export const GET = defineHandler({
  authorize: () => true,
  query: { q: z.string() }
}, async (req) => {
  return TResponse.json({
    query: req.query().q,
    results: []
  })
})
```

extends `api.ts`:
```ts
import { defineApi } from "@farbenmeer/tapi/server"

export const api = defineApi()
  .route("/books", import("./api/books"))
  .route("/books/:id", import("./api/book"))
  .route("/search", import("./api/search"))
```

call the route on the client as
```ts
import { client } from "client"

async function searchBooks(q: string) {
  const books = await client.search.get({ q })
  console.log(books)
}

searchBooks('TApi')
```

## Post Requests
Define a POST-route, for example to add a book in `api/books.ts`:
```ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server"
import { z } from "zod/v4"

/* export const GET = ... */

export const POST = defineHandler({
  authorize: () => true,
  body: z.object({ title: z.string() }),
}, async (req) => {
  const { title } = await req.data()
  const book = await createThisBook({ title })
  return TResponse.json(book)
})
```

and call it as either:
```ts
import { client } from "client"

async function addBook(title: string) {
  const book = await client.books.post({}, { title })
  console.log(book)
}

addBook('TApi')
```

or with formData:
```ts
import { client } from "client"

async function addBook(title: string) {
  const book = await client.books.post({}, new FormData({ title }))
  console.log(book)
}

addBook('TApi')
```


or with formData without the query-parameter:
```ts
import { client } from "client"

async function addBook(title: string) {
  const book = await client.books.post(new FormData({ title }))
  console.log(book)
}

addBook('TApi')
```

## Wildcard Routes

Use wildcards to match arbitrary paths:

```ts
// api/files.ts
import { defineHandler, TResponse } from "@farbenmeer/tapi/server"
import { z } from "zod/v4"

export const GET = defineHandler({
  authorize: () => true,
  params: { path: z.string() }
}, async (req) => {
  const filePath = req.params().path
  // filePath = "documents/report.pdf" for /api/files/documents/report.pdf
  const file = await getFile(filePath)
  return TResponse.json(file)
})
```

Define the route in `api.ts`:
```ts
export const api = defineApi()
  .route("/files/*path", import("./api/files"))
```

Call it from the client:
```ts
const file = await client.files["documents/report.pdf"].get()
```

**Note:** Wildcards (`*` or `*name`) match everything including slashes and must come at the end of the path. Use `*name` to capture the matched portion as a parameter.
which is particularly useful with react forms:
```tsx
<form action={client.books.post}>
  <input name="title" />
</form>
```
