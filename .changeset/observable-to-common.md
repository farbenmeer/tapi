---
"@toapi/common": minor
"@toapi/client": minor
"@toapi/react": minor
---

Move the `Observable` type from `@toapi/client` to `@toapi/common`. `@toapi/client` continues to re-export `Observable`, so its public API is unchanged. `@toapi/react` now depends on `@toapi/common` directly and no longer has a peer dependency on `@toapi/client`.
