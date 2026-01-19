export function generateServer(
  apiPath: string,
  apiInfo: { title: string; version: string }
) {
  return `
const { createBunnyApp } = require("@farbenmeer/bunny/server")

createBunnyApp({
  api: () => import("${apiPath}"),
  dist: __dirname + "/dist",
  apiInfo: {
    title: "${apiInfo.title}",
    version: "${apiInfo.version}",
  }
}).listen(3000);
`;
}
