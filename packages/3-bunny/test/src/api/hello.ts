import { defineHandler, TResponse } from "@farbenmeer/bunny";
import { auth } from "../lib/auth";

export const GET = defineHandler(
  {
    authorize: auth,
  },
  async () => {
    return TResponse.json({ message: "Hello, world!" });
  }
);
