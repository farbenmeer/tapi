---
title: Getting Started
description: Create a new Bunny project from scratch.
---

## Create a New Project

Scaffold a new project with the `init` command:

```bash
npx @farbenmeer/bunny init my-app
```

This creates the directory, extracts the boilerplate, and installs dependencies. You can specify a package manager with `--use`:

```bash
npx @farbenmeer/bunny init my-app --use pnpm
```

If you omit the name, the project is initialized in the current directory (which must not already contain a `package.json`).

## Development

Start the development server:

```bash
bunny dev
```

This starts a Vite dev server for the frontend and watches your API code with esbuild for hot-reload. The server listens on port 3000 by default:

```bash
bunny dev --port 8080
```

During development, the service worker is replaced with a dummy that immediately unregisters itself so caching does not interfere with hot-reload.

## Production Build

Build for production:

```bash
bunny build
```

This produces a `.bunny/prod/` directory containing:
- `dist/` — The Vite-built SPA and static assets.
- `api.cjs` — The bundled API server.
- `dist/sw.js` — The service worker with the build manifest baked in.
- `buildId.txt` — A unique build identifier.

### Standalone Mode

Use `--standalone` to bundle all dependencies (including `node_modules`) into a single `server.cjs`:

```bash
bunny build --standalone
```

This is useful for Docker deployments where you want a minimal image without `node_modules` but might now work if your dependencies include ffi binaries.

### Source Maps

Generate source maps with `--sourcemap`:

```bash
bunny build --sourcemap
```

## Production Server

Start the production server:

```bash
bunny start
```

This serves the built API and static files. Set the port with `--port`:

```bash
bunny start --port 8080
```
