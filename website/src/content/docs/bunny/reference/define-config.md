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
  client?: ClientConfig;
  worker?: WorkerConfig;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `vite` | `UserConfig` (from Vite) | Extend or override the Vite configuration used during development and production builds. |
| `server` | `ServerConfig` | Configure how the Bunny server resolves the public URL of incoming requests, and inject static replacements into the server bundle. |
| `client` | `ClientConfig` | Inject static replacements into the client bundle. |
| `worker` | `WorkerConfig` | Inject static replacements into the service worker bundle. |

## ServerConfig

```ts
interface ServerConfig {
  trustForwardedHeader?: boolean;
  trustHostHeader?: boolean;
  host?: string;
  protocol?: string;
  define?: Record<string, string>;
}
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `trustForwardedHeader` | `boolean` | `false` | Trust the `X-Forwarded-Host` and `X-Forwarded-Proto` headers when determining the request URL. Enable this when running behind a reverse proxy that sets these headers. |
| `trustHostHeader` | `boolean` | `false` | Trust the `Host` header when determining the request URL. Enable this when your reverse proxy forwards the original `Host` header and you want it used for URL construction. |
| `host` | `string` | — | A static hostname to use when constructing the request URL. Takes precedence over header-based host detection. |
| `protocol` | `string` | — | A static protocol (`http` or `https`) to use when constructing the request URL. Takes precedence over header-based protocol detection. |
| `define` | `Record<string, string>` | — | Statically replace identifiers in the server bundle at build time. See [Static Replacements](#static-replacements). |

## ClientConfig

```ts
interface ClientConfig {
  define?: Record<string, string>;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `define` | `Record<string, string>` | Statically replace identifiers in the client bundle at build time. See [Static Replacements](#static-replacements). |

## WorkerConfig

```ts
interface WorkerConfig {
  define?: Record<string, string>;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `define` | `Record<string, string>` | Statically replace identifiers in the service worker bundle at build time. See [Static Replacements](#static-replacements). |

## Static Replacements

Each bundle (`client`, `server`, and `worker`) accepts a `define` map that Bunny forwards to Vite (for the client) and esbuild (for the server and worker). At build time every occurrence of a key in your source is replaced with the corresponding value verbatim — so values must be valid JavaScript expressions. Wrap strings with `JSON.stringify` to avoid common mistakes:

```ts
import { defineConfig } from "@farbenmeer/bunny";

export default defineConfig({
  client: {
    define: {
      "process.env.API_BASE": JSON.stringify("https://api.example.com"),
      __FEATURE_FLAG__: "true",
    },
  },
  server: {
    define: {
      "process.env.DATABASE_POOL_SIZE": JSON.stringify("20"),
    },
  },
});
```

Because replacements happen at build time, code guarded by a statically-false condition becomes unreachable and is eliminated by the bundler. This is how Bunny's predefined variables enable conditional compilation — see [Predefined Variables](#predefined-variables) below.

### Predefined Variables

Bunny always defines the following variables in each bundle. Your own `define` entries are merged on top and take precedence.

| Variable | Bundle | Values |
| --- | --- | --- |
| `process.env.NODE_ENV` | client, worker | `"development"` in `bunny dev`, otherwise `process.env.NODE_ENV` or `"production"`. |
| `process.env.BUNNY_ENV` | client, server, worker | `"development"` in `bunny dev`, `"production"` in `bunny build`. |
| `process.env.BUNNY_BUNDLE` | client, server, worker | `"client"`, `"server"`, or `"worker"` — identifies which bundle the code was built into. |
| `process.env.BUNNY_SERVER` | server | `"dev"` during `bunny dev`, `"standalone"` for the bundled production server, `"cli"` for the API worker. |

Use them to gate code that should only exist in a specific environment or bundle:

```ts
if (process.env.BUNNY_ENV === "development") {
  // Only included in the dev bundle — removed from production builds.
  console.log("Debug helpers attached");
}

if (process.env.BUNNY_BUNDLE === "client") {
  // Only included in the client bundle.
}
```

After the replacement, `if ("development" === "development")` collapses to `if (true)`, and the opposite comparison collapses to `if (false)` — the unreachable branch is then dropped by the bundler's dead-code elimination.

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
