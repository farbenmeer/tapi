type Thenable<T> = {
  then<R = T>(
    onfulfilled?: (value: T) => R | PromiseLike<R>,
    onrejected?: (reason: any) => void
  ): Promise<R>;
  catch(onrejected: (reason: any) => void): Promise<T>;
  finally(onfinally: () => void): Promise<T>;
  $: Promise<T>;
};

export type LacyPromise<T, P = never> = T extends (...args: infer A) => infer R
  ? (...args: A) => LacyPromise<R>
  : {
      [key in Exclude<
        keyof T,
        "then" | "catch" | "finally" | "$"
      >]: LacyPromise<T[key]>;
    } & Thenable<T | P>;

export function lacy<T>(data: Promise<T>): LacyPromise<T> {
  return new Proxy(() => data, {
    get(target, prop): any {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        return (...args: any) => (target()[prop] as Function)(...args);
      }
      if (prop === "$") {
        return target();
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
  }) as unknown as LacyPromise<T>;
}
