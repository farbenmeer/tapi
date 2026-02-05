---
title: lacy
---

The `lacy` function wraps a Promise in a Proxy that allows lazy property access and method calls without intermediate `await` expressions.

## Usage

```ts
import { lacy } from "@farbenmeer/lacy";

const result = lacy(Promise.resolve({ users: [{ name: "Alice" }] }));

await result.users[0].name; // "Alice"
```

## Signature

```ts
function lacy<T>(data: Promise<T>): LacyPromise<T>
```

## Parameters

### `data`

**Type**: `Promise<T>`

The promise to wrap. Can be any promise — `fetch()` calls, database queries, or plain `Promise.resolve()` values.

## Return Value

**Type**: `LacyPromise<T>`

A proxy object that supports lazy chaining. See [LacyPromise](#lacypromise) below.

## Types

### `LacyPromise<T>`

The core type returned by `lacy()`. It combines lazy property/method access with the standard Promise protocol.

```ts
type LacyPromise<T, P = never> = T extends (...args: infer A) => infer R
  ? (...args: A) => LacyPromise<R>
  : {
      [key in Exclude<keyof T, "then" | "catch" | "finally" | "$">]: LacyPromise<T[key]>;
    } & Thenable<T | P>;
```

**Behavior:**

- If `T` is a **function**, the `LacyPromise` is callable with the same arguments and returns a `LacyPromise` of the return type.
- Otherwise, every property of `T` becomes a `LacyPromise` of that property's type, enabling deep chaining.
- Includes `then`, `catch`, `finally` for standard Promise interop.
- Includes `$` to access the raw underlying `Promise<T>`.

### `Thenable<T>`

The Promise-compatible interface mixed into every `LacyPromise`.

```ts
type Thenable<T> = {
  then<R = T>(
    onfulfilled?: (value: T) => R | PromiseLike<R>,
    onrejected?: (reason: any) => void
  ): Promise<R>;
  catch(onrejected: (reason: any) => void): Promise<T>;
  finally(onfinally: () => void): Promise<T>;
  $: Promise<T>;
};
```

| Property | Type | Description |
| --- | --- | --- |
| `then` | `(onfulfilled?, onrejected?) => Promise<R>` | Attach fulfillment/rejection handlers. |
| `catch` | `(onrejected) => Promise<T>` | Attach a rejection handler. |
| `finally` | `(onfinally) => Promise<T>` | Attach a handler that runs on settlement. |
| `$` | `Promise<T>` | Access the raw underlying promise directly. |

## Examples

### Property access

```ts
const obj = lacy(Promise.resolve({ a: 1, b: 2 }));

await obj.a; // 1
await obj.b; // 2
```

### Array indexing

```ts
const arr = lacy(Promise.resolve([10, 20, 30]));

await arr[0]; // 10
await arr[2]; // 30
```

### Method calls

```ts
const arr = lacy(Promise.resolve([1, 2, 3]));

await arr.map((n) => n * 2);    // [2, 4, 6]
await arr.filter((n) => n > 1); // [2, 3]
```

### Deep chaining

```ts
const data = lacy(fetch("/api/users")).json();

await data[0].name;           // First user's name
await data.map((u) => u.age); // Array of ages
```

### Accessing the raw promise

```ts
const wrapped = lacy(Promise.resolve(42));

const raw = wrapped.$; // Promise<number>
await raw;             // 42
```

### Null and undefined

Null and undefined values resolve correctly without throwing:

```ts
const obj = lacy(Promise.resolve({ value: null }));

await obj.value; // null (not undefined)
```
