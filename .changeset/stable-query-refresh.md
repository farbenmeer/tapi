---
"@toapi/client": patch
"@toapi/react": patch
"@toapi/common": patch
---

Give query observables an optional stable queryKey across revalidation promises. React retains the last resolved data during background refreshes, including when inline query factories run again because of parent updates or typing. Switching URLs, query parameters, or client instances still suspends for the new query. Custom observables without a key keep their existing identity behavior.
