# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM node:24-alpine AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build --standalone

# copy production dependencies and source code into final image
FROM base AS runner
COPY --from=builder /usr/src/app/.bunny/prod .

# run the app
USER node
EXPOSE 3000/tcp
CMD [ "node", "server.js" ]
