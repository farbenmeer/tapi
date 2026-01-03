export function generateServer() {
  return `
import { startBunnyServer } from "@farbenmeer/bunny/server"

startBunnyServer({
  port: 3000,
  api: () => import("./api.cjs"),
  dist: import.meta.dirname + "/dist",
});
`;
}
