#!/usr/bin/env bun

import { Command } from "commander";
import { init } from "./cli/init.js";
import { dev } from "./cli/dev.js";
import { build } from "./cli/build.js";
import { start } from "./cli/start.js";

const program = new Command();

program
  .name("bunny")
  .description("CLI for the Bunny Web-Framework")
  .version("0.1.0")
  .addCommand(init)
  .addCommand(dev)
  .addCommand(build)
  .addCommand(start);

await program.parseAsync(process.argv);
