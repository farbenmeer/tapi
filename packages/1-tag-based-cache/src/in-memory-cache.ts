import { DatabaseSync } from "node:sqlite";
import type { CacheEntry, Cache, Subscription, Json } from "./index";

const MIN_GC_TIMEOUT = 5 * 1000;
const MAX_GC_TIMEOUT = 5 * 60 * 1000;
const GC_TIMEOUT_STEP = 0.1;

export class InMemoryCache implements Cache {
  db = new DatabaseSync(":memory:");
  gcTimeout = MIN_GC_TIMEOUT;
  subscribers = new Set<Subscription>();

  constructor() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      BEGIN;
      CREATE TABLE entries (
        key TEXT PRIMARY KEY,
        data TEXT,
        attachment BLOB,
        added_at INTEGER,
        expires_at INTEGER
      );
      CREATE TABLE tags (
        key TEXT,
        tag TEXT,
        UNIQUE(key, tag),
        FOREIGN KEY (key) REFERENCES entries(key) ON DELETE CASCADE
      );
      COMMIT;
    `);

    setTimeout(() => {
      this.gc();
    }, this.gcTimeout);
  }

  async get(key: string): Promise<CacheEntry | null> {
    const result = this.db
      .prepare(
        `
          SELECT data, attachment
          FROM entries
          WHERE key = ? AND expires_at >= ?
        `
      )
      .get(key, Date.now());

    return Promise.resolve(
      result
        ? {
            data: result.data ? JSON.parse(result.data as string) : null,
            attachment: result.attachment as Uint8Array,
          }
        : null
    );
  }

  set({
    key,
    data,
    attachment,
    ttl,
    tags,
  }: CacheEntry & {
    key: string;
    ttl: number;
    tags: string[];
  }): Promise<void> {
    this.db.exec("BEGIN;");
    this.db
      .prepare(
        `
          INSERT INTO entries (key, data, attachment, added_at, expires_at)
          VALUES (?, ?, ?, ?, ?);
        `
      )
      .run(
        key,
        data ? JSON.stringify(data) : null,
        attachment ?? null,
        Date.now(),
        Date.now() + ttl * 1000
      );

    const stmt = this.db.prepare(`
      INSERT INTO tags (key, tag) VALUES (?, ?)
    `);

    for (const tag of tags) {
      stmt.run(key, tag);
    }
    this.db.exec("COMMIT;");

    return Promise.resolve();
  }

  delete(tags: string[], meta?: Json): Promise<void> {
    this.db.exec("BEGIN;");
    const stmt = this.db.prepare(
      `
        DELETE FROM entries WHERE key IN
          (SELECT key FROM tags WHERE tag = ?);
      `
    );

    for (const tag of tags) {
      stmt.run(tag);
    }

    this.db.exec("COMMIT;");

    for (const callback of this.subscribers) {
      callback(tags, meta);
    }

    return Promise.resolve();
  }

  gc() {
    this.db.exec("BEGIN;");
    const stmt = this.db.prepare(
      `
        DELETE FROM entries WHERE expires_at < ?;
      `
    );

    const result = stmt.run(Date.now());
    this.db.exec("COMMIT;");

    if (result.changes > 100) {
      this.gcTimeout = Math.max(
        Math.floor(this.gcTimeout * (1 - GC_TIMEOUT_STEP)),
        MIN_GC_TIMEOUT
      );
    } else if (result.changes < 10) {
      this.gcTimeout = Math.min(
        Math.floor(this.gcTimeout * (1 + GC_TIMEOUT_STEP)),
        MAX_GC_TIMEOUT
      );
    }

    setTimeout(() => {
      this.gc();
    }, this.gcTimeout);
  }

  subscribe(callback: Subscription): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }
}
