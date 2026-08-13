# @farbenmeer/lacy

Lightweight utility for lazy evaluation of JavaScript promises. Chain property access and method calls without awaiting intermediate values.

**[Documentation](https://oss-docs.apps.farbenmeer.de/lacy/)** | **[GitHub](https://github.com/farbenmeer/tapi/tree/main/packages/1-lacy)** | **[npm](https://www.npmjs.com/package/@farbenmeer/lacy)** 

```ts
import { lacy } from "@farbenmeer/lacy";

// Instead of this:
const response = await fetch("/api/users");
const data = await response.json();
const name = data[0].name;

// Write this:
const name = await lacy(fetch("/api/users")).json()[0].name;
```

## Installation

```bash
npm install @farbenmeer/lacy
yarn add @farbenmeer/lacy
pnpm add @farbenmeer/lacy
bun add @farbenmeer/lacy
```

## License

MIT
