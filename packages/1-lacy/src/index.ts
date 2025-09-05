export type LacyPromise<T, P = never> = T extends (...args: infer A) => infer R
  ? (...args: A) => LacyPromise<R>
  : {
      [key in Exclude<keyof T, "then" | "catch" | "finally">]: LacyPromise<
        T[key]
      >;
    } & Promise<T | P>;

export function lacy<T>(data: Promise<T>): LacyPromise<T> {
  return new Proxy(() => data, {
    get(target, prop): any {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        return (...args: any) => (target()[prop] as Function)(...args);
      }

      return lacy<unknown>(
        target().then((data: any) => {
          if (typeof data[prop] === "function") {
            return (...args: any) => data[prop](...args);
          }

          return data[prop];
        })
      );
    },
    apply(target, _thisArg, argArray) {
      return lacy<unknown>(target().then((method: any) => method(...argArray)));
    },
  }) as LacyPromise<T>;
}
