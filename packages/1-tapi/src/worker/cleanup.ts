import {
  type CacheMeta,
  META_STORE_NAME,
  TAGS_STORE_NAME,
  openCache,
  openCacheMetaDB,
} from "./cache";

export interface CleanupOptions {
  /**
   * Grace period in seconds past a cache entry's `expiresAt` before the
   * entry is dropped. Entries expired within this window are kept; entries
   * expired longer than this window are deleted from both the cache and
   * the meta store.
   */
  maximumStaleAge: number;
}

/**
 * Reconcile the worker's cache and metadata stores. Intended to be called
 * from the service worker's `activate` event:
 *
 * ```ts
 * self.addEventListener("activate", (event) => {
 *   event.waitUntil(cleanup({ maximumStaleAge: 60 * 60 * 24 * 7 }));
 * });
 * ```
 *
 * Performs three things:
 *  1. Drops cache + meta entries whose `expiresAt` is older than
 *     `maximumStaleAge` seconds.
 *  2. Drops cache entries that have no corresponding meta record (orphans).
 *  3. Rebuilds the tags store from the surviving meta records, healing any
 *     drift between the two stores.
 */
export async function cleanup({
  maximumStaleAge,
}: CleanupOptions): Promise<void> {
  const [metaDb, cache] = await Promise.all([openCacheMetaDB(), openCache()]);
  const cutoff = Date.now() - maximumStaleAge * 1000;

  const survivors = new Map<string, string[]>();
  const dropped: string[] = [];

  // Pass 1: cursor meta, drop long-expired records, rebuild tags store
  // from survivors. All in a single readwrite transaction so meta and tags
  // can't disagree halfway through.
  await new Promise<void>((resolve, reject) => {
    const tx = metaDb.transaction(
      [META_STORE_NAME, TAGS_STORE_NAME],
      "readwrite",
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("Failed to clean up tapi cache"));

    const metaStore = tx.objectStore(META_STORE_NAME);
    const tagsStore = tx.objectStore(TAGS_STORE_NAME);

    const cursorReq = metaStore.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) {
        // cursor done — rebuild tags store from `survivors`
        tagsStore.clear();
        const tagToUrls = new Map<string, string[]>();
        for (const [url, tags] of survivors) {
          for (const tag of tags) {
            const urls = tagToUrls.get(tag);
            if (urls) urls.push(url);
            else tagToUrls.set(tag, [url]);
          }
        }
        for (const [tag, urls] of tagToUrls) {
          tagsStore.put(urls, tag);
        }
        return;
      }
      const url = cursor.key as string;
      const value: CacheMeta = cursor.value;
      if (value.expiresAt !== null && value.expiresAt < cutoff) {
        dropped.push(url);
        cursor.delete();
      } else {
        survivors.set(url, value.tags);
      }
      cursor.continue();
    };
  });

  // Delete dropped URLs from Cache Storage. Outside the IDB transaction
  // because the Cache API is async and would auto-commit the tx.
  await Promise.all(dropped.map((url) => cache.delete(url)));

  // Pass 2: drop cache entries that have no surviving meta record.
  // `survivors` already contains every URL with a (kept) meta record, so
  // anything in the cache not in `survivors` and not in `dropped` is an
  // orphan from a prior interrupted write.
  const cacheKeys = await cache.keys();
  const knownUrls = new Set(survivors.keys());
  await Promise.all(
    cacheKeys.map((req) => {
      if (knownUrls.has(req.url)) return Promise.resolve(true);
      return cache.delete(req);
    }),
  );
}
