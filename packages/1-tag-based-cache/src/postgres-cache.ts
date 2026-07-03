import type { Pool, PoolClient, Notification } from "pg";
import type { Cache, CacheEntry, Json, Subscription } from "./index";

const CHANNEL = "tag_based_cache_invalidate";

const MIN_GC_TIMEOUT = 5 * 1000;
const MAX_GC_TIMEOUT = 5 * 60 * 1000;
const GC_TIMEOUT_STEP = 0.1;

interface InvalidationMessage {
  tags: string[];
  meta?: Json;
}

export interface PostgresCacheOptions {
  /**
   * When `true` (the default) the required tables and indexes are created
   * lazily on the first operation via `CREATE TABLE IF NOT EXISTS`. Set to
   * `false` if you manage the schema yourself (e.g. via migrations).
   */
  createSchema?: boolean;
}

export class PostgresCache implements Cache {
  subscriptions = new Set<Subscription>();
  listener?: PoolClient;
  gcTimeout = MIN_GC_TIMEOUT;

  private ready: Promise<void>;
  private gcTimer?: ReturnType<typeof setTimeout>;
  private stopped = false;

  constructor(
    private pool: Pool,
    private options: PostgresCacheOptions = {}
  ) {
    this.ready = this.setup();
  }

  private async setup(): Promise<void> {
    if (this.options.createSchema !== false) {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS cache_entries (
          key TEXT PRIMARY KEY,
          data JSONB,
          attachment BYTEA,
          added_at BIGINT NOT NULL,
          expires_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cache_tags (
          key TEXT NOT NULL REFERENCES cache_entries(key) ON DELETE CASCADE,
          tag TEXT NOT NULL,
          PRIMARY KEY (key, tag)
        );
        CREATE INDEX IF NOT EXISTS cache_tags_tag_idx ON cache_tags (tag);
        CREATE INDEX IF NOT EXISTS cache_entries_expires_at_idx
          ON cache_entries (expires_at);
      `);
    }

    this.gcTimer = setTimeout(() => this.gc(), this.gcTimeout);
  }

  async get(key: string): Promise<CacheEntry | null> {
    await this.ready;

    const { rows } = await this.pool.query(
      `
        SELECT data, attachment
        FROM cache_entries
        WHERE key = $1 AND expires_at >= $2
      `,
      [key, Date.now()]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      data: row.data ?? null,
      attachment: row.attachment ? new Uint8Array(row.attachment) : null,
    };
  }

  async set({
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
    await this.ready;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `
          INSERT INTO cache_entries (key, data, attachment, added_at, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (key) DO UPDATE SET
            data = EXCLUDED.data,
            attachment = EXCLUDED.attachment,
            added_at = EXCLUDED.added_at,
            expires_at = EXCLUDED.expires_at
        `,
        [
          key,
          data ? JSON.stringify(data) : null,
          attachment ? Buffer.from(attachment) : null,
          Date.now(),
          Date.now() + ttl * 1000,
        ]
      );

      // Replace the full tag set so tags removed since the last `set` are
      // dropped, matching the `INSERT OR REPLACE` semantics of the SQLite
      // implementations.
      await client.query(`DELETE FROM cache_tags WHERE key = $1`, [key]);

      for (const tag of tags) {
        await client.query(
          `INSERT INTO cache_tags (key, tag) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
          [key, tag]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      throw e;
    } finally {
      client.release();
    }
  }

  async delete(tags: string[], meta?: Json): Promise<void> {
    await this.ready;

    // `cache_tags` rows are removed automatically via `ON DELETE CASCADE`.
    await this.pool.query(
      `
        DELETE FROM cache_entries
        WHERE key IN (SELECT key FROM cache_tags WHERE tag = ANY($1))
      `,
      [tags]
    );

    await this.pool.query(`SELECT pg_notify($1, $2)`, [
      CHANNEL,
      JSON.stringify({ tags, meta } satisfies InvalidationMessage),
    ]);
  }

  private async setupListener(): Promise<void> {
    const listener = await this.pool.connect();
    this.listener = listener;

    listener.on("notification", (msg: Notification) => {
      if (msg.channel !== CHANNEL || !msg.payload) return;
      const { tags, meta } = JSON.parse(msg.payload) as InvalidationMessage;
      for (const callback of this.subscriptions) {
        callback(tags, meta);
      }
    });

    // `CHANNEL` is a fixed, safe identifier so string interpolation here is
    // not injectable (LISTEN does not accept a bound parameter).
    await listener.query(`LISTEN ${CHANNEL}`);
  }

  subscribe(callback: Subscription): () => void {
    if (this.subscriptions.size === 0) {
      this.setupListener();
    }
    this.subscriptions.add(callback);

    return () => {
      this.subscriptions.delete(callback);
      if (this.subscriptions.size === 0) {
        this.listener?.removeAllListeners("notification");
        this.listener?.release();
        this.listener = undefined;
      }
    };
  }

  private async gc(): Promise<void> {
    try {
      const result = await this.pool.query(
        `DELETE FROM cache_entries WHERE expires_at < $1`,
        [Date.now()]
      );
      const changes = result.rowCount ?? 0;

      if (changes > 100) {
        this.gcTimeout = Math.max(
          Math.floor(this.gcTimeout * (1 - GC_TIMEOUT_STEP)),
          MIN_GC_TIMEOUT
        );
      } else if (changes < 10) {
        this.gcTimeout = Math.min(
          Math.floor(this.gcTimeout * (1 + GC_TIMEOUT_STEP)),
          MAX_GC_TIMEOUT
        );
      }
    } catch {
      // Ignore transient errors (e.g. the pool being drained on shutdown);
      // the next tick will retry.
    } finally {
      if (!this.stopped) {
        this.gcTimer = setTimeout(() => this.gc(), this.gcTimeout);
      }
    }
  }

  /**
   * Stops the background garbage collector and releases the dedicated
   * invalidation listener connection back to the pool. Call this before
   * shutting down so no timers or connections are left dangling. The
   * underlying pool is left untouched — the caller owns its lifecycle.
   */
  async close(): Promise<void> {
    this.stopped = true;
    if (this.gcTimer) {
      clearTimeout(this.gcTimer);
      this.gcTimer = undefined;
    }
    this.listener?.removeAllListeners("notification");
    this.listener?.release();
    this.listener = undefined;
    this.subscriptions.clear();
  }
}
