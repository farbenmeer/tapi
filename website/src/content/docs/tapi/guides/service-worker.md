---
title: Service Worker Setup
description: Learn how to set up a TApi service worker for caching and revalidation.
---

This guide explains how to create a TApi service worker, build it, and
register it on your page.

## 1. Create the Service Worker

Create a `service-worker.ts` file in your project (e.g. at the root or in
`src/`):

```ts
// service-worker.ts
import {
  handleTapiRequest,
  listenForInvalidations,
  cleanup,
} from "@farbenmeer/tapi/worker";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("activate", (event) => {
  // Drop cache entries that have been expired longer than 7 days,
  // delete orphans, and rebuild the tags index from meta.
  event.waitUntil(cleanup({ maximumStaleAge: 60 * 60 * 24 * 7 }));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/api") &&
    !url.pathname.startsWith("/api/__tapi")
  ) {
    event.respondWith(handleTapiRequest(event.request));
  }
});

listenForInvalidations({ url: "/api/__tapi/invalidations" });
```

Adjust the pathname checks to match your API base path and revalidation
endpoint.

When the service worker connects to the invalidation stream, it
automatically marks every cached entry as expired so the next access
revalidates it. `cleanup({ maximumStaleAge })` is what you call from the
`activate` event to bound long-term cache growth: it deletes entries
whose `expiresAt` is older than `maximumStaleAge` seconds, removes any
cache entries that no longer have a meta record, and rebuilds the tags
index from the surviving meta records.

## 2. Add TypeScript Types

Service workers use APIs from the `WebWorker` type lib rather than the
standard `DOM` lib. Add `"WebWorker"` to your `tsconfig.json` so
TypeScript recognizes `ServiceWorkerGlobalScope`, `FetchEvent`, and
related types:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable", "WebWorker"]
  }
}
```

If your project already has a `lib` array, just append `"WebWorker"` to
it.

## 3. Build into `public/sw.js`

The service worker file needs to be bundled into a single JavaScript file
and placed where your web server can serve it from the root path. Use
your bundler of choice to build `service-worker.ts` into `public/sw.js`.

For example with esbuild:

```bash
esbuild service-worker.ts --bundle --outfile=public/sw.js
```

Or add it as a build script in your `package.json`:

```json
{
  "scripts": {
    "build:sw": "esbuild service-worker.ts --bundle --outfile=public/sw.js"
  }
}
```

### Using Vite + `@farbenmeer/vite-plugin-tapi`

If your project uses [`@farbenmeer/vite-plugin-tapi`](/tapi/reference/vite-plugin-tapi),
the cleanest way to build the service worker is with
[`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) in
`injectManifest` mode, alongside `tapi()`. See the [vite-plugin-tapi
README](https://github.com/farbenmeer/tapi/tree/main/packages/3-vite-plugin-tapi#service-worker)
for the full recipe.

## 4. Register the Service Worker

Add a script to your HTML page that registers the service worker. This
should run on every page that uses TApi:

```html
<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
</script>
```

Place this at the end of your `<body>` or in a `<script>` tag in
`<head>` with `defer`. A full example:

```html
<!doctype html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
    <script>
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js");
      }
    </script>
  </body>
</html>
```

Once registered, the service worker will intercept API requests on
subsequent navigations, serve cached responses when available, and
automatically refetch stale data when tags are invalidated through the
revalidation stream. See [Caching Strategies](/tapi/reference/caching)
for the full details on how the cache layers work together.
