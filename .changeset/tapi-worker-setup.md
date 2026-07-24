---
"@toapi/worker": minor
---

Add `setupToapiWorker`, a single-call helper that registers the `activate` and `fetch` listeners and opens the revalidation stream, replacing the manual `cleanup` / `handleToapiRequest` / `listenForInvalidations` wiring. The individual functions remain exported for advanced setups.

Rename `handleTapiRequest` to `handleToapiRequest` as part of the tapi → toapi rebrand. `handleTapiRequest` stays as a deprecated alias for the same function and will be removed in a future major version.
