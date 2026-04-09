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
  server?: ServerConfig;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `vite` | `UserConfig` (from Vite) | Extend or override the Vite configuration used during development and production builds. |
| `server` | `ServerConfig` | Configure how the Bunny server resolves the public URL of incoming requests. |

## ServerConfig

```ts
interface ServerConfig {
  trustForwardedHeader?: boolean;
  trustHostHeader?: boolean;
  host?: string;
  protocol?: string;
}
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `trustForwardedHeader` | `boolean` | `false` | Trust the `X-Forwarded-Host` and `X-Forwarded-Proto` headers when determining the request URL. Enable this when running behind a reverse proxy that sets these headers. |
| `trustHostHeader` | `boolean` | `false` | Trust the `Host` header when determining the request URL. Enable this when your reverse proxy forwards the original `Host` header and you want it used for URL construction. |
| `host` | `string` | — | A static hostname to use when constructing the request URL. Takes precedence over header-based host detection. |
| `protocol` | `string` | — | A static protocol (`http` or `https`) to use when constructing the request URL. Takes precedence over header-based protocol detection. |

## Usage

Create a `bunny.config.ts` in your project root:

```ts
import { defineConfig } from "@farbenmeer/bunny";

export default defineConfig({
  vite: {
    // Any Vite configuration
  },
  server: {
    trustForwardedHeader: true, // trust X-Forwarded-Host / X-Forwarded-Proto
  },
});
```

The config file is optional. If it does not exist, Bunny uses its defaults.

Bunny enables Vite's native `resolve.tsconfigPaths` so TypeScript path aliases work out of the box. Your `vite.plugins` are merged alongside it.
