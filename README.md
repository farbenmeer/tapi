# TAPI Monorepo

A collection of TypeScript libraries for building type-safe REST APIs and web applications.

## Packages

### [@farbenmeer/tapi](./packages/1-tapi)
Build REST APIs with fully typed clients without a compile step.

### [@farbenmeer/lacy](./packages/1-lacy)
Lightweight lazy evaluation utility library.

### [@farbenmeer/router](./packages/1-router)
Lightweight React-based client-side router with nested routes and path parameters.

### [@farbenmeer/tag-based-cache](./packages/1-tag-based-cache)
Flexible caching system with tag-based invalidation supporting in-memory, filesystem, and Redis backends.

### [@farbenmeer/react-tapi](./packages/2-react-tapi)
React bindings for TAPI with Suspense integration and auto-revalidation.

### [@farbenmeer/skeleton](./packages/2-skeleton)
Skeleton loading state components for React applications.

### [@farbenmeer/bunny](./packages/3-bunny)
Minimalistic web framework built on TAPI and React with Vite and esbuild.

### [@farbenmeer/bunny-boilerplate](./packages/4-bunny-boilerplate)
Starter template for Bunny projects.

## Examples

### [env-file](./examples/env-file)
Example of using environment variables from a .env-file with bunny.

### [todo-list](./examples/todo-list)
Example of a simple todo list application using bunny.
