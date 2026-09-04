---
"@toapi/react": patch
---

`useQuery` no longer renders the previous query's data after the query changes. The stored value is now bound to the observable it was loaded for; when a different observable comes in, the hook suspends on the new one instead of handing out stale data until the subscription catches up. A late update from a subscription that has already been unsubscribed is ignored.
