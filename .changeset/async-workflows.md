---
"@farbenmeer/workflow": minor
---

Workflows are now async functions backed by AsyncLocalStorage.

Breaking changes:

- `workflow(gen)` now requires `gen: (input) => Promise<void>` instead of a synchronous function.
- `step(fn)` now returns `(input) => Promise<O>`. Use `await step()` inside workflows.
- `rethrowSuspense` has been removed — `try/catch` around steps now works naturally because steps reject with real errors instead of throwing a sentinel for synchronous replay.
- Steps with persisted errors (retry budget exhausted) now throw deterministically on replay instead of being re-executed.

Improvements:

- Parallel steps via `Promise.all([stepA(), stepB()])` are now supported. Step IDs include a per-run invocation counter so the same step can be called multiple times (in a loop or in parallel) without colliding.
- Workflow code can `await` arbitrary helpers, not only steps.
