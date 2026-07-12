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

export function deleteDB(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = self.indexedDB.deleteDatabase(name);
    req.onsuccess = () => {
      resolve();
    };
    req.onerror = () => {
      reject(new Error(`Failed to delete IndexedDB Database ${name}`));
    };
  });
}
