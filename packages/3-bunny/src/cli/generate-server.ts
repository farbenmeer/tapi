export function generateServer() {
  return `
import api from "./api.js"
import { startBunnyServer } from "@farbenmeer/bunny/server"

startBunnyServer({
  port: 3000,
  api,
  dist: __dirname + "/dist",
});
`;
}
