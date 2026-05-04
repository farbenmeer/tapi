---
"@farbenmeer/vite-plugin-tapi-example-demo": minor
"@farbenmeer/vite-plugin-tapi": minor
"@farbenmeer/tapi-example-tables": minor
"@farbenmeer/bunny": patch
"@farbenmeer/tapi": patch
---

Refactor Vite Plugin:

- production deployments should run srvx directly
- dev and preview mode work as expected
- invalidation stream is served directly by TApi's server handler (under api base path)
