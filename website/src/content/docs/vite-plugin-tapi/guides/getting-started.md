---
title: Getting Started
description: Set up vite-plugin-tapi and configure your API entry point.
---

## Installation

```bash
pnpm add -D @farbenmeer/vite-plugin-tapi
pnpm add @farbenmeer/tapi srvx
```

## Plugin Setup

Add the plugin to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tapi from "@farbenmeer/vite-plugin-tapi";

export default defineConfig({
  plugins: [tapi()],
});
```

## API Entry Point

By default the plugin looks for `src/api.ts` and expects it to export `api`:

```ts
// src/api.ts
import { defineApi, defineHandler, TResponse } from "@farbenmeer/tapi/server";

export const api = defineApi().route("/hello", {
  GET: defineHandler({ authorize: () => true }, async () => {
    return TResponse.json({ message: "hello" });
  }),
});
```

In dev (`vite`) and preview (`vite preview`) the API is mounted as middleware at `/api` on Vite's server. Frontend and API share the same port.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `entry` | `string` | `"src/api.ts"` | Path to the file exporting `api`. Resolved against the Vite root. |
| `basePath` | `string` | `"/api"` | Prefix for API routes. Use `""` to mount at the root. |
| `port` | `number` | — | Default port for Vite's dev/preview server. Falls back to the `PORT` env var. |
| `external` | `(string \| RegExp)[]` | `[]` | Packages to keep external in the server bundle. |

## Environment Variables

During development the plugin loads `.env`, `.env.local`, `.env.<mode>`, and `.env.<mode>.local` via Vite's `loadEnv` and mirrors every key into `process.env` before the API module is loaded. This covers server-side libraries (database clients, OAuth secrets) that read `process.env` directly.

Existing `process.env` values take precedence, so shell variables override `.env` files.

In production, env vars must come from the runtime (Docker, systemd, your PaaS). The built server does not load `.env` files.
