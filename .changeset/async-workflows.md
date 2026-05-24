---
"@farbenmeer/workflow": minor
---

Workflows are now async functions backed by AsyncLocalStorage: `step()` returns a Promise, parallel steps via `Promise.all` are supported, and `rethrowSuspense` is removed.
