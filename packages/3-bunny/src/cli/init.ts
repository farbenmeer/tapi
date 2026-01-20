import { Command } from "commander";
import { exec } from "node:child_process";
import {
  access,
  constants,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import * as tar from "tar";

const $ = promisify(exec);

export const init = new Command()
  .name("init")
  .description("Initialize a new project")
  .argument("[name]", "Name of the project")
  .action(async (name) => {
    console.info("Initializing project...");
    if (name) {
      const dirPath = path.join(process.cwd(), name);
      try {
        if ((await readdir(dirPath, { recursive: true })).length > 0) {
          console.error(`Directory ${name} already exists and contains files.`);
          process.exit(1);
        } else {
          await mkdir(dirPath, { recursive: true });
        }
      } catch {
        await mkdir(dirPath, { recursive: true });
      }
      process.chdir(dirPath);
    } else {
      const pkgPath = path.join(process.cwd(), "package.json");
      try {
        await access(pkgPath, constants.F_OK);
        console.error(`Package.json already exists.`);
        process.exit(1);
      } catch {}
    }
    console.info("Project directory:", process.cwd());

    const boilerplatePath = path.join(
      fileURLToPath(import.meta.url),
      "../../../boilerplate.tar.gz"
    );
    await tar.extract({
      file: boilerplatePath,
      cwd: process.cwd(),
      stripComponents: 1,
    });

    console.info("Extracted:", await readdir(process.cwd()));

    const pm =
      process.env.npm_config_user_agent?.match(/^(pnpm|yarn|npm|bun)/)?.[1] ??
      "npm";

    const packageJson = JSON.parse(
      await readFile(path.join(process.cwd(), "package.json"), "utf8")
    );

    packageJson.name = path.basename(process.cwd());
    packageJson.version = "0.1.0";

    await writeFile(
      path.join(process.cwd(), "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await $(`${pm} install`);
    console.log(result.stdout);
    console.error(result.stderr);

    console.log("Project initialized successfully!");
  });
