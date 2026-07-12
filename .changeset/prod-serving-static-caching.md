---
"@farbenmeer/vite-plugin-tapi-example-demo": patch
"@farbenmeer/vite-plugin-tapi": patch
---

vite-plugin-tapi-demo: the reference Caddyfile now sets cache headers for the client build

Content-hashed assets under `/assets/*` are served with
`Cache-Control: public, max-age=31536000, immutable`, and the SPA shell (`/`,
`index.html`) with `no-cache`; `file_server` already emits `ETag`/`Last-Modified`
and answers `304`. A comment documents dropping `encode` when running behind a
compressing edge to avoid double compression, and the docker e2e test asserts
both cache headers.

Docs: the `srvx -s` static-serving note now calls out that it has no SPA history
fallback and sets no cache headers, pointing client-routed SPAs at a static
server / CDN (the reference Caddyfile) instead.
