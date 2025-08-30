import * as path from "node:path";

export async function generateServer() {
  const serverFile = path.join(process.cwd(), ".bunny", "server.ts");

  const hasAuth = await Bun.file(
    path.join(process.cwd(), "src", "auth.ts")
  ).exists();
  const hasApi = await Bun.file(
    path.join(process.cwd(), "src", "api.ts")
  ).exists();

  await Bun.write(
    serverFile,
    `
import { serve } from "bun";
${
  hasApi
    ? 'import { api } from "api"; import { createRequestHandler } from "@farbenmeer/bunny";'
    : ""
}
${
  hasAuth
    ? 'import { auth } from "auth"; import { createAuthRoute } from "@farbenmeer/bun-auth";'
    : ""
}
import client from "index.html";

${
  hasApi
    ? 'const tapiHandler = createRequestHandler(api, { basePath: "/api" });'
    : ""
}

const server = serve({
  routes: {
    ${hasAuth ? '"/api/auth/*": createAuthRoute(auth),' : ""}
    ${hasApi ? '"/api/*": (req) => tapiHandler(new Request(req)),' : ""}
    "/*": client,
  },
  port: 3000,
  development: process.env.NODE_ENV === "development" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(\`🚀 Server running at \${server.url}\`);
`
  );

  return serverFile;
}
