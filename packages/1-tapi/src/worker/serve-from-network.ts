import { EXPIRES_AT_HEADER, TAGS_HEADER } from "../shared/constants";
import { deleteCacheEntry, storeCacheEntry } from "./cache";

export async function serveFromNetwork(req: Request) {
  const res = await fetch(req);
  // only cache ok responses with tags or expires-at header
  if (
    res.ok &&
    (res.headers.has(TAGS_HEADER) || res.headers.has(EXPIRES_AT_HEADER))
  ) {
    await storeCacheEntry(req, res);
  } else {
    await deleteCacheEntry(req);
  }
  return res;
}
