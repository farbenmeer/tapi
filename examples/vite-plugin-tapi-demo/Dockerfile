# Build context is the monorepo root (workspace dependencies must be available),
# e.g. `docker build -f examples/vite-plugin-tapi-demo/Dockerfile .`

# --- Build stage: compile workspace deps and bundle the demo ---
FROM node:24-slim AS builder
WORKDIR /usr/src/app
RUN corepack enable
ENV NODE_ENV=production

COPY . .
RUN pnpm install --frozen-lockfile
# Build the demo's workspace dependencies first, then the demo itself.
# `vite build` emits a self-contained dist/server.js (srvx fetch handler)
# and static client files under dist/client.
RUN pnpm run --filter "@farbenmeer/vite-plugin-tapi-example-demo^..." build
RUN pnpm run --filter "@farbenmeer/vite-plugin-tapi-example-demo" build

# --- Runtime stage: srvx (Node) for the API + Caddy for static/reverse proxy ---
FROM node:24-alpine AS runner
WORKDIR /srv
ENV NODE_ENV=production

# Caddy binary from the official image.
COPY --from=caddy:2-alpine /usr/bin/caddy /usr/bin/caddy

# srvx CLI runs the bundled fetch handler.
RUN npm install -g srvx@^0.11.15

# Built artifacts: self-contained server bundle + static client files.
COPY --from=builder /usr/src/app/examples/vite-plugin-tapi-demo/dist/server.js ./server.js
COPY --from=builder /usr/src/app/examples/vite-plugin-tapi-demo/dist/client ./client

COPY examples/vite-plugin-tapi-demo/Caddyfile /etc/caddy/Caddyfile
COPY examples/vite-plugin-tapi-demo/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
