export class TagManager {
  private urlsByTag = new Map<string, Set<string>>();
  private tagsByUrl = new Map<string, Set<string>>();

  add(res: Response): void {
    const tags = new Set(res.headers.get("X-TAPI-Tags")?.split(" "));

    for (const tag of this.tagsByUrl.get(res.url) ?? []) {
      if (!tags.has(tag)) {
        this.urlsByTag.get(tag)?.delete(res.url);
      }
    }

    for (const tag of tags.values()) {
      let urls = this.urlsByTag.get(tag);
      if (!urls) {
        urls = new Set();
        this.urlsByTag.set(tag, urls);
      }
      urls.add(res.url);
    }

    this.tagsByUrl.set(res.url, tags);
  }

  remove(res: Response): string[] {
    const tags = res.headers.get("X-TAPI-Tags")?.split(" ") ?? [];
    let removedUrls = new Set<string>();
    for (const tag of tags) {
      const urls = this.urlsByTag.get(tag);
      if (urls) {
        removedUrls = removedUrls.union(urls);
      }
      this.urlsByTag.delete(tag);
    }
    for (const url of removedUrls.values()) {
      this.tagsByUrl.delete(url);
    }
    return Array.from(removedUrls);
  }
  
  removeUrl(url: string) {
    const tags = this.tagsByUrl.get(url);
    if (!tags) return;
    for (const tag of tags.values()) {
      this.urlsByTag.get(tag)?.delete(url);
    }
    this.tagsByUrl.delete(url);
  }
}
