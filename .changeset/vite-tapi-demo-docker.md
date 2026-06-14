---
"@farbenmeer/vite-plugin-tapi-example-demo": patch
---

Add a production Dockerfile that serves the api with the srvx CLI behind Caddy
(reverse proxy + static files with an index.html not-found fallback), plus a
Docker e2e test. Mount the demo api under `/api` instead of the root.
