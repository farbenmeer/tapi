export function openDB(
  name: string,
  version: number,
  migrate: (db: IDBDatabase) => void
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = self.indexedDB.open(name, version);
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(new Error(`Failed to open IndexedDB Database ${name}@${version}`));
    };
    req.onupgradeneeded = () => {
      migrate(req.result);
    };
  });
}
