import { test, expect } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// End-to-end test of the production Docker image, which serves the tapi API
// with the srvx CLI behind Caddy (reverse proxy + static files with an
// index.html not-found fallback). Skipped when no Docker runtime is available.

const HOST_PORT = 3211;
const IMAGE = "tapi-demo-e2e:test";
const CONTAINER = "tapi-demo-e2e";

// Build context is the monorepo root; the Dockerfile lives in this example.
const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../../../..");
// Overridable so sandboxes behind a TLS-intercepting proxy can point at a
// Dockerfile variant that injects a CA. Defaults to the committed Dockerfile.
const dockerfile =
  process.env.DEMO_DOCKERFILE ?? "examples/vite-plugin-tapi-demo/Dockerfile";

function dockerAvailable(): boolean {
  return spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
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

const hasDocker = dockerAvailable();

test.describe("docker image (caddy + srvx)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    test.skip(!hasDocker, "docker runtime not available");
    // Building the image can take a while on a cold cache.
    test.setTimeout(600_000);

    execFileSync("docker", ["build", "-f", dockerfile, "-t", IMAGE, "."], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    spawnSync("docker", ["rm", "-f", CONTAINER], { stdio: "ignore" });
    execFileSync(
      "docker",
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
    await waitForReady(`http://localhost:${HOST_PORT}/`);
  });

  test.afterAll(() => {
    spawnSync("docker", ["rm", "-f", CONTAINER], { stdio: "ignore" });
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
    const res = await request.get("/greet?name=api");
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
});
