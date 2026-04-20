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
src/
├── api.ts                            # TApi root: defineApi().route(...)
├── handlers/                         # TApi route handlers
│   └── hello.ts
├── api/[...].ts                      # Nitro catch-all → TApi
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
- **Nitro** scans `src/api/**` (mounted at `/api`) and `src/routes/**` (mounted at `/`) thanks to `serverDir: "src"` in `nitro.config.ts`.
- **TApi** owns everything under `/api`. The single Nitro file at `src/api/[...].ts` forwards every request to TApi's `createRequestHandler`. TApi handlers live in `src/handlers/` to stay out of Nitro's auto-scan path.
- **Service worker** is built by `vite.sw.config.ts` into `.cache/sw/sw.js` (lib mode), then registered as a Nitro public asset via `publicAssets` in `nitro.config.ts`. The client registers it from `src/index.tsx` only in production.

## Deployment

The default `node-server` Nitro preset produces a self-contained `.output/server/index.mjs`. The included `Dockerfile` builds and runs it. Switch presets by setting `NITRO_PRESET` (e.g. `vercel`, `cloudflare`, `bun`) — see [nitro.build/deploy](https://nitro.build/deploy).
