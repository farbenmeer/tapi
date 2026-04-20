import { handleTapiRequest, listenForInvalidations } from "@farbenmeer/tapi/worker";
import { INVALIDATIONS_ROUTE } from "@farbenmeer/tapi/client";

declare const self: ServiceWorkerGlobalScope;

const STATIC_CACHE = "static-v1";
const APP_SHELL = ["/", "/index.html"];
const buildId = "v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.host !== self.location.host) return;
  if (url.pathname === "/sw.js") return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleTapiRequest(buildId, event.request));
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(STATIC_CACHE, event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      caches
        .match("/index.html")
        .then((cached) => cached ?? fetch(event.request)),
    );
  }
});

async function cacheFirst(cacheName: string, req: Request): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

listenForInvalidations({ buildId, url: INVALIDATIONS_ROUTE }).catch((error) =>
  console.error("Failed to listen for invalidations", error),
);
