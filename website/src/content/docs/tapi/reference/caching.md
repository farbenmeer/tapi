---
title: Caching Strategies
---

## Caching Strategies

TApi uses multiple layers of caches combined with a Pub/Sub system to ensure great performance without compromising on reactivity.

The three cache layers are:
1. Server-side Cache
2. Service Worker Cache
3. Client-side Cache

### Revalidation table

This table shows how each of the cache layers will handle a request for a resource depending on its revalidation state. There are three revalidation states:

* No Config: This route does not use the `cache` config
* Valid: This route specifies `cache.ttl`, `cache.tags` or both, none of the tags have been invalidated and the ttl has not expired since the last request was (successfully) handled.
* Invalid: This route specifies `cache.ttl`, `cache.tags` or both and one of the tags has been invalidated or the ttl has expired since the last request was (successfully) handled.

|                       | No Config | Valid | Invalid |
|-----------------------|------------------|---------------------|-------------------|
| Server                  | nothing stored         | serve from cache            | call handler |
| Worker   | network-first | cache-first | network-first |
| Client       | serve from cache     |  serve from cache       | refresh      |

where 'refresh' means that the client will _immediately_ request a fresh version of the resource as soon as it goes invalid (tag gets revalidated, expires or is manually revalidated by calling `revalidate()` on the resource). The fresh version will be cached and distributed to all subscribers on the resource (usually the views displaying the data to the user).

### Server-side Cache

TApi does not cache data on the server-side by default. You can enable caching by passing a `cache` to `createRequestHandler`:

```ts
createRequestHandler(api, { cache: new InMemoryCache() })
```

for reference cache implementations check out the [tag-based-cache](/tag-based-cache) package.

Even when not caching, TApi includes a very simple Pub/Sub system to distribute invalidated tags to all connected clients via long polling connections. To set this up, you will need to create an instance of the `PubSub` class and pass it to the `createRequestHandler`:

```ts
import { PubSub, createRequestHandler } from '@farbenmeer/tapi/server';

const pubsub = new PubSub();
const handleRequest = createRequestHandler(api, { cache: pubsub });
```
and set up a separate route for the long-polling endpoint:

```ts
import { streamRevalidatedTags } from '@farbenmeer/tapi/server';

const GET = () => streamRevalidatedTags({ cache: pubsub, buildId: process.env.BUILD_ID })
```

where `process.env.BUILD_ID` is a unique identifier for your build. This is used to notify the TApi service worker when it needs to reload.

*Caveat*: The default Pub/Sub implementation only works on a single host. If you need to run TApi across multiple hosts, the only ready-to-use solution for now is the [RedisCache](/tag-based-cache/reference/redis-cache).


### Service Worker Cache

TApi includes tools to set up a service worker that can cache TApi responses. To set this up create a service worker, listen to the `fetch` event, determine if the request should be handled by TApi and if so, call `handleTapiRequest`:

```ts
import { handleTapiRequest } from '@farbenmeer/tapi/worker';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.host === process.env.BASE_URL && /\/api/.test(url.pathname)) {
    event.respondWith(handleRequest(process.env.BUILD_ID, event.request));
  }
});
```

This will store responses in a cache (where the cache name is dependent on the `buildId` so the cache will be fresh on every update of your application) and serve them from the cache until they expire or get revalidated through tag-based revalidation.

Additionally, the service worker can listen to the invalidation stream from the server using `listenForInvalidations`:

```ts
import { listenForInvalidations } from '@farbenmeer/tapi/worker';

listenForInvalidations({ url: process.env.INVALIDATION_ROUTE, buildId: process.env.BUILD_ID });
```
where you need to make sure that the `process.env.INVALIDATION_ROUTE` is set to the correct route that was set up to respond using `streamRevalidatedTags` and `process.env.BUILD_ID` needs to match the `buildId` passed to `streamRevalidatedTags` on the server.

when listening for invalidations, the worker will mark all of it's cached entries as expired and notify it's clients to reload them as soon as it manages to connect to the invalidation stream.


### Client cache

TApi has another layer of caching built into the client. This cache makes sure that a request using the TApi client will return the exact same response on subsequent calls:
```ts
client.books.get() === client.books.get()
```
which is important so frameworks such as React will not get stuck in infinite render loops when using the TApi client.

The client cache is, naturally, cleared on every page load. The client cache does not persist any data across page loads, this is the job ob the service worker.

Data in the client cache will automatically refresh when its TTL expires plus a random jitter (maximum jitter is configurable by passing `maxOverdueTTL` option to `createFetchClient`, default 1000ms) to avoid thundering herd problems.

This means that a response that has a ttl of 10 seconds:
```ts
TResponse.json({ ... }, { cache: { ttl: 10 }})
```

will actually be refreshed in the background every 10-11 seconds.

Responses for which the server has specified tags:
```ts
TResponse.json({ ... }, { cache: { tags: ['books'] }})
```

will be automatically refreshed whenever
* A mutating request (`POST`, `PUT`, `PATCH`, `DELETE`) is made to a route that has a tag in common with the response.
* The service worker receives an invalidation event for a tag in common with the response.
* The `defaultTTL` configured on the server is exceeded.

Subscribe to the refreshed data using the `subscribe` method:

```ts
client.books.get().subscribe((data) => {
  console.log(data);
});
```

The client only caches entries while they have active subscriptions. When the last subscription is removed, the entry is removed from the cache after a short delay configurable via the `minTTL` option to `createFetchClient`, default 5000ms.
