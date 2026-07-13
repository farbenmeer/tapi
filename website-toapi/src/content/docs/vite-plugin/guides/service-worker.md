---
title: "Service Worker"
description: "Add offline support and tag-based cache revalidation by composing @toapi/vite-plugin with vite-plugin-pwa."
---

To get Toapi's offline / tag-based revalidation behavior, add a service worker
built by [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) in
`injectManifest` mode. The two plugins compose cleanly: `@toapi/vite-plugin`
redirects the client build to `dist/client/`, which is exactly where VitePWA
emits `sw.js`, and the production server bundle is built separately so nothing
leaks across.

## Installation

```bash
pnpm add -D vite-plugin-pwa
```

## Vite config

```ts
// vite.config.ts
import { defineConfig } from "vite";
import toapi from "@toapi/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    toapi(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      injectRegister: "auto",
      devOptions: { enabled: true, type: "module" },
      // optional, pass-through to VitePWA:
      // manifest: { name: "My App", short_name: "App", ... },
    }),
  ],
});
```

Setting `devOptions.enabled: true` makes the service worker run during
`vite dev` as well. Without it the SW only runs in `vite preview` and
production.

## Service worker

```ts
// src/service-worker.ts
import {
  handleTapiRequest,
  listenForInvalidations,
  cleanup,
} from "@toapi/worker";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("activate", (event) => {
  // Drop cache entries that have been expired longer than 7 days,
  // remove orphans, and rebuild the tags index.
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

## TypeScript

Add `"WebWorker"` to the `lib` array in `tsconfig.json` so TypeScript
recognizes `ServiceWorkerGlobalScope` and related globals:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "WebWorker"]
  }
}
```

## Notes

- Adjust the `/api` path checks in the service worker to match the `basePath`
  you pass to `toapi()`.
- `cleanup`'s `maximumStaleAge` is a grace period, in seconds, past a cache
  entry's `expiresAt` before it is actually deleted on the next SW activation.

For the full service-worker API, see the
[`@toapi/worker`](/tapi/worker/) package.
