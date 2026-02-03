---
title: Bunny
description: A minimalistic React framework built on TApi.
---

Bunny is a web framework that pairs a React SPA frontend (bundled with Vite) with a type-safe REST API backend (powered by TApi). It includes a service worker for offline support and caching, a CLI for scaffolding, development, building, and production serving, and full TypeScript type safety between client and server.

There is no server-side rendering, no server components, no custom compiler, and no filesystem routing. Just React, REST, and TypeScript.

## Features

- **React SPA** with Vite for fast development and optimized production builds.
- **TApi integration** for type-safe API routes with `defineApi` and `defineHandler`.
- **Service worker** for offline support, static file caching, and tag-based cache invalidation.
- **CLI** with commands for scaffolding, development, building, and production serving.
- **OpenAPI schema** auto-generated and served at `/.well-known/openapi.json`.
- **Standalone builds** that bundle all dependencies into a single file for easy deployment.

## Quick Start

```bash
npx @farbenmeer/bunny init my-app
cd my-app
npm run dev
```

This scaffolds a new project, installs dependencies, and starts a development server on port 3000.

## How It Works

A Bunny project has two entry points:

**`src/api.ts`** defines your API routes using TApi:

```ts
import { defineApi } from "@farbenmeer/bunny/server";

export const api = defineApi().route("/hello", import("./api/hello"));
```

**`src/index.tsx`** renders your React app:

```ts
import { startBunnyClient } from "@farbenmeer/bunny/client";
import { App } from "app/app";

startBunnyClient(<App />);
```

The client can call the API with full type safety:

```ts
import { createFetchClient } from "@farbenmeer/bunny/client";
import type { api } from "./api";

export const client = createFetchClient<typeof api.routes>("/api");
```

```tsx
import { useQuery } from "@farbenmeer/bunny/client";
import { client } from "client";

export function App() {
  const hello = useQuery(client.hello.get());
  return <div>{hello.message}</div>;
}
```
