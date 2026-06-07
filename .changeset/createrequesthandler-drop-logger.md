---
"@farbenmeer/tapi": minor
"@farbenmeer/bunny": patch
---

Drop the `logger` option from `createRequestHandler`. Configure the logger on the API definition instead via `defineApi({ logger })`. Bunny installs a default logger on the API when one isn't provided.
