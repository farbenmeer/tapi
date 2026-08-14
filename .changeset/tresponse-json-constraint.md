---
"@toapi/common": minor
"@toapi/server": patch
"@toapi/client": patch
---

Constrain `TResponse.json` to only accept JSON-serializable values (`JSONValue`). This prevents non-JSON types such as `Date`, `Map`, `Set`, `bigint`, `undefined`, functions, or symbols from being passed as structured response data, which would otherwise be silently coerced to strings by `JSON.stringify` and break the type contract the client relies on. Form-data mocks that echoed `Object.fromEntries(formData)` (which can contain `File` values) were updated to return only string entries.
