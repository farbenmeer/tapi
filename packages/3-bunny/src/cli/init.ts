import { Command } from "commander";
import {
  access,
  constants,
  cp,
  mkdir,
  readdir,
  readFile,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import ownPackageJson from "../../package.json";

const $ = promisify(exec);

export const init = new Command()
  .name("init")
  .description("Initialize a new project")
  .argument("[name]", "Name of the project")
  .action(async (name) => {
    console.info("Initializing project...");
    if (name) {
      const dirPath = path.join(process.cwd(), name);
      if ((await readdir(dirPath, { recursive: true })).length > 0) {
        console.error(`Directory ${name} already exists and contains files.`);
        process.exit(1);
      } else {
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

    const pm =
      process.env.npm_config_user_agent?.match(/^(pnpm|yarn|npm|bun)/)?.[1] ??
      "npm";

    const packageJson = JSON.parse(
      await readFile(
        path.join(process.cwd(), "boilerplate/package.json"),
        "utf8"
      )
    );
    packageJson.name = path.basename(process.cwd());
    packageJson.dependencies[
      "@farbenmeer/bunny"
    ] = `^${ownPackageJson.version}`;

    await $(`${pm} install`);

    console.log("Project initialized successfully!");
  });
