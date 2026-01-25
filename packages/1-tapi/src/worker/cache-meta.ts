import { openDB } from "./idb";

const DB_NAME = "tapi-cache-meta";
const DB_VERSION = 1;
const META_STORE_NAME = "meta";
const TAGS_STORE_NAME = "tags";

interface CacheMeta {
  tags: string[];
  expiresAt: number | null;
}

async function openCacheMetaDB() {
  return openDB(DB_NAME, DB_VERSION, (db) => {
    db.createObjectStore(META_STORE_NAME);
    db.createObjectStore(TAGS_STORE_NAME);
  });
}

export async function storeMetadata(url: string, meta: CacheMeta) {
  const db = await openCacheMetaDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction([META_STORE_NAME, TAGS_STORE_NAME], "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(new Error(`Failed to store metadata for "${url}"`));

    const metaStore = tx.objectStore(META_STORE_NAME);
    metaStore.put(meta, url);
    const tagsStore = tx.objectStore(TAGS_STORE_NAME);
    for (const tag of meta.tags) {
      const req = tagsStore.get(tag);
      req.onsuccess = () => {
        const urls: string[] = req.result ?? [];
        urls.push(url);
        tagsStore.put(urls, tag);
      };
    }
  });
}

export async function getMetadata(url: string) {
  const db = await openCacheMetaDB();
  return new Promise<CacheMeta | null>((resolve, reject) => {
    const tx = db.transaction(META_STORE_NAME, "readonly");
    const metaStore = tx.objectStore(META_STORE_NAME);
    const req = metaStore.get(url);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () =>
      reject(new Error(`Failed to retrieve metadata for "${url}"`));
  });
}

export async function invalidateTags(cache: Cache, tags: string[]) {
  const db = await openCacheMetaDB();
  return new Promise<void>((resolve, reject) => {
    const deletes: Promise<boolean>[] = [];
    const tx = db.transaction([TAGS_STORE_NAME, META_STORE_NAME], "readwrite");
    tx.oncomplete = async () => {
      await Promise.all(deletes);
      resolve();
    };
    tx.onerror = () =>
      reject(new Error(`Failed to invalidate tags ${tags.join(", ")}`));
    const tagsStore = tx.objectStore(TAGS_STORE_NAME);
    const metaStore = tx.objectStore(META_STORE_NAME);
    for (const tag of tags) {
      const req = tagsStore.get(tag);
      req.onsuccess = () => {
        const urls: string[] = req.result ?? [];
        for (const url of urls) {
          metaStore.delete(url);
          deletes.push(cache.delete(url));
        }
        tagsStore.delete(tag);
      };
    }
  });
}
