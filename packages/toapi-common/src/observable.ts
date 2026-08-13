export type Observable<T> = {
  subscribe(callback: (value: Promise<T>) => void): () => void;
};
