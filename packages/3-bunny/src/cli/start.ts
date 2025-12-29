import { Command } from "commander";
import path from "node:path";
import { startBunnyServer } from "../server";

export const start = new Command()
  .name("start")
  .description("Bunny Production server")
  .option("--port <number>", "Port number", "3000")
  .action((options) => {
    const bunnyDir = path.join(process.cwd(), ".bunny", "prod");
    process.env.NODE_ENV = "production";
    const { api } = require(path.join(bunnyDir, "api.js"));

    startBunnyServer({
      api,
      port: parseInt(options.port, 10),
      dist: path.join(bunnyDir, "dist"),
    });
  });
