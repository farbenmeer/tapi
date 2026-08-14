import {
  EXPIRES_AT_HEADER,
  HttpError,
  TAGS_HEADER,
  type Logger,
  type Observable,
} from "@toapi/common";
import { handleResponse } from "./handle-response.js";
import {
  type CacheEntryState,
  init,
  type ObservablePromise,
  queue,
  resolve,
  revalidate,
  revert,
} from "./state-machine.js";

type Subscription = (data: Promise<unknown>) => void;
type Fetcher = () => Promise<Response>;

interface CacheEntry {
  state: CacheEntryState;
  fetch: Fetcher;
  subscriptions: Set<Subscription>;
  timeout: ReturnType<typeof setTimeout> | null;
}

interface Options {
  minTTL?: number;
  maxOverdueTTL?: number;
  logger?: Logger;
}

const DEFAULT_MIN_TTL = 5 * 1000;
const DEFAULT_MAX_OVERDUE_TTL = 1000;

export class Cache {
  private storage = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>();
  private minTTL: number;
  private maxOverdueTTL: number;
  private errorLog: (error: unknown) => void | Promise<void>;

  constructor(options: Options) {
    this.minTTL = options.minTTL ?? DEFAULT_MIN_TTL;
    this.maxOverdueTTL = options.maxOverdueTTL ?? DEFAULT_MAX_OVERDUE_TTL;
    this.errorLog = options.logger?.error ?? console.error;
  }

  request(url: string, fetch: () => Promise<Response>): ObservablePromise {
    const entry = this.storage.get(url);

    if (entry) {
      switch (entry.state.status) {
        case "pending":
        case "revalidating":
          return entry.state.queued ?? entry.state.next;
        case "cached":
          return entry.state.value;
      }
    } else {
      const { observable } = this.loadFreshData(url, fetch);
      this.storage.set(url, {
        state: init(observable),
        fetch,
        subscriptions: new Set(),
        timeout: null,
      });
      return observable;
    }
  }

  private async setResolveHook(
    url: string,
    responsePromise: Promise<Response>,
    observable: ObservablePromise,
  ) {
    try {
      const response = await responsePromise;
      await observable;

      const entry = this.storage.get(url);
      switch (entry?.state.status) {
        case "pending": {
          const { tags, expiresAt } = this.extractMetadata(response);

          for (const tag of tags) {
            const urls = this.tagIndex.get(tag);
            if (urls) {
              urls.add(url);
            } else {
              this.tagIndex.set(tag, new Set([url]));
            }
          }
          entry.state = resolve(entry.state, observable, tags, expiresAt);

          this.setTimer(url, entry);
          return;
        }
        case "revalidating": {
          const { tags, expiresAt } = this.extractMetadata(response);

          // add url to tagIndex for new tags
          for (const tag of tags.difference(entry.state.tags)) {
            const urls = this.tagIndex.get(tag);
            if (urls) {
              urls.add(url);
            } else {
              this.tagIndex.set(tag, new Set([url]));
            }
          }

          // remove url from tagIndex for removed tags
          for (const tag of entry.state.tags.difference(tags)) {
            this.tagIndex.get(tag)?.delete(url);
          }

          entry.state = resolve(entry.state, observable, tags, expiresAt);

          this.setTimer(url, entry);
          return;
        }
      }
    } catch (error) {
      if (error instanceof HttpError && error.status < 500) {
        // not found, no access etc, evict the entry
        this.evictEntry(url);
        return;
      }

      const entry = this.storage.get(url);
      if (!entry) {
        // evicted, ignore
        return;
      }

      // log every other error
      this.errorLog(error);
      switch (entry.state.status) {
        case "pending":
          // no point to caching a failed request
          this.evictEntry(url);
          return;
        case "revalidating":
          // revert to last good state
          entry.state = revert(entry.state);
          return;
      }
    }
  }

  revalidateUrl(url: string): Promise<void> {
    const entry = this.storage.get(url);

    // no entry, nothing to do
    if (!entry) return Promise.resolve();

    // no subscribers, evict the entry
    if (entry.subscriptions.size === 0) {
      this.evictEntry(url);
      return Promise.resolve();
    }

    const { observable, resolved } = this.loadFreshData(
      url,
      entry.fetch,
      entry.state.status === "revalidating"
        ? entry.state.next
        : Promise.resolve(),
    );

    switch (entry.state.status) {
      case "pending":
        // pending is stale now, replace it with a fresh request
        entry.state = init(observable);
        break;

      case "cached":
        // revalidate
        entry.state = revalidate(entry.state, observable);
        break;

      case "revalidating":
        // already revalidating, queue
        entry.state = queue(entry.state, observable);
        break;
    }

    // notify subscribers
    for (const callback of entry.subscriptions) {
      callback(observable);
    }

    return resolved;
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

  private evictEntry(url: string) {
    const entry = this.storage.get(url);
    if (!entry) return;

    switch (entry.state.status) {
      case "cached":
      case "revalidating":
        // remove tags from index
        for (const tag of entry.state.tags) {
          this.tagIndex.get(tag)?.delete(url);
        }
    }

    this.storage.delete(url);
  }

  private loadFreshData(
    url: string,
    fetch: Fetcher,
    waitFor: Promise<unknown> = Promise.resolve(),
  ): { observable: ObservablePromise; resolved: Promise<void> } {
    // actually load fresh data
    const responsePromise = waitFor.then(() => fetch());

    const observable: ObservablePromise = Object.assign(
      responsePromise.then(handleResponse),
      {
        subscribe: (callback: Subscription) =>
          this.subscribe(url, fetch, callback),
      },
    );

    const resolved = this.setResolveHook(url, responsePromise, observable);

    return { observable, resolved };
  }

  private subscribe(
    url: string,
    fetch: Fetcher,
    callback: Subscription,
  ): () => void {
    const entry = this.storage.get(url);

    if (!entry) {
      // has been evicted
      const { observable } = this.loadFreshData(url, fetch);
      const newEntry = {
        state: init(observable),
        fetch,
        subscriptions: new Set([callback]),
        timeout: null,
      };
      this.storage.set(url, newEntry);
      callback(observable);
      return () => this.unsubscribe(url, newEntry, callback);
    }

    // set up subscription
    entry.subscriptions.add(callback);

    if (entry.subscriptions.size === 1) {
      // was scheduled for eviction, reset the timer
      this.setTimer(url, entry);
    }

    // Immediately push the current value to the new subscriber
    // so it doesn't miss any updates
    switch (entry.state.status) {
      case "cached":
        callback(entry.state.value);
        break;
      case "pending":
      case "revalidating":
        callback(entry.state.queued ?? entry.state.next);
        break;
    }

    return () => this.unsubscribe(url, entry, callback);
  }

  private unsubscribe(url: string, entry: CacheEntry, callback: Subscription) {
    entry.subscriptions.delete(callback);
    this.setTimer(url, entry);
  }

  private setTimer(url: string, entry: CacheEntry) {
    if (entry.timeout) {
      clearTimeout(entry.timeout);
    }

    if (entry.subscriptions.size === 0) {
      // no active subscriptions, set up eviction timer
      entry.timeout = setTimeout(() => this.evictEntry(url), this.minTTL);
      return;
    }

    if (entry.state.status === "cached" && entry.state.expiresAt) {
      // entry expires, set up revalidation timer
      const timeUntilRevalidation =
        entry.state.expiresAt -
        Date.now() +
        Math.round(Math.random() * this.maxOverdueTTL);
      entry.timeout = setTimeout(
        () => this.revalidateUrl(url),
        Math.max(0, timeUntilRevalidation),
      );
      return;
    }

    // no timeout necessary
    entry.timeout = null;
  }

  private extractMetadata(response: Response): {
    tags: Set<string>;
    expiresAt?: number;
  } {
    const expiresAtHeader = response.headers.get(EXPIRES_AT_HEADER);
    return {
      tags: new Set(response.headers.get(TAGS_HEADER)?.split(" ") ?? []),
      expiresAt: expiresAtHeader ? parseInt(expiresAtHeader, 10) : undefined,
    };
  }
}
