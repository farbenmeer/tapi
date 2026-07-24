export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export interface CacheEntry {
  data?: Json | null;
  attachment?: Uint8Array | null;
}

export interface Subscription {
  (tags: string[], meta?: Json): void;
}

export interface Cache {
  get(key: string): Promise<CacheEntry | null>;
  set(
    input: CacheEntry & { key: string; ttl: number; tags: string[] }
  ): Promise<void>;
  /** @deprecated use invalidate instead
   *
   * invalidate is more idiomatic naming for a cache (and this is clearly a pure cache, not general purpose database).
   * it is also consistent with the wording used in the tapi server package.
   */
  delete(tags: string[], meta?: { clientId?: string }): Promise<void>;
  invalidate(tags: string[], meta?: { clientId?: string }): Promise<void>;
  subscribe(callback: Subscription): () => void;
}
