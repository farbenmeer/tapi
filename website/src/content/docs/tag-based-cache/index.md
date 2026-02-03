---
title: Tag-Based Cache
description: A tag-based cache abstraction with multiple backend implementations.
---

`@farbenmeer/tag-based-cache` is a cache library that supports tag-based invalidation. Instead of invalidating individual keys, you can invalidate entire groups of cache entries by their tags.

The package provides three implementations of the same `Cache` interface:

- [**InMemoryCache**](/tag-based-cache/reference/in-memory-cache) — SQLite in-memory database, suitable for single-process use.
- [**FilesystemCache**](/tag-based-cache/reference/filesystem-cache) — SQLite file-based database, persists data to disk.
- [**RedisCache**](/tag-based-cache/reference/redis-cache) — Redis-backed distributed cache with pub/sub support for multi-host setups.

All implementations are interchangeable since they conform to the same [`Cache`](/tag-based-cache/reference/cache) interface.

## Installation

```bash
npm install @farbenmeer/tag-based-cache
```

## Quick Start

```ts
import { InMemoryCache } from "@farbenmeer/tag-based-cache/in-memory-cache";

const cache = new InMemoryCache();

// Store an entry with tags
await cache.set({
  key: "user:1",
  data: { name: "Alice" },
  ttl: 3600,
  tags: ["users", "user:1"],
});

// Retrieve it
const entry = await cache.get("user:1");
// { data: { name: "Alice" }, attachment: null }

// Invalidate all entries tagged "users"
await cache.delete(["users"]);

await cache.get("user:1"); // null
```

## Usage with TApi

Pass a cache instance to `createRequestHandler` to enable server-side caching:

```ts
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { InMemoryCache } from "@farbenmeer/tag-based-cache/in-memory-cache";

const cache = new InMemoryCache();
const handleRequest = createRequestHandler(api, { cache });
```

See [Caching Strategies](/tapi/reference/caching) for the full picture of how caching works across all layers in TApi.
