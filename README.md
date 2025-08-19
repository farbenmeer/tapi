# TApi

This library makes it possible to build a Rest API including a fully typed client without a compile step.


## State of this library
Very much alpha. I just came up with this idea.
Currently only supports GET and POST requests.

## Plans
* Support more HTTP methods
* Support wildcard paths (`/books/[...path]`)
* Add function to automatically generate OpenAPI specs
* Add support for server-clients for use on the server that call the handler functions directly instead of making a fetch request

## Inspiration
Very much [TRPC](https://trpc.io/). It's quite similar but with a REST paradigm so the API is actually usable for other clients.

## Setup

```bash
npm install @tapi/core
yarn add @tapi/core
pnpm add @tapi/core
bun add @tapi/core
```

Create a file (conventionally called `api.ts`) with your API definition:
```ts
import { defineApi } from "@tapi/core"

export const api = defineApi()
```

Set up a route to handle the requests. This depends on your framework. For Next.js it would be `app/api/[...tap]/route.ts`:
```ts
import { api } from "api"
import { createRequestHandler } from "@tapi/core"

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

export const client = defineFetchClient<typeof api>(apiUrl)
```
where `apiUrl` is the base URL of your API, usually something like `https://example.com/api`.

## Adding Routes
Define your first route as a file, in this example `api/books.ts`:

```ts
import { defineHandler, TResponse } from "@tapi/core"

export const get = defineHandler({}, async () => {
  return TResponse.json([
    { id: 1, title: "TApi for Dummies" },
    { id: 2, title: "Advanced TApi" }
  ])
})
```

extends `api.ts`:
```ts
import { defineApi } from "@tapi/core"

export const api = defineApi()
  .route("/books", import("./api/books"))
```

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
import { defineHandler, TResponse } from "@tapi/core"

export const get = defineHandler({ params: ['id'] }, async (req) => {
  return TResponse.json({
    id: req.params.id,
    title: `Book with id ${req.params.id}`
  })
})
```

extends `api.ts`:
```ts
import { defineApi } from "@tapi/core"

export const api = defineApi()
  .route("/books", import("./api/books"))
  .route("/books/[id]", import("./api/book"))
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
import { defineHandler, TResponse } from "@tapi/core"
import { z } from "zod/v4"

export const get = defineHandler({ query: { q: z.string() } }, async (req) => {
  return TResponse.json({
    query: req.query().q,
    results: []
  })
})
```

extends `api.ts`:
```ts
import { defineApi } from "@tapi/core"

export const api = defineApi()
  .route("/books", import("./api/books"))
  .route("/books/[id]", import("./api/book"))
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
import { defineHandler, TResponse } from "@tapi/core"

/* export const get = ... */

export const post = defineHandler(
  { body: z.object({ title: z.string() }),
  async (req) => {
    const { title } = await req.data()
    const book = await createThisBook({ title })
    return TResponse.json(book)
  }
})
```
