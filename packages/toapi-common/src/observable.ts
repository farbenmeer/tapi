export type Subscription<T> = (value: Promise<T>) => void | Promise<void>;

export type Observable<T> = {
  readonly queryKey: string;
  subscribe(callback: Subscription<T>): () => void;
};
