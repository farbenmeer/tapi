import { Command } from "commander";
import { exec } from "node:child_process";
import { access, constants, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import * as tar from "tar";

const $ = promisify(exec);

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

function detectPackageManager(use: string | undefined): PackageManager {
  if (use && ["pnpm", "npm", "yarn", "bun"].includes(use)) {
    return use as PackageManager;
  }
  const ua = process.env.npm_config_user_agent;
  const match = ua?.match(/^(pnpm|yarn|npm|bun)/)?.[1];
  return (match as PackageManager) ?? "pnpm";
}

const program = new Command()
  .name("create-tapi-app")
  .description("Scaffold a new TApi + Nitro + Vite + React project")
  .argument("[name]", "Project directory to create")
  .option("--use <packageManager>", "Package manager: pnpm | npm | yarn | bun")
  .option("--no-install", "Skip the install step")
  .option("--no-git", "Skip git initialization")
  .action(async (name: string | undefined, options: { use?: string; install: boolean; git: boolean }) => {
    if (name) {
      const dirPath = path.resolve(process.cwd(), name);
      try {
        const entries = await readdir(dirPath);
        if (entries.length > 0) {
          console.error(`Error: ${dirPath} exists and is not empty.`);
          process.exit(1);
        }
      } catch {
        await mkdir(dirPath, { recursive: true });
      }
      process.chdir(dirPath);
    } else {
      try {
        await access(path.join(process.cwd(), "package.json"), constants.F_OK);
        console.error("Error: package.json already exists in current directory.");
        process.exit(1);
      } catch {}
    }

    const projectName = path.basename(process.cwd());
    console.info(`Creating ${projectName} in ${process.cwd()}`);

    const templatePath = path.resolve(fileURLToPath(import.meta.url), "../../template.tgz");
    await tar.extract({ file: templatePath, cwd: process.cwd(), stripComponents: 1 });

    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    pkg.name = projectName;
    pkg.version = "0.1.0";
    pkg.private = true;
    delete pkg.description;
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    const pm = detectPackageManager(options.use);

    if (options.git) {
      try {
        await $("git init");
      } catch (error) {
        console.warn("git init failed (continuing):", (error as Error).message);
      }
    }

    if (options.install) {
      console.info(`Installing dependencies with ${pm}…`);
      const result = await $(`${pm} install`);
      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.error(result.stderr);
    }

    console.log(`\n✓ Project ready.\n  cd ${projectName ?? "."}\n  ${pm} dev\n`);
  });

await program.parseAsync(process.argv);
