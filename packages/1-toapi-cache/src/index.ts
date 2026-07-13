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
  delete(tags: string[], meta?: { clientId?: string }): Promise<void>;
  subscribe(callback: Subscription): () => void;
}
