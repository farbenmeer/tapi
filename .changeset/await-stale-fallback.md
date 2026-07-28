---
"@toapi/worker": patch
---

Fix offline stale-fallback in the worker: `serveFromNetwork` is now awaited so the expired-cache catch block can serve the cached response when the network is unavailable.