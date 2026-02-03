export function generateServer(
  apiPath: string,
  apiInfo: { title: string; version: string }
) {
  return `
const { createBunnyApp } = require("@farbenmeer/bunny/server")
const { readFileSync } = require("fs")
const path = require("path")

const buildId = readFileSync(path.resolve(__dirname, "buildId.txt"), "utf-8")

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
