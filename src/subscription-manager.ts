export class SubscriptionManager {
  private subscriptions = new Map<
    string,
    Set<(data: Promise<unknown>) => void>
  >();

  subscribe(url: string, callback: (data: Promise<unknown>) => void) {
    let urlSubscriptions = this.subscriptions.get(url);
    if (!urlSubscriptions) {
      urlSubscriptions = new Set();
      this.subscriptions.set(url, urlSubscriptions);
    }
    urlSubscriptions.add(callback);
    return () => {
      urlSubscriptions.delete(callback);
      if (urlSubscriptions.size === 0) {
        this.subscriptions.delete(url);
      }
    };
  }

  trigger(url: string, data: Promise<unknown>) {
    const urlSubscriptions = this.subscriptions.get(url);
    if (urlSubscriptions) {
      for (const callback of urlSubscriptions.values()) {
        callback(data);
      }
    }
  }

  has(url: string) {
    return this.subscriptions.has(url);
  }
}
