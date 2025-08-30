import { Command } from "commander";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { generateServer } from "./server";
import "./tailwind-plugin";

export const dev = new Command()
  .name("dev")
  .description("Bunny Development server")
  .action(async () => {
    const bunnyDir = path.join(process.cwd(), ".bunny");
    await mkdir(bunnyDir, { recursive: true });
    const serverFile = await generateServer();
    process.env.NODE_ENV = "development";
    await import(serverFile);
  });
