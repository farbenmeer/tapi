import { EXPIRES_AT_HEADER, TAGS_HEADER } from "../shared/constants";
import { storeMetadata } from "./cache-meta";

export async function serveFromNetwork(cache: Cache, req: Request) {
  const res = await fetch(req);
  // only cache ok responses with tags or expires-at header
  if (
    res.ok &&
    (res.headers.has(TAGS_HEADER) || res.headers.has(EXPIRES_AT_HEADER))
  ) {
    const expiresAt = res.headers.get(EXPIRES_AT_HEADER);
    await storeMetadata(req.url, {
      tags: res.headers.get(TAGS_HEADER)?.split(" ").filter(Boolean) ?? [],
      expiresAt: expiresAt ? parseInt(expiresAt, 10) : null,
    });
    await cache.put(req, res.clone());
  } else {
    await cache.delete(req);
  }
  return res;
}
