import { TAGS_HEADER } from "../shared/constants";
import { invalidateTags } from "./cache-meta";

export async function mutateAndInvalidate(cache: Cache, req: Request) {
  const res = await fetch(req);
  const tags = res.headers.get(TAGS_HEADER)?.split(" ")?.filter(Boolean) ?? [];
  if (tags.length === 0) {
    return res;
  }

  await invalidateTags(cache, tags);

  return res;
}
