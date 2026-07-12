import { test, expect } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// End-to-end test of the production container image, which serves the tapi API
// with the srvx CLI behind Caddy (reverse proxy + static files with an
// index.html not-found fallback). Works with either Docker or Podman, and is
// skipped when neither container runtime is available.

const HOST_PORT = 3211;
const IMAGE = "tapi-demo-e2e:test";
const CONTAINER = "tapi-demo-e2e";

// Build context is the monorepo root; the Dockerfile lives in this example.
const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../../../..");
// Overridable so sandboxes behind a TLS-intercepting proxy can point at a
// Dockerfile variant that injects a CA. Defaults to the committed Dockerfile.
const dockerfile =
  process.env.DEMO_DOCKERFILE ?? "examples/vite-plugin-tapi-demo/Dockerfile";

// Use Docker if present, otherwise Podman (their CLIs are compatible here).
function detectRuntime(): string | undefined {
  for (const runtime of ["docker", "podman"]) {
    if (spawnSync(runtime, ["info"], { stdio: "ignore" }).status === 0) {
      return runtime;
    }
  }
  return undefined;
}

async function waitForReady(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${url}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

const runtime = detectRuntime();

test.describe("container image (caddy + srvx)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    test.skip(!runtime, "no container runtime (docker/podman) available");
    const cli = runtime as string;
    // Building the image can take a while on a cold cache.
    test.setTimeout(600_000);

    execFileSync(cli, ["build", "-f", dockerfile, "-t", IMAGE, "."], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    spawnSync(cli, ["rm", "-f", CONTAINER], { stdio: "ignore" });
    execFileSync(
      cli,
      [
        "run",
        "-d",
        "--name",
        CONTAINER,
        "-p",
        `${HOST_PORT}:80`,
        "-e",
        "FOO=fromShell",
        IMAGE,
      ],
      { stdio: "inherit" },
    );
    // Poll the API (not just the static root) so we wait for srvx to boot too.
    await waitForReady(`http://localhost:${HOST_PORT}/api/greet?name=ready`);
  });

  test.afterAll(() => {
    if (runtime) {
      spawnSync(runtime, ["rm", "-f", CONTAINER], { stdio: "ignore" });
    }
  });

  test("caddy serves the static page", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "vite-plugin-tapi demo" }),
    ).toBeVisible();
  });

  test("greets via the api proxied through caddy", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Name:").fill("docker");
    await page.getByRole("button", { name: "Greet" }).click();
    await expect(page.getByTestId("output")).toHaveText("hello, docker");
  });

  test("api returns json through the reverse proxy", async ({ request }) => {
    const res = await request.get("/api/greet?name=api");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ greeting: "hello, api" });
  });

  test("static assets are served by caddy", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const asset = html.match(/\/assets\/[^"]+\.js/)?.[0];
    expect(asset).toBeTruthy();
    const res = await request.get(asset as string);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("javascript");
  });

  test("unknown routes fall back to index.html", async ({ request }) => {
    const res = await request.get("/this/does/not/exist");
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("vite-plugin-tapi demo");
  });

  test("content-hashed assets get an immutable long-cache header", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    const asset = html.match(/\/assets\/[^"]+\.js/)?.[0];
    expect(asset).toBeTruthy();
    const res = await request.get(asset as string);
    expect(res.headers()["cache-control"]).toContain("immutable");
  });

  test("the SPA shell is served with no-cache", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["cache-control"]).toContain("no-cache");
  });
});
