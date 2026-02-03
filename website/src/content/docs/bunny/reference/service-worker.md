---
title: Service Worker
---

Bunny includes a built-in service worker that handles static file caching, API response caching via TApi, and cache invalidation.

The service worker is automatically bundled during `bunny build` and registered by [`startBunnyClient`](/bunny/reference/start-bunny-client) in production. It is disabled during development.

## How It Works

### Install

On install, the worker pre-caches all static files listed in the build manifest (JS, CSS, images, etc.) and immediately activates via `skipWaiting()`.

### Fetch Handling

Requests are handled based on their path:

| Request | Behavior |
| --- | --- |
| Static files (in manifest) | Served from cache, falls back to network and caches the response. |
| `/api/*` | Handled by TApi's `handleTapiRequest`, which manages API response caching with tag-based invalidation. |
| Everything else | Serves `/index.html` from cache for SPA client-side routing. |

Requests to other origins and to `/sw.js` itself are ignored.

### Cache Invalidation

The worker connects to the server's invalidation stream at `/__bunny/invalidations` using TApi's `listenForInvalidations`. When the server invalidates cache tags (e.g. after a mutation), the worker marks matching cached API responses as expired and notifies active clients to re-fetch.

### Cache Naming

- **Static files**: `bunny-static-cache-{buildId}`
- **API responses**: `bunny-api-cache-{buildId}`

The `buildId` is generated on each build, so deploying a new version automatically starts with a fresh cache.

## Build Manifest

The service worker receives a `BunnyManifest` object at build time:

```ts
interface BunnyManifest {
  buildId: string;
  staticCachedFiles: string[];
}
```

This is injected by esbuild during `bunny build` as a `__BUNNY_MANIFEST` global.
