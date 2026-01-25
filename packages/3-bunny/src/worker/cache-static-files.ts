import type { BunnyManifest } from "../manifest";
import { STATIC_CACHE_PREFIX } from "./contants";

export async function cacheStaticFiles(manifest: BunnyManifest) {
  const staticCache = await self.caches.open(
    STATIC_CACHE_PREFIX + manifest.buildId
  );
  await staticCache.addAll(manifest.staticCachedFiles);
  console.info("Bunny: Cached", manifest.staticCachedFiles);
}
