import type { BunnyManifest } from "../manifest";
import { STATIC_CACHE_PREFIX } from "./contants";

export async function serveStaticFile(
  manifest: BunnyManifest,
  req: Request | URL
) {
  const staticCache = await self.caches.open(
    STATIC_CACHE_PREFIX + manifest.buildId
  );

  const cached = await staticCache.match(req);
  if (cached) {
    return cached;
  }

  const res = await fetch(req);
  await staticCache.put(req, res.clone());
  return res;
}
