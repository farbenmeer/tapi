import type { Logger } from "@toapi/common";
import { INVALIDATIONS_ROUTE } from "@toapi/common";
import { cleanup } from "./cleanup";
import { handleToapiRequest } from "./handle-toapi-request";
import { listenForInvalidations } from "./revalidation-stream";

declare const self: ServiceWorkerGlobalScope;

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export interface SetupToapiWorkerOptions {
  /**
   * Base path whose requests are handled by the Toapi cache. Same-origin
   * requests whose pathname starts with this prefix are served from cache /
   * network by {@link handleToapiRequest}; the `${basePath}/__tapi` control
   * endpoints (such as the invalidation stream) are always excluded.
   *
   * @default "/api"
   */
  basePath?: string;
  /**
   * URL of the server's revalidation stream.
   *
   * @default `${basePath}/__tapi/invalidations`
   */
  invalidationsUrl?: string;
  /**
   * Grace period in seconds past a cache entry's `expiresAt` before it is
   * dropped on the next `activate`. See {@link CleanupOptions}.
   *
   * @default 60 * 60 * 24 * 7 // 7 days
   */
  maximumStaleAge?: number;
  /**
   * Optional logger. Its `error` method is used for failed network refetches
   * and for a fatal failure of the invalidation stream. Defaults to
   * `console.error`.
   */
  logger?: Logger;
}

/**
 * Wire up the whole Toapi service worker in a single call. This registers the
 * `activate` and `fetch` listeners and opens the revalidation stream, and is
 * equivalent to calling {@link cleanup}, {@link handleToapiRequest}, and
 * {@link listenForInvalidations} by hand.
 *
 * ```ts
 * // service-worker.ts
 * import { setupToapiWorker } from "@toapi/worker";
 *
 * declare const self: ServiceWorkerGlobalScope;
 *
 * setupToapiWorker();
 * ```
 *
 * The `fetch` listener only responds to same-origin requests under `basePath`,
 * so it composes with other `fetch` listeners (for example
 * `vite-plugin-pwa`'s precaching) — requests it doesn't handle fall through to
 * them.
 */
export function setupToapiWorker({
  basePath = "/api",
  invalidationsUrl = `${basePath}${INVALIDATIONS_ROUTE}`,
  maximumStaleAge = ONE_WEEK_SECONDS,
  logger,
}: SetupToapiWorkerOptions = {}) {
  const controlPrefix = `${basePath}/__tapi`;
  const errorLog =
    logger?.error ??
    ((err: unknown) =>
      console.error("Toapi Worker: invalidation stream failed", err));

  self.addEventListener("activate", (event) => {
    event.waitUntil(cleanup({ maximumStaleAge }));
  });

  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    // only handle same-origin API requests, and never the control endpoints
    if (url.origin !== self.location.origin) return;
    if (
      url.pathname.startsWith(basePath) &&
      !url.pathname.startsWith(controlPrefix)
    ) {
      event.respondWith(handleToapiRequest(event.request, { logger }));
    }
  });

  listenForInvalidations({ url: invalidationsUrl }).catch(errorLog);
}
