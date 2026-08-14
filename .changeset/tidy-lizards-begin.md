---
"@toapi/client": patch
---

500-up responses are not cached, 400-499 responses evict the cache, waitForRevalidation never throws
