---
title: defineConfig
---

`defineConfig` is a helper for creating a typed `bunny.config.ts` configuration file.

```ts
import { defineConfig } from "@farbenmeer/bunny";
```

## Signature

```ts
function defineConfig(config: BunnyConfig): BunnyConfig
```

## BunnyConfig

```ts
interface BunnyConfig {
  vite?: UserConfig;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `vite` | `UserConfig` (from Vite) | Extend or override the Vite configuration used during development and production builds. |

## Usage

Create a `bunny.config.ts` in your project root:

```ts
import { defineConfig } from "@farbenmeer/bunny";

export default defineConfig({
  vite: {
    // Any Vite configuration
  },
});
```

The config file is optional. If it does not exist, Bunny uses its defaults.

Bunny always adds `vite-tsconfig-paths` to the Vite plugins so TypeScript path aliases work out of the box. Your `vite.plugins` are merged alongside it.
