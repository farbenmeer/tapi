# @farbenmeer/workflow

## 0.3.0

### Minor Changes

- 135c9a8: Workflows are now async functions backed by AsyncLocalStorage: `step()` returns a Promise, parallel steps via `Promise.all` are supported, and `rethrowSuspense` is removed.

## 0.2.1

### Patch Changes

- 5f0a81c: missing js extension in imports

## 0.2.0

### Minor Changes

- f12c743: list workflows and steps
- 9c33a47: In-Workflow error handling
- 9c33a47: stop-method

## 0.1.2

### Patch Changes

- d071db4: export schema files

## 0.1.1

### Patch Changes

- 4843f50: fix(workflow): add .js extensions to all relative ESM imports
- 16cbb9e: fix(workflow): widen DrizzleBetterSqliteAdapter schema generic to any
