import { defineHandler, TResponse } from "@farbenmeer/bunny/server";
//import { auth } from "../lib/auth";

export const GET = defineHandler(
  {
    authorize: () => true,
  },
  async () => {
    return TResponse.json({ message: "Hello, world!" });
  }
);
