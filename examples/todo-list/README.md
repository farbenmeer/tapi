# Toapi TODO List Example

A small React + Vite app that talks to a [Toapi](https://www.npmjs.com/package/@toapi/server)
API through `@toapi/vite-plugin`. Todos are stored in a local SQLite database
(`db/todos.sqlite`) via `node:sqlite`.

Commands:
* `pnpm dev` starts the Vite dev server (API included, with hot reload).
* `pnpm build` creates a production build (`dist/client` + `dist/server.js`).
* `pnpm start` previews the production build (run `pnpm build` first).
* `pnpm test` runs the Playwright end-to-end tests against dev and prod.
