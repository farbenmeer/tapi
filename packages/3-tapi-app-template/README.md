# TApi App

A minimal full-stack app: [TApi](https://www.npmjs.com/package/@farbenmeer/tapi) on top of [Nitro](https://nitro.build) + [Vite](https://vite.dev) + React.

## Scripts

```bash
pnpm dev      # dev server with HMR (client + server)
pnpm build    # production build → .output/
pnpm start    # run the production server
pnpm preview  # preview the production build
```

## Project layout

```
server.ts                             # Nitro server entry: forwards /api/** to TApi
src/
├── api.ts                            # TApi root: defineApi().route(...)
├── handlers/                         # TApi route handlers
│   └── hello.ts
├── routes/                           # Nitro routes (non-/api)
│   ├── __tapi/invalidations.get.ts   # Cache-invalidation stream
│   └── .well-known/openapi.json.get.ts
├── app.tsx                           # React root component
├── client.ts                         # Typed TApi client for the frontend
├── index.tsx                         # React entry
├── main.css
└── sw.ts                             # Service worker (built separately)
```

## How the pieces connect

- **Vite** bundles the React client. `nitro/vite` plugs Nitro into the same dev/build pipeline.
- **Nitro** auto-detects `server.ts` at the project root as the server entry handler (mounted at `/**`), and scans `src/routes/**` (mounted at `/`) thanks to `serverDir: "src"` in `nitro.config.ts`. More-specific scanned routes take precedence over `server.ts`.
- **TApi** owns everything under `/api`. `server.ts` checks the path and forwards `/api/**` requests to TApi's `createRequestHandler`; everything else falls through to the scanned routes or the renderer (SPA fallback). TApi handlers live in `src/handlers/`.
- **Service worker** is built by `vite.sw.config.ts` into `.cache/sw/sw.js` (lib mode), then registered as a Nitro public asset via `publicAssets` in `nitro.config.ts`. The client registers it from `src/index.tsx` only in production.

## Deployment

The default `node-server` Nitro preset produces a self-contained `.output/server/index.mjs`. The included `Dockerfile` builds and runs it. Switch presets by setting `NITRO_PRESET` (e.g. `vercel`, `cloudflare`, `bun`) — see [nitro.build/deploy](https://nitro.build/deploy).
