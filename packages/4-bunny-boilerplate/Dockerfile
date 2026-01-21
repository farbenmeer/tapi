FROM node:24-slim AS base
WORKDIR /usr/src/app
RUN corepack enable
ENV NODE_ENV=production

# install dependencies into temp image
FROM base AS builder
COPY . .
RUN {{INSTALL_COMMAND}}
RUN {{BUILD_COMMAND}}

# copy standalone build to final runner image
FROM base AS runner
COPY --from=builder /usr/src/app/.bunny/prod .

# run the app
USER node
EXPOSE 3000/tcp
CMD [ "node", "server.js" ]
