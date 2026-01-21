# Bunny Project

This project was created using `@farbenmeer/bunny init`.

It uses the `@farbenmeer/bunny`-Framework.

Commands:
* `pnpm run dev` starts the dev-server.
* `pnpm run build` creates a production build.
* `pnpm run start` starts the production server (run `bun run build` first).
* `pnpm run build --standalone` creates a production build with a standalone server in the directory `.bunny/prod`.

## Development Server

Start the development server with:

```bash
pnpm run dev
```

The dev server provides a powerful development experience:
- **Client-side**: Uses Vite for fast HMR (Hot Module Replacement) and instant feedback
- **Server-side**: Uses esbuild for rapid server code compilation
- **Hot Reloading**: Automatically reloads both client and server code when changes are detected
- **Fast Refresh**: React components update without losing state

The development server is optimized for quick iteration and provides excellent developer experience with minimal configuration.

## Adding Tools and Features

Instead of reimplementing functionality or providing scaffolding options for every tool, Bunny includes the
`instructions/` folder, which contains markdown guides for adding popular tools and features to your project.

While it is easy enough to follow these instructions manually, they are also designed to be used with AI agents. Just point the AI agent of your choice at one of the markdown files.

The following list has been last updated on 2026-02-01.

The currently recommended set of tools is

### Styling
* [Tailwind CSS](./instructions/tailwind.md) which does not need further introduction

### Database
* [Drizzle ORM](./instructions/drizzle-orm.md) which seems like a sensible choice and fits neatly into the no-magic-just-code approach that makes Bunny so powerful.

### Authentication
* [better-auth](./instructions/better-auth.md) which just seems to be best-in-class right now and easily fits with TApi's approach of building on plain web `Request`/`Response` objects for request handlers.

### Routing
* [@farbenmeer/router](./instructions/farbenmeer-router.md) which is a minimalistic client-side-only react router designed for Bunny.


## Building for Production

Bunny provides two build modes depending on your deployment needs:

### Standard Build

```bash
pnpm run build
```

Creates a production build that runs in the current node/package environment. This mode:
- Outputs optimized client and server bundles
- Requires `node_modules` to be present
- Suitable for traditional Node.js hosting environments
- Start with `pnpm run start` after building
- Supports binary modules

### Standalone Build

```bash
pnpm run build --standalone
```

Creates a completely self-contained production build in the `.bunny/prod` directory. This mode:
- Bundles all dependencies into the output
- No `node_modules` required at runtime
- Perfect for containerized deployments (Docker)
- Includes everything needed to run the application
- Smaller deployment footprint
- Does not currently support external modules

## Deployment

### Docker Deployment

Bunny projects are designed to work seamlessly with Docker. A typical Dockerfile workflow:

1. Uses a multi-stage build to keep the final image small
2. Runs `bunny build --standalone` to create a self-contained build
3. Copies only the `.bunny/prod` directory to the final image

View (and adjust if necessary) the Dockerfile created for you.

Run  `docker build -t my-app .` to build the Docker image.

The standalone build ensures your Docker image only contains what's necessary to run your application, resulting in faster builds and smaller image sizes.
