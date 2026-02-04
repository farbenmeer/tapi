import { Command } from "commander";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const recipes = new Command()
  .name("recipes")
  .description(
    "Get the latest recipes for adding functionality to your project"
  )
  .option("--only <recipe>", "Only add the specified recipe")
  .option("--list", "List all available recipes")
  .action(async ({ only, list }) => {
    if (list) {
      const sourceDir = path.resolve(
        fileURLToPath(import.meta.url),
        "../../../recipes"
      );
      const availableRecipes = await readdir(sourceDir);
      console.log("Available recipes:");
      for (const recipe of availableRecipes) {
        const match = recipe.match(/(.+)\.md$/);
        if (!match) continue;
        const [, name] = match;
        console.log(`- ${name}`);
      }
      return;
    }

    await copyRecipes(only);
  });

export async function copyRecipes(only?: string) {
  const sourceDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../../../recipes"
  );
  const targetDir = path.resolve(process.cwd(), "recipes");
  await mkdir(targetDir, { recursive: true });
  if (only) {
    const sourcePath = path.join(sourceDir, `${only}.md`);
    const targetPath = path.join(targetDir, `${only}.md`);
    await copyFile(sourcePath, targetPath);
    console.log(`Copied ${only} recipe to ${targetPath}`);
    return;
  }

  const availableRecipes = await readdir(sourceDir);
  for (const recipe of availableRecipes) {
    const sourcePath = path.join(sourceDir, recipe);
    const targetPath = path.join(targetDir, recipe);
    await copyFile(sourcePath, targetPath);
  }
  console.log(`Copied ${availableRecipes.length} recipes to ${targetDir}`);
}
