import type { BunnyManifest } from "../manifest";
import { API_CACHE_PREFIX, STATIC_CACHE_PREFIX } from "./contants";

export async function cleanUpCaches(manifest: BunnyManifest) {
  for (const cacheName of await self.caches.keys()) {
    if (
      cacheName.startsWith(API_CACHE_PREFIX) &&
      cacheName !== API_CACHE_PREFIX + manifest.buildId
    ) {
      await self.caches.delete(cacheName);
      console.info("Bunny: Cleaned up Cache", cacheName);
    }
    if (
      cacheName.startsWith(STATIC_CACHE_PREFIX) &&
      cacheName !== STATIC_CACHE_PREFIX + manifest.buildId
    ) {
      await self.caches.delete(cacheName);
      console.info("Bunny: Cleaned up Cache", cacheName);
    }
  }
}
