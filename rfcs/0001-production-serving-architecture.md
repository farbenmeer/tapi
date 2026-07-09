# RFC 0001 — Production Serving Architecture for tapi Full-Stack Apps

- **Status:** Draft / Recommendation
- **Author:** Roman Ernst
- **Date:** 2026-07-09
- **Scope:** How a full-stack app built with `@farbenmeer/vite-plugin-tapi` should
  serve its built client (`dist/client`) and its `/api` fetch handler
  (`dist/server.js`) in production.
- **Non-goal:** Changing the tapi request handler, the client, or the worker.
  This RFC is about the static-serving + ingress layer only. It proposes a
  direction and a Definition of Done; it does **not** merge code.

---

## TL;DR / Recommendation

**Keep a dedicated static server / reverse proxy (Caddy) in front of `srvx` as
the *default, blessed* production pattern (Option B), and offer the
single-`srvx`-process mode (Option A) as a first-class, opt-in alternative for
edge-less / single-container deployments — but do not make it the default.**

Rationale in one paragraph: `srvx` is not replaceable — it is the only component
that can execute the JavaScript fetch handler, so the decision is strictly about
who serves the *static* client and who terminates *ingress*. On that narrow
question, Caddy's `file_server` is correct-by-default (ETag/Last-Modified/304,
precise `Cache-Control`, opt-in compression) while `srvx`'s `serveStatic` is
correct on *none* of those axes today and exposes no knobs to fix it. Behind the
PaaS edge (Traefik) that already does TLS, HTTP/3, compression and security
headers, an unmodified single-`srvx` process would additionally
**double-compress** with no way to turn it off. That disqualifies single-`srvx`
as the *fleet default* right now. It remains genuinely useful for
"one container, no second webserver, no compressing edge" deployments, so we
should ship it as a supported opt-in once its three gaps are closed to the
Definition of Done in §8.

This is a "both, with a clear default" outcome, and it matches what the
maintainer already asked for on PR #266: *"a minimal deployment option that
serves both api and assets **and** a prod option that splits it."*

---

## 1. Background: the current state

### 1.1 What the plugin emits

`vite build` with `@farbenmeer/vite-plugin-tapi` produces two deliberately
separated trees (`packages/3-vite-plugin-tapi/src/index.ts`):

```
dist/
├── client/        — static frontend (index.html, /assets/*-<hash>.js|css, images)
├── server.js      — bundled srvx fetch handler (API only), + sourcemap
└── server.js.map
```

- The client build's `outDir` is redirected to `<outDir>/client` in the `config`
  hook, and the server bundle is written to `<outDir>` by `closeBundle`. The
  server bundle is a **sibling of**, never **inside**, the static root.
- **Security invariant (documented):** the server bundle carries DB credentials,
  API keys and server-only libraries and **must never be deployed to a public
  static host**. Treating `dist/client/` as the static root makes it impossible
  to leak `server.js` by accident. Any single-process variant has to preserve
  this by scoping static serving strictly to `dist/client`.

### 1.2 The handler is `/api`-only by design

`createRequestHandler` (`packages/1-tapi/src/server/create-request-handler.ts`)
matches routes under `basePath` (plugin default `/api`) and returns a plain
`404 Not Found` for everything else (final line of the handler). It intentionally
does not know about static files or client routes — serving the client is not
tapi's job today.

### 1.3 The reference deployment already ships **Option B**

`examples/vite-plugin-tapi-demo` (merged via **PR #349**, 2026-06-14) is a
production container image that runs **`srvx` (Node) for `/api` behind Caddy**:

- `docker-entrypoint.sh`: starts `srvx serve --prod --host 127.0.0.1 --port
  ${API_PORT:-3000} /srv/server.js &` on an internal port, then `exec caddy run`
  as PID 1 (so Caddy receives stop signals; the srvx child dies with the
  container).
- `Caddyfile`: `:80`, `root * /srv/client`, `handle /api/*` →
  `reverse_proxy 127.0.0.1:{$API_PORT:3000}`, everything else →
  `try_files {path} /index.html; file_server` (SPA history fallback).
- `e2e/docker.spec.ts` verifies: static page, proxied API JSON, static asset
  content-type, and the `index.html` fallback for unknown routes.

This is exactly the "partitur" pattern (below), and it is the pattern currently
blessed in the repo.

### 1.4 The reference app "partitur" (PaaS)

- **Container:** `srvx` serves `dist/server.js` (`/api`) on an internal port;
  **Caddy** serves `dist/client` (SPA, `try_files … /index.html`) and
  reverse-proxies `/api` → `srvx`, on the one ingress port.
- **Edge (PaaS / Traefik):** already terminates TLS, does HTTP/3, negotiates
  compression per `Accept-Encoding` (gzip/brotli/zstd), and sets security headers
  (HSTS, `nosniff`). So the app's own layers must **not** duplicate TLS,
  compression, or those security headers.

### 1.5 What the docs currently say

`packages/3-vite-plugin-tapi/README.md` and
`website/…/vite-plugin-tapi/guides/deployment.md` recommend a **dedicated static
host — nginx, Caddy, or S3** for `dist/client`, and mention
`srvx --prod -s client dist/server.js` as a "if you don't need a separate static
host" fallback. Note the demo's `start` npm script uses exactly that
single-process fallback — which, as §5 shows, has **no SPA fallback**, so
`pnpm start` 404s on a deep-link/reload. The container image (Caddy) does not
have that problem.

---

## 2. Prior art in this repo — this has been decided twice

This is the most important context for the RFC, and it should be represented
honestly: **serving the client from the built server (Option A) has been
proposed twice and set aside both times; the split (Option B) is what has landed.**

| PR | What | Author | Outcome |
|----|------|--------|---------|
| #264 | Emit client **and** server bundles (Vite environments API) | pex (Roman) | **merged** |
| #269 | Auto-load `.env` into `process.env` in dev | pex | **merged** |
| #266 | *serve SPA from the built server* (Option A, v1) | pex | **closed, unmerged** |
| #267 | Extract prod runtime into a real module | pex | closed |
| #346 / #347 | *production server serves client build with SPA fallback* (Option A, v2, adds a `static` option) | mismosmi (Michel) | **closed, unmerged** (2026-06-14) |
| #349 | Dockerfile: **api via srvx behind Caddy** (Option B reference) | mismosmi | **merged** (2026-06-14, same day) |

Key quotes from the #266 discussion (the maintainer, `mismosmi`):

> "I think serving static assets with a real file server (nginx i guess) is the
> way to go. We should stay flexible about this I guess, would be nice to have a
> minimal deployment option that serves both api and assets **and** a prod
> option that splits it."

> "the preferred prod deployment from my point of view would be a container with
> nginx serving the static files and proxying api routes to a node process that
> runs an api only build."

> "it would actually be sufficiently easy to make all of this possible with a
> create-tapi-app that selects from some examples."

And the requesting author (`pex`) on his own #266, arguing the split's upsides:

> "Pros vs. this PR: No `fs.readFileSync` per request blocking the Node event
> loop; free range requests, gzip/brotli, cache headers handled by the static
> layer; cleaner separation of concerns; Vite's hashed `/assets/*` filenames
> cache trivially."

Interpretation: the team is **not** opposed to a single-process option — the
maintainer explicitly wants one *alongside* the split. What was rejected was
making single-process serving the *only* / *default* path with a hand-rolled
static server. The polished Option A implementation still exists on branch
**`feat/vite-plugin-tapi-serve-static`** (the `static` option, `serveStatic` +
`index.html` fallback), ready to revive if we choose to.

### 2.1 Fleet is internally split

`@farbenmeer/bunny` — the sibling full-stack framework in this monorepo — already
serves its client **from a single Node process**: `packages/3-bunny/src/server/
create-bunny-app.ts` uses `connect()` + `serve-static` and emits a standalone
`server.cjs` run as `node server.cjs`. So within the same company/monorepo,
**bunny = single-process self-served static (Option A philosophy)** while
**vite-plugin-tapi = split (Option B)**. Whatever we recommend should be a
conscious choice about this divergence, not an accident.

---

## 3. The real constraint: `srvx` is required; Caddy cannot replace it

`srvx` is a JavaScript runtime server: it loads and executes `dist/server.js`,
which *is* the tapi fetch handler. Caddy is a Go binary and **cannot execute a
JS fetch handler**. Therefore:

- **"Replace `srvx` with Caddy" is off the table.** Something must run the JS
  handler; that something is `srvx` (or Node/Bun/Deno directly, or a Workers
  runtime — but not Caddy).
- The decision is **only** about the *static + ingress* layer:
  1. Who serves `dist/client` (Caddy `file_server`, `srvx` `serveStatic`, a CDN,
     or the PaaS platform)?
  2. Does the app run a *second webserver* (Caddy) at all, or fold static into
     the one `srvx` process?

Everything below is about (1) and (2).

---

## 4. Division of labor (target)

For the PaaS fleet the layers should be:

| Concern | Owner (PaaS fleet) |
|---|---|
| TLS termination, HTTP/3 | **Edge** (Traefik) |
| Compression (gzip/brotli/zstd per `Accept-Encoding`) | **Edge** |
| Security headers (HSTS, `nosniff`) | **Edge** |
| Static file correctness (ETag/Last-Modified/304, `Cache-Control`, SPA fallback) | **Caddy** (default) or the app layer (opt-in single-srvx) |
| Reverse proxy `/api` → JS handler | **Caddy** (default) |
| `/api` fetch handler execution | **`srvx`** (always) |

The single most consequential row is **"static file correctness"** — that is
where the options genuinely differ, and where `srvx` is weak today (§5).

---

## 5. `srvx` `serveStatic` gap analysis (source-verified, v0.11.21)

Verified directly against `srvx` source at tag `v0.11.21` (the version pinned in
`pnpm-lock.yaml`): `src/static.ts`, `src/cli/serve.ts`. `serveStatic` accepts
only `{ dir, methods?, renderHTML? }`. Behavior:

1. **No SPA / history fallback.** On a miss it returns `next()` (fallthrough),
   never `index.html`. It only tries `path`, `path.html`, `path/index.html`.
   Deep client routes (`/engagements/42`) 404 on reload/deep-link unless a real
   file exists. *(This is exactly why PRs #266 and #346 existed.)*
2. **No `Cache-Control`, `ETag`, `Last-Modified`, or `304`.** The only response
   headers are `Content-Type`, `Content-Length`, and — when it compresses —
   `Content-Encoding` + `Vary`. `mtime` is never read; conditional-request
   headers are never parsed. So Vite's content-hashed `/assets/*` get **no**
   `immutable`/long-cache, `index.html` gets **no** `no-cache`, and there is no
   revalidation (no 304). This is a real regression versus Caddy's `file_server`.
   The edge **cannot** compensate: it does not know which files are content-hashed
   and which are not.
3. **Unconditional on-the-fly compression, no opt-out.** If the client advertises
   br/gzip, `serveStatic` compresses the stream via `node:zlib` on **every**
   request (no precompressed `.br`/`.gz` siblings, no caching of compressed
   output, no option to disable). Behind a compressing edge this
   **double-compresses** (CPU waste; and re-compresses on every hit).
4. **Requires `node:fs` (+ `node:zlib`).** Not usable on Workers/edge runtimes —
   a single-`srvx` static deployment implies a Node/Bun/Deno filesystem runtime.

CLI notes: `srvx --prod -s client dist/server.js` and `srvx serve --entry …`
both call the *same* `serveStatic` with only `{ dir }`, so they inherit every gap
above. Also, the CLI **auto-activates** static serving if a `public/` directory
happens to sit next to the entry (footgun), and its static middleware runs
*before* the app handler.

**Upstream status.** The generic parts of these gaps ideally belong in `srvx`.
But `h3js/srvx` issue **#156 "Caching for static assets"** (requesting exactly
`Cache-Control: …, immutable` + optional ETag) was **closed without
implementation**, and there is **no** open issue/PR for SPA fallback or a
compression opt-out. So upstream cannot be relied on in the near term; anything
we need soon has to live in tapi.

---

## 6. Options

### Option A — Single `srvx` process serves static + `/api`

One process, one image, no second binary. `dist/server.js` composes
`createRequestHandler` (under `basePath`) + `serveStatic({ dir: dist/client })` +
an `index.html` SPA fallback. This is the `feat/vite-plugin-tapi-serve-static`
branch / PR #346.

- **+** Fewest moving parts; one container, one port, no Caddy binary/config.
- **+** Matches bunny; matches "Dokploy single-container / no nginx sidecar".
- **+** SPA fallback solvable in the plugin (already done on the branch).
- **−** Static correctness is `srvx`'s weak spot: **no** asset `immutable`/ETag/304
  out of the box (gap #2 must be re-implemented in the plugin).
- **−** **Double-compression behind the edge**, with no opt-out (gap #3). This is
  the blocker for the current PaaS.
- **−** `fs` reads on the JS event loop for every static hit (mitigated by a CDN
  in front, but there is no CDN in front on the current PaaS).
- **−** Static correctness becomes *tapi's* maintenance burden.

### Option B — Dedicated static server / reverse proxy (Caddy) in front of `srvx`

The merged reference pattern. Caddy serves `dist/client` with `try_files … /
index.html`, reverse-proxies `/api` → internal `srvx`. tapi ships a reference
`Caddyfile` (it already does, in the demo).

- **+** `file_server` gets ETag/Last-Modified/304 for free; `Cache-Control` is a
  one-line directive per path; correct-by-default and battle-tested.
- **+** Compression is opt-in (`encode …`) — behind a compressing edge you simply
  **omit** it, so no double-compression.
- **+** SPA fallback is a native one-liner (`try_files`).
- **+** Clean separation: tapi stays narrowly about `/api`; static correctness is
  owned by a real file server the org already understands.
- **+** Already merged, tested (docker e2e), and matches the fleet edge.
- **−** Two processes in one container (Caddy + srvx) → an entrypoint /
  supervision concern and one extra binary/layer (~40 MB Caddy).
- **−** A second config file (`Caddyfile`) to keep correct across the fleet.

### Option C — External static host / CDN or PaaS-native static (srvx = `/api` only)

Serve `dist/client` from something that is *not* a webserver you operate: an
S3/object-store + CDN, **or** the PaaS platform's own static service / the edge
itself. `srvx` runs the API-only bundle (`static: false`); the two are joined by
path routing at the edge (`/api/*` → srvx service, else → static). This is the
README's "dedicated static host" advice and Roman's original Dokploy
"two deployments" idea.

- **+** Best possible caching, HTTP/3, global distribution (CDN); zero static load
  on Node.
- **+** No second webserver *inside* the container.
- **−** Two deploy targets / artifacts; the client build must be published
  separately.
- **−** SPA fallback and cache policy move to the CDN/platform config (varies per
  provider); more places for "static correctness" to drift.
- **−** Overkill for the internal PaaS fleet unless an app is high-traffic/public.

### Trade-off matrix

| Axis | A: single srvx | B: Caddy → srvx | C: CDN/PaaS static → srvx |
|---|---|---|---|
| SPA deep-link/reload | plugin fallback (branch) | `try_files` (native) | CDN/platform rewrite |
| Hashed-asset `immutable` + `no-cache` html | **must build in plugin** | one-liner, correct | CDN/platform config |
| ETag / 304 revalidation | **none** unless added | **automatic** | CDN, automatic |
| Compression behind edge | **double-compress, no opt-out** | omit `encode` → clean | edge/CDN only, clean |
| Moving parts (container) | **1 process** | 2 processes | 1 process + external host |
| Image size / layers | **smallest** | +Caddy (~40 MB) | smallest |
| Who owns static correctness | tapi/app | Caddy (proven) | CDN/platform |
| Security boundary (server bundle) | scope `serveStatic`→`dist/client` | client root only | client root only |
| Fits current PaaS edge | **poorly** (double-compress) | **well** | well (if platform static exists) |
| Fleet ops burden | tapi maintains static code | one shared `Caddyfile` | per-provider config |
| Workers/edge-runtime API | **no** (`node:fs`) | n/a | n/a |

---

## 7. Recommendation

**Default (blessed) pattern: Option B — Caddy in front of `srvx`.** Promote the
reference `Caddyfile` from a buried example into a first-class, documented,
opinionated artifact (see §10), and make it the recommended production topology
for full-stack tapi apps on the PaaS.

**Supported opt-in: Option A — single `srvx` with `static: true`** — for
single-container / edge-less deployments (quick demos, Dokploy-style, apps with
no compressing edge, or teams that would rather not operate Caddy). Revive PR
#346 behind the existing `static` option (default **stays `false`** for the
fleet's sake — i.e. keep API-only as the plugin default so nobody double-compresses
by accident), and only advertise it as production-grade once the §8 Definition of
Done is met. Document the compression caveat prominently.

**Option C** is the right answer for a specific class of apps (high-traffic /
public, or where the platform already has a first-class static service), but is
not the fleet default.

Why B over A as the default, stated as an honest technical judgment rather than
deference to precedent:

1. **Correct-by-default wins for a fleet default.** Caddy's `file_server` gets
   ETag/Last-Modified/304 and `Cache-Control` right with near-zero config;
   `srvx`'s `serveStatic` gets none of it and has no knobs. For something every
   app in the fleet runs, pick the component that is correct without per-app care.
2. **The compression asymmetry is decisive on *this* edge.** Caddy lets you *not*
   compress (edge does it); `srvx` *forces* compression with no opt-out. Behind
   Traefik, single-`srvx` double-compresses every request. That alone rules out
   unmodified single-`srvx` as the default here.
3. **Separation of concerns.** Keeping static correctness in Caddy lets tapi stay
   narrowly about `/api`, which is what the maintainer wanted and what keeps the
   plugin's surface small.

Why still ship A at all: it is legitimately the right tool when there is **one
container, no compressing edge, and a preference for zero extra binaries** — and
the maintainer explicitly asked for that minimal option. Shipping it (opt-in,
gaps closed) serves those cases and unifies philosophy with bunny for teams that
want it.

---

## 8. Definition of Done for single-`srvx` (Option A), and where each piece lives

If/when Option A is shipped as production-grade, all three must hold. "Where it
lives" prefers the most generic correct home, falling back to tapi when upstream
is unavailable.

1. **SPA catch-all fallback to `index.html`** for unmatched `GET`/`HEAD`
   navigations.
   - **Lives in: `vite-plugin-tapi` (generated `dist/server.js`).** SPA fallback
     is app policy, not a generic static concern, so it should not go upstream.
     **Already implemented** on `feat/vite-plugin-tapi-serve-static` (composes
     `serveStatic` + `index.html` fallback, `GET`/`HEAD` only).

2. **`Cache-Control` + `ETag` for content-hashed assets, `no-cache` for
   `index.html`.**
   - **Generic part (ETag/Last-Modified/304) → push upstream to `srvx`** (revive
     issue #156). All `srvx` static users benefit.
   - **Vite-layout-aware policy → `vite-plugin-tapi`.** The plugin is the *only*
     layer that knows Vite emits content-hashed files under `/assets/*`
     (→ `Cache-Control: public, max-age=31536000, immutable`) versus non-hashed
     entry files like `index.html` (→ `Cache-Control: no-cache`). The generated
     server can decorate `serveStatic`'s returned `Response` with these headers,
     keyed on `pathname`. **Gap on the branch:** PR #346 sets `no-cache` on the
     HTML shell only; it does **not** add `immutable`/ETag on `/assets/*`. That
     is the remaining work item for DoD #2.

3. **Compression opt-out when behind a compressing edge.**
   - **Lives upstream in `srvx`** (a `compress: false` option, or "respect a
     `no-transform`/pre-set `Content-Encoding`"). There is no way to do this in
     tapi without forking `serveStatic`.
   - **Until upstream lands:** single-`srvx` behind a compressing edge is **not
     recommended**; document the caveat (use it only where nothing else
     compresses, or where the per-request CPU cost is acceptable). This is the one
     gap tapi cannot close alone, and the main reason A is opt-in, not default.

**Security invariant (all variants):** `serveStatic` must be scoped strictly to
`dist/client` (`new URL("./client", import.meta.url)`), never `dist/`, so
`server.js`/`server.js.map` can never be served as files. The branch does this;
add an explicit e2e assertion that `GET /server.js` 404s.

---

## 9. Explicit verdict on "srvx vs Caddy"

- **Stays `srvx` (never Caddy):** executing the JS fetch handler (`/api`). Caddy
  cannot run JS. This is non-negotiable and is why "replace srvx with Caddy" is
  not a real option.
- **Can be Caddy (and should be, by default on the PaaS):** static file serving
  with correct caching + SPA fallback, and reverse-proxying `/api` to `srvx`.
- **Owned by the edge on the PaaS (neither srvx nor Caddy should duplicate):** TLS,
  HTTP/3, compression, HSTS/`nosniff`.
- **Net:** run **two components** — `srvx` for `/api`, Caddy for static+proxy —
  as the default; collapse to **one** (`srvx` with `static: true`) only as an
  opt-in for edge-less/single-container cases per §7–§8.

---

## 10. Migration sketch

### 10.1 partitur (already Option B — this is alignment, not a rewrite)

partitur already runs srvx-internal + Caddy-ingress behind a Traefik edge, so the
work is de-duplication and correctness, not re-architecture:

1. **Adopt the reference `Caddyfile` shape** (clean `/api/*` split + `try_files`
   fallback + `file_server`).
2. **Remove compression from Caddy.** The demo `Caddyfile` has `encode gzip`;
   behind a compressing edge (Traefik does gzip/brotli/zstd) this is redundant.
   **Exactly one layer compresses** — the edge. Drop `encode` from Caddy.
3. **Add explicit cache headers in Caddy** so revalidation + long-cache are right:
   - `/assets/*` (content-hashed) → `Cache-Control: public, max-age=31536000,
     immutable`.
   - `index.html` / the SPA shell → `Cache-Control: no-cache`.
   - `file_server` already emits `ETag`/`Last-Modified` and answers `304`.
4. **Do not set HSTS/`nosniff` in Caddy** — the edge owns them; duplicating risks
   conflicting values.
5. **Keep srvx on an internal interface** (`--host 127.0.0.1`), never exposed
   directly; only Caddy binds the ingress port.

Reference `Caddyfile` (edge-fronted variant — no TLS, no compression, explicit
cache policy):

```caddyfile
# Behind a TLS+compressing edge (e.g. Traefik). Caddy owns static correctness
# and reverse-proxying /api to the internal srvx process. It does NOT terminate
# TLS, compress, or set security headers — the edge already does all three.
:80 {
	root * /srv/client

	# JS fetch handler (tapi /api) runs on an internal srvx process.
	handle /api/* {
		reverse_proxy 127.0.0.1:{$API_PORT:3000}
	}

	# Content-hashed assets are immutable and safe to cache forever.
	@assets path /assets/*
	header @assets Cache-Control "public, max-age=31536000, immutable"

	# The SPA shell must always revalidate so new asset hashes are picked up.
	@html path / /index.html
	header @html Cache-Control "no-cache"

	# Static file, or SPA history fallback. file_server sets ETag/Last-Modified
	# and answers conditional requests (304) automatically.
	handle {
		try_files {path} /index.html
		file_server
	}
}
```

(If an app is *not* behind a compressing edge, add `encode zstd br gzip` and,
if Caddy terminates TLS, the usual `tls`/security-header blocks.)

### 10.2 An app that wants to drop Caddy (opt into Option A)

Only where the edge is **not** compressing (or the double-compress cost is
accepted) and after DoD #2 lands:

1. `tapi({ static: true })` → `dist/server.js` serves `dist/client` + SPA
   fallback.
2. Deploy one container: `srvx serve --prod --port $PORT /app/dist/server.js`
   (Node/Bun/Deno runtime; `node:fs` required).
3. Drop the Caddy binary, `Caddyfile`, and the two-process entrypoint.
4. Confirm deep-link/reload works (plugin SPA fallback) and that `GET /server.js`
   404s (security invariant).

---

## 11. Follow-ups / open questions

- **Revive or close** `feat/vite-plugin-tapi-serve-static` (PR #346) explicitly,
  now with a decision on record: keep it as the opt-in path, `static: false`
  default, plus DoD #2 (asset `immutable`/ETag).
- **Upstream `srvx`:** re-open/track issue #156 (cache headers) and file a new
  issue for a compression opt-out. These are generic and shouldn't be forked into
  tapi if avoidable.
- **`create-tapi-app` / examples:** the maintainer's suggested delivery vehicle —
  ship both a "Caddy + srvx" example (exists) and a "single srvx" example so the
  choice is a scaffold selection, not hand-wiring.
- **Fleet consistency with bunny:** decide whether the single-srvx option should
  converge tapi apps toward bunny's self-serving model for teams that prefer one
  process, or whether the split stays the house default for both eventually.
- **Reference `Caddyfile` correctness:** fold the cache-header + no-double-compress
  improvements from §10.1 back into `examples/vite-plugin-tapi-demo/Caddyfile`
  and the deployment docs (the current one has `encode gzip` and no cache
  directives).

---

## Appendix: sources

- Repo: `packages/3-vite-plugin-tapi/src/index.ts`,
  `packages/1-tapi/src/server/create-request-handler.ts`,
  `examples/vite-plugin-tapi-demo/{Dockerfile,Caddyfile,docker-entrypoint.sh,e2e/docker.spec.ts}`,
  `packages/3-bunny/src/server/create-bunny-app.ts`,
  `packages/3-vite-plugin-tapi/README.md`,
  `website/src/content/docs/vite-plugin-tapi/guides/deployment.md`.
- PRs: #264 (merged), #266 (closed), #267 (closed), #269 (merged),
  #346/#347 (closed), #349 (merged).
- `srvx` v0.11.21 source: `src/static.ts`, `src/cli/serve.ts`, `src/cli/main.ts`
  (verified via raw source at tag `v0.11.21`).
- `srvx` upstream issue #156 "Caching for static assets" (closed, unimplemented);
  no open issue/PR for SPA fallback or a compression opt-out.
