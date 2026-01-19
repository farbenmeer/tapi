import { Command } from "commander";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createBunnyApp } from "../server.js";

export const start = new Command()
  .name("start")
  .description("Bunny Production server")
  .option("--port <number>", "Port number", "3000")
  .action(async (options) => {
    const bunnyDir = path.join(process.cwd(), ".bunny", "prod");
    const packageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "package.json"), "utf-8")
    );
    process.env.NODE_ENV = "production";

    createBunnyApp({
      api: () => import(path.join(bunnyDir, "api.cjs")),
      dist: path.join(bunnyDir, "dist"),
      apiInfo: {
        title: packageJson.name,
        version: packageJson.version,
      },
    }).listen(parseInt(options.port, 10));
  });
