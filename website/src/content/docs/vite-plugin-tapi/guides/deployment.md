---
title: Deployment
description: Serve the production bundle with srvx.
---

## Build Output

`vite build` writes two clearly separated trees:

```
dist/
├── client/        — static frontend assets (HTML, JS, CSS, images)
├── server.js      — bundled server (sourcemap included)
└── server.js.map
```

Server-only code (database credentials, API keys, server-side libraries) lives in `dist/server.js` and must not be deployed to a public static host. Deploying only `dist/client/` as the static root makes it impossible to accidentally leak the server bundle.

## Running the Server

The server bundle is a fetch-handler module. By default it is a complete single-host server: it serves the API under `basePath`, the static client from the sibling `dist/client/`, and falls back to `index.html` for unmatched navigations so history-routed SPAs survive deep-links and reloads. Serve it with the [srvx](https://srvx.h3.dev) CLI:

```bash
srvx serve --entry dist/server.js
```

No `-s` flag and no separate static host are needed — the bundle serves its own client. `srvx` picks up `PORT`, `HOST`, and other settings from environment variables.

Static serving uses `node:fs`, so it requires a Node/Bun/Deno runtime with filesystem access.

## Serving Static Assets Elsewhere

To put the static frontend on a dedicated static host instead — nginx, Caddy, or an S3-compatible bucket fronted by a CDN, for better caching, compression, and HTTP/2 — set `static: false` so `dist/server.js` stays API-only, and deploy `dist/client/` separately:

```ts
tapi({ static: false });
```

The `static` option also accepts `{ fallback: false }` (serve static files but `404` instead of the SPA fallback, for multi-page apps) and `{ fallback: "404.html" }` (use a custom fallback file, resolved relative to `dist/client/`).

## Environment Variables

The production server does not load `.env` files. Env vars must come from the runtime: Docker env, systemd `EnvironmentFile`, or your PaaS config.
