import { Command } from "commander";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createBunnyApp } from "../server.js";
import { readConfig } from "./read-config.js";
import { loadEnv } from "../load-env.js";

export const start = new Command()
  .name("start")
  .description("Bunny Production server")
  .option("--port <number>", "Port number", process.env.PORT ?? "3000")
  .action(async (options) => {
    const bunnyDir = path.join(process.cwd(), ".bunny", "prod");
    const packageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "package.json"), "utf-8"),
    );

    process.env.NODE_ENV = "production";
    loadEnv("production");
    const config = await readConfig();

    const buildId = await readFile(path.join(bunnyDir, "buildId.txt"), "utf-8");

    console.info(`Starting Bunny Production Server\nBuild ${buildId}`);

    createBunnyApp({
      api: () => import(path.join(bunnyDir, "api.cjs")),
      dist: path.join(bunnyDir, "dist"),
      apiInfo: {
        title: packageJson.name,
        version: packageJson.version,
        buildId,
      },
      serverConfig: config.server,
    }).listen(parseInt(options.port ?? process.env.PORT ?? "3000", 10));
  });
