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

export type Subscription = (
  tags: string[],
  meta: { clientId?: string }
) => void;

export interface Cache {
  get(key: string): Promise<CacheEntry | null>;
  set(
    input: CacheEntry & { key: string; ttl: number; tags: string[] }
  ): Promise<void>;
  delete(tags: string[], meta?: { clientId?: string }): Promise<void>;
  subscribe(callback: Subscription): () => void;
}

export class PubSub implements Cache {
  subscribers = new Set<Subscription>();

  async get(_key: string): Promise<CacheEntry | null> {
    return null;
  }

  set(
    _: CacheEntry & {
      key: string;
      ttl: number;
      tags: string[];
    }
  ): Promise<void> {
    return Promise.resolve();
  }

  delete(tags: string[], meta?: { clientId?: string }): Promise<void> {
    for (const callback of this.subscribers) {
      callback(tags, meta ?? {});
    }

    return Promise.resolve();
  }

  subscribe(callback: Subscription): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }
}
