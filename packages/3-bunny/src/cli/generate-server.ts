export function generateServer() {
  return `
import api from "./api.cjs"
import { startBunnyServer } from "@farbenmeer/bunny/server"

startBunnyServer({
  port: 3000,
  api,
  dist: __dirname + "/dist",
});
`;
}
