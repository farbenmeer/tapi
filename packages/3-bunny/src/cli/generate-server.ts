import type { ServerConfig } from "../config";

export function generateServer(apiPath: string, serverConfig?: ServerConfig) {
  return `
const { createBunnyApp } = require("@farbenmeer/bunny/server")

createBunnyApp({
  api: () => import("${apiPath}"),
  dist: __dirname + "/dist",
  serverConfig: ${JSON.stringify(serverConfig, null, 2)},
}).listen(parseInt(process.env.PORT ?? 3000, 10));
`;
}
