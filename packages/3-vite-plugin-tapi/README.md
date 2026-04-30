# @farbenmeer/vite-plugin-tapi

Vite plugin that runs a TApi server alongside Vite's dev server and bundles a production server entry on `vite build`.

## Install

```bash
pnpm add -D @farbenmeer/vite-plugin-tapi
```

Peer-deps: `vite ^8`, `@farbenmeer/tapi`.

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tapi from "@farbenmeer/vite-plugin-tapi";

export default defineConfig({
  plugins: [tapi()],
});
```

The plugin looks for `src/api.ts` (override via `entry`), expects an exported `api` (an `ApiDefinition`), and serves it on `/api/*` (override via `basePath`).

## Options

| Option       | Default       | Description                                                                       |
| ------------ | ------------- | --------------------------------------------------------------------------------- |
| `entry`      | `"src/api.ts"`| Path to the module exporting `api`. Resolved against the Vite root.               |
| `basePath`   | `"/api"`      | Mount path for the api handler. Empty string mounts at root.                      |
| `port`       | `3000`        | Port for the api server. Falls back to `PORT` env var.                            |
| `standalone` | `false`       | If `true`, the production bundle inlines `srvx` and `@farbenmeer/tapi`.           |

## Environment variables

### Dev (`pnpm dev`)

The plugin loads `.env`, `.env.local`, `.env.<mode>`, and `.env.<mode>.local` via Vite's `loadEnv` and mirrors every key into `process.env` before the api module is loaded. Existing `process.env` values keep precedence, so shell vars override `.env` files.

```
.env                     # all envs
.env.local               # all envs, ignored by git
.env.development         # dev only
.env.development.local   # dev only, ignored by git
```

This covers server-side libraries that read `process.env.X` directly (BetterAuth, DB clients, OAuth secrets). Vite's `import.meta.env` injection still applies to client code.

### Production (`node dist/server.mjs`)

The built server does **not** load `.env` files. In production, env vars come from the runtime — Docker, systemd, or your PaaS. If you want `.env` support locally for production smoke tests, opt in via Node's built-in flag:

```jsonc
// package.json
"scripts": {
  "start": "node --env-file-if-exists=.env dist/server.mjs"
}
```

## Build output

`vite build` emits `dist/server.mjs`. By default `srvx` and `@farbenmeer/tapi` are external; the consumer needs them installed at runtime. With `standalone: true` they are inlined and the output runs without `node_modules`.
