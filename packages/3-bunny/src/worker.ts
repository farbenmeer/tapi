import {
  handleTapiRequest,
  listenForInvalidations,
} from "@farbenmeer/tapi/worker";
import type { BunnyManifest } from "./manifest";
import { cacheStaticFiles } from "./worker/cache-static-files";
import { cleanUpCaches } from "./worker/clean-up-caches";
import { API_CACHE_PREFIX } from "./worker/contants";
import { serveStaticFile } from "./worker/serve-static-files";

declare const self: ServiceWorkerGlobalScope;
declare const __BUNNY_MANIFEST: string;

const manifest = JSON.parse(__BUNNY_MANIFEST) as BunnyManifest;
const apiPathPattern = /^\/api(\/|$)/;

console.info("Bunny: Set up Worker", manifest.buildId);

self.addEventListener("install", (event) => {
  event.waitUntil(cacheStaticFiles(manifest).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanUpCaches(manifest));
});

const staticFilePaths = new Set(manifest.staticCachedFiles);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // ignore requests for other origins
  if (url.host !== self.location.host) return;
  // ignore requests for service worker script
  if (url.pathname === "/sw.js") return;

  console.info("Bunny Worker", event.request.method, url.pathname);
  if (staticFilePaths.has(url.pathname)) {
    event.respondWith(serveStaticFile(manifest, event.request));
    return;
  }

  if (apiPathPattern.test(url.pathname)) {
    event.respondWith(
      self.caches
        .open(API_CACHE_PREFIX + manifest.buildId)
        .then((cache) => handleTapiRequest(cache, event.request))
    );
    return;
  }

  event.respondWith(serveStaticFile(manifest, new URL("/index.html", url)));
});

self.caches
  .open(API_CACHE_PREFIX + manifest.buildId)
  .then((cache) => listenForInvalidations(cache, "/__bunny/invalidations"))
  .catch((error) => console.error("Failed to listen for invalidations", error));
