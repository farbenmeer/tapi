# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS builder
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS runner
COPY --from=builder /usr/src/app/.bunny/prod .
COPY drizzle /usr/src/app/drizzle

ENV SQLITE_FILE=/mnt/data/db.sqlite

# run the app
USER bun
EXPOSE 3000/tcp
CMD [ "bun", "run", "migrate", "&&", "bun", "run", "server.js" ]
