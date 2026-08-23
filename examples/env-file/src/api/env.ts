import { defineHandler, TResponse } from "@toapi/server";

export const GET = defineHandler(
  {
    authorize: () => true,
  },
  async () => {
    return TResponse.json({ foo: process.env.FOO });
  }
);
