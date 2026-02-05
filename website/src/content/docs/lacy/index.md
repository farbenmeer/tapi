---
title: Lacy
description: Lazy evaluation for JavaScript promises
---

Lacy is a lightweight utility that wraps Promises with a Proxy, enabling you to chain property access and method calls without awaiting intermediate values.

## Why?

Working with promises often leads to verbose chains of `await` expressions:

```ts
const response = await fetch("/api/users");
const data = await response.json();
const first = data[0];
const name = first.name;
```

With Lacy, you can express the same thing as a single lazy chain:

```ts
import { lacy } from "@farbenmeer/lacy";

const name = await lacy(fetch("/api/users")).json()[0].name;
```

Each property access and method call is deferred until you `await` the final result. Nothing is evaluated eagerly — the chain builds up a sequence of operations that resolve in order when awaited.

## Installation

```bash
npm install @farbenmeer/lacy
```

## Quick Start

```ts
import { lacy } from "@farbenmeer/lacy";

// Wrap any promise
const users = lacy(Promise.resolve([
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
]));

// Access properties lazily
await users[0].name; // "Alice"

// Call methods lazily
await users.map((u) => u.name); // ["Alice", "Bob"]

// Chain as deep as you need
const data = lacy(Promise.resolve({ deeply: { nested: { value: 42 } } }));
await data.deeply.nested.value; // 42
```

## How It Works

`lacy()` returns a `Proxy` that intercepts property access and function calls. Each intercepted operation returns a new `LacyPromise` wrapping the deferred computation, so chains compose naturally.

- **Property access** (`obj.key`) — returns a `LacyPromise` that resolves to the property value
- **Method calls** (`obj.method(args)`) — invokes the method on the resolved value and wraps the result
- **`await`** — resolves the full chain
- **`.then()` / `.catch()` / `.finally()`** — standard Promise protocol, so `LacyPromise` works anywhere a Promise does
- **`.$`** — escape hatch to get the raw underlying `Promise`
