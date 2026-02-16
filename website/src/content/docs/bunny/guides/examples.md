---
title: Examples
description: Example applications built with Bunny.
---

The repository includes three example applications that demonstrate Bunny's features at different levels of complexity.

## Todo List

A full-stack todo app with SQLite persistence and cache invalidation.

**Features:** CRUD operations, database integration, Zod validation, tag-based cache invalidation, Tailwind CSS.

### API

```ts
import { defineApi } from "@farbenmeer/bunny/server";

export const api = defineApi()
  .route("/todos", import("./api/todos"))
  .route("/todos/:id", import("./api/todo"));
```

The `/todos` endpoint supports `GET` (list all) and `POST` (create). The `/todos/:id` endpoint supports `PATCH` (toggle done) and `DELETE`.

### Caching

Cache tags are used so the service worker can invalidate stale data after mutations:

```ts
export const get = defineHandler({
  method: "GET",
  cache: { tags: ["todos"] },
  handler: () => {
    const todos = db.prepare("SELECT * FROM todos").all();
    return TResponse.json(todos);
  },
});
```

Write operations invalidate the relevant tags:

```ts
export const del = defineHandler({
  method: "DELETE",
  invalidates: ["todos", `todo:${params.id}`],
  // ...
});
```

### Client

The React app uses `useQuery` to fetch data and calls mutations directly through the typed client:

```tsx
const todos = useQuery(client.todos.get());

<form action={client.todos.post}>
  <input name="text" />
  <button type="submit">Add</button>
</form>
```

[View source on GitHub](https://github.com/farbenmeer/tapi/tree/main/examples/todo-list)

---

## Contact Book

A multi-page contact management app with client-side routing and in-memory caching.

**Features:** Client-side routing with `@farbenmeer/router`, `InMemoryCache` from `@farbenmeer/tag-based-cache`, per-record cache tags, inline editing.

### Routing

The app uses `Switch` and `Route` from `@farbenmeer/router` for client-side navigation:

```tsx
import { Switch, Route } from "@farbenmeer/router";

function App() {
  return (
    <Switch>
      <Route path="/" exact component={ContactList} />
      <Route path="/contacts/new" exact component={ContactForm} />
      <Route path="/contacts/:id" component={ContactDetail} />
    </Switch>
  );
}
```

### API

Six endpoints cover full CRUD plus a bulk delete:

```ts
export const api = defineApi()
  .route("/contacts", import("./api/contacts"))
  .route("/contacts/:id", import("./api/contact"));
```

Each contact endpoint uses granular cache tags for efficient invalidation:

```ts
export const get = defineHandler({
  method: "GET",
  cache: { tags: ["contacts", `contact:${params.id}`] },
  handler: ({ params }) => {
    const contact = contacts.get(params.id);
    if (!contact) throw new HttpError(404, "Contact not found");
    return TResponse.json(contact);
  },
});
```

### Cache

The server uses `InMemoryCache` from `@farbenmeer/tag-based-cache` for tag-based cache management:

```ts
import { InMemoryCache } from "@farbenmeer/tag-based-cache";

const cache = new InMemoryCache();
```

[View source on GitHub](https://github.com/farbenmeer/tapi/tree/main/examples/contact-book)

---

## Env File

A minimal example showing how to read server environment variables and expose them to the client.

**Features:** `.env` file support, single API endpoint, basic data fetching.

### API

```ts
export const get = defineHandler({
  method: "GET",
  handler: () => {
    return TResponse.json({ FOO: process.env.FOO });
  },
});
```

### Client

```tsx
function App() {
  const env = useQuery(client.env.get());
  return <pre>{JSON.stringify(env, null, 2)}</pre>;
}
```

[View source on GitHub](https://github.com/farbenmeer/tapi/tree/main/examples/env-file)
