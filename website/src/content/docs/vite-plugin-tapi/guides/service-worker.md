---
title: Service Worker
description: Add offline support and tag-based cache revalidation with vite-plugin-pwa.
---

`vite-plugin-tapi` composes cleanly with [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) in `injectManifest` mode. The plugin redirects the client build to `dist/client/`, which is exactly where VitePWA emits `sw.js`, and the server bundle is built separately so nothing leaks across.

## Installation

```bash
pnpm add -D vite-plugin-pwa
```

## Vite Config

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tapi from "@farbenmeer/vite-plugin-tapi";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tapi(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      injectRegister: "auto",
      devOptions: { enabled: true, type: "module" },
    }),
  ],
});
```

Setting `devOptions.enabled: true` makes the service worker run during `vite dev` as well. Without it the SW only runs in `vite preview` and production.

## Service Worker

```ts
// src/service-worker.ts
import {
  handleTapiRequest,
  listenForInvalidations,
  cleanup,
} from "@farbenmeer/tapi/worker";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("activate", (event) => {
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

Add `"WebWorker"` to the `lib` array in `tsconfig.json` so TypeScript recognizes `ServiceWorkerGlobalScope` and related globals:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "WebWorker"]
  }
}
```

## Notes

- Adjust the `/api` path checks in the service worker to match the `basePath` you pass to `tapi()`.
- `cleanup`'s `maximumStaleAge` is a grace period in seconds past a cache entry's `expiresAt` before it is deleted on the next SW activation.
