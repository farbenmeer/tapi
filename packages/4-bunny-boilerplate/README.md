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

The `instructions/` folder contains markdown guides for adding popular tools and features to your project:

- **Tailwind CSS**: Step-by-step instructions for setting up Tailwind for styling
- **Better Auth**: Integration guide for adding authentication to your application
- And more...

These instruction files provide detailed setup steps and best practices for integrating additional functionality into your Bunny project. The easiest way to add tools is to tell your AI Agent of choice to follow one of the instruction files.

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
