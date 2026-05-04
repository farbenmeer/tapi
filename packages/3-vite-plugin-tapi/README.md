# @farbenmeer/vite-plugin-tapi

Vite plugin for [tapi](https://github.com/farbenmeer/tapi). Bundles your tapi
API alongside your Vite frontend in a single project: serves the API as
middleware in dev and preview mode, and produces a deployable server bundle
for production.

## Installation

```bash
pnpm add -D @farbenmeer/vite-plugin-tapi
pnpm add @farbenmeer/tapi srvx
```

Peer-deps: `vite ^8`, `@farbenmeer/tapi`.

## Usage

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import tapi from "@farbenmeer/vite-plugin-tapi";

export default defineConfig({
  plugins: [tapi()],
});
```

The plugin expects `src/api.ts` to export `api` (an `ApiDefinition`):
```ts
import { defineApi, defineHandler, TResponse } from "@farbenmeer/tapi/server";

export const api = defineApi().route("/hello", {
  GET: defineHandler({ authorize: () => true }, async () => {
    return TResponse.json({ message: "hello" });
  }),
});
```

In dev (`vite`) and preview (`vite preview`) modes, the plugin attaches a
middleware to Vite's server that handles requests at the configured
`basePath` (default `/api`). The same Vite server serves both the frontend
and the API on a single port.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `entry` | `string` | `"src/api.ts"` | Path to the file exporting `api`. Resolved against the Vite root. |
| `basePath` | `string` | `"/api"` | Prefix for API routes. Use `""` to mount at the root. |
| `port` | `number` | — | Default port for Vite's dev/preview server. Falls back to the `PORT` env var. |
| `external` | `(string \| RegExp)[]` | `[]` | Packages to keep external in the server bundle. By default everything is bundled. |

## Environment variables

### Dev (`pnpm dev`)

The plugin loads `.env`, `.env.local`, `.env.<mode>`, and `.env.<mode>.local`
via Vite's `loadEnv` and mirrors every key into `process.env` before the api
module is loaded. Existing `process.env` values keep precedence, so shell
vars override `.env` files.

```
.env                     # all envs
.env.local               # all envs, ignored by git
.env.development         # dev only
.env.development.local   # dev only, ignored by git
```

This covers server-side libraries that read `process.env.X` directly
(BetterAuth, DB clients, OAuth secrets). Vite's `import.meta.env` injection
still applies to client code.

### Production (`srvx dist/server/server.js`)

The built server does **not** load `.env` files. In production, env vars come
from the runtime — Docker, systemd, or your PaaS. 


## Build output

`vite build` writes two clearly separated trees:

```
dist/
├── client/        — static frontend assets (HTML, JS, CSS, images)
└── server/
    ├── server.js      — bundled server (sourcemap included)
    └── server.js.map
```

The split exists for safety: server-only code (database credentials,
third-party API keys, server-side libraries) lives in `dist/server/` and
**must not** be deployed to a public static host. Treating `dist/client/` as
the static-deploy root makes it impossible to leak the server bundle by
accident.

## Deployment

The server bundle is a fetch-handler module. Serve it in production with the
[srvx](https://srvx.h3.dev) CLI:

```bash
srvx --prod dist/server/server.js
```

`srvx` picks up `PORT`, `HOST`, and other settings from environment variables.

### Static assets

Static frontend assets in `dist/client/` should ideally be served by a
dedicated static host — nginx, Caddy, or an S3-compatible bucket fronted by a
CDN. Dedicated static hosts give you better caching, compression, HTTP/2,
and offload the load from your Node.js server.

If you don't want a separate static host, srvx can serve them too with the
`-s` flag:

```bash
srvx --prod -s ../client dist/server/server.js
```

The path passed to `-s` is resolved **relative to the directory containing
the entry file** (`dist/server/`), so `../client` points at `dist/client/`.
API routes are matched first; static files fall through when no API route
handles the request.
