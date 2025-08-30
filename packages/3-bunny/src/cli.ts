#!/usr/bin/env bun

import { Command } from "commander";
import { init } from "./cli/init";
import { dev } from "./cli/dev";
import { build } from "./cli/build";
import { start } from "./cli/start";
import { migrate } from "./cli/migrate";

const program = new Command();

program
  .name("bunny")
  .description("CLI for the Bunny Web-Framework")
  .version("0.1.0")
  .addCommand(init)
  .addCommand(dev)
  .addCommand(build)
  .addCommand(start)
  .addCommand(migrate);

await program.parseAsync(process.argv);
