import { defineHandler, TResponse } from "@farbenmeer/bunny/server";

export const GET = defineHandler(
  {
    authorize: () => true,
  },
  async () => {
    return TResponse.json({ message: "Hello, world!" });
  }
);
