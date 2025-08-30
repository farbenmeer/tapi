import * as path from "node:path";

export async function generateServer() {
  const serverFile = path.join(process.cwd(), ".bunny", "server.ts");

  await Bun.write(
    serverFile,
    `
import { serve } from "bun";
import { createRequestHandler } from "@farbenmeer/bunny";
import { api } from "api";
import client from "index.html";

const tapiHandler = createRequestHandler(api, { basePath: "/api" });


const server = serve({
  routes: {
    "/api/*": (req) => tapiHandler(new Request(req)),
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
