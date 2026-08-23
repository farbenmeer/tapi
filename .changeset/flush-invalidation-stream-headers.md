---
"@toapi/server": patch
---

Flush the revalidation stream's response headers immediately.

`streamRevalidatedTags` previously wrote nothing until the first keepalive
fired, so `GET ${basePath}/__tapi/invalidations` left clients waiting up to ten
seconds before the response resolved. It now sends the first keepalive right
away (consumers already skip empty lines) and encodes keepalives as bytes
rather than enqueueing a raw string into the byte stream.
