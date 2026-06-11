---
"@farbenmeer/vite-plugin-tapi": minor
---

vite-plugin-tapi: the production server now serves the client build with SPA fallback

The bundled `dist/server.js` previously handled only the API and returned `404`
for every other path, so serving the frontend in production meant either
`vite preview` (a dev server that rejects unknown `Host` headers via
`preview.allowedHosts` — breaking behind preview proxies) or `srvx -s client`
(whose static handler has no history fallback, so refreshing a client route
404s).

`dist/server.js` is now a complete single-host server: API routes under
`basePath`, static files from the sibling `./client`, and an `index.html` SPA
fallback for unmatched `GET`/`HEAD` navigations. Deployment is just
`srvx serve --entry dist/server.js` — no `-s` flag, no separate static host,
and client-side routes survive deep-links and reloads.

A new `static` option controls this: `true` (default) serves static + SPA
fallback; `false` keeps the old API-only bundle (for a dedicated static host /
CDN or a runtime without filesystem access); `{ fallback: false }` serves
static files without the SPA fallback; `{ fallback: "404.html" }` uses a custom
fallback file.
