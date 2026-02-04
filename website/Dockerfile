FROM node:24-slim AS builder
WORKDIR /usr/src/app
RUN corepack enable
ENV NODE_ENV=production

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run --filter "@farbenmeer/tapi-website" build

FROM nginx:alpine AS runner
COPY --from=builder /usr/src/app/website/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
