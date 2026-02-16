import { EXPIRES_AT_HEADER, TAGS_HEADER } from "../shared/constants.js";
import type { Observable } from "./client-types.js";
import { handleResponse } from "./handle-response.js";

type ObservablePromise = Promise<unknown> & Observable<unknown>;
type Subscription = (data: Promise<unknown>) => void;

interface CacheEntry {
  current?: {
    value: ObservablePromise;
    expiresAt?: number;
    tags: Set<string>;
  };
  next?: ObservablePromise;
  queuedRevalidation?: Promise<void>;
  fetch: () => Promise<Response>;
  subscriptions: Set<Subscription>;
  timeout: NodeJS.Timeout | null;
}

interface Hooks {
  error: (error: unknown) => void | Promise<void>;
}

interface Options {
  minTTL?: number;
  maxOverdueTTL?: number;
  hooks?: Partial<Hooks>;
}

const DEFAULT_MIN_TTL = 5 * 1000;
const DEFAULT_MAX_OVERDUE_TTL = 1000;

export class Cache {
  private storage = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>();
  private minTTL: number;
  private maxOverdueTTL: number;
  private hooks: Hooks;

  constructor(options: Options) {
    this.minTTL = options.minTTL ?? DEFAULT_MIN_TTL;
    this.maxOverdueTTL = options.maxOverdueTTL ?? DEFAULT_MAX_OVERDUE_TTL;
    this.hooks = {
      error: options.hooks?.error ?? console.error,
    };
  }

  private emplace(url: string, fetch: () => Promise<Response>) {
    const currentEntry = this.storage.get(url);
    if (currentEntry) {
      currentEntry.fetch = fetch;
      return currentEntry;
    }
    const newEntry: CacheEntry = {
      subscriptions: new Set(),
      timeout: null,
      fetch,
    };
    this.storage.set(url, newEntry);
    return newEntry;
  }

  private revalidateRequest(
    url: string,
    entry: CacheEntry,
  ): { observable: ObservablePromise; revalidated: Promise<void> } {
    if (entry.timeout) {
      // clear timeout to make sure it the entry doesn't get revalidated again or removed based on TTL
      clearTimeout(entry.timeout);
    }

    // actually load fresh data
    const responsePromise = entry.fetch();

    const observable: Promise<unknown> & Observable<unknown> = Object.assign(
      responsePromise.then(handleResponse),
      {
        subscribe: (callback: Subscription) => {
          if (entry.subscriptions.size === 0) {
            if (entry.timeout) {
              clearTimeout(entry.timeout);
            }
            if (entry.current?.expiresAt) {
              entry.timeout = setTimeout(
                () => {
                  this.revalidateRequest(url, entry);
                },
                entry.current?.expiresAt +
                  Math.round(Math.random() * this.maxOverdueTTL),
              );
            }
          }
          entry.subscriptions.add(callback);

          // If there's a newer revalidation in-flight or completed since
          // this observable was created, notify the new subscriber immediately
          // so it doesn't miss the update.
          if (entry.next && entry.next !== observable) {
            callback(entry.next);
          }

          return () => {
            entry.subscriptions.delete(callback);
            if (entry.subscriptions.size === 0) {
              this.queueClearEntry(url);
            }
          };
        },
      },
    );

    entry.next = observable;

    // notify subscribers
    for (const callback of entry.subscriptions) {
      callback(observable);
    }

    const next = entry.next;

    const waitForRevalidation = async () => {
      try {
        // wait for request to finish
        const response = await responsePromise;
        // this will throw an error if the response is not ok
        await observable;

        if (entry.next !== next) {
          // request was superseded by a new request
          return;
        }

        // update entry
        const oldTags = entry.current?.tags ?? new Set();
        const newTags = new Set(
          response.headers.get(TAGS_HEADER)?.split(" ") ?? [],
        );
        const expiresAtHeader = response.headers.get(EXPIRES_AT_HEADER);
        const expiresAt = expiresAtHeader
          ? parseInt(expiresAtHeader, 10)
          : undefined;

        entry.current = {
          value: observable,
          tags: newTags,
          expiresAt,
        };
        entry.next = undefined;

        // add url to tagIndex for new tags
        for (const tag of newTags.difference(oldTags)) {
          const urls = this.tagIndex.get(tag);
          if (urls) {
            urls.add(url);
          } else {
            this.tagIndex.set(tag, new Set([url]));
          }
        }

        // remove url from tagIndex for removed tags
        for (const tag of oldTags.difference(newTags)) {
          this.tagIndex.get(tag)?.delete(url);
        }
      } catch (error) {
        if (!entry.current) {
          // no current value, we are stuck with the rejected promise
          entry.current = {
            value: observable,
            tags: new Set(),
          };
        }
        // there is a current valid value, we'll keep that an drop the error
        entry.next = undefined;
        await this.hooks.error(error);
      } finally {
        if (entry.subscriptions.size === 0) {
          // clear response after minTTL if no subscribers active
          this.queueClearEntry(url);
        }
      }
    };

    return { observable, revalidated: waitForRevalidation() };
  }

  request(url: string, fetch: () => Promise<Response>): ObservablePromise {
    const now = Date.now();
    let entry = this.emplace(url, fetch);

    if (entry.current) {
      // has cached value, serve from cache
      return entry.current.value;
    }

    // no cached value

    if (entry.next) {
      // already loading, serve from next
      return entry.next;
    }

    // nothing cached, load fresh
    const { observable } = this.revalidateRequest(url, entry);
    return observable;
  }

  async queueRevalidation(url: string, entry: CacheEntry) {
    await entry.next;
    const { revalidated } = this.revalidateRequest(url, entry);
    await revalidated;
  }

  async revalidateUrl(url: string) {
    const entry = this.storage.get(url);

    if (!entry) return;

    if (entry.next) {
      // we are currently fetching that url
      if (entry.queuedRevalidation) {
        // another revalidation is already queued, wait for it to finish
        await entry.queuedRevalidation;
      } else {
        // queue another revalidation
        const queuedRevalidation = this.queueRevalidation(url, entry);
        entry.queuedRevalidation = queuedRevalidation;
        await queuedRevalidation;
      }
    } else {
      // there is no request in flight, revalidate immediately
      const { revalidated } = this.revalidateRequest(url, entry);
      await revalidated;
    }
  }

  async revalidateTags(tags: string[]) {
    // collect urls to revalidate
    let urls = new Set<string>();
    for (const tag of tags) {
      const taggedUrls = this.tagIndex.get(tag);
      if (!taggedUrls) continue;
      urls = urls.union(taggedUrls);
    }
    // revalidate urls and wait until all are resolved or rejected
    await Promise.allSettled(
      Array.from(urls).map((url) => this.revalidateUrl(url)),
    );
  }

  queueClearEntry(url: string) {
    const entry = this.storage.get(url);
    if (!entry) return;

    if (entry.timeout) {
      clearTimeout(entry.timeout);
    }

    entry.timeout = setTimeout(() => {
      if (entry.current) {
        for (const tag of entry.current.tags) {
          this.tagIndex.get(tag)?.delete(url);
        }
      }
      this.storage.delete(url);
    }, this.minTTL);
  }
}
