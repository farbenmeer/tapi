import { beforeEach, describe, test } from "vitest";
import { Adapter } from "./adapter";
import { InMemoryAdapter } from "./adapter-inmemory";
import { startEngine } from "./engine";
import { workflow } from "./workflow";
import { step } from "./step";

describe("engine", () => {
  let adapter: Adapter;

  beforeEach(() => {
    adapter = new InMemoryAdapter();
  });

  test("fullWorkflow", async () => {
    const engine = startEngine({
      storage: adapter,
      workflows: {
        fullWorkflow: workflow(() => {}),
      },
    });

    await engine.fullWorkflow();
  });
});
