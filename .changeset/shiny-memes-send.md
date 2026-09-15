---
"@toapi/router": minor
---

Add a `useTransition` option to `Router`, `Link`, and `useRouter`'s `push`/`replace` to control how navigation state updates are scheduled (disable transitions, or supply a custom one e.g. from React's `useTransition()` hook). `Link` now wraps its click handling in a transition by default, so `useOptimistic` updates triggered from `onClick` work as expected.
