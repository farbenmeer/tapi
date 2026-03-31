import crypto from "node:crypto";
import { context } from "./context";

export class Step<I = unknown> {
  constructor(
    private fn: (input: I) => Promise<unknown>,
    private input: I,
  ) {}

  async run() {
    return await this.fn(this.input);
  }

  id() {
    return crypto
      .createHash("md5")
      .update(this.fn.name)
      .update(this.fn.toString())
      .update(JSON.stringify(this.input))
      .digest("hex");
  }
}

export function step<I, O>(run: (input: I) => Promise<O>) {
  return (input: I) => {
    const step = new Step(run, input);
    const state = context.stepState.get(step.id());
    if (state) {
      return state.result as O;
    }
    throw step;
  };
}
