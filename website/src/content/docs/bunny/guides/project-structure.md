---
title: Project Structure
description: How a Bunny project is organized.
---

A Bunny project follows a simple, flat structure:

```
my-app/
  src/
    index.html        # HTML entry point
    index.tsx         # React entry point
    main.css          # Global styles
    api.ts            # API definition
    client.ts         # Typed fetch client
    app/
      app.tsx         # Root React component
    api/
      hello.ts        # Route handler
  bunny.config.ts     # Optional Bunny/Vite config
  package.json
```

## Key Files

### `src/index.html`

The HTML shell. Must include a `<div id="__bunny"></div>` mount point and a script tag pointing to `index.tsx`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="./main.css" />
    <title>My App</title>
    <script type="module" src="./index.tsx" async></script>
  </head>
  <body>
    <div id="__bunny"></div>
  </body>
</html>
```

### `src/index.tsx`

Calls [`startBunnyClient`](/bunny/reference/start-bunny-client) to mount your React app with StrictMode, Suspense, and service worker registration:

```tsx
import { startBunnyClient } from "@farbenmeer/bunny/client";
import { App } from "app/app";

startBunnyClient(<App />);
```

### `src/api.ts`

Defines your API routes using TApi's `defineApi`. Each route points to a module that exports HTTP method handlers:

```ts
import { defineApi } from "@farbenmeer/bunny/server";

export const api = defineApi()
  .route("/hello", import("./api/hello"))
  .route("/users", import("./api/users"));
```

### `src/client.ts`

Creates a typed fetch client for your API:

```ts
import { createFetchClient } from "@farbenmeer/bunny/client";
import type { api } from "./api";

export const client = createFetchClient<typeof api.routes>("/api");
```

### `src/api/*.ts`

Route handlers export named HTTP methods (`GET`, `POST`, etc.) using `defineHandler`:

```ts
import { defineHandler, TResponse } from "@farbenmeer/bunny/server";

export const GET = defineHandler(
  { authorize: () => true },
  async () => {
    return TResponse.json({ message: "Hello, world!" });
  }
);
```

### `bunny.config.ts`

Optional configuration file. Currently supports extending the Vite config:

```ts
import { defineConfig } from "@farbenmeer/bunny";

export default defineConfig({
  vite: {
    // Custom Vite configuration
  },
});
```

## Build Output

Running `bunny build` produces:

```
.bunny/prod/
  dist/           # Static files (SPA + assets)
    index.html
    sw.js         # Service worker
    assets/       # Hashed JS/CSS chunks
  api.cjs         # Bundled API server
  buildId.txt     # Unique build identifier
```

In standalone mode (`bunny build --standalone`), a `server.cjs` is produced that includes all dependencies.
