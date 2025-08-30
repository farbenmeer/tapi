import { Command } from "commander";
import path from "node:path";

export const start = new Command()
  .name("start")
  .description("Bunny Production server")
  .action(async () => {
    const distDir = path.join(process.cwd(), ".bunny", "dist");
    process.env.NODE_ENV = "production";
    process.chdir(distDir);
    await import(path.join(distDir, "server.js"));
  });
