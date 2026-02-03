---
title: startBunnyClient
---

`startBunnyClient` is the client-side entry point. It mounts your React app to the DOM, wraps it in `StrictMode` and `Suspense`, and registers the service worker in production.

```ts
import { startBunnyClient } from "@farbenmeer/bunny/client";
```

## Signature

```ts
function startBunnyClient(app: ReactNode): void
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `app` | `ReactNode` | Your root React component. |

## Usage

```tsx
import { startBunnyClient } from "@farbenmeer/bunny/client";
import { App } from "app/app";

startBunnyClient(<App />);
```

## What It Does

1. Finds or creates a `<div id="__bunny">` mount element.
2. Wraps your app in `<StrictMode>` and `<Suspense>`.
3. Renders with `createRoot`.
4. In development, preserves the React root across Vite hot module reloads.
5. In production, registers the service worker at `/sw.js`.

## Client Exports

The `@farbenmeer/bunny/client` entry re-exports everything from:

- `@farbenmeer/react-tapi` — React hooks for TApi (`useLacy`, etc.).
- `@farbenmeer/tapi/client` — `createFetchClient` and other client utilities.

This means you can import all client-side TApi utilities from a single package:

```ts
import { createFetchClient, useLacy } from "@farbenmeer/bunny/client";
```
