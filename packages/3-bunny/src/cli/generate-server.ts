export function generateServer() {
  return `
import { createBunnyApp } from "@farbenmeer/bunny/server"

createBunnyApp({
  api: () => import("./api.cjs"),
  dist: import.meta.dirname + "/dist",
}).listen(3000);
`;
}
