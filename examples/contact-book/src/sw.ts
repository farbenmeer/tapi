/**
 * Service worker for the contact book. `setupToapiWorker` serves every request
 * under `/api` from the Toapi cache and keeps that cache in sync with the
 * server's tag invalidation stream.
 */

/// <reference lib="webworker" />

import { setupToapiWorker } from "@toapi/worker";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

setupToapiWorker();
