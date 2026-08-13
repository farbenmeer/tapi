---
"@toapi/server": minor
---

Replace createLocalClient with createLocalFetch
technically this is a breaking change so this breaks the semver contract but I'm pretty sure this is unused so far anyway.
This resolves the odd dependency of @toapi/server -> @toapi/client which shouldn't have existed in the first place.
