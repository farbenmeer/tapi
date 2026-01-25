import { handleTapiRequest } from "@farbenmeer/tapi/worker";
import type { BunnyManifest } from "./manifest";
import { cacheStaticFiles } from "./worker/cache-static-files";
import { cleanUpCaches } from "./worker/clean-up-caches";
import { serveStaticFile } from "./worker/serve-static-files";
import { API_CACHE_PREFIX } from "./worker/contants";

declare const self: ServiceWorkerGlobalScope;
declare const __BUNNY_MANIFEST: string;

const manifest = JSON.parse(__BUNNY_MANIFEST) as BunnyManifest;
const apiPathPattern = /^\/api(\/|$)/;

console.info("Bunny: Set up Worker", manifest.buildId);

self.addEventListener("install", (event) => {
  event.waitUntil(cacheStaticFiles(manifest));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanUpCaches(manifest));
});

const staticFilePaths = new Set(manifest.staticCachedFiles);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
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
