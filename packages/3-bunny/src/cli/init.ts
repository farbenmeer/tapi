import { $ } from "bun";
import { Command } from "commander";
import { exists, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

export const init = new Command()
  .name("init")
  .description("Initialize a new project")
  .argument("[name]", "Name of the project")
  .action(async (name) => {
    console.info("Initializing project...");
    if (name) {
      const dirPath = path.join(process.cwd(), name);
      if (await exists(dirPath)) {
        if ((await readdir(dirPath, { recursive: true })).length > 0) {
          console.error(`Directory ${name} already exists and contains files.`);
          process.exit(1);
        }
      } else {
        await mkdir(dirPath, { recursive: true });
      }
      process.chdir(dirPath);
    } else {
      const pkgPath = path.join(process.cwd(), "package.json");
      if (await Bun.file(pkgPath).exists()) {
        console.error(`Package.json already exists.`);
        process.exit(1);
      }
    }

    const tarBall = path.join(
      path.dirname(path.dirname(__dirname)),
      "boilerplate.tar.gz"
    );

    // Extract the tarball to the current directory
    await $`tar -xzf ${tarBall} --strip-components=1`;

    await $`bun pm pkg set name=${name ?? path.basename(process.cwd())}`;

    await $`git init`;
    await $`bun install`;
    await $`bun run generate`;
    await $`bun run migrate`;

    console.log("Project initialized successfully!");
  });
