export class TagManager {
  private urlsByTag = new Map<string, Set<string>>();
  private tagsByUrl = new Map<string, Set<string>>();

  add(url: string, tags: string[]): void {
    const tags_ = new Set(tags);
    for (const tag of this.tagsByUrl.get(url) ?? []) {
      if (!tags_.has(tag)) {
        this.urlsByTag.get(tag)?.delete(url);
      }
    }

    for (const tag of tags_.values()) {
      let urls = this.urlsByTag.get(tag);
      if (!urls) {
        urls = new Set();
        this.urlsByTag.set(tag, urls);
      }
      urls.add(url);
    }

    this.tagsByUrl.set(url, tags_);
  }

  get(tags: string[]): string[] {
    let urls = new Set<string>();
    for (const tag of tags) {
      const tagUrls = this.urlsByTag.get(tag);
      if (tagUrls) {
        urls = urls.union(tagUrls);
      }
    }
    return Array.from(urls);
  }

  remove(url: string) {
    const tags = this.tagsByUrl.get(url);
    if (!tags) return;
    for (const tag of tags.values()) {
      this.urlsByTag.get(tag)?.delete(url);
    }
    this.tagsByUrl.delete(url);
  }
}
