---
title: "Observable"
description: "The Observable type augments GET promises with a subscribe() method for receiving cache updates over time."
---

`Observable<T>` is the type that augments the promise returned by a client `.get()` call. On top of being an awaitable promise, an observable lets you **subscribe** to future values for the same cache entry, so long-lived views can react when the underlying data changes.

## Type

```ts
export type Observable<T> = {
  subscribe(callback: (value: Promise<T>) => void): () => void;
};
```

A `.get()` therefore returns `Promise<T> & Observable<T>`:

```ts
const result = client.users.get();

// use it as a promise
const users = await result;

// or subscribe to updates
const unsubscribe = result.subscribe((next) => {
  next.then((users) => render(users));
});
```

## `subscribe(callback)`

- **`callback`** — invoked with a `Promise<T>` each time a new value for this URL becomes available. The callback receives a promise (not a resolved value) because the fresh data may still be loading; awaiting it also lets you observe errors.
- **Returns** — an unsubscribe function. Call it to stop receiving updates.

Subscriptions are what keep the cache entry alive. While at least one subscriber is registered, the client keeps the entry, schedules background revalidations based on the server's `X-TAPI-Expires-At` header, and applies tag-based invalidations. When the last subscriber unsubscribes, the entry is scheduled for cleanup after `minTTL`.

```ts
const result = client.todos.get();

const unsubscribe = result.subscribe((next) => {
  next
    .then((todos) => setTodos(todos))
    .catch((err) => console.error(err));
});

// later, when the view unmounts:
unsubscribe();
```

:::tip
If a newer value arrives between the moment `.get()` returns the observable and the moment you call `.subscribe()`, the client notifies your callback immediately with that newer value, so you never miss an update due to a race.
:::

## Relationship to `@toapi/react`

[`@toapi/react`](/tapi/react/) wraps this `subscribe`/unsubscribe protocol in React hooks so components re-render automatically on cache changes. `Observable` is the underlying primitive; use it directly when integrating with other frameworks or state stores.

## Related

- [createFetchClient](/tapi/client/reference/create-fetch-client/)
- [Revalidation & subscriptions](/tapi/client/reference/revalidation/)
