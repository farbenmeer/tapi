---
---

Fix a flaky `RedisCache > expire by ttl` test that raced the TTL expiry boundary on loaded CI runners. Test-only change; no released package is affected.
