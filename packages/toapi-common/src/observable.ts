export type Observable<T> = {
  // Optional identity for a logical query whose response promises change.
  // Must be distinct across clients and requests, and stable across refreshes.
  readonly queryKey?: object;
  subscribe(callback: (value: Promise<T>) => void): () => void;
};
