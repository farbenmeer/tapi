---
title: CLI
---

The `bunny` CLI provides commands for the full project lifecycle.

## `bunny init [name]`

Scaffolds a new Bunny project.

```bash
bunny init my-app
```

- **`name`** (optional): Directory name for the project. If omitted, initializes in the current directory.
- **`--use <pm>`**: Package manager to use (`npm`, `pnpm`, `yarn`, `bun`). Auto-detected from the current environment if not specified.

Creates the project directory, extracts the boilerplate, sets up `package.json` and `Dockerfile`, and runs dependency installation.

## `bunny dev`

Starts the development server.

```bash
bunny dev --port 3000
```

- **`--port <port>`**: Port to listen on. Defaults to `3000`.

Runs Vite in middleware mode for the frontend with hot module replacement. The API code (`src/api.ts`) is watched and rebuilt with esbuild — changes are hot-reloaded without restarting the server.

Routes:
- `/api/*` — API endpoints handled by TApi.
- `/.well-known/openapi.json` — Auto-generated OpenAPI schema.
- Everything else — Served by Vite.

The service worker is disabled during development to prevent caching issues.

## `bunny build`

Builds for production.

```bash
bunny build
bunny build --standalone
bunny build --sourcemap
```

- **`--standalone`**: Bundles all dependencies into a single `server.cjs` file. Useful for minimal Docker images.
- **`--sourcemap`**: Generates source maps for the client build.

Output is written to `.bunny/prod/`. See [Project Structure](/bunny/guides/project-structure) for details on the build output.

## `bunny start`

Starts the production server from the build output.

```bash
bunny start --port 3000
```

- **`--port <port>`**: Port to listen on. Defaults to `3000`.

Loads the built API from `.bunny/prod/api.cjs`, serves static files from `.bunny/prod/dist`, and reads the build ID from `.bunny/prod/buildId.txt`. Sets `NODE_ENV=production`.
