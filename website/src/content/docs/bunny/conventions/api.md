---
title: api.ts
description: API Routes and Cache Configuration
---

## The api.ts File

The `src/api.ts` file is the entry point for all server-side logic in Bunny.

The main export ist the API-object with the definition of all API routes:
```ts
export const api = defineApi()
```

For how to configure API routes, check out the [TApi Docs](/tapi).

### Cache configuration

By default, Bunny does not cache API responses on the server. In order to enable server-side caching you need to provide a cache implementation. To do so, export a `cache` object from `src/cache.ts`:

```ts
export const cache = new CacheImplementation()
```

where `CacheImplementation` is a class that implements the `Cache`-interface:

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export interface CacheEntry {
  data?: Json | null;
  attachment?: Uint8Array | null;
}

export type Subscription = (tags: string[], meta?: Json) => void;

export interface Cache {
  get(key: string): Promise<CacheEntry | null>;
  set(
    input: CacheEntry & { key: string; ttl: number; tags: string[] }
  ): Promise<void>;
  delete(tags: string[], meta?: Json): Promise<void>;
  subscribe(callback: Subscription): () => void;
}
```

For reference implementations check out the package [@farbenmeer/tag-based-cache](/tag-based-cache).

It provides three options:

- `MemoryCache`: A simple in-memory cache implementation. Should be sufficient for single-server deployments.
- `FileCache`: A file-based cache implementation. Persists data as an sqlite database. Use this for single-server deployments where a lot of data needs to be cached or the cache needs to be persisted across server restarts.
- `RedisCache`: A Redis-based cache implementation. Use this for multi-server deployments.
