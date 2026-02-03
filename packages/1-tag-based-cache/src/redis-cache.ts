import type { RedisClientType } from "@redis/client";
import type { Cache, CacheEntry, Json, Subscription } from "./index";

const BLOB_STRING_TYPE = 36;

interface InvalidationMessage {
  tags: string[];
  meta?: Json;
}

export class RedisCache implements Cache {
  subscriptions = new Set<Subscription>();
  subscriber?: RedisClientType;

  constructor(private redis: RedisClientType) {}

  async get(key: string): Promise<CacheEntry | null> {
    const data = await this.redis.get(`data:${key}`);
    const attachment = (await this.redis
      .withCommandOptions({
        typeMapping: {
          [BLOB_STRING_TYPE]: Buffer,
        },
      })
      .get(`attachment:${key}`)) as unknown as Buffer;

    return data || attachment
      ? {
          data: data ? JSON.parse(data) : null,
          attachment: attachment ? new Uint8Array(attachment) : null,
        }
      : null;
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
    let promises: Promise<unknown>[] = [];
    if (data) {
      promises.push(
        this.redis.set(`data:${key}`, JSON.stringify(data), { EX: ttl })
      );
    }
    if (attachment) {
      promises.push(
        this.redis.set(`attachment:${key}`, Buffer.from(attachment), {
          EX: ttl,
        })
      );
    }

    for (const tag of tags) {
      promises.push(this.redis.sAdd(`tag:${tag}`, key));
    }

    await Promise.all(promises);
  }

  async delete(tags: string[], meta?: Json): Promise<void> {
    const keys = await Promise.all(
      tags.map((tag) => this.redis.sMembers(`tag:${tag}`))
    );
    const keySet = new Set<string>(keys.flat());

    const keysToDelete: string[] = tags.map((tag) => `tag:${tag}`);

    for (const key of keySet) {
      keysToDelete.push(`data:${key}`, `attachment:${key}`);
    }

    // Delete all the keys if there are any
    if (keysToDelete.length > 0) {
      await this.redis.del(keysToDelete);
    }

    await this.redis.publish(
      "invalidate",
      JSON.stringify({ tags, meta } satisfies InvalidationMessage)
    );
  }

  async setupSubscription() {
    this.subscriber = this.redis.duplicate();
    await this.subscriber.connect();
    await this.subscriber.subscribe("invalidate", (message) => {
      const { tags, meta } = JSON.parse(message) as InvalidationMessage;
      for (const callback of this.subscriptions) {
        callback(tags, meta);
      }
    });
  }

  subscribe(callback: Subscription): () => void {
    if (this.subscriptions.size === 0) {
      this.setupSubscription();
    }
    this.subscriptions.add(callback);

    return () => {
      this.subscriptions.delete(callback);
      if (this.subscriptions.size === 0) {
        this.subscriber?.destroy();
        this.subscriber = undefined;
      }
    };
  }
}
