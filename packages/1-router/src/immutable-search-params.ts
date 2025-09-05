export class ImmutableSearchParams extends URLSearchParams {
  override set(key: string, value: string) {
    const newSearchParams = new URLSearchParams(this);
    newSearchParams.set(key, value);
    return new ImmutableSearchParams(newSearchParams);
  }

  override append(name: string, value: string) {
    const newSearchParams = new URLSearchParams(this);
    newSearchParams.append(name, value);
    return new ImmutableSearchParams(newSearchParams);
  }

  override delete(key: string) {
    const newSearchParams = new URLSearchParams(this);
    newSearchParams.delete(key);
    return new ImmutableSearchParams(newSearchParams);
  }
}
