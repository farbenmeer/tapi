# Build context is the monorepo root (workspace dependencies must be
# available), e.g. `docker build -f examples/todo-list/Dockerfile .`

# --- Build stage: compile workspace deps and bundle the app ---
FROM node:24-slim AS builder
WORKDIR /usr/src/app
RUN corepack enable
ENV NODE_ENV=production

COPY . .
RUN pnpm install --frozen-lockfile
# Build the example's workspace dependencies first, then the example itself.
# `vite build` emits a self-contained dist/server.js (srvx fetch handler)
# and the static client files under dist/client.
RUN pnpm run --filter "@farbenmeer/toapi-example-todo-list^..." build
RUN pnpm run --filter "@farbenmeer/toapi-example-todo-list" build

# --- Runtime stage: srvx serves the API and the static client files ---
FROM node:24-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN npm install -g srvx@^0.11.15

COPY --from=builder /usr/src/app/examples/todo-list/dist/server.js ./server.js
COPY --from=builder /usr/src/app/examples/todo-list/dist/client ./client

# The sqlite database lives in ./db (see src/db.ts) and must be writable.
RUN mkdir db && chown -R node:node db

USER node
EXPOSE 3000/tcp
CMD [ "srvx", "serve", "--prod", "--host", "0.0.0.0", "--port", "3000", "-s", "client", "server.js" ]
