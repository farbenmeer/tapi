export interface Thenable<T> {
  then(): Promise<T>;
}
