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

The server bundle is a fetch-handler module. Serve it with the [srvx](https://srvx.h3.dev) CLI:

```bash
srvx --prod dist/server.js
```

`srvx` picks up `PORT`, `HOST`, and other settings from environment variables.

## Serving Static Assets

Static assets in `dist/client/` should ideally be served by a dedicated static host — nginx, Caddy, or an S3-compatible bucket fronted by a CDN — for better caching, compression, and HTTP/2.

If you don't need a separate static host, srvx can serve them too with the `-s` flag:

```bash
srvx --prod -s client dist/server.js
```

The path passed to `-s` is resolved relative to the directory containing the entry file (`dist/`), so `client` points at `dist/client/`. API routes are matched first; static files fall through when no API route handles the request.

## Environment Variables

The production server does not load `.env` files. Env vars must come from the runtime: Docker env, systemd `EnvironmentFile`, or your PaaS config.
