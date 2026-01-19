FROM node:24-slim AS base
WORKDIR /usr/src/app
RUN corepack enable
ENV NODE_ENV=production

# install dependencies into temp image
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run --filter "@farbenmeer/bunny-example-todo-list^" build
RUN pnpm run --filter "@farbenmeer/bunny-example-todo-list" build --standalone

# copy standalone build to final runner image
FROM base AS runner
COPY --from=builder /usr/src/app/examples/todo-list/.bunny/prod .

RUN mkdir db
RUN chown -R node:node db

# run the app
USER node
EXPOSE 3000/tcp
CMD [ "node", "server.js" ]
